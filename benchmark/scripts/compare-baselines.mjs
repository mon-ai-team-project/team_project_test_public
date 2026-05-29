#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";

const DEFAULT_GOLD = "benchmark/gold_relevant_papers.verified.csv";
const DEFAULT_ALLOWLIST = "benchmark/gold_audit_allowlist.json";
const DEFAULT_METRICS_OUTPUT = "benchmark/baseline_comparison_metrics.csv";
const DEFAULT_SUMMARY_OUTPUT = "benchmark/baseline_comparison_summary.json";
const DEFAULT_K = 5;
const METHOD_INPUTS = [
  { method: "rule_based", path: "benchmark/baseline_rule_based_results.csv" },
  { method: "single_llm", path: "benchmark/baseline_single_llm_results.csv" },
  { method: "proposed_agent", path: "benchmark/proposed_agent_results.csv" }
];

const args = parseArgs(process.argv.slice(2));
const goldPath = args.gold ?? DEFAULT_GOLD;
const allowlistPath = args.allowlist ?? DEFAULT_ALLOWLIST;
const metricsOutputPath = args.output ?? DEFAULT_METRICS_OUTPUT;
const summaryOutputPath = args.summaryOutput ?? DEFAULT_SUMMARY_OUTPUT;
const k = args.k ? Number.parseInt(args.k, 10) : DEFAULT_K;

for (const path of [goldPath, ...METHOD_INPUTS.map((input) => input.path)]) {
  if (!fs.existsSync(path)) {
    console.error("Input file not found: " + path);
    process.exit(1);
  }
}

const goldRows = parseCsv(fs.readFileSync(goldPath, "utf8"));
const goldByTask = groupBy(goldRows, "task_id");
const acceptedWarnings = readAcceptedWarnings(allowlistPath);

const metricRows = METHOD_INPUTS.flatMap((input) => {
  const rows = parseCsv(fs.readFileSync(input.path, "utf8")).map((row) => normalizeResultRow(row, input.method, input.path));
  const rowsByTask = groupBy(rows, "task_id");
  return [...rowsByTask.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([taskId, taskRows]) => evaluateMethodTask(input.method, input.path, taskId, taskRows, goldByTask.get(taskId) ?? [], acceptedWarnings, k));
});

const summary = summarize(metricRows, {
  gold: goldPath,
  allowlist: allowlistPath,
  metricsOutput: metricsOutputPath,
  summaryOutput: summaryOutputPath,
  k,
  inputs: METHOD_INPUTS
});

writeCsv(metricsOutputPath, metricRows, [
  "method",
  "source_file",
  "task_id",
  "result_count",
  "gold_count",
  "verified_gold_count",
  "precision_at_5",
  "ndcg_at_5",
  "gold_doi_hit_rate_at_5",
  "doi_presence_rate_at_5",
  "top_journal_precision_at_5",
  "paper_validity_rate_at_5",
  "accepted_exception_count",
  "matched_gold_ids",
  "matched_dois",
  "accepted_exception_locations"
]);
fs.writeFileSync(summaryOutputPath, JSON.stringify(summary, null, 2) + "\n", "utf8");

console.log(JSON.stringify(summary, null, 2));

function normalizeResultRow(row, method, sourceFile) {
  return {
    ...row,
    method,
    source_file: sourceFile,
    title: row.title ?? "",
    doi: row.doi ?? "",
    journal: row.journal ?? "",
    journal_rank: row.journal_rank ?? "",
    result_rank: row.result_rank ?? row.rank ?? "",
    verification_status: row.verification_status ?? "",
    verification_reason: row.verification_reason ?? "",
    unpaywall_status: row.unpaywall_status ?? ""
  };
}

function evaluateMethodTask(method, sourceFile, taskId, taskRows, taskGoldRows, acceptedWarnings, cutoff) {
  const rankedResults = [...taskRows]
    .sort((a, b) => Number.parseInt(a.result_rank || "0", 10) - Number.parseInt(b.result_rank || "0", 10))
    .slice(0, cutoff);
  const relevantGold = taskGoldRows.filter((row) => Number.parseFloat(row.human_relevance || "0") >= 4);
  const verifiedGold = relevantGold.filter((row) => normalizeStatus(row.doi_label_status) === "verified" && normalizeDoi(row.doi));
  const goldByDoi = new Map(verifiedGold.map((row) => [normalizeDoi(row.doi), row]));
  const goldByTitle = new Map(relevantGold.map((row) => [normalizeTitle(row.title), row]).filter(([title]) => title));
  const acceptedExceptionLocations = acceptedWarnings
    .map((warning) => warning.location)
    .filter((location) => isAcceptedExceptionPresent(location, taskId, rankedResults, taskGoldRows));

  const matchedGold = new Map();
  const gains = rankedResults.map((result) => {
    const match = findGoldMatch(result, goldByDoi, goldByTitle);
    if (match) {
      matchedGold.set(match.gold_id, match);
      return Number.parseFloat(match.human_relevance || "0");
    }
    return 0;
  });
  const idealGains = relevantGold
    .map((row) => Number.parseFloat(row.human_relevance || "0"))
    .sort((a, b) => b - a)
    .slice(0, cutoff);

  const denominator = rankedResults.length || 1;
  const matchedDoiCount = rankedResults.filter((result) => goldByDoi.has(normalizeDoi(result.doi))).length;
  const doiPresentCount = rankedResults.filter((result) => normalizeDoi(result.doi)).length;
  const topJournalCount = rankedResults.filter(isTopJournal).length;
  const validPaperCount = rankedResults.filter(isValidPaperLike).length;

  return {
    method,
    source_file: sourceFile,
    task_id: taskId,
    result_count: String(rankedResults.length),
    gold_count: String(relevantGold.length),
    verified_gold_count: String(verifiedGold.length),
    precision_at_5: formatRate(matchedGold.size / denominator),
    ndcg_at_5: formatRate(dcg(gains) / (dcg(idealGains) || 1)),
    gold_doi_hit_rate_at_5: formatRate(verifiedGold.length ? matchedDoiCount / verifiedGold.length : 0),
    doi_presence_rate_at_5: formatRate(doiPresentCount / denominator),
    top_journal_precision_at_5: formatRate(topJournalCount / denominator),
    paper_validity_rate_at_5: formatRate(validPaperCount / denominator),
    accepted_exception_count: String(acceptedExceptionLocations.length),
    matched_gold_ids: [...matchedGold.keys()].join(";"),
    matched_dois: rankedResults.map((result) => normalizeDoi(result.doi)).filter((doi) => goldByDoi.has(doi)).join(";"),
    accepted_exception_locations: acceptedExceptionLocations.join(";")
  };
}

function isAcceptedExceptionPresent(location, taskId, rankedResults, taskGoldRows) {
  const normalizedLocation = normalizeStatus(location);
  if (!normalizedLocation) return false;
  if (/^t\d+\//.test(normalizedLocation)) {
    const [locationTaskId, goldId] = normalizedLocation.split("/");
    if (locationTaskId !== normalizeStatus(taskId)) return false;
    const goldRow = taskGoldRows.find((row) => normalizeStatus(row.gold_id) === goldId);
    if (!goldRow) return false;
    return rankedResults.some((row) => normalizeDoi(row.doi) === normalizeDoi(goldRow.doi) || normalizeTitle(row.title) === normalizeTitle(goldRow.title));
  }
  return rankedResults.some((row) => normalizeDoi(row.doi) === normalizeDoi(location));
}

function findGoldMatch(result, goldByDoi, goldByTitle) {
  const doi = normalizeDoi(result.doi);
  if (doi && goldByDoi.has(doi)) return goldByDoi.get(doi);
  const title = normalizeTitle(result.title);
  if (title && goldByTitle.has(title)) return goldByTitle.get(title);
  return null;
}

function isTopJournal(result) {
  const rank = normalizeStatus(result.journal_rank);
  return rank.includes("국제 s급") || rank.includes("국제 a1급");
}

function isValidPaperLike(result) {
  if (!normalizeDoi(result.doi) || !normalizeTitle(result.title) || !normalizeStatus(result.journal)) return false;
  const status = normalizeStatus(result.verification_status);
  if (!status) return true;
  const reason = normalizeStatus(result.verification_reason);
  return status === "verified" && (!reason || (reason.includes("title match") && reason.includes("journal match")));
}

function readAcceptedWarnings(path) {
  if (!fs.existsSync(path)) return [];
  const parsed = JSON.parse(fs.readFileSync(path, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

function summarize(rows, metadata) {
  const numericKeys = [
    "precision_at_5",
    "ndcg_at_5",
    "gold_doi_hit_rate_at_5",
    "doi_presence_rate_at_5",
    "top_journal_precision_at_5",
    "paper_validity_rate_at_5",
    "accepted_exception_count"
  ];
  const methods = [...new Set(rows.map((row) => row.method))].sort();
  const byMethod = Object.fromEntries(
    methods.map((method) => {
      const methodRows = rows.filter((row) => row.method === method);
      return [
        method,
        {
          task_count: methodRows.length,
          result_count: sum(methodRows, "result_count"),
          gold_count: sum(methodRows, "gold_count"),
          verified_gold_count: sum(methodRows, "verified_gold_count"),
          macro_averages: Object.fromEntries(
            numericKeys.map((key) => [key, Number(average(methodRows.map((row) => Number.parseFloat(row[key] || "0"))).toFixed(4))])
          ),
          matched_gold_ids: unique(methodRows.flatMap((row) => row.matched_gold_ids.split(";").filter(Boolean))),
          matched_dois: unique(methodRows.flatMap((row) => row.matched_dois.split(";").filter(Boolean))),
          accepted_exception_locations: unique(methodRows.flatMap((row) => row.accepted_exception_locations.split(";").filter(Boolean)))
        }
      ];
    })
  );

  return {
    ...metadata,
    methodOrder: methods,
    byMethod,
    interpretation: {
      precision_at_5: "Exact DOI/title overlap against task gold rows with human_relevance >= 4.",
      ndcg_at_5: "Rank quality using matched gold human_relevance as gain.",
      gold_doi_hit_rate_at_5: "Exact DOI hits divided by verified DOI gold labels for the task.",
      doi_presence_rate_at_5: "Share of top-5 rows with a DOI.",
      top_journal_precision_at_5: "Share of top-5 rows in approved international S or A1 journals.",
      paper_validity_rate_at_5: "Share of rows with DOI, title, journal, and no failed verification marker.",
      accepted_exception_count: "Accepted gold-audit exception locations touched by the method/task result set."
    }
  };
}

function dcg(gains) {
  return gains.reduce((total, gain, index) => total + (Math.pow(2, gain) - 1) / Math.log2(index + 2), 0);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sumValue, value) => sumValue + value, 0) / values.length;
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number.parseInt(row[key] || "0", 10), 0);
}

function unique(values) {
  return [...new Set(values)].sort();
}

function formatRate(value) {
  return Number.isFinite(value) ? value.toFixed(4) : "0.0000";
}

function normalizeDoi(value) {
  return String(value ?? "").trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
}

function normalizeTitle(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}

function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const groupKey = row[key] ?? "";
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(row);
  }
  return groups;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--gold") parsed.gold = argv[++i];
    else if (arg === "--allowlist") parsed.allowlist = argv[++i];
    else if (arg === "--output") parsed.output = argv[++i];
    else if (arg === "--summary-output") parsed.summaryOutput = argv[++i];
    else if (arg === "--k") parsed.k = argv[++i];
  }
  return parsed;
}

function parseCsv(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function writeCsv(path, rows, headers) {
  const text = [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(","))].join("\n") + "\n";
  fs.writeFileSync(path, text, "utf8");
}

function escapeCsv(value) {
  const stringValue = String(value);
  if (!/[",\n\r]/.test(stringValue)) return stringValue;
  return '"' + stringValue.replace(/"/g, '""') + '"';
}
