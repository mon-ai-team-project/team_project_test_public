#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";

const DEFAULT_OUTPUT = "benchmark/auto_review_baseline_results.csv";
const DEFAULT_SUMMARY = "benchmark/auto_review_baseline_summary.json";
const DEFAULT_GOLD = "benchmark/gold_relevant_papers.verified.csv";

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with"
]);

const METHOD_INPUTS = [
  { method: "rule_based", path: "benchmark/baseline_rule_based_results.csv" },
  { method: "single_llm", path: "benchmark/baseline_single_llm_results.csv" }
];

const args = parseArgs(process.argv.slice(2));
const outputPath = args.output ?? DEFAULT_OUTPUT;
const summaryPath = args.summary ?? DEFAULT_SUMMARY;
const goldPath = args.gold ?? DEFAULT_GOLD;

for (const path of [goldPath, ...METHOD_INPUTS.map((input) => input.path)]) {
  if (!fs.existsSync(path)) {
    console.error("Input file not found: " + path);
    process.exit(1);
  }
}

const goldRows = parseCsv(fs.readFileSync(goldPath, "utf8"));
const goldByTask = groupBy(goldRows, "task_id");
const reviewRows = METHOD_INPUTS.flatMap((input) => {
  const rows = parseCsv(fs.readFileSync(input.path, "utf8"));
  return rows.map((row) => reviewRow(input.method, input.path, row, goldByTask.get(row.task_id) ?? []));
});

writeCsv(outputPath, reviewRows, [
  "method",
  "source_file",
  "task_id",
  "result_rank",
  "doi",
  "title",
  "journal",
  "journal_rank",
  "auto_relevance",
  "auto_decision",
  "failure_type",
  "matched_gold_id",
  "matched_gold_relevance",
  "evidence"
]);

const summary = summarize(reviewRows, { output: outputPath, gold: goldPath, inputs: METHOD_INPUTS });
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log(JSON.stringify(summary, null, 2));

function reviewRow(method, sourceFile, row, taskGoldRows) {
  const normalizedDoi = normalizeDoi(row.doi);
  const normalizedTitle = normalizeTitle(row.title);
  const goldMatch = findGoldMatch(row, taskGoldRows);
  const keywordScore = scoreKeywordFit(row.keyword, row.title);
  const topJournal = isTopJournal(row);
  const staleTopic = detectStaleTopic(row.task_id, row.title + " " + row.source_note + " " + row.review_note);
  const metadataMissing = !normalizedDoi || !normalizedTitle || !normalizeTitle(row.journal);

  let autoRelevance = 0;
  const evidence = [];
  if (goldMatch) {
    autoRelevance = Math.max(autoRelevance, Number.parseFloat(goldMatch.human_relevance || "0"));
    evidence.push("matched audited gold " + goldMatch.gold_id);
  }
  if (keywordScore >= 0.5) {
    autoRelevance = Math.max(autoRelevance, 4);
    evidence.push("strong title keyword overlap " + keywordScore.toFixed(2));
  } else if (keywordScore > 0) {
    autoRelevance = Math.max(autoRelevance, 3);
    evidence.push("partial title keyword overlap " + keywordScore.toFixed(2));
  } else {
    evidence.push("no title keyword overlap");
  }
  if (topJournal) evidence.push("approved S/A1 journal");
  else evidence.push("not approved S/A1 journal");
  if (metadataMissing) evidence.push("missing required metadata");
  if (staleTopic) evidence.push("stale topic marker: " + staleTopic);

  const failureType = chooseFailureType({ metadataMissing, staleTopic, topJournal, goldMatch, keywordScore });
  const autoDecision = chooseDecision({ failureType, autoRelevance, goldMatch, topJournal });

  return {
    method,
    source_file: sourceFile,
    task_id: row.task_id ?? "",
    result_rank: row.result_rank ?? row.rank ?? "",
    doi: row.doi ?? "",
    title: row.title ?? "",
    journal: row.journal ?? "",
    journal_rank: row.journal_rank ?? "",
    auto_relevance: String(Math.max(0, Math.min(5, Math.round(autoRelevance)))),
    auto_decision: autoDecision,
    failure_type: failureType,
    matched_gold_id: goldMatch?.gold_id ?? "",
    matched_gold_relevance: goldMatch?.human_relevance ?? "",
    evidence: evidence.join("; ")
  };
}

function findGoldMatch(row, taskGoldRows) {
  const doi = normalizeDoi(row.doi);
  const title = normalizeTitle(row.title);
  return taskGoldRows.find((gold) => {
    const goldDoi = normalizeDoi(gold.doi);
    const goldTitle = normalizeTitle(gold.title);
    return (doi && goldDoi && doi === goldDoi) || (title && goldTitle && title === goldTitle);
  });
}

function scoreKeywordFit(keyword, title) {
  const titleTokens = new Set(tokenize(title));
  const keywordTokens = tokenize(keyword).filter((token) => !STOPWORDS.has(token));
  if (!keywordTokens.length) return 0;
  const matches = keywordTokens.filter((token) => titleTokens.has(token)).length;
  return matches / keywordTokens.length;
}

function isTopJournal(row) {
  const rank = normalizeText(row.journal_rank);
  return rank.includes("국제 s급") || rank.includes("국제 a1급");
}

function detectStaleTopic(taskId, text) {
  const normalized = normalizeText(text);
  const staleByTask = {
    T001: ["dynamic capabilities", "dynamic capability"],
    T002: ["governance", "agency theory"],
    T003: ["service quality", "customer satisfaction"]
  };
  return (staleByTask[taskId] ?? []).find((marker) => normalized.includes(marker)) ?? "";
}

function chooseFailureType({ metadataMissing, staleTopic, topJournal, goldMatch, keywordScore }) {
  if (metadataMissing) return "metadata_problem";
  if (staleTopic) return "stale_topic";
  if (!topJournal) return "not_top_journal";
  if (!goldMatch && keywordScore === 0) return "low_relevance";
  if (!goldMatch && keywordScore < 0.5) return "partial_relevance";
  return "none";
}

function chooseDecision({ failureType, autoRelevance, goldMatch, topJournal }) {
  if (["metadata_problem", "stale_topic", "low_relevance"].includes(failureType)) return "reject";
  if (goldMatch && autoRelevance >= 4 && topJournal) return "include";
  if (autoRelevance >= 4 && topJournal) return "include";
  return "review_by_rule";
}

function summarize(rows, metadata) {
  const byMethod = Object.fromEntries([...new Set(rows.map((row) => row.method))].sort().map((method) => {
    const methodRows = rows.filter((row) => row.method === method);
    return [method, summarizeRows(methodRows)];
  }));
  return {
    ...metadata,
    generatedBy: "benchmark/scripts/auto-review-baselines.mjs",
    policy: "Fully automated rule-based review; no human manual review required.",
    rowCount: rows.length,
    byMethod
  };
}

function summarizeRows(rows) {
  return {
    row_count: rows.length,
    include_count: count(rows, "auto_decision", "include"),
    review_by_rule_count: count(rows, "auto_decision", "review_by_rule"),
    reject_count: count(rows, "auto_decision", "reject"),
    average_auto_relevance: Number(average(rows.map((row) => Number.parseFloat(row.auto_relevance || "0"))).toFixed(4)),
    failure_types: Object.fromEntries([...new Set(rows.map((row) => row.failure_type))].sort().map((failureType) => [failureType, count(rows, "failure_type", failureType)])),
    matched_gold_ids: unique(rows.map((row) => row.matched_gold_id).filter(Boolean))
  };
}

function count(rows, key, value) {
  return rows.filter((row) => row[key] === value).length;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function unique(values) {
  return [...new Set(values)].sort();
}

function tokenize(value) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function normalizeDoi(value) {
  return String(value ?? "").trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
}

function normalizeTitle(value) {
  return normalizeText(value);
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    if (arg === "--output") parsed.output = argv[++i];
    else if (arg === "--summary") parsed.summary = argv[++i];
    else if (arg === "--gold") parsed.gold = argv[++i];
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

