const workerUrl = normalizeBaseUrl(process.env.WORKER_URL ?? "https://paper-agent-project.shch3653.workers.dev");
const runSearch = (process.env.RUN_SEARCH ?? "false").toLowerCase() === "true";
const requireReady = (process.env.REQUIRE_READY ?? "true").toLowerCase() !== "false";
const requireR2 = (process.env.REQUIRE_R2 ?? "false").toLowerCase() === "true";
const pollMs = Number(process.env.POLL_MS ?? 3000);
const timeoutMs = Number(process.env.TIMEOUT_MS ?? 180000);

const searchPayload = {
  keyword: process.env.SMOKE_KEYWORD ?? "AI interview employer branding",
  maxResults: Number(process.env.SMOKE_MAX_RESULTS ?? 3),
  yearStart: Number(process.env.SMOKE_YEAR_START ?? 2020),
  yearEnd: Number(process.env.SMOKE_YEAR_END ?? 2026)
};

const summary = {
  ok: true,
  workerUrl,
  mode: runSearch ? "search" : "read_only",
  checks: {}
};

const health = await fetchJson(`${workerUrl}/api/health`);
summary.checks.health = health;
assert(health.ok, `Worker health failed: ${JSON.stringify(health)}`);

const diagnostics = await fetchJson(`${workerUrl}/api/diagnostics`);
summary.checks.diagnostics = diagnostics;
assert(diagnostics.ok, `Worker diagnostics failed: ${JSON.stringify(diagnostics)}`);
assert(diagnostics.db?.bound, "D1 binding is missing.");
assert((diagnostics.db?.missingColumns ?? []).length === 0, `D1 missing columns: ${diagnostics.db?.missingColumns?.join(", ")}`);

if (requireReady) {
  assert(diagnostics.readiness?.activeProviderReady, `Active provider is not ready: ${JSON.stringify(diagnostics.readiness)}`);
}

if (requireR2) {
  assert(diagnostics.env?.r2Reports, "R2 REPORTS binding is not ready.");
}

const recentJobs = await fetchJson(`${workerUrl}/api/search-jobs?limit=3`);
summary.checks.recentJobs = {
  count: recentJobs.jobs?.length ?? 0,
  latest: recentJobs.jobs?.[0] ?? null
};

if (runSearch) {
  const started = await postJson(`${workerUrl}/api/search-jobs`, searchPayload);
  const jobId = started.job?.id;
  assert(jobId, `Search did not return a job id: ${JSON.stringify(started)}`);
  summary.search = { payload: searchPayload, jobId };

  const completed = await waitForJob(jobId);
  summary.search.job = completed.job;
  summary.search.paperCount = completed.papers?.length ?? 0;
  summary.search.sourceResultCount = completed.job?.sourceResultCount ?? null;
  summary.search.allowedResultCount = completed.job?.allowedResultCount ?? null;

  assert(completed.job?.status === "completed", `Search job did not complete: ${JSON.stringify(completed.job)}`);

  const csv = await fetchOk(`${workerUrl}/api/search-jobs/${jobId}/papers.csv`);
  const report = await fetchOk(`${workerUrl}/api/search-jobs/${jobId}/report.md`);
  const xlsx = await fetchOk(`${workerUrl}/api/search-jobs/${jobId}/papers.xlsx`);
  const pdf = await fetchOk(`${workerUrl}/api/search-jobs/${jobId}/report.pdf`);
  summary.search.endpoints = {
    csvStatus: csv.status,
    markdownStatus: report.status,
    xlsxStatus: xlsx.status,
    pdfStatus: pdf.status
  };
}

console.log(JSON.stringify(summary, null, 2));

async function waitForJob(jobId) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await fetchJson(`${workerUrl}/api/search-jobs/${jobId}`);
    if (result.job?.status === "completed" || result.job?.status === "failed") return result;
    await sleep(pollMs);
  }
  throw new Error(`Timed out waiting for search job ${jobId}`);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${url} failed with ${response.status}: ${body}`);
  }
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`${url} failed with ${response.status}: ${responseBody}`);
  }
  return response.json();
}

async function fetchOk(url) {
  let response = await fetch(url, { method: "HEAD" });
  if (!response.ok) response = await fetch(url, { method: "GET" });
  assert(response.ok, `${url} failed with ${response.status}`);
  return response;
}

function normalizeBaseUrl(value) {
  return value.replace(/\/$/, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
