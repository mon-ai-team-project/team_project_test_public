# Project Progress And Session Handoff

Updated: 2026-05-14

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

0. Wait for Clarivate to approve the `wos-starter` subscription for `MON AI Team Paper Agent Project`.
1. After approval, copy the issued API key into the Cloudflare Worker variables/secrets as `WOS_API_KEY`.
2. Wait for Cloudflare to deploy the next `main` commit.
3. Open `/api/diagnostics` and confirm `env.wosApiKey` is `true`.
4. Open the dashboard and confirm the System Checks panel reports D1 schema readiness and WoS API key presence.
5. Click `Run` and confirm the Pipeline Progress panel advances through `wos_search`, journal filtering, Crossref, Unpaywall, ranking, and completion.
6. Confirm D1 `papers.openalex_id` stores the WoS UID for new rows. The column name is retained for schema compatibility.
7. Verify deployed CSV and Markdown report downloads include Crossref, Unpaywall, and evaluation score data.
8. Start the next major implementation phase: ranking formula improvements or PDF report generation.

## Current Status

The project is deployed through the cloud workflow:

1. Code changes are committed and pushed to `origin/main`.
2. Cloudflare picks up GitHub changes and deploys the Worker and Pages projects.
3. The dashboard calls the deployed Worker API.
4. The Worker searches Web of Science and writes search job results to Cloudflare D1.
5. D1 Console queries now return stored rows.

The latest confirmed behavior is normal:

- Clicking `Run` in the dashboard creates a search job.
- `POST /api/search-jobs` now calls the Web of Science Starter API, maps returned documents, scores them, and stores the result in D1.
- `search_jobs`, `papers`, and `evaluations` receive rows in D1.
- D1 Console no longer returns empty results after a successful run.

## Repository And Deployment Targets

- GitHub repository: `https://github.com/Vulter3653/paper-agent-project.git`
- Active branch: `main`
- Worker service: `paper-agent-project`
- Dashboard Pages project: `paper-agent-dashboard`
- D1 database: `paper_agent_db`
- D1 binding: `DB`
- D1 database ID: `4d622431-3574-4e04-a359-dada93e97438`
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

### Dashboard

- Search keyword input.
- `Run` button calls `POST /api/search-jobs`.
- Ranked papers table.
- Selected paper detail panel.
- Status metrics for job state, step, paper count, and top score.
- Refresh button calls `GET /api/search-jobs/:id`.
- API error messages are shown in the page when search creation or refresh fails.
- Dashboard API base URL supports `VITE_API_BASE_URL`, with a deployed Worker default.
- Pipeline Progress panel visualizes Web of Science search, journal filtering, Crossref enrichment, Unpaywall check, ranking, and completion status.
- Paper Detail panel shows Score Breakdown for relevance, journal fit, Crossref verification, open access, citations, and recency.
- System Checks panel calls `GET /api/diagnostics` to display D1 schema readiness and Worker environment variable presence.

### Worker API

- `GET /api/health`
- `POST /api/search-jobs`
- `GET /api/search-jobs/:id`
- `GET /api/search-jobs/:id/papers.csv`
- `GET /api/search-jobs/:id/report.md`
- `GET /api/diagnostics`
- CORS headers for dashboard access.
- D1 binding validation.
- D1 schema creation/backfill checks.
- Asynchronous search job processing with persisted `current_step` updates.
- Web of Science Starter API search using the dashboard keyword.
- Web of Science API key support through `WOS_API_KEY`.
- Web of Science retry/backoff handling for 429 and 5xx responses.
- Web of Science result mapping for title, authors, year, journal/source, DOI, abstract/keywords, WoS UID, and citation count.
- Basic relevance scoring based on title keyword overlap, abstract keyword overlap, citation count, and recency.
- Search job persistence into D1.
- D1 readback for job, paper, and evaluation data.
- Direct CSV generation from persisted D1 results while R2 is unavailable.
- Direct Markdown report generation from persisted D1 results while R2 is unavailable.
- Crossref DOI lookup after Web of Science search.
- Crossref metadata enrichment for publisher, ISSN, publication type, and published date.
- Basic DOI/title/year/journal verification status and reason fields.
- Unpaywall DOI lookup after Crossref enrichment.
- Unpaywall open access metadata persistence for PDF URL, landing page URL, license, host type, repository, status, and reason.
- Business school journal allowlist filtering based on `경영대학 학술지 목록.docx`; non-allowlisted journals are removed before D1 persistence and API/CSV output.
- JSON error responses for API failures.

### D1 Schema

Schema is tracked in `apps/worker/schema.sql`.

Tables:

- `search_jobs`
- `papers`
- `evaluations`

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

## Important Fixes Completed

- Worker name aligned to the existing Cloudflare service: `paper-agent-project`.
- Root `wrangler.toml` added for Cloudflare root deploy compatibility.
- D1 binding configured without R2, because R2 is intentionally disabled for the MVP.
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
- Markdown report download was added as an R2-free interim report output.

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

Markdown report generation was statically verified with typecheck/build/dry-run. Runtime verification should be done against a deployed or local completed search job using `GET /api/search-jobs/:id/report.md`.

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
4. Confirm deployed persisted evaluation score columns in D1, CSV, and Markdown report output.
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
