# Changelog

All notable repository changes must be recorded in this file.

This project follows a strict manual changelog policy. Every commit or pull request that changes source code, infrastructure configuration, documentation, benchmark data, prompts, schema, or deployment behavior must update this file in the same commit or pull request.

## Rules

- Add a new entry under `Unreleased` before committing a meaningful change.
- Use one of these labels: `Added`, `Changed`, `Fixed`, `Removed`, `Security`, `Infra`, `Docs`, `Benchmark`.
- Include the affected path when practical.
- Do not bundle unrelated changes into one vague entry.
- Do not remove historical entries.
- If a change is intentionally not user-visible, still record it as `Infra`, `Docs`, or `Changed`.

## Unreleased

- `Added`: Added `apps/mcp` Cloudflare Remote MCP Worker with read-only D1/R2 tools for diagnostics, recent jobs, job details, paper results, and report links.
- `Infra`: Added `paper-agent-mcp` Wrangler configuration with Durable Object `MCP_OBJECT`, D1 `DB`, R2 `REPORTS`, and `nodejs_compat` for the Cloudflare Agents SDK.
- `Docs`: Updated `README.md`, `docs/mcp.md`, `docs/progress.md`, and `docs/debug-log.md` with MCP deployment, verification, and troubleshooting details.
- `Changed`: Updated `packages/shared/src/index.ts` and `apps/worker/src/index.ts` so final ranking uses persisted relevance, journal fit, Crossref verification, OA, citation, and recency score components.
- `Docs`: Added `docs/mcp.md` with a phased MCP attachment plan, safe tool boundaries, deployment options, required bindings/secrets, and audit requirements.
- `Docs`: Added `docs/workflow.md` and updated `docs/benchmark.md` to reflect `AI_Agent_프로젝트_전체_통합본.pdf` into the target multi-agent workflow, data architecture, output standard, evaluation plan, blocker status, and WoS-excluded implementation priorities.
- `Added`: Added `GET /api/search-jobs?limit=` in `apps/worker/src/index.ts` for recent search job listing.
- `Added`: Added a Recent Jobs panel in `apps/web/src/main.tsx` and `apps/web/src/styles.css` so saved jobs can be reloaded without starting a new search.
- `Changed`: Improved Markdown report output in `apps/worker/src/index.ts` with executive summary metrics, a top-ranked table, generated timestamp, OA landing page, and license details.
- `Docs`: Recorded deployed `UNPAYWALL_EMAIL` diagnostics verification in `docs/debug-log.md` and `docs/progress.md`.
- `Infra`: Enabled the `REPORTS` R2 binding for bucket `paper-agent-outputs` in `wrangler.toml` and `apps/worker/wrangler.toml`.
- `Changed`: Updated `apps/worker/src/index.ts` to persist CSV and Markdown report outputs to R2 under `reports/<job_id>/` and serve stored R2 objects when available.
- `Docs`: Updated `README.md`, `docs/progress.md`, and `docs/debug-log.md` with R2 output storage behavior and verification steps.
- `Added`: Added `GET /api/search-jobs/:id/report.md` in `apps/worker/src/index.ts` and a dashboard Markdown report download button in `apps/web/src/main.tsx`.
- `Docs`: Recorded Clarivate `wos-starter` subscription approval as priority 0 in `docs/progress.md`.
- `Changed`: Replaced OpenAlex search with Clarivate Web of Science Starter API search in `apps/worker/src/index.ts`, using `WOS_API_KEY` and `X-ApiKey` authentication.
- `Changed`: Updated dashboard pipeline and System Checks labels in `apps/web/src/main.tsx` from OpenAlex to WoS.
- `Docs`: Replaced OpenAlex setup references with Web of Science setup in `.env.example`, `README.md`, `docs/progress.md`, and `docs/debug-log.md`.
- `Added`: Added `GET /api/diagnostics` in `apps/worker/src/index.ts` to report D1 schema and Worker environment readiness.
- `Added`: Added dashboard System Checks panel in `apps/web/src/main.tsx` and `apps/web/src/styles.css`.
- `Added`: Persisted score breakdown columns in `evaluations` via `apps/worker/schema.sql`, `apps/worker/src/index.ts`, and `apps/worker/migrations/0004_add_evaluation_score_columns.sql`.
- `Changed`: Updated dashboard score breakdown in `apps/web/src/main.tsx` to prefer persisted evaluation scores and fallback to client-side estimates for older rows.
- `Added`: Added score breakdown visualization in `apps/web/src/main.tsx` and `apps/web/src/styles.css` for relevance, journal fit, Crossref verification, OA, citations, and recency.
- `Changed`: Included `citedByCount` in `PaperSummary` API mapping through `packages/shared/src/index.ts` and `apps/worker/src/index.ts`.
- `Changed`: Updated `apps/worker/src/index.ts` to create search jobs immediately and process OpenAlex, journal filtering, Crossref, Unpaywall, and ranking in the background with persisted step updates.
- `Changed`: Updated dashboard polling in `apps/web/src/main.tsx` so selected papers update when asynchronous results arrive.
- `Added`: Added pipeline progress visualization to `apps/web/src/main.tsx` and `apps/web/src/styles.css` for search run status.
- `Added`: Added `packages/shared/src/businessSchoolJournals.ts` allowlist extracted from `경영대학 학술지 목록.docx`.
- `Changed`: Updated `apps/worker/src/index.ts` so only allowed business school journals are saved and returned from search results.
- `Changed`: Updated `apps/web/src/main.tsx` and `apps/web/src/styles.css` to handle empty results after journal allowlist filtering.
- `Added`: Added Unpaywall DOI open access metadata lookup in `apps/worker/src/index.ts` with D1 persistence and CSV output.
- `Changed`: Updated `apps/web/src/main.tsx` to display OA PDF/page availability, Unpaywall status, license, host type, and repository metadata.
- `Docs`: Added `apps/worker/migrations/0003_add_unpaywall_columns.sql` for manual D1 repair when deployed tables predate Unpaywall columns.
- `Docs`: Added `apps/worker/migrations/0002_add_crossref_columns.sql` for manual D1 repair when deployed tables predate Crossref columns.
- `Docs`: Updated `docs/progress.md` and `docs/debug-log.md` with Crossref enrichment verification, deployment requirements, and next-session handoff details.
- `Added`: Added Crossref DOI metadata enrichment and DOI/title/year/journal verification fields in `apps/worker/src/index.ts`, `apps/worker/schema.sql`, and CSV output.
- `Fixed`: Corrected Crossref verification match counting in `apps/worker/src/index.ts` so `mismatch` is not counted as a successful match.
- `Docs`: Added `CROSSREF_EMAIL` to `.env.example` and `README.md` required secrets.
- `Docs`: Added `docs/debug-log.md` with CSV endpoint verification and troubleshooting details.
- `Added`: Added `GET /api/search-jobs/:id/papers.csv` in `apps/worker/src/index.ts` and a dashboard CSV download button in `apps/web/src/main.tsx`.
- `Fixed`: Added OpenAlex `api_key` support, selected response fields, and retry/backoff handling for 429 responses in `apps/worker/src/index.ts`.
- `Docs`: Added `OPENALEX_API_KEY` to `.env.example` and `README.md` required secrets.
- `Changed`: Replaced demo-only search persistence in `apps/worker/src/index.ts` with OpenAlex Works API search, D1 persistence, and basic relevance scoring.
- `Changed`: Extended `apps/worker/schema.sql` and D1 schema backfill checks with `openalex_id`, `abstract`, and `cited_by_count` paper metadata.
- `Docs`: Added and expanded `docs/progress.md` as the mandatory session handoff document with current implementation, deployment, D1 verification status, remaining work, and next-session startup instructions.
- `Docs`: Added `README.md` session handoff policy requiring `docs/progress.md` updates before ending work sessions.
- `Added`: Added `apps/worker/schema.sql` with D1 tables and indexes for search jobs, papers, and evaluations.
- `Fixed`: Added Worker route error responses and D1 column backfill checks so older Cloudflare D1 tables can accept search job inserts.
- `Fixed`: Included `created_at` values when inserting papers and evaluations to satisfy existing Cloudflare D1 constraints.
- `Changed`: Updated `apps/web/src/main.tsx` to show API errors when search creation or refresh fails.
- `Changed`: Updated `apps/worker/src/index.ts` so search job POST/GET routes persist demo results to D1 and read them back by job ID.
- `Changed`: Connected the dashboard refresh button in `apps/web/src/main.tsx` to reload the active search job from the Worker API.
- `Changed`: Updated `apps/web/src/main.tsx` to call the deployed Worker API through `VITE_API_BASE_URL`, defaulting to `https://paper-agent-project.shch3653.workers.dev`, and added Vite environment typings.
- `Infra`: Added root `wrangler.toml` so the existing Cloudflare Build configuration can deploy with `npx wrangler deploy` from repository root.
- `Fixed`: Renamed Worker in `apps/worker/wrangler.toml` to `paper-agent-project` so it matches the existing Cloudflare Worker service.
- `Fixed`: Added missing `build` scripts to `apps/worker/package.json` and `packages/shared/package.json` so Cloudflare root-level `npm run build` succeeds across workspaces.
- `Infra`: Configured `apps/worker/wrangler.toml` with D1 database ID `4d622431-3574-4e04-a359-dada93e97438` and disabled R2 binding until billing is available.
- `Added`: Created `CHANGELOG.md` and `.github/pull_request_template.md` to enforce strict update history tracking.

## 2026-05-11

- `Added`: Set up monorepo structure with `apps/web`, `apps/worker`, `packages/shared`, `docs`, and `benchmark`.
- `Added`: Created React/Vite dashboard scaffold in `apps/web`.
- `Added`: Created Cloudflare Worker API scaffold in `apps/worker`.
- `Added`: Created shared TypeScript types and final score helper in `packages/shared`.
- `Docs`: Replaced initial team workspace README with project architecture, local development, Cloudflare setup, and MVP flow.
- `Infra`: Added `.env.example`, `.gitignore`, npm workspaces, Wrangler configuration, and Cloudflare compatibility date alignment.
