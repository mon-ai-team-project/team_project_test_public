# Debug Log

This file records debugging and troubleshooting work that affects implementation, deployment, or verification. Update it whenever a defect is investigated or a verification run changes project confidence.

## 2026-05-15 - Dashboard Search Options

### Context

After fixing the dashboard `Run` failure, the next bottleneck was search tuning. The dashboard had fixed request values:

```json
{"yearStart":2020,"maxResults":20}
```

This made it hard to test broader WoS queries or adjust candidate volume from the UI.

### Code Changes Under Test

- Added `Max`, `From`, and `To` controls to the dashboard command area.
- `Max` is clamped to the Worker-supported range of 1-50.
- `From` and `To` are optional year fields.
- Empty year fields are omitted from the request payload.
- `Run` now sends `keyword`, `maxResults`, and optional `yearStart`/`yearEnd` from UI state instead of hard-coded values.

### Verification Commands

```bash
npm run typecheck
npm run build
```

Both passed.

## 2026-05-15 - Dashboard Run Failed At WoS Search

### Context

The user reported that clicking `Run` in the dashboard produced `status=failed`.

### Investigation

Recent deployed jobs showed:

```text
job-7581dd40-75dd-4853-90c7-812b41ccc047
keyword=AI interview employer branding
status=failed
currentStep=wos_search
errorMessage=Web of Science request failed with 400
```

Diagnostics were healthy:

```text
searchProvider=wos
wosApiKey=true
wosApiKeySource=WOS_API_KEY
missingColumns=[]
crossrefEmail=true
unpaywallEmail=true
r2Reports=true
```

The dashboard sends `maxResults=20`. The Worker multiplied this by 5 to collect candidates, producing `limit=100` for WoS. The WoS Starter API limit range is 1-50, so the request failed with HTTP 400 before any papers could be saved.

### Resolution

Changed the WoS candidate limit cap from 100 to 50:

```text
candidateLimit = min(50, max(maxResults, maxResults * 5))
```

Also made the WoS 400 error message more specific so future failures point to query syntax or the 1-50 limit range.

### Verification Commands

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/worker/wrangler.toml
```

All passed.

### Next Runtime Check

After deployment, click `Run` in the dashboard again or run:

```bash
curl -s -X POST https://paper-agent-project.shch3653.workers.dev/api/search-jobs \
  -H 'Content-Type: application/json' \
  --data '{"keyword":"AI interview employer branding","yearStart":2020,"maxResults":20}'
```

Expected result: the job should leave `wos_search` and complete or proceed to journal filtering without a WoS 400 error.

### Runtime Confirmation

After Cloudflare automatic deployment caught up, the same dashboard-style payload completed:

```text
job-6639c061-9c43-43bf-bbc7-063de355f974
status=completed
currentStep=completed
sourceResultCount=2
allowedResultCount=0
```

This confirms the `status=failed` issue was the WoS request limit. The remaining zero-paper state is not a runtime failure; it means the returned WoS candidates did not pass the approved journal allowlist.

## 2026-05-15 - Dashboard UI/UX Refresh

### Context

The dashboard was functionally complete but visually flat. The requested task was to improve the frontend UI/UX without changing the backend API flow.

### Code Changes Under Test

- Reworked the top header into a command-focused search area with provider/readiness badges.
- Added richer status cards with include/review counts.
- Moved pipeline and system checks into a compact operations grid.
- Reworked the main content into a larger ranked-paper workspace and a right-side detail/recent-jobs column.
- Added paper status badges, rank pills, score pills, journal column, and author subtext in the result table.
- Kept report preview in the main workflow below the ranked paper table.
- Added responsive layout rules for tablet and mobile widths.

### Verification Commands

```bash
npm run typecheck
npm run build
npm run dev:web
curl -s -I http://127.0.0.1:5173/
```

Static checks passed. The local Vite server returned HTTP 200.

### Notes

Headless Chromium screenshot capture was attempted, but the environment's Chromium process did not complete screenshot output due to local font/DBus runtime errors. The process was terminated and no screenshot artifact was committed.

## 2026-05-15 - WoS Search Runtime Result Counts

### Context

The WoS API key is now visible to the deployed Worker:

```json
{
  "searchProvider": "wos",
  "env": {
    "wosApiKey": true,
    "wosApiKeySource": "WOS_API_KEY"
  },
  "readiness": {
    "activeProviderReady": true
  }
}
```

### Runtime Verification

Created three deployed WoS jobs:

```text
job-2f7faddb-3e4e-4a16-8daf-fc287b136b57 keyword=marketing analytics
job-56122b46-7545-4257-a454-1f3e3c358373 keyword=strategic management
job-64132c0c-6ad3-47e3-943f-c113b302081d keyword=marketing
```

All three jobs completed successfully, which confirms the Worker can authenticate against WoS and run the pipeline. Each returned zero saved papers after the journal allowlist stage.

### Code Changes Under Test

Added search job result count diagnostics:

```text
search_jobs.source_result_count
search_jobs.allowed_result_count
```

The Worker now records how many provider candidates were received and how many passed the approved business school journal allowlist. The dashboard now displays this as `Source / Allowed`, making zero-result jobs diagnosable without inspecting logs.

The count diagnostics exposed the actual parser defect: Clarivate's official Web of Science Starter JavaScript client models the document list as `hits`, not `documents`. The Worker now reads `data.hits` first and keeps `data.documents` only as a compatibility fallback.

### Verification Commands

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/worker/wrangler.toml
```

All passed.

### Next Runtime Check

After deployment, run another WoS job and confirm:

```text
Source / Allowed shows a numeric pair.
If Source > 0 and Allowed = 0, the API returned results but the approved journal filter removed them.
If Source = 0, the WoS query itself returned no candidates for the keyword/date range.
```

Expected after the `hits` parser fix:

```text
Source should be greater than 0 for broad business keywords such as marketing.
Allowed may still be 0 if the first page of WoS candidates does not include approved journals.
```

### Additional Finding

After direct deployment, running `marketing` without a year filter returned:

```text
sourceResultCount=50
allowedResultCount=10
```

The same keyword with `yearStart=2020` still returned zero candidates, so the remaining issue was the WoS year range clause. The Worker now emits short year ranges as explicit OR clauses:

```text
PY=(2020 OR 2021 OR 2022 OR 2023 OR 2024 OR 2025 OR 2026)
```

instead of:

```text
PY=(2020-2026)
```

### Current Runtime Confirmation

After direct Worker deployment, the default dashboard-style payload:

```json
{"keyword":"marketing","yearStart":2020,"maxResults":10}
```

completed with:

```text
job-b83c7239-03a0-4376-98bc-cee2ed8a5b6e
sourceResultCount=50
allowedResultCount=8
```

This confirms WoS authentication, `hits` parsing, year filtering, approved journal filtering, Crossref enrichment, D1 persistence, and dashboard-readable job metrics are working. Unpaywall still returned 422 for the runtime job, while a direct public API call for the same DOI returned 200. DOI and email values are now trimmed before Unpaywall requests; run a new job after this change to confirm whether the 422 was caused by whitespace in runtime values.

### Latest Deployment Check

Direct Worker deployments completed:

```text
3af40580-0c46-4b60-9031-430d0b3824cf - search result diagnostics
37121eff-c477-431a-a05b-0d631f2ec721 - WoS hits parser and year filter
c827fe7b-37cc-40db-8755-fb8031031fdb - Unpaywall DOI/email normalization
```

After the final deployment, a short `maxResults=2` smoke job completed:

```text
job-3939c7f5-d674-4069-bacd-e18d5ebff919
sourceResultCount=10
allowedResultCount=0
```

This confirms the latest deployed code still records source/allowed counts. The short candidate window did not include allowlisted journals; use `maxResults=10` or the dashboard default for a fuller WoS validation.

## 2026-05-15 - WoS API Key Runtime Diagnostics

### Context

The user reported that the WoS API key was registered in Cloudflare, but deployed diagnostics still returned:

```json
{
  "searchProvider": "wos",
  "env": {
    "wosApiKey": false
  },
  "readiness": {
    "activeProviderReady": false
  }
}
```

### Investigation

- Confirmed deployed Worker sees `SEARCH_PROVIDER=wos`.
- Confirmed deployed Worker still does not see `WOS_API_KEY`.
- Confirmed code was reading exactly `env.WOS_API_KEY`.
- Attempted `wrangler secret list`, but this local shell does not have `CLOUDFLARE_API_TOKEN`, so remote secret names could not be listed from the terminal.

### Code Changes Under Test

Added safe WoS API key source detection without exposing secret values.

Accepted runtime aliases:

```text
WOS_API_KEY
WOS_APIKEY
WOS_STARTER_API_KEY
CLARIVATE_API_KEY
WEB_OF_SCIENCE_API_KEY
```

Diagnostics now returns:

```text
env.wosApiKey
env.wosApiKeySource
```

The dashboard System Checks panel also shows the detected source name when present.

### Verification Commands

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/worker/wrangler.toml
```

All passed.

### Next Runtime Check

After Cloudflare deploys this commit, open:

```text
https://paper-agent-project.shch3653.workers.dev/api/diagnostics
```

Expected if any supported key name is present:

```json
{
  "searchProvider": "wos",
  "env": {
    "wosApiKey": true,
    "wosApiKeySource": "WOS_API_KEY"
  },
  "readiness": {
    "activeProviderReady": true
  }
}
```

If `wosApiKeySource` remains `null`, the key is not attached to the production `paper-agent-project` Worker runtime, even if it appears elsewhere in Cloudflare.

## 2026-05-14 - Dashboard Report Preview

### Context

Markdown reports were available only as downloads. The requested next step was to expose the generated `report.md` directly in the dashboard so users can inspect the Report Agent output without leaving the page.

### Code Changes Under Test

- Added a Report Preview panel to the dashboard.
- The panel fetches `GET /api/search-jobs/:id/report.md` for completed jobs.
- The panel displays detected Markdown sections as chips.
- The full Markdown is shown in a scrollable preview area.
- Refresh and download controls share the existing report endpoint.

### Verification Commands

```bash
npm run typecheck
npm run build
```

Both passed. Runtime verification should be done after Cloudflare Pages deploy by opening the dashboard, loading a completed job, and confirming the Report Preview panel renders the Markdown sections.

### Runtime Confirmation

The user confirmed that the Report Preview appears in the dashboard after deployment.

### Next Work

The next recommended implementation step is XLSX output before PDF:

```text
GET /api/search-jobs/:id/papers.xlsx
R2: reports/<job_id>/papers.xlsx
Dashboard XLSX download button
e2e XLSX endpoint and R2 verification
```

## 2026-05-14 - Report Agent Markdown Enhancement

### Context

The search, D1, R2, dashboard, and MCP flow is stable under the OpenAlex fallback provider. The next requested task was to improve the report artifact so it reads more like a literature review report rather than only a metadata export.

### Code Changes Under Test

The Markdown report now adds these sections before the ranked table:

```text
Key Findings
Common Themes
Method / Context Differences
Research Gaps
Suggested Reading Order
Screening Notes
Limitations
```

The new sections are generated from the saved paper metadata, ranking scores, include/review decisions, Crossref verification status, Open Access status, journals, years, and recurring title terms.

### Verification Commands

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/worker/wrangler.toml
```

All passed. Runtime verification should be done after deployment by running a new search job and checking `GET /api/search-jobs/<job_id>/report.md` or R2 `reports/<job_id>/report.md` for the new sections.

## 2026-05-14 - Worker MCP R2 End-To-End Report Verification

### Context

OpenAlex provider runtime testing is now working. The next recommended task was to verify that the latest completed job is consistent across the deployed Worker API, D1, MCP tools, download endpoints, and R2 output objects.

### Added Verification

Added reusable script:

```bash
npm run e2e:reports
```

Optional target:

```bash
JOB_ID=job-... npm run e2e:reports
```

### Current Result

The deployed e2e check passed.

Verified job:

```text
job-9c382a48-7192-4934-987f-63e47ceac7bf
```

Observed:

```text
searchProvider: openalex
paperCount: 9
CSV endpoint: 200
Markdown endpoint: 200
R2 CSV: reports/job-9c382a48-7192-4934-987f-63e47ceac7bf/papers.csv
R2 Markdown: reports/job-9c382a48-7192-4934-987f-63e47ceac7bf/report.md
```

R2 object presence:

```text
papers.csv exists, size 5980
report.md exists, size 10704
```

### Troubleshooting

The first script version checked the download endpoints with `HEAD`. The Worker routes currently implement `GET`, not `HEAD`, so the CSV check returned 404. The script now falls back to `GET` whenever `HEAD` is not successful, matching how the dashboard downloads files.

## 2026-05-14 - Temporary OpenAlex Search Provider

### Context

WoS API approval is still delayed. To run practical end-to-end integration tests before `WOS_API_KEY` is issued, the Worker now supports a temporary OpenAlex provider selected by environment variable.

### Code Changes Under Test

- Added `SEARCH_PROVIDER` with supported values:
  - `wos`
  - `openalex`
- Default remains `wos`.
- Added OpenAlex Worker variables:
  - `OPENALEX_EMAIL`
  - `OPENALEX_API_KEY` optional
- Added OpenAlex Works API search path using keyword search, publication date filters, citation sorting, polite pool `mailto`, and optional `api_key`.
- OpenAlex results are mapped into the existing `PaperRecord` structure so journal filtering, Crossref enrichment, Unpaywall enrichment, ranking, D1, R2, CSV, Markdown, dashboard, and MCP read paths stay unchanged.
- Dashboard diagnostics now show the active provider and provider readiness.
- Pipeline progress now normalizes `wos_search` and `openalex_search` into the same source-search stage.

### Required Cloudflare Test Settings

For temporary integration testing before WoS approval:

```text
SEARCH_PROVIDER=openalex
OPENALEX_EMAIL=<contact email>
OPENALEX_API_KEY=<optional>
```

After WoS approval:

```text
SEARCH_PROVIDER=wos
WOS_API_KEY=<Clarivate issued key>
```

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

Local OpenAlex runtime test:

```bash
npx wrangler dev --config apps/worker/wrangler.toml --port 8787 \
  --var SEARCH_PROVIDER:openalex \
  --var OPENALEX_EMAIL:<contact email> \
  --var CROSSREF_EMAIL:<contact email> \
  --var UNPAYWALL_EMAIL:<contact email>
```

Then:

```bash
curl -s http://localhost:8787/api/diagnostics
curl -s -X POST http://localhost:8787/api/search-jobs \
  -H 'Content-Type: application/json' \
  --data '{"keyword":"Marketing","yearStart":2020,"maxResults":5}'
curl -s http://localhost:8787/api/search-jobs/<job_id>
```

Observed successful job:

```text
job-16b478a9-acb5-482e-891d-ba459ab116b5
```

Result:

- `status: completed`
- `currentStep: completed`
- persisted one allowlisted result from `Journal of Management Studies`
- Crossref verification returned `verified`
- Unpaywall returned direct OA PDF metadata
- diagnostics returned `searchProvider: openalex`, no missing D1 columns, and `activeProviderReady: true`

### Troubleshooting

The first OpenAlex runtime request failed with:

```text
OpenAlex request failed with 400
```

Direct API inspection showed `host_venue` is not a valid current `select` field. The fallback now reads the journal/source from `primary_location.source.display_name`.

## 2026-05-14 - Cloudflare Remote MCP Worker Attachment

### Context

The requested next step was to attach Cloudflare MCP first. The implementation uses a separate Worker so the MCP surface remains isolated from the dashboard/backend API.

### Code Changes Under Test

- Added `apps/mcp` workspace.
- Added Worker service `paper-agent-mcp`.
- Added MCP endpoint `/mcp`.
- Added health endpoint `/health`.
- Added Durable Object binding `MCP_OBJECT`.
- Reused existing D1 binding `DB` and R2 binding `REPORTS`.
- Exposed read-only tools only:
  - `get_system_diagnostics`
  - `query_recent_jobs`
  - `get_search_job`
  - `get_paper_results`
  - `get_report_links`

### Verification Commands

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/mcp/wrangler.toml
```

All passed.

Dry-run confirmed:

```text
env.MCP_OBJECT (PaperAgentMcp)            Durable Object
env.DB (paper_agent_db)                   D1 Database
env.REPORTS (paper-agent-outputs)         R2 Bucket
```

### Troubleshooting

The first dry-run failed because the Cloudflare Agents SDK imports Node `async_hooks`.

Resolution:

```toml
compatibility_flags = ["nodejs_compat"]
```

The actual deploy command then failed locally because the current non-interactive shell did not have `CLOUDFLARE_API_TOKEN`.

Required local action before deployment:

```bash
export CLOUDFLARE_API_TOKEN=...
npm run deploy:mcp
```

## 2026-05-14 - Deployed MCP Runtime Verification

### Context

The user confirmed the deployed `paper-agent-mcp` health response:

```json
{
  "ok": true,
  "service": "paper-agent-mcp",
  "endpoint": "/mcp"
}
```

### Verification

Confirmed health endpoint:

```bash
curl -s https://paper-agent-mcp.shch3653.workers.dev/health
```

Confirmed MCP protocol connectivity with the TypeScript MCP SDK over Streamable HTTP.

Observed tool list:

```text
get_system_diagnostics
query_recent_jobs
get_search_job
get_paper_results
get_report_links
```

Confirmed `get_system_diagnostics` returned D1 ready, no missing columns, R2 reports bound, and read-only MCP mode.

Confirmed D1 job reads with:

```text
query_recent_jobs
get_search_job
get_paper_results
get_report_links
```

Completed job used for verification:

```text
job-7c9f455b-e7aa-4443-8148-63a4a4a4b1e5
```

`get_paper_results` returned ranked D1 paper rows. `get_report_links` returned API paths and R2 keys. For this older completed job, `existsInR2` was false because it was generated before R2 output persistence was enabled.

### Follow-Up

Added reusable smoke test:

```bash
npm run smoke:mcp
```

## 2026-05-14 - Component-Based Ranking Formula And MCP Plan

### Context

WoS API approval is delayed, so implementation proceeded on ranking quality and MCP attachment planning without requiring live search execution.

### Code Changes Under Test

- Updated shared score input and weights:

```text
relevance: 0.35
journalFit: 0.20
verification: 0.15
openAccess: 0.10
citation: 0.10
recency: 0.10
```

- Worker now recalculates `finalScore` after Crossref and Unpaywall enrichment, then reranks papers before D1/R2 persistence.
- Include status now requires both score and minimum verification confidence:
  - `include`: final score >= 0.72 and verification score >= 0.5
  - `exclude`: final score < 0.35
  - otherwise `review`

### MCP Planning

- Added `docs/mcp.md`.
- Recommended read-only MCP first, then controlled write tools.
- Recommended separate Worker for safer MCP experimentation.
- Added an audit-table proposal for future MCP tool calls.

### Verification Commands

Static checks should be run:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All passed. The dry-run output showed `env.DB` and `env.REPORTS` bindings.

## 2026-05-14 - Integrated Project PDF Workflow Reflection

### Context

The file `AI_Agent_프로젝트_전체_통합본.pdf` was added locally and requested as the basis for the overall workflow design. The PDF defines the project as a top-journal-aware multi-agent literature review assistant with Planner, Journal Selector, Search/Retriever, Verifier, OA Download, Journal Evaluation, Relevance, Ranking, Summarizer, Comparator, Critic, and Report agents.

### Extraction Notes

- `pdftotext` was not available in the environment.
- The PDF text was extracted by reading PDF streams and applying embedded ToUnicode CMaps.
- The source PDF remains untracked unless explicitly requested.

### Reflected Design Decisions

- Added `docs/workflow.md` as the implementation-facing workflow source of truth.
- Captured the 12-stage workflow from user input through R2 report output.
- Mapped each target agent to current implementation status.
- Preserved D1 as operational metadata storage and R2 as output artifact storage.
- Recorded the WoS API approval as the current live-search blocker.
- Listed WoS-excluded next priorities: ranking formula, Recent Jobs filters, report sections, PDF/XLSX output, Vectorize relevance, Drive OA PDF upload, and tests.

## 2026-05-14 - Recent Jobs Dashboard Recovery

### Context

Clarivate `wos-starter` approval is still pending, so new live searches remain blocked. The dashboard needed a way to recover and inspect prior D1 search jobs without creating a new search.

### Code Changes Under Test

- Added Worker route:

```text
GET /api/search-jobs?limit=10
```

- The route returns recent `search_jobs` rows ordered by `created_at DESC`.
- Added dashboard Recent Jobs panel that loads recent jobs on startup and can reload a prior job through `GET /api/search-jobs/:id`.
- Refreshing or creating a job refreshes the recent jobs list.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All passed. The dry-run output showed `env.DB` and `env.REPORTS` bindings.

## 2026-05-14 - Markdown Report Format Improvement

### Context

Clarivate `wos-starter` approval is still the priority 0 external blocker, so development continued on report output quality that can be verified without live WoS access.

### Code Changes Under Test

- Added executive summary metrics to Markdown reports:
  - include/review/exclude counts
  - open access PDF count
  - average final score
  - generated timestamp
- Added a top-ranked Markdown table before detailed paper sections.
- Added OA landing page and license/host/repository details to each paper section.
- Escaped pipe characters in table cells so journal titles and paper titles do not break Markdown tables.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All passed. The dry-run output showed `env.DB` and `env.REPORTS` bindings.

## 2026-05-14 - Unpaywall Runtime Variable Verification

### Context

The deployed diagnostics endpoint initially showed `unpaywallEmail: false` after the user added `UNPAYWALL_EMAIL` in Cloudflare. The expected runtime variable name in code is exactly `UNPAYWALL_EMAIL`.

### Investigation

- Confirmed `apps/worker/src/index.ts` checks `Boolean(env.UNPAYWALL_EMAIL)`.
- Confirmed `.env.example` uses `UNPAYWALL_EMAIL`.
- Attempted remote secret listing with Wrangler, but this local environment does not have `CLOUDFLARE_API_TOKEN`, so Wrangler could not inspect deployed secrets directly.
- Queried the deployed diagnostics endpoint:

```bash
curl -s https://paper-agent-project.shch3653.workers.dev/api/diagnostics
```

Observed:

```json
{
  "ok": true,
  "db": {
    "bound": true,
    "missingColumns": []
  },
  "env": {
    "wosApiKey": false,
    "crossrefEmail": true,
    "unpaywallEmail": true,
    "r2Reports": true
  }
}
```

### Resolution

`UNPAYWALL_EMAIL` is now visible to the deployed Worker runtime. No code change was required. Remaining external blocker is Clarivate `wos-starter` approval and `WOS_API_KEY` configuration.

## 2026-05-14 - R2 Output Storage Binding

### Context

R2 bucket creation is complete. The Worker can now persist generated output files instead of only streaming CSV/Markdown responses directly from D1.

### Code Changes Under Test

- Enabled `REPORTS` R2 binding for bucket `paper-agent-outputs` in both Worker config files:

```text
wrangler.toml
apps/worker/wrangler.toml
```

- Search completion now attempts to write:

```text
reports/<job_id>/papers.csv
reports/<job_id>/report.md
```

- Download endpoints check R2 first, then fall back to direct D1-based generation:

```text
GET /api/search-jobs/:id/papers.csv
GET /api/search-jobs/:id/report.md
```

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All passed. The dry-run output showed both bindings:

```text
env.DB (paper_agent_db)
env.REPORTS (paper-agent-outputs)
```

### Troubleshooting Notes

- R2 persistence is non-blocking for job success. If R2 writes fail, the job remains completed and the download endpoints still generate content directly from D1.
- Runtime verification requires a deployed Worker with the `REPORTS` binding and a completed search job.
- After a completed job, check R2 bucket `paper-agent-outputs` for `reports/<job_id>/papers.csv` and `reports/<job_id>/report.md`.

## 2026-05-14 - Markdown Report Output While WoS Approval Is Pending

### Context

The `wos-starter` subscription for `MON AI Team Paper Agent Project` is pending Clarivate approval. The approval wait is now the priority 0 external blocker, so development continued on output generation that does not require a live WoS API key.

### Code Changes Under Test

- Added Worker route:

```text
GET /api/search-jobs/:id/report.md
```

- Added Markdown report generation from persisted D1 job, paper, Crossref, Unpaywall, and evaluation score data.
- Added a dashboard Markdown report download button next to the CSV download button.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All passed.

### Troubleshooting Notes

- The report endpoint depends on an existing completed or partial search job in D1.
- R2 remains disabled, so the report is generated directly from Worker response content rather than stored as an object.

## 2026-05-14 - Clarivate Web of Science Search Replacement

### Context

The user requested replacing the paper search source with Clarivate Web of Science API after reviewing the Clarivate developer API site.

Official Clarivate pages checked:

```text
https://developer.clarivate.com/apis
https://developer.clarivate.com/apis/wos
https://developer.clarivate.com/apis/wos-starter/swagger
```

### Code Changes Under Test

- Replaced the Worker search stage from OpenAlex Works API to Web of Science Starter API:

```text
GET https://api.clarivate.com/apis/wos-starter/v1/documents
Header: X-ApiKey: <WOS_API_KEY>
Query: q=TS=(...), limit, page, db=WOS, sortField=TC+D
```

- Updated the first persisted Worker step from `openalex_search` to `wos_search`.
- Updated diagnostics to report `env.wosApiKey`.
- Updated the dashboard pipeline label to `WoS`.
- Updated required local/Cloudflare variable documentation to `WOS_API_KEY`.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All passed.

### Troubleshooting Notes

- The D1 `papers.openalex_id` column is intentionally retained for compatibility with the existing deployed schema. New rows store the WoS UID in this column.
- Runtime WoS search was not executed locally because the Clarivate `WOS_API_KEY` value is not present in the local environment.
- After deployment, add `WOS_API_KEY` to the Cloudflare Worker variables/secrets and verify `/api/diagnostics` reports `env.wosApiKey: true`.

### Resolution

The codebase now uses Web of Science Starter API as the primary paper search source. Remaining action: commit, push, configure `WOS_API_KEY` in Cloudflare, wait for deployment, and run the dashboard search flow.

## 2026-05-14 - Diagnostics Endpoint And Dashboard Checks

### Context

D1 schema drift has occurred several times after adding new columns. A lightweight diagnostic path was added so the dashboard can show missing columns and environment readiness before users run a job.

### Code Changes Under Test

- Added `GET /api/diagnostics` in `apps/worker/src/index.ts`.
- Added required D1 column checks for `search_jobs`, `papers`, and `evaluations`.
- Added Worker environment presence checks for OpenAlex, Crossref, Unpaywall, and R2.
- Added System Checks panel in `apps/web/src/main.tsx`.
- Added status chip styles in `apps/web/src/styles.css`.

### Expected Behavior

- `/api/diagnostics` returns `ok: true` when D1 is bound and all required columns exist.
- Missing D1 columns are returned as `table.column` entries.
- The dashboard System Checks panel displays DB/schema readiness and environment variable presence.
- R2 can remain warning-only because report storage is not enabled during the billing-limited MVP.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All three passed.

Runtime check:

```bash
npx wrangler dev --port 8787 --ip 127.0.0.1 \
  --var UNPAYWALL_EMAIL:<contact email> \
  --var CROSSREF_EMAIL:<contact email> \
  --var OPENALEX_EMAIL:<contact email>

curl -s http://127.0.0.1:8787/api/diagnostics
```

Observed:

- HTTP 200.
- `ok: true`.
- `db.bound: true`.
- `db.missingColumns: []`.
- `r2Reports: false`, which is expected while R2 remains disabled.

## 2026-05-14 - Persisted Evaluation Score Components

### Context

The dashboard Score Breakdown initially calculated most component scores in the frontend. The next step was to persist those components in D1 so the evaluation record is auditable and CSV/API output can carry the same score breakdown.

### Code Changes Under Test

- Added score component columns to `apps/worker/schema.sql`.
- Added D1 backfill checks in `apps/worker/src/index.ts`.
- Added score component INSERT values for `evaluations`.
- Added score component SELECT/API mapping and CSV columns.
- Added `apps/worker/migrations/0004_add_evaluation_score_columns.sql` for manual D1 repair.
- Updated dashboard score breakdown to prefer persisted score values and fallback to local estimates for older rows.

### Expected Behavior

- New `evaluations` rows store:
  - `relevance_score`
  - `journal_fit_score`
  - `verification_score`
  - `oa_score`
  - `citation_score`
  - `recency_score`
- API paper summaries include these fields.
- CSV includes these fields.
- Dashboard score bars use the persisted values when present.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All three passed.

Runtime check:

```bash
npx wrangler dev --port 8787 --ip 127.0.0.1 \
  --var UNPAYWALL_EMAIL:<contact email> \
  --var CROSSREF_EMAIL:<contact email> \
  --var OPENALEX_EMAIL:<contact email>
```

Create and poll a local search job:

```bash
curl -s -X POST http://127.0.0.1:8787/api/search-jobs \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"AI interview employer branding","maxResults":3}'

curl -s http://127.0.0.1:8787/api/search-jobs/job-b7747e29-3d5d-476f-a446-d833bcca2c2a
```

Observed:

- Job completed normally.
- API response included persisted component fields: `relevanceScore`, `journalFitScore`, `verificationScore`, `oaScore`, `citationScore`, and `recencyScore`.
- Example verified values: `journalFitScore: 1`, `verificationScore: 1`, `oaScore: 1`, `citationScore: 1`, `recencyScore: 0.6`.

CSV check:

```bash
curl -s -D - http://127.0.0.1:8787/api/search-jobs/job-b7747e29-3d5d-476f-a446-d833bcca2c2a/papers.csv
```

Observed:

- HTTP 200.
- CSV header included all six persisted score component columns.

## 2026-05-14 - Dashboard Score Breakdown

### Context

The dashboard needed to show score components after a run, starting from the previously defined item 2: relevance, journal fit, Crossref verification, OA status, citations, and recency.

### Code Changes Under Test

- Added `citedByCount` to `PaperSummary` in `packages/shared/src/index.ts`.
- Added `p.cited_by_count` to the Worker paper summary SELECT and response mapper.
- Added `ScoreBreakdown` UI in `apps/web/src/main.tsx`.
- Added score bar styles in `apps/web/src/styles.css`.

### Expected Behavior

- Selecting a paper shows six score bars in Paper Detail.
- Relevance uses `abstractScore`.
- Journal Fit is `1.00` because only allowlisted journals are returned.
- Crossref score derives from `verificationStatus`.
- Open Access score derives from Unpaywall/PDF/page availability.
- Citation score derives from OpenAlex `citedByCount`.
- Recency score derives from publication year.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All three passed.

Runtime check:

```bash
npx wrangler dev --port 8787 --ip 127.0.0.1 \
  --var UNPAYWALL_EMAIL:<contact email> \
  --var CROSSREF_EMAIL:<contact email> \
  --var OPENALEX_EMAIL:<contact email>
```

Create and poll a local search job:

```bash
curl -s -X POST http://127.0.0.1:8787/api/search-jobs \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"AI interview employer branding","maxResults":3}'

curl -s http://127.0.0.1:8787/api/search-jobs/job-31a5b171-3f6b-4614-82c4-322b505a5d89
```

Observed:

- Job completed normally.
- Paper response included `citedByCount`.
- Example verified value: `citedByCount: 378`.

## 2026-05-14 - Asynchronous Worker Progress Updates

### Context

The dashboard pipeline panel needed real progress data instead of only showing completion after the POST request finished. The Worker now creates a job immediately, returns it to the dashboard, and continues processing in the background.

### Code Changes Under Test

- Changed `POST /api/search-jobs` to return the initial job immediately.
- Added `ctx.waitUntil()` background processing.
- Added persisted step updates for:
  - `openalex_search`
  - `journal_filter`
  - `crossref_enrichment`
  - `unpaywall_check`
  - `ranking`
  - `completed`
- Added failed job persistence if a background step throws.
- Updated dashboard polling so the selected paper updates when results arrive asynchronously.

### Expected Behavior

- `Run` returns quickly with `status: searching` and an empty `papers` array.
- The dashboard polls `GET /api/search-jobs/:id`.
- `currentStep` changes as each Worker step completes.
- When processing finishes, `status` becomes `completed`, `currentStep` becomes `completed`, and papers are available.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All three passed.

Runtime check:

```bash
npx wrangler dev --port 8787 --ip 127.0.0.1 \
  --var UNPAYWALL_EMAIL:<contact email> \
  --var CROSSREF_EMAIL:<contact email> \
  --var OPENALEX_EMAIL:<contact email>
```

Create a local search job:

```bash
curl -s -X POST http://127.0.0.1:8787/api/search-jobs \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"AI interview employer branding","maxResults":5}'
```

Observed:

- POST returned immediately.
- Initial response had `status: searching`, `currentStep: openalex_search`, `totalSteps: 6`, and an empty `papers` array.

Polling check:

```bash
curl -s http://127.0.0.1:8787/api/search-jobs/job-e44935b6-74e4-4277-9219-e285c795a1da
```

Observed:

- Job reached `status: completed`.
- `currentStep` reached `completed`.
- Papers were persisted and returned.

CSV check:

```bash
curl -s -D - http://127.0.0.1:8787/api/search-jobs/job-e44935b6-74e4-4277-9219-e285c795a1da/papers.csv
```

Observed:

- HTTP 200.
- CSV contained the asynchronously generated job results.

## 2026-05-14 - Dashboard Pipeline Progress Visualization

### Context

After clicking `Run`, the dashboard needed to show where the paper discovery process is in the workflow. The current Worker still processes a job synchronously, so the UI can show the active run state during the request and the completed lifecycle after the response returns.

### Code Changes Under Test

- Added a Pipeline Progress panel in `apps/web/src/main.tsx`.
- Added six visible stages: OpenAlex, Journal Filter, Crossref, Unpaywall, Ranking, and Complete.
- Added progress bar and step state styles in `apps/web/src/styles.css`.

### Expected Behavior

- Before a run, the panel shows a ready state.
- While `Run` is waiting on the Worker response, OpenAlex is highlighted as active.
- When a job returns `completed`, all six stages are shown as complete.
- Future asynchronous backend progress can reuse the same panel by updating `job.currentStep`.

## 2026-05-14 - Business School Journal Allowlist

### Context

The search result must include only journals listed in `경영대학 학술지 목록.docx`. Results from any other journal must fail the selection step and not appear in API, dashboard, CSV, or D1 paper rows.

### Source Extraction

The `.docx` file was inspected as Word XML:

```bash
unzip -l "경영대학 학술지 목록.docx"
unzip -p "경영대학 학술지 목록.docx" word/document.xml
```

Numbered list entries were extracted from the document. The extracted `research article only` entry was treated as a note, not a journal, and was excluded from the allowlist.

### Code Changes Under Test

- Added `packages/shared/src/businessSchoolJournals.ts`.
- Added normalized journal name matching helpers.
- Updated Worker search flow to fetch more OpenAlex candidates, filter by the allowlist, then run Crossref and Unpaywall only for allowed journals.
- Updated dashboard empty state for searches where all candidates are filtered out.

### Expected Behavior

- Allowed journals continue through Crossref, Unpaywall, D1 persistence, API output, dashboard output, and CSV output.
- Non-allowlisted journals are removed before persistence and do not appear in outputs.
- If no allowed journals are found, the job returns an empty `papers` array and the dashboard shows an empty state.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All three passed.

Runtime check:

```bash
npx wrangler dev --port 8787 --ip 127.0.0.1 \
  --var UNPAYWALL_EMAIL:<contact email> \
  --var CROSSREF_EMAIL:<contact email> \
  --var OPENALEX_EMAIL:<contact email>
```

Create a local search job:

```bash
curl -s -X POST http://127.0.0.1:8787/api/search-jobs \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"AI interview employer branding","maxResults":5}'
```

Observed:

- HTTP 200.
- Response returned only allowlisted journals.
- Verified local output included `Journal of the Academy of Marketing Science` and `Journal of Business Ethics`.
- The previously observed non-allowlisted `International Journal of Information Management` result did not appear.

CSV check:

```bash
curl -s -D - http://127.0.0.1:8787/api/search-jobs/job-13ef9a4e-a6c7-4114-8e99-03779cca2152/papers.csv
```

Observed:

- HTTP 200.
- CSV contained only allowlisted journals from the filtered job.

## 2026-05-14 - Unpaywall OA Metadata Foundation

### Context

`UNPAYWALL_EMAIL` was added to the Cloudflare Worker variables/secrets. The next implementation phase was to check DOI-backed papers against Unpaywall and store open access metadata without using R2.

### Code Changes Under Test

- Added Unpaywall DOI lookup in `apps/worker/src/index.ts`.
- Added paper fields for OA PDF URL, OA landing page URL, license, host type, repository, Unpaywall status, and Unpaywall reason.
- Added D1 schema creation/backfill checks for the new Unpaywall columns.
- Added Unpaywall columns to CSV output.
- Added dashboard table/detail display for PDF/page availability and OA metadata.
- Added shared dashboard/API type fields in `packages/shared/src/index.ts`.

### Notes

- R2 remains disabled due to billing, so the Worker stores only Unpaywall metadata and URLs.
- The Worker skips Unpaywall lookup gracefully when `UNPAYWALL_EMAIL` is not configured.
- Local runtime verification first returned `unpaywallStatus: skipped` because shell environment variables are not automatically injected into Worker `env` by `wrangler dev`.
- Re-running `wrangler dev` with `--var UNPAYWALL_EMAIL:...` injected the value correctly.
- Added a tracked manual migration file:

```text
apps/worker/migrations/0003_add_unpaywall_columns.sql
```

Use Cloudflare D1 Console to run `PRAGMA table_info(papers);`, then run only the missing `ALTER TABLE` statements from that migration file.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All three passed.

Runtime check:

```bash
npx wrangler dev --port 8787 --ip 127.0.0.1 \
  --var UNPAYWALL_EMAIL:<contact email> \
  --var CROSSREF_EMAIL:<contact email> \
  --var OPENALEX_EMAIL:<contact email>
```

Create a local search job:

```bash
curl -s -X POST http://127.0.0.1:8787/api/search-jobs \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"AI interview employer branding","maxResults":1}'
```

Observed:

- HTTP 200.
- Response included `oaPdfUrl`, `oaLandingPageUrl`, `oaLicense`, `oaHostType`, `unpaywallStatus`, and `unpaywallReason`.
- `unpaywallStatus` returned `found` for the verified local DOI test.

CSV check:

```bash
curl -s -D - http://127.0.0.1:8787/api/search-jobs/job-7c4e87a1-dccb-4f12-a8bf-79c589e80b59/papers.csv
```

Observed:

- HTTP 200.
- CSV header included `oa_pdf_url`, `oa_landing_page_url`, `oa_license`, `oa_host_type`, `oa_repository`, `unpaywall_status`, and `unpaywall_reason`.
- CSV row included Unpaywall metadata.

## 2026-05-14 - D1 Missing Publisher Column

### Context

D1 Console returned:

```text
no such column: publisher at offset 19: SQLITE_ERROR
```

This means the deployed D1 `papers` table predates the Crossref enrichment columns. The Worker has automatic schema backfill, but D1 Console queries fail until either the deployed Worker runs once after the latest code is live or the missing columns are added manually.

### Verification Attempt

Tried to inspect the remote D1 table from the terminal:

```bash
npx wrangler d1 execute paper_agent_db --remote --command "PRAGMA table_info(papers);"
```

Result:

- Failed because this non-interactive terminal does not have `CLOUDFLARE_API_TOKEN` set.
- No remote D1 mutation was applied from the terminal.

### Resolution Path

Added a tracked manual migration file:

```text
apps/worker/migrations/0002_add_crossref_columns.sql
```

Use Cloudflare D1 Console to run `PRAGMA table_info(papers);`, then run only the missing `ALTER TABLE` statements from that migration file.

If `publisher` is missing, the other Crossref columns are likely missing too:

```text
crossref_id
publisher
issn
publication_type
published_date
verification_status
verification_reason
```

After the columns exist, run the dashboard again so new rows are populated with Crossref metadata.

## 2026-05-14 - Crossref Enrichment And Verifier Foundation

### Context

The next development phase after CSV export was to start the Verifier Agent foundation. The Worker now enriches OpenAlex DOI-backed papers with Crossref metadata and records a basic verification decision.

### Code Changes Under Test

- Added Crossref DOI lookup in `apps/worker/src/index.ts`.
- Added paper fields for Crossref ID, publisher, ISSN, publication type, published date, verification status, and verification reason.
- Added D1 schema creation/backfill checks for the new paper columns.
- Added Crossref and verification columns to CSV output.
- Added shared dashboard/API type fields in `packages/shared/src/index.ts`.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All three passed.

Runtime check:

```bash
curl -s -X POST http://127.0.0.1:8787/api/search-jobs \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"AI interview employer branding","maxResults":1}'
```

Observed:

- HTTP 200.
- Response contained OpenAlex-derived paper data.
- Response included Crossref-derived fields: `publisher`, `issn`, `publicationType`, `publishedDate`, `verificationStatus`, and `verificationReason`.

CSV check:

```bash
curl -s -D - http://127.0.0.1:8787/api/search-jobs/job-bc0b798d-8dcd-46e0-8fa2-7131dbf74987/papers.csv
```

Observed:

- HTTP 200.
- CSV header included `publisher`, `issn`, `publication_type`, `published_date`, `verification_status`, and `verification_reason`.
- CSV row included Crossref metadata and verification details.

### Troubleshooting Notes

- The first local JSON check showed Crossref enrichment was being saved but not returned because `mapPaperSummary` did not expose the new optional fields.
- The row mapper was updated to return the Crossref and verification fields.
- Review found that string-based match counting could treat `mismatch` as a successful match because the word ends with `match`; verification now counts boolean match results instead.
- A second local POST confirmed the fields were present in the API response and CSV output.
- The local runtime emitted non-blocking `workerd` RPC messages during dev server execution, but API calls completed successfully.

### Resolution

Crossref enrichment is locally verified. Remaining action: commit, push, wait for Cloudflare deployment, add `CROSSREF_EMAIL` to the Worker variables/secrets, and verify deployed D1 rows.

## 2026-05-13 - CSV Export Endpoint Verification

### Context

The project needed a CSV download path because R2 is unavailable during the MVP due to billing constraints. The intended flow was:

```text
Dashboard Run
-> Worker creates/searches a job
-> D1 persists job, papers, evaluations
-> Dashboard Download button calls GET /api/search-jobs/:id/papers.csv
-> Worker generates CSV directly from D1
```

### Code Changes Under Test

- Added Worker route:

```text
GET /api/search-jobs/:id/papers.csv
```

- Added CSV generation helpers in `apps/worker/src/index.ts`.
- Added dashboard CSV button in `apps/web/src/main.tsx`.
- Added button layout styling in `apps/web/src/styles.css`.

### Verification Commands

Static checks:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

All three passed.

Runtime check:

```bash
npx wrangler dev --port 8787 --ip 127.0.0.1
```

Create a local search job:

```bash
curl -s -X POST http://127.0.0.1:8787/api/search-jobs \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"AI interview employer branding","maxResults":2}'
```

Observed:

- HTTP 200.
- Response contained a completed job.
- Response contained OpenAlex-derived paper results.

CSV check:

```bash
curl -s -D - http://127.0.0.1:8787/api/search-jobs/job-a0b2e7ba-cef1-4c49-a8f4-bf33cd699983/papers.csv | head -n 20
```

Observed:

- HTTP 200.
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition` attachment filename was set.
- CSV header row was present.
- CSV rows included rank, title, authors, DOI, OA status, scores, and relevance reason.

### Troubleshooting Notes

- The previous turn was interrupted after implementation and verification but before documentation and commit.
- No `wrangler dev` process remained running after interruption.
- No code rollback was required.
- The local runtime emitted non-blocking `workerd` RPC messages during dev server execution, but API calls completed successfully with HTTP 200 responses.
- The CSV endpoint depends on an existing job ID. A browser GET to `/api/search-jobs` still returns `{"error":"Not found"}` because that route is intentionally POST-only.

### Resolution

The CSV export implementation is locally verified. Remaining action: commit, push, wait for Cloudflare deployment, and verify the deployed dashboard download button.
