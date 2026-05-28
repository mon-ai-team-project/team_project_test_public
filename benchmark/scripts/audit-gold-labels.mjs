import fs from "node:fs";
import process from "node:process";

const DEFAULT_GOLD_PATH = "benchmark/gold_relevant_papers.csv";
const DEFAULT_TASKS_PATH = "benchmark/tasks.jsonl";
const DEFAULT_MARKDOWN_PATH = "benchmark/gold_audit_report.md";
const DEFAULT_JSON_PATH = "benchmark/gold_audit_report.json";

const args = parseArgs(process.argv.slice(2));
const goldPath = args.gold ?? DEFAULT_GOLD_PATH;
const tasksPath = args.tasks ?? DEFAULT_TASKS_PATH;
const markdownPath = args.markdown ?? DEFAULT_MARKDOWN_PATH;
const jsonPath = args.json ?? DEFAULT_JSON_PATH;

const tasks = readTasks(tasksPath);
const goldRows = parseCsv(fs.readFileSync(goldPath, "utf8"));
const audit = auditGoldRows({ goldRows, tasks, goldPath, tasksPath });

fs.writeFileSync(markdownPath, renderMarkdown(audit), "utf8");
fs.writeFileSync(jsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

console.log(`Gold audit complete: ${markdownPath}`);
console.log(
  `Rows=${audit.summary.goldRows}, tasks=${audit.summary.tasksCovered}/${audit.summary.expectedTasks}, errors=${audit.summary.errors}, warnings=${audit.summary.warnings}`,
);

if (audit.summary.errors > 0 && !args.allowErrors) {
  process.exitCode = 1;
}

function auditGoldRows({ goldRows, tasks, goldPath, tasksPath }) {
  const issues = [];
  const taskIds = tasks.map((task) => task.task_id);
  const goldTaskIds = unique(goldRows.map((row) => row.task_id).filter(Boolean));
  const byTask = groupBy(goldRows, (row) => row.task_id);
  const byGoldId = groupBy(goldRows, (row) => row.gold_id);
  const byDoi = groupBy(goldRows, (row) => normalizeDoi(row.doi)).filter((group) => group.key);
  const byTitle = groupBy(goldRows, (row) => normalizeTitle(row.title)).filter((group) => group.key);

  for (const taskId of taskIds) {
    const rows = byTask.find((group) => group.key === taskId)?.rows ?? [];
    if (rows.length === 0) {
      addIssue(issues, "error", "missing_task_rows", `Task ${taskId} has no gold rows.`, taskId);
    } else if (rows.length < 3) {
      addIssue(issues, "warning", "low_task_row_count", `Task ${taskId} has only ${rows.length} gold rows.`, taskId);
    }
  }

  for (const taskId of goldTaskIds) {
    if (!taskIds.includes(taskId)) {
      addIssue(issues, "error", "unknown_task_id", `Gold rows reference unknown task_id ${taskId}.`, taskId);
    }
  }

  for (const group of byGoldId) {
    if (group.key && group.rows.length > 1) {
      addIssue(issues, "error", "duplicate_gold_id", `gold_id ${group.key} appears ${group.rows.length} times.`, group.key);
    }
  }

  for (const [index, row] of goldRows.entries()) {
    const location = `${row.task_id || "missing_task"}/${row.gold_id || `row_${index + 2}`}`;
    const doi = normalizeDoi(row.doi);
    const relevance = Number(row.human_relevance);
    const year = Number(row.year);

    if (!row.task_id || !row.gold_id || !row.title || !row.journal) {
      addIssue(issues, "error", "missing_required_field", "A required task_id, gold_id, title, or journal field is blank.", location);
    }
    if (!doi) {
      addIssue(issues, "error", "missing_doi", "DOI is blank.", location);
    } else if (!looksLikeDoi(doi)) {
      addIssue(issues, "error", "invalid_doi_format", `DOI '${row.doi}' does not match expected DOI format.`, location);
    }
    if (row.doi_label_status !== "verified") {
      addIssue(issues, "warning", "not_verified", `doi_label_status is '${row.doi_label_status || "blank"}'.`, location);
    }
    if (row.top_journal_expected !== "yes") {
      addIssue(issues, "warning", "not_top_journal_expected", `top_journal_expected is '${row.top_journal_expected || "blank"}'.`, location);
    }
    if (!Number.isFinite(relevance) || relevance < 4) {
      addIssue(issues, "warning", "low_human_relevance", `human_relevance is '${row.human_relevance || "blank"}'.`, location);
    }
    if (!Number.isFinite(year) || year < 1990 || year > 2026) {
      addIssue(issues, "warning", "suspicious_year", `year is '${row.year || "blank"}'.`, location);
    }
    if (!mentionsVerificationEvidence(row.notes)) {
      addIssue(issues, "warning", "weak_verification_notes", "notes do not clearly mention verification evidence.", location);
    }
  }

  for (const group of byDoi) {
    if (group.rows.length < 2) continue;
    const titles = unique(group.rows.map((row) => normalizeTitle(row.title)));
    const locations = group.rows.map((row) => `${row.task_id}/${row.gold_id}`).join(", ");
    if (titles.length > 1) {
      addIssue(issues, "error", "duplicate_doi_different_titles", `DOI ${group.key} is reused for different titles: ${locations}.`, group.key);
    } else {
      addIssue(issues, "warning", "duplicate_doi_same_title", `DOI ${group.key} appears in multiple gold rows: ${locations}.`, group.key);
    }
  }

  for (const group of byTitle) {
    if (group.rows.length < 2) continue;
    const dois = unique(group.rows.map((row) => normalizeDoi(row.doi)).filter(Boolean));
    if (dois.length > 1) {
      const locations = group.rows.map((row) => `${row.task_id}/${row.gold_id}`).join(", ");
      addIssue(issues, "error", "same_title_multiple_dois", `Same normalized title has multiple DOI values: ${locations}.`, group.key);
    }
  }

  const taskSummary = taskIds.map((taskId) => {
    const rows = byTask.find((group) => group.key === taskId)?.rows ?? [];
    return {
      taskId,
      rows: rows.length,
      verified: rows.filter((row) => row.doi_label_status === "verified").length,
      topJournalExpected: rows.filter((row) => row.top_journal_expected === "yes").length,
      doiBacked: rows.filter((row) => normalizeDoi(row.doi)).length,
    };
  });

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    generatedAt: "reproducible-current-inputs",
    inputs: { goldPath, tasksPath },
    summary: {
      goldRows: goldRows.length,
      expectedTasks: taskIds.length,
      tasksCovered: goldTaskIds.length,
      verifiedRows: goldRows.filter((row) => row.doi_label_status === "verified").length,
      topJournalExpectedRows: goldRows.filter((row) => row.top_journal_expected === "yes").length,
      doiBackedRows: goldRows.filter((row) => normalizeDoi(row.doi)).length,
      duplicateDoiGroups: byDoi.filter((group) => group.rows.length > 1).length,
      errors: errors.length,
      warnings: warnings.length,
    },
    taskSummary,
    issueCounts: countBy(issues, (issue) => `${issue.severity}:${issue.code}`),
    issues,
  };
}

function renderMarkdown(audit) {
  const issueRows = audit.issues.length
    ? audit.issues
        .map((issue) => `| ${issue.severity} | ${issue.code} | ${escapeTable(issue.location)} | ${escapeTable(issue.message)} |`)
        .join("\n")
    : "| none | none | none | No issues detected. |";

  const taskRows = audit.taskSummary
    .map(
      (row) =>
        `| ${row.taskId} | ${row.rows} | ${row.verified} | ${row.doiBacked} | ${row.topJournalExpected} |`,
    )
    .join("\n");

  const issueCountRows = Object.entries(audit.issueCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `| ${escapeTable(key)} | ${value} |`)
    .join("\n");

  return `# Gold Label Audit Report

Generated: ${audit.generatedAt}

This report checks internal consistency of \`${audit.inputs.goldPath}\` against \`${audit.inputs.tasksPath}\`. It does not replace external DOI, publisher, Crossref, or Web of Science verification.

## Summary

| Metric | Value |
| --- | ---: |
| Gold rows | ${audit.summary.goldRows} |
| Tasks covered | ${audit.summary.tasksCovered} / ${audit.summary.expectedTasks} |
| Verified rows | ${audit.summary.verifiedRows} |
| DOI-backed rows | ${audit.summary.doiBackedRows} |
| top_journal_expected=yes rows | ${audit.summary.topJournalExpectedRows} |
| Duplicate DOI groups | ${audit.summary.duplicateDoiGroups} |
| Errors | ${audit.summary.errors} |
| Warnings | ${audit.summary.warnings} |

## Task Coverage

| Task | Rows | Verified | DOI-backed | Top journal expected |
| --- | ---: | ---: | ---: | ---: |
${taskRows}

## Issue Counts

| Issue | Count |
| --- | ---: |
${issueCountRows || "| none | 0 |"}

## Issues

| Severity | Code | Location | Message |
| --- | --- | --- | --- |
${issueRows}

## Maintainer Notes

- Treat \`error\` rows as blockers before organization-main synchronization.
- Treat \`warning\` rows as review items. Some duplicate DOI warnings are acceptable when the same paper is intentionally relevant to multiple benchmark tasks.
- Re-run with \`npm run benchmark:audit-gold\` after any gold-label edit.
`;
}

function addIssue(issues, severity, code, message, location) {
  issues.push({ severity, code, location, message });
}

function readTasks(path) {
  return fs
    .readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (arg === "--allow-errors") {
      parsed.allowErrors = true;
    } else if (arg.startsWith("--")) {
      parsed[arg.slice(2)] = rawArgs[i + 1];
      i += 1;
    }
  }
  return parsed;
}

function parseCsv(input) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...dataRows] = rows.filter((csvRow) => csvRow.some((value) => value !== ""));
  return dataRows.map((csvRow) => Object.fromEntries(header.map((name, index) => [name, csvRow[index] ?? ""])));
}

function looksLikeDoi(value) {
  return /^10\.\d{4,9}\/\S+$/i.test(value);
}

function mentionsVerificationEvidence(notes) {
  return /\b(crossref|doi|publisher|verified|web of science|wos|springer|sage|elsevier|wiley|taylor|informs|academy of management|oxford|cambridge)\b/i.test(
    notes ?? "",
  );
}

function groupBy(rows, getKey) {
  const map = new Map();
  for (const row of rows) {
    const key = getKey(row) ?? "";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return [...map.entries()].map(([key, groupedRows]) => ({ key, rows: groupedRows }));
}

function countBy(rows, getKey) {
  const counts = {};
  for (const row of rows) {
    const key = getKey(row);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeDoi(value) {
  return String(value ?? "")
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .toLowerCase();
}

function normalizeTitle(value) {
  return normalizePlain(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizePlain(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeTable(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
