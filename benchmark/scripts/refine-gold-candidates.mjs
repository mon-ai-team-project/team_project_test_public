#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";

const DEFAULT_TASKS = "benchmark/tasks.jsonl";
const DEFAULT_VERIFIED = "benchmark/gold_relevant_papers.verified.csv";
const DEFAULT_QUEUE = "benchmark/gold_refinement_queue.csv";
const DEFAULT_CANDIDATES = "benchmark/gold_crossref_candidates.csv";
const CROSSREF_API = "https://api.crossref.org/works";

const args = parseArgs(process.argv.slice(2));
const tasksPath = args.tasks ?? DEFAULT_TASKS;
const verifiedPath = args.verified ?? DEFAULT_VERIFIED;
const queuePath = args.queue ?? DEFAULT_QUEUE;
const candidatesPath = args.candidates ?? DEFAULT_CANDIDATES;
const candidatesPerTask = args.candidatesPerTask ? Number.parseInt(args.candidatesPerTask, 10) : 10;
const limitTasks = args.limitTasks ? Number.parseInt(args.limitTasks, 10) : Number.POSITIVE_INFINITY;
const politeDelayMs = args.delayMs ? Number.parseInt(args.delayMs, 10) : 1100;
const contactEmail = process.env.CROSSREF_EMAIL ?? process.env.UNPAYWALL_EMAIL ?? process.env.CONTACT_EMAIL ?? "";

for (const path of [tasksPath, verifiedPath]) {
  if (!fs.existsSync(path)) {
    console.error(`Input file not found: ${path}`);
    process.exit(1);
  }
}

const tasks = fs
  .readFileSync(tasksPath, "utf8")
  .trim()
  .split(/\r?\n/)
  .map((line) => JSON.parse(line));
const verifiedRows = parseCsv(fs.readFileSync(verifiedPath, "utf8"));
const rowsByTask = groupBy(verifiedRows, "task_id");

const queueRows = [];
for (const task of tasks) {
  const rows = rowsByTask.get(task.task_id) ?? [];
  const verifiedCount = rows.filter((row) => row.doi_label_status === "verified").length;
  for (const row of rows) {
    if (row.doi_label_status === "verified") continue;
    queueRows.push({
      task_id: task.task_id,
      gold_id: row.gold_id,
      current_status: row.doi_label_status,
      current_title: row.title,
      current_doi: row.doi,
      current_journal: row.journal,
      audited_relevance: row.human_relevance,
      verified_count_for_task: String(verifiedCount),
      target_field: task.field,
      journal_category_id: task.journal_category_id,
      research_question: task.research_question,
      action_required: verifiedCount >= 3 ? "scripted_review_optional" : "replace_or_verify_exact_title"
    });
  }
}

fs.writeFileSync(queuePath, stringifyCsv(queueRows), "utf8");

const candidateRows = [];
let queriedTasks = 0;
for (const task of tasks) {
  if (queriedTasks >= limitTasks) break;
  const rows = rowsByTask.get(task.task_id) ?? [];
  const verifiedCount = rows.filter((row) => row.doi_label_status === "verified").length;
  if (verifiedCount >= 3) continue;

  queriedTasks += 1;
  const query = buildTaskQuery(task);
  try {
    const candidates = await queryCrossref(query, candidatesPerTask, contactEmail);
    candidates.forEach((work, index) => {
      candidateRows.push({
        task_id: task.task_id,
        candidate_rank: String(index + 1),
        query,
        title: work.title?.[0] ?? "",
        authors: formatAuthors(work.author),
        year: String(getCrossrefYear(work) ?? ""),
        journal: work["container-title"]?.[0] ?? "",
        doi: normalizeDoi(work.DOI ?? ""),
        crossref_score: String(work.score ?? ""),
        type: work.type ?? "",
        publisher: work.publisher ?? "",
        target_field: task.field,
        journal_category_id: task.journal_category_id,
        expected_priority: Array.isArray(task.expected_priority) ? task.expected_priority.join("; ") : "",
        evaluation_focus: Array.isArray(task.evaluation_focus) ? task.evaluation_focus.join("; ") : "",
        selection_status: "needs_automated_verification"
      });
    });
  } catch (error) {
    candidateRows.push({
      task_id: task.task_id,
      candidate_rank: "0",
      query,
      title: "",
      authors: "",
      year: "",
      journal: "",
      doi: "",
      crossref_score: "",
      type: "",
      publisher: "",
      target_field: task.field,
      journal_category_id: task.journal_category_id,
      expected_priority: Array.isArray(task.expected_priority) ? task.expected_priority.join("; ") : "",
      evaluation_focus: Array.isArray(task.evaluation_focus) ? task.evaluation_focus.join("; ") : "",
      selection_status: `lookup_failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }

  if (queriedTasks < Math.min(limitTasks, tasks.length)) await sleep(politeDelayMs);
}

fs.writeFileSync(candidatesPath, stringifyCsv(candidateRows), "utf8");

console.log(
  JSON.stringify(
    {
      tasks: tasks.length,
      refinementQueueRows: queueRows.length,
      queriedTasks,
      candidateRows: candidateRows.length,
      queue: queuePath,
      candidates: candidatesPath,
      contactEmail: Boolean(contactEmail)
    },
    null,
    2
  )
);

function buildTaskQuery(task) {
  const focus = Array.isArray(task.evaluation_focus) ? task.evaluation_focus.slice(0, 2).join(" ") : "";
  return [task.keyword, focus].filter(Boolean).join(" ");
}

async function queryCrossref(query, rows, email) {
  const url = new URL(CROSSREF_API);
  url.searchParams.set("query.bibliographic", query);
  url.searchParams.set("rows", String(rows));
  url.searchParams.set("select", "DOI,title,author,container-title,published-print,published-online,issued,score,type,publisher");
  if (email) url.searchParams.set("mailto", email);

  const response = await fetchWithRetry(url);
  const data = await response.json();
  return data?.message?.items ?? [];
}

async function fetchWithRetry(url) {
  let lastResponse = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": "paper-agent-benchmark/1.0" } });
    if (response.ok) return response;
    lastResponse = response;
    if (![429, 500, 502, 503, 504].includes(response.status)) break;
    await sleep(800 * (attempt + 1));
  }
  throw new Error(`Crossref request failed with ${lastResponse?.status ?? "unknown status"}`);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--tasks") parsed.tasks = argv[++i];
    else if (arg === "--verified") parsed.verified = argv[++i];
    else if (arg === "--queue") parsed.queue = argv[++i];
    else if (arg === "--candidates") parsed.candidates = argv[++i];
    else if (arg === "--candidates-per-task") parsed.candidatesPerTask = argv[++i];
    else if (arg === "--limit-tasks") parsed.limitTasks = argv[++i];
    else if (arg === "--delay-ms") parsed.delayMs = argv[++i];
  }
  return parsed;
}

function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row[key])) map.set(row[key], []);
    map.get(row[key]).push(row);
  }
  return map;
}

function normalizeDoi(value) {
  return value.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
}

function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) return "";
  return authors
    .slice(0, 6)
    .map((author) => [author.given, author.family].filter(Boolean).join(" "))
    .filter(Boolean)
    .join("; ");
}

function getCrossrefYear(work) {
  return (
    work?.published?.["date-parts"]?.[0]?.[0] ??
    work?.["published-print"]?.["date-parts"]?.[0]?.[0] ??
    work?.["published-online"]?.["date-parts"]?.[0]?.[0] ??
    work?.issued?.["date-parts"]?.[0]?.[0] ??
    null
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
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

function stringifyCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(","))].join("\n") + "\n";
}

function escapeCsv(value) {
  const stringValue = String(value);
  if (!/[",\n\r]/.test(stringValue)) return stringValue;
  return `"${stringValue.replace(/"/g, '""')}"`;
}
