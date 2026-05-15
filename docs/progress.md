# Project Progress And Session Handoff

Updated: 2026-05-15

## Mandatory Session Handoff Rules

This file is the required handoff document for future sessions. Before ending any work session, update this file in the same commit or final repository state.

Strict rules:

- Always update `Updated:` to the current date.
- Record all meaningful work completed during the session.
- Record verification commands and whether they passed, failed, or were not run.
- Record deployment URLs, database IDs, branch names, and service names when they change.
- Record any uncommitted work, local-only state, blockers, and manual Cloudflare/GitHub actions still required.
- Keep `Next Session Start Here` accurate and specific enough that a new session can continue without re-reading the full conversation.
- Update `CHANGELOG.md` whenever `docs/progress.md` changes.
- Do not remove historical context unless it is replaced with more accurate current state.

## Next Session Start Here

Start from the current `main` branch. First check:

```bash
git status --short --branch
git log --oneline -8
```

Then verify deployed behavior:

```text
Dashboard: https://paper-agent-project.pages.dev/
Worker health: https://paper-agent-project.shch3653.workers.dev/api/health
```

Current next implementation target:

0. WoS API key registration is complete. Deployed diagnostics must remain:
   - `searchProvider: "wos"`
   - `env.wosApiKey: true`
   - `env.wosApiKeySource: "WOS_API_KEY"`
   - `readiness.activeProviderReady: true`
1. Deploy the search job result count diagnostics added in this session.
2. Confirm the WoS Starter API `hits` parser fix is deployed.
3. Confirm the WoS year filter OR-clause fix is deployed.
4. Run a new WoS dashboard search and confirm the `Source / Allowed` metric.
   - If `Source > 0` and `Allowed = 0`, the WoS query returned candidates but the approved journal allowlist removed them.
   - If `Source = 0`, tune the WoS keyword/date query.
5. Confirm D1 `search_jobs.source_result_count` and `search_jobs.allowed_result_count` are populated for new jobs.
6. If allowed results remain zero for broad business keywords, improve WoS retrieval by adding source-title-aware query expansion or multi-page candidate collection before the allowlist filter.
7. Confirm D1 `papers.openalex_id` stores the external source identifier. The column name is retained for schema compatibility.
8. Verify deployed CSV and Markdown report downloads include Crossref, Unpaywall, and evaluation score data.
9. In R2 bucket `paper-agent-outputs`, confirm `reports/<job_id>/papers.csv` and `reports/<job_id>/report.md` are created for completed jobs with allowed papers.
10. Confirm the Markdown report includes executive summary metrics, Report Agent synthesis sections, top-ranked table, paper details, OA landing page, and license details.
11. Confirm the dashboard Recent Jobs panel lists saved jobs and can reload prior job results.
12. Confirm new jobs use persisted component-score final ranking: relevance 35%, journal fit 20%, Crossref verification 15%, OA 10%, citation 10%, recency 10%.
13. Use `docs/mcp.md` as the current source of truth for MCP attachment and the implemented read-only MCP Worker.
14. Deployed MCP is verified at `https://paper-agent-mcp.shch3653.workers.dev/health`.
15. MCP protocol connectivity and read-only tool calls are verified with `npm run smoke:mcp`.
16. Start the next major implementation phase with XLSX output first, then PDF output.
    - Add `reports/<job_id>/papers.xlsx` generation and R2 persistence.
    - Add dashboard XLSX download button.
    - Extend `npm run e2e:reports` to verify XLSX endpoint and R2 object.
    - After XLSX is stable, add `reports/<job_id>/report.pdf`.
17. Use `docs/workflow.md` as the current source of truth for the integrated multi-agent target workflow.

## Current Status

The project is deployed through the cloud workflow:

1. Code changes are committed and pushed to `origin/main`.
2. Cloudflare picks up GitHub changes and deploys the Worker and Pages projects.
3. The dashboard calls the deployed Worker API.
4. The Worker searches the configured source provider and writes search job results to Cloudflare D1.
5. D1 Console queries now return stored rows.

The latest confirmed behavior is normal:

- Clicking `Run` in the dashboard creates a search job.
- `POST /api/search-jobs` calls the configured source provider, maps returned documents, scores them, and stores the result in D1.
- `search_jobs`, `papers`, and `evaluations` receive rows in D1.
- D1 Console no longer returns empty results after a successful run.
- Deployed `/api/diagnostics` confirms provider readiness, Crossref, Unpaywall, and R2 status; `wosApiKey` is now `true` and `wosApiKeySource` is `WOS_API_KEY`.
- Dashboard Report Preview is visible and displays the Markdown report for completed jobs.
- WoS runtime searches now complete, but the first tested keywords returned zero saved papers after the approved journal allowlist.
- Search job count diagnostics have been added so new jobs expose provider candidate count and allowlist pass count.
- WoS Starter API parsing has been corrected to read the official `hits` response array.
- WoS short year ranges now use explicit OR clauses because `PY=(start-end)` returned zero candidates in runtime testing.

## Repository And Deployment Targets

- GitHub repository: `https://github.com/Vulter3653/paper-agent-project.git`
- Active branch: `main`
- Worker service: `paper-agent-project`
- Dashboard Pages project: `paper-agent-dashboard`
- D1 database: `paper_agent_db`
- D1 binding: `DB`
- D1 database ID: `4d622431-3574-4e04-a359-dada93e97438`
- R2 bucket: `paper-agent-outputs`
- R2 binding: `REPORTS`
- MCP Worker service: `paper-agent-mcp`
- MCP endpoint: `https://paper-agent-mcp.shch3653.workers.dev/mcp`
- Default Worker API URL: `https://paper-agent-project.shch3653.workers.dev`
- Dashboard URL: `https://paper-agent-project.pages.dev/`

Local manual Cloudflare deployment is not used. Deployment should happen in Cloudflare from GitHub commits.

## Implemented

### Monorepo

- Root npm workspace configuration.
- `apps/web` for the React/Vite dashboard.
- `apps/worker` for the Cloudflare Worker API.
- `packages/shared` for shared TypeScript types and scoring helpers.
- `docs` and `benchmark` directories for project references.
- `docs/workflow.md` reflects `AI_Agent_프로젝트_전체_통합본.pdf` into the active implementation roadmap.
- `docs/mcp.md` defines the MCP attachment plan, allowed tool phases, security boundaries, and audit requirements.
- `apps/mcp` implements the first read-only Cloudflare Remote MCP Worker.

### Dashboard

- Search keyword input.
- `Run` button calls `POST /api/search-jobs`.
- Ranked papers table.
- Selected paper detail panel.
- Status metrics for job state, step, paper count, and top score.
- Recent Jobs panel for reloading saved D1 search jobs without creating a new search.
- Refresh button calls `GET /api/search-jobs/:id`.
- API error messages are shown in the page when search creation or refresh fails.
- Dashboard API base URL supports `VITE_API_BASE_URL`, with a deployed Worker default.
- Pipeline Progress panel visualizes Web of Science search, journal filtering, Crossref enrichment, Unpaywall check, ranking, and completion status.
- Status metrics include `Source / Allowed` for new jobs after deployment.
- Paper Detail panel shows Score Breakdown for relevance, journal fit, Crossref verification, open access, citations, and recency.
- System Checks panel calls `GET /api/diagnostics` to display D1 schema readiness and Worker environment variable presence.
- Report Preview panel fetches `GET /api/search-jobs/:id/report.md` for completed jobs and displays the Markdown report in the dashboard before download.

### Worker API

- `GET /api/health`
- `POST /api/search-jobs`
- `GET /api/search-jobs?limit=10`
- `GET /api/search-jobs/:id`
- `GET /api/search-jobs/:id/papers.csv`
- `GET /api/search-jobs/:id/report.md`
- `GET /api/diagnostics`
- CORS headers for dashboard access.
- D1 binding validation.
- R2 `REPORTS` binding for generated output storage.
- D1 schema creation/backfill checks.
- Asynchronous search job processing with persisted `current_step` updates.
- `SEARCH_PROVIDER` switch for `wos` or temporary `openalex` integration testing.
- Web of Science Starter API search using the dashboard keyword.
- Web of Science API key support through `WOS_API_KEY`.
- Web of Science retry/backoff handling for 429 and 5xx responses.
- Web of Science result mapping for title, authors, year, journal/source, DOI, abstract/keywords, WoS UID, and citation count.
- Web of Science Starter API response parsing reads `hits`, with `documents` retained as a compatibility fallback.
- Web of Science year filters use explicit OR clauses for short ranges.
- Temporary OpenAlex Works API fallback using `OPENALEX_EMAIL` and optional `OPENALEX_API_KEY`.
- OpenAlex result mapping for title, authors, publication year/date, source, DOI, OA status, abstract, type, and citation count.
- Basic relevance scoring based on title keyword overlap, abstract keyword overlap, citation count, and recency.
- Final ranking based on persisted component scores: relevance, journal fit, verification, OA, citation, and recency.
- Search job persistence into D1.
- Search jobs track provider candidate count and approved journal allowlist pass count.
- D1 readback for job, paper, and evaluation data.
- Recent search job listing from D1.
- CSV generation from persisted D1 results, with R2 storage under `reports/<job_id>/papers.csv` when available.
- Markdown report generation from persisted D1 results, with R2 storage under `reports/<job_id>/report.md` when available.
- Report Agent Markdown sections for key findings, common themes, method/context differences, research gaps, suggested reading order, screening notes, and limitations.
- CSV and Markdown download endpoints serve the R2 object first and fall back to direct generation if no object exists.
- Crossref DOI lookup after Web of Science search.
- Crossref metadata enrichment for publisher, ISSN, publication type, and published date.
- Basic DOI/title/year/journal verification status and reason fields.
- Unpaywall DOI lookup after Crossref enrichment.
- Unpaywall open access metadata persistence for PDF URL, landing page URL, license, host type, repository, status, and reason.
- Business school journal allowlist filtering based on `경영대학 학술지 목록.docx`; non-allowlisted journals are removed before D1 persistence and API/CSV output.
- JSON error responses for API failures.

### Remote MCP Worker

- `apps/mcp` contains a separate Cloudflare Worker named `paper-agent-mcp`.
- MCP transport endpoint is `/mcp`.
- Health endpoint is `/health`.
- Durable Object binding: `MCP_OBJECT`.
- D1 binding: `DB`.
- R2 binding: `REPORTS`.
- Current mode is read-only.
- Implemented tools:
  - `get_system_diagnostics`
  - `query_recent_jobs`
  - `get_search_job`
  - `get_paper_results`
  - `get_report_links`
- No write/search/generation tools are exposed yet.

### D1 Schema

Schema is tracked in `apps/worker/schema.sql`.

Tables:

- `search_jobs`
- `papers`
- `evaluations`

Additional search job diagnostics now tracked/backfilled:

- `source_result_count`
- `allowed_result_count`

Additional paper metadata now tracked/backfilled:

- `openalex_id` stores the external source identifier; new rows store the WoS UID for schema compatibility.
- `abstract`
- `cited_by_count`
- `crossref_id`
- `publisher`
- `issn`
- `publication_type`
- `published_date`
- `verification_status`
- `verification_reason`
- `oa_pdf_url`
- `oa_landing_page_url`
- `oa_license`
- `oa_host_type`
- `oa_repository`
- `unpaywall_status`
- `unpaywall_reason`

Additional evaluation score metadata now tracked/backfilled:

- `relevance_score`
- `journal_fit_score`
- `verification_score`
- `oa_score`
- `citation_score`
- `recency_score`

Indexes:

- `idx_papers_job_id`
- `idx_evaluations_paper_id`

The deployed D1 database already had some existing schema constraints, including `papers.created_at NOT NULL`. The Worker now inserts `created_at` values for papers and evaluations.

### Change Tracking

- `CHANGELOG.md` was added and is used as the required manual change log.
- `.github/pull_request_template.md` was added to enforce changelog updates.

## Next Implementation Plan: XLSX/PDF Outputs

Begin with XLSX because it is lower risk than PDF and directly useful for reviewing paper rows and scores.

Recommended XLSX scope:

- Add `GET /api/search-jobs/:id/papers.xlsx`.
- Generate workbook from the same persisted D1 result used by CSV.
- Include columns currently present in CSV:
  - job metadata
  - rank/title/authors/year/journal/DOI
  - Crossref metadata
  - Unpaywall metadata
  - score components
  - final score/include status/relevance reason
- Persist XLSX to R2 under:

```text
reports/<job_id>/papers.xlsx
```

- Add dashboard XLSX download icon beside Markdown and CSV.
- Extend `apps/mcp/scripts/e2e-check.mjs` to verify:
  - XLSX endpoint status 200
  - R2 object exists
  - non-zero object size

Recommended PDF scope after XLSX:

- Add `GET /api/search-jobs/:id/report.pdf`.
- Generate from the enhanced Markdown report or equivalent HTML.
- Persist PDF to R2 under:

```text
reports/<job_id>/report.pdf
```

Residual decisions for next session:

- Choose XLSX generation library that works in Cloudflare Workers.
- Choose PDF generation approach compatible with Workers runtime, or defer PDF to a separate rendering service if needed.

## Important Fixes Completed

- Worker name aligned to the existing Cloudflare service: `paper-agent-project`.
- Root `wrangler.toml` added for Cloudflare root deploy compatibility.
- R2 bucket `paper-agent-outputs` and Worker binding `REPORTS` are now configured.
- Workspace build scripts added so root `npm run build` succeeds.
- Dashboard connected to the deployed Worker API.
- Worker POST route fixed after Cloudflare error 1101 by returning JSON errors and handling D1 schema drift.
- D1 insert fixed for `papers.created_at NOT NULL`.
- Demo-only persistence was replaced with real scholarly search and D1 persistence.
- Web of Science errors now return clearer messages for missing `WOS_API_KEY`, authorization failures, and 429 quota limits.
- CSV export endpoint and dashboard CSV button were added and locally verified.
- Crossref enrichment was added after source mapping so DOI-backed results carry publisher, ISSN, publication type, published date, and verification reasons.
- Unpaywall enrichment was added after Crossref mapping so DOI-backed results carry OA PDF/page metadata without requiring R2 storage.
- Journal allowlist filtering was added so only journals from `packages/shared/src/businessSchoolJournals.ts` appear in search results.
- Pipeline Progress was added to the dashboard so users can see where a run is in the paper discovery flow.
- Worker job execution was changed to return a job immediately and continue Web of Science, journal filtering, Crossref, Unpaywall, and ranking in the background with D1 progress updates.
- Score Breakdown was added to the dashboard detail view; the Worker now returns `citedByCount` in paper summaries for citation scoring.
- Score component values are now persisted in `evaluations` and returned through API/CSV so the dashboard can prefer stored scores over frontend estimates.
- Diagnostics were added so D1 schema drift and environment readiness can be checked from the API and dashboard before running jobs.
- Markdown report download was added and CSV/Markdown outputs are stored in R2 when the `REPORTS` binding is available.
- Markdown report output now includes an executive summary, include/review/exclude counts, OA PDF count, average score, Report Agent synthesis sections, top-ranked table, OA landing page, and license details.
- Dashboard now previews Markdown reports for completed jobs without requiring a file download.
- Integrated workflow design from `AI_Agent_프로젝트_전체_통합본.pdf` is now tracked in `docs/workflow.md`.
- Read-only Cloudflare Remote MCP Worker was added in `apps/mcp`.

## Verification Completed

These commands passed after recent code changes:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

CSV endpoint was also locally verified with `wrangler dev`, `POST /api/search-jobs`, and `GET /api/search-jobs/:id/papers.csv`.

Crossref enrichment was locally verified with `wrangler dev`, `POST /api/search-jobs`, and `GET /api/search-jobs/:id/papers.csv`. The local JSON and CSV responses included `publisher`, `issn`, `publication_type`, `published_date`, `verification_status`, and `verification_reason`.

Unpaywall enrichment was locally verified with `wrangler dev --var UNPAYWALL_EMAIL:...`, `POST /api/search-jobs`, and `GET /api/search-jobs/:id/papers.csv`. The local JSON and CSV responses included `oa_pdf_url`, `oa_landing_page_url`, `oa_license`, `oa_host_type`, `oa_repository`, `unpaywall_status`, and `unpaywall_reason`.

Business school journal allowlist filtering was locally verified with `wrangler dev`, `POST /api/search-jobs`, and `GET /api/search-jobs/:id/papers.csv`. The local JSON and CSV responses contained only allowlisted journals, including `Journal of the Academy of Marketing Science` and `Journal of Business Ethics`, and excluded the previously observed non-allowlisted `International Journal of Information Management` result.

Asynchronous Worker progress was locally verified with `wrangler dev`, `POST /api/search-jobs`, `GET /api/search-jobs/:id`, and `GET /api/search-jobs/:id/papers.csv`. The POST response returned immediately with `status: searching`, `currentStep: openalex_search`, `totalSteps: 6`, and an empty `papers` array; a later GET returned `status: completed`, `currentStep: completed`, and persisted paper results. New builds use `currentStep: wos_search` for the first search stage.

Dashboard Score Breakdown was locally verified through typecheck/build and Worker API polling. The Worker response now includes `citedByCount` in paper summaries; a local completed job returned `citedByCount: 378`, enabling the dashboard Citation score bar.

Persisted evaluation score components were locally verified with `wrangler dev`, `POST /api/search-jobs`, `GET /api/search-jobs/:id`, and `GET /api/search-jobs/:id/papers.csv`. The API response and CSV included `relevanceScore`, `journalFitScore`, `verificationScore`, `oaScore`, `citationScore`, and `recencyScore`; example verified values included `journalFitScore: 1`, `verificationScore: 1`, `oaScore: 1`, `citationScore: 1`, and `recencyScore: 0.6`.

Diagnostics were locally verified with `wrangler dev` and `GET /api/diagnostics`. The response returned `ok: true`, `db.bound: true`, no missing columns, and expected warning-level false values for disabled features such as R2 reports.

Temporary OpenAlex provider was locally verified with `wrangler dev --var SEARCH_PROVIDER:openalex --var OPENALEX_EMAIL:...`, `POST /api/search-jobs`, and `GET /api/search-jobs/:id`. The completed test job `job-16b478a9-acb5-482e-891d-ba459ab116b5` returned an allowlisted `Journal of Management Studies` result, Crossref verification, Unpaywall OA PDF metadata, and diagnostics with `searchProvider: openalex` plus `activeProviderReady: true`.

R2 output storage was statically verified with typecheck/build/dry-run. Runtime verification should be done after deployment by completing a search job, downloading `GET /api/search-jobs/:id/papers.csv` and `GET /api/search-jobs/:id/report.md`, and confirming R2 objects exist under `reports/<job_id>/`.

Deployed OpenAlex e2e report verification passed with:

```bash
npm run e2e:reports
```

Verified job `job-9c382a48-7192-4934-987f-63e47ceac7bf` had 9 papers, Worker/MCP top-paper agreement, CSV and Markdown download status 200, and R2 objects present:

```text
reports/job-9c382a48-7192-4934-987f-63e47ceac7bf/papers.csv
reports/job-9c382a48-7192-4934-987f-63e47ceac7bf/report.md
```

Cloudflare Remote MCP was statically verified with:

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/mcp/wrangler.toml
```

The dry-run confirmed `env.MCP_OBJECT`, `env.DB`, and `env.REPORTS`. Deployment was later confirmed by the user and remote health check.

```bash
npm run smoke:mcp
```

The deployed smoke test confirmed tool listing, diagnostics, recent job query, completed job details, paper rows, and report link metadata.

## Manual Cloudflare Settings Required

For real Web of Science search, configure these on the Worker service:

```text
Workers & Pages
-> paper-agent-project
-> Settings
-> Variables and Secrets
```

Add:

```text
WOS_API_KEY=<Clarivate Web of Science API key>
CROSSREF_EMAIL=<contact email>
UNPAYWALL_EMAIL=<contact email>
```

Clarivate API access is managed from:

```text
https://developer.clarivate.com/apis
```

Cloud behavior was also verified:

```sql
SELECT * FROM search_jobs;
SELECT * FROM papers;
SELECT * FROM evaluations;
```

After clicking `Run`, these queries returned stored data.

## Remaining Work

Web of Science search, D1 persistence, CSV export, Crossref enrichment, Unpaywall metadata lookup, business school journal allowlist filtering, dashboard pipeline visualization, asynchronous job progress updates, dashboard score breakdown, persisted evaluation score components, and API/dashboard diagnostics are implemented locally. After Cloudflare deploys the next commit and `WOS_API_KEY` is configured, verify the deployed dashboard and D1 rows. The next major implementation phase is hardening and extending real paper discovery:

0. Wait for Clarivate `wos-starter` subscription approval.
1. Confirm deployed System Checks panel and `/api/diagnostics`.
2. Confirm deployed pipeline progress visualization after clicking `Run`.
3. Confirm deployed score breakdown in the Paper Detail panel.
4. Confirm deployed persisted evaluation score columns in D1, CSV, Markdown report output, and R2 objects.
5. Improve ranking formula using the persisted component scores.
6. Add PDF report generation when R2 or another durable output target is available.
7. Add tests around Worker API persistence, diagnostics, Web of Science mapping, journal allowlist filtering, Crossref enrichment, Unpaywall enrichment, CSV/report generation, D1 row mapping, asynchronous progress updates, and score breakdown mapping.

## Useful D1 Checks

After a dashboard run:

```sql
SELECT * FROM search_jobs ORDER BY created_at DESC;
SELECT * FROM papers ORDER BY created_at DESC;
SELECT * FROM evaluations ORDER BY created_at DESC;
```

Count rows:

```sql
SELECT COUNT(*) FROM search_jobs;
SELECT COUNT(*) FROM papers;
SELECT COUNT(*) FROM evaluations;
```

Web of Science source metadata check:

```sql
SELECT title, openalex_id, cited_by_count, substr(abstract, 1, 120) AS abstract_preview
FROM papers
ORDER BY created_at DESC
LIMIT 10;
```

Crossref metadata check:

```sql
SELECT title, doi, publisher, issn, publication_type, published_date, verification_status, verification_reason
FROM papers
ORDER BY created_at DESC
LIMIT 10;
```

If this query returns `no such column: publisher`, first run:

```sql
PRAGMA table_info(papers);
```

Then add only the missing Crossref columns from:

```text
apps/worker/migrations/0002_add_crossref_columns.sql
```

Unpaywall metadata check:

```sql
SELECT title, doi, oa_pdf_url, oa_landing_page_url, oa_license, oa_host_type, oa_repository, unpaywall_status, unpaywall_reason
FROM papers
ORDER BY created_at DESC
LIMIT 10;
```

If this query returns `no such column: oa_pdf_url`, first run:

```sql
PRAGMA table_info(papers);
```

Then add only the missing Unpaywall columns from:

```text
apps/worker/migrations/0003_add_unpaywall_columns.sql
```

Business school journal allowlist check:

```sql
SELECT DISTINCT journal_name
FROM papers
ORDER BY journal_name ASC;
```

Every returned `journal_name` should correspond to `packages/shared/src/businessSchoolJournals.ts`.

Evaluation score component check:

```sql
SELECT relevance_score, journal_fit_score, verification_score, oa_score, citation_score, recency_score, final_score
FROM evaluations
ORDER BY created_at DESC
LIMIT 10;
```

If this query returns `no such column: relevance_score`, first run:

```sql
PRAGMA table_info(evaluations);
```

Then add only the missing evaluation score columns from:

```text
apps/worker/migrations/0004_add_evaluation_score_columns.sql
```

Diagnostics check:

```text
https://paper-agent-project.shch3653.workers.dev/api/diagnostics
```

The response `ok` field should be `true` after all required D1 columns are present.

CSV check:

```text
https://paper-agent-project.shch3653.workers.dev/api/search-jobs/<job_id>/papers.csv
```

Markdown report check:

```text
https://paper-agent-project.shch3653.workers.dev/api/search-jobs/<job_id>/report.md
```

R2 object check:

```text
R2 -> paper-agent-outputs -> reports/<job_id>/papers.csv
R2 -> paper-agent-outputs -> reports/<job_id>/report.md
```
