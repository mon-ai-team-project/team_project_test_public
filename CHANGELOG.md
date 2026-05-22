# Changelog

All notable repository changes must be recorded in this file.

This project follows a strict manual changelog policy. Every commit or pull request that changes source code, infrastructure configuration, documentation, benchmark data, prompts, schema, or deployment behavior must update this file in the same commit or pull request.

## Rules

- Add a new entry under `Unreleased` before committing a meaningful change, then move it under the current `YYYY-MM-DD` section before the final commit when the date is known.
- Use one of these labels: `Added`, `Changed`, `Fixed`, `Removed`, `Security`, `Infra`, `Docs`, `Benchmark`.
- Every dated work entry must use this exact attribution format: `Label: description. (agent-id)`.
- Use lowercase agent identifiers such as `(codex)` or `(gemini)`, and never remove or rewrite another agent's attribution unless the user explicitly requests correction.
- Date headings may include an agent suffix, such as `## YYYY-MM-DD (codex)`, when a section is specific to one agent.
- Include the affected path when practical.
- Do not bundle unrelated changes into one vague entry.
- Do not remove historical entries.
- If a change is intentionally not user-visible, still record it as `Infra`, `Docs`, or `Changed`.

## Unreleased

- No unreleased changes.

## 2026-05-22 (codex)

- Docs: Added organization-main team task briefing and synchronized team workspace status/instructions for jin23624, juilie, shonshinemin, member-c, and seunghyeon. (codex)

- Added: Added agent rule validation script and GitHub Actions workflow to enforce team branch scope, changelog attribution, and assigned personal-folder updates. (codex)
- Fixed: Tightened agent rule validation so benchmark PR attribution must appear in newly added CHANGELOG lines. (codex)
- Infra: Added CODEOWNERS and updated PR template so maintainer review, shared rules, and personal work-log updates are required for team PRs. (codex)

- Docs: Added shared writing rules for Codex, Gemini, Claude, and future agents, and added/updated agent-specific operating guides. (codex)

## 2026-05-20 (codex)

- Infra: Added Worker and MCP staging Wrangler example configs and ignored local staging config copies that will contain environment-specific D1 IDs. (codex)
- Added: Added `apps/worker/scripts/smoke-test.mjs` and `npm run smoke:worker` for no-quota Worker health, diagnostics, and recent-job checks with optional low-quota search mode. (codex)
- Docs: Updated `docs/staging-testbed.md`, `docs/progress.md`, and `docs/debug-log.md` with Worker smoke-test usage and verification. (codex)
- Docs: Added `docs/staging-testbed.md` with the personal-repo-based staging Worker, Pages, MCP, D1, R2, smoke-test, promotion, and team-integration procedure. (codex)
- Docs: Clarified `seunghyeon_choi/README.md` as the current active worker workspace, maintainer role, integration boundary, and main-protection responsibility. (codex)
- Docs: Added MCP installation guide and shared client config example for Paper Agent, GitHub, Cloudflare, Playwright, and restricted filesystem MCP servers selected from `awesome-mcp-servers`. (codex)
- Docs: Recorded MCP smoke-test verification and local Codex MCP registration status in `docs/debug-log.md` and `docs/progress.md`. (codex)

## 2026-05-18 (shonshinemin)

- Benchmark: Filled `benchmark/manual_review_proposed.csv` with manual relevance scores and decisions for all 15 proposed agent papers across T001-T003 (reviewer: shonshinemin). (shonshinemin)
- Benchmark: Promoted T003 rank-1 paper to gold as G061 in `benchmark/gold_relevant_papers.verified.csv`; DOI `10.1287/mksc.2023.0494` (MARKETING SCIENCE, human_relevance=5, doi_label_status=verified). (shonshinemin)
- Benchmark: Re-ran `npm run benchmark:evaluate-proposed` after gold G061 promotion; `precision_at_k` 0.0000→0.0667, `ndcg_at_k` 0.0000→0.1601, `gold_doi_hit_rate_at_k` 0.0000→0.3333; stability confirmed for doi_accuracy, paper_validity, top_journal_precision, hallucination, oa_success. (shonshinemin)
- Benchmark: Updated `benchmark/proposed_agent_metrics.csv` and `benchmark/proposed_agent_metrics_summary.json` with post-gold-update values. (shonshinemin)
- Docs: Added `shonshinemin_cmd/metric-change-report.md` with full per-task delta analysis, NDCG derivation, and QA recommendations. (shonshinemin)
- Docs: Added `shonshinemin_cmd/qa-notes.md` with QA workflow, allowed-file scope, and re-run instructions. (shonshinemin)
- Docs: Appended benchmark QA re-evaluation entry to `docs/debug-log.md`. (shonshinemin)
- Docs: Appended shonshinemin work summary to `docs/progress.md`. (shonshinemin)

## 2026-05-18 (codex)

- Docs: Added `docs/github-main-protection.md` and updated team agent guidance to reserve organization `main` for `seunghyeon_choi` maintainer-reviewed integration. (codex)
- Benchmark: Completed `benchmark/manual_review_proposed.csv` for all 15 T001-T003 Proposed Agent rows using REPRO-Bench-style human relevance review from `paper_agent_enhanced_report.pdf` section 8. (juilie)
- Docs: Updated `juilie_bot_hub/README.md` with the manual review summary and Paper-Agent-Bench evaluation basis. (juilie)
- Docs: Added `docs/cloudflare-org-repo-migration.md` with Worker, Pages, and MCP settings for switching Cloudflare Git builds to the organization repository. (codex)
- Security: Audited tracked files, Git history, and local workspace for GitHub PAT, Cloudflare token, OpenAlex key, private key, AWS, npm, and Slack token patterns; no actual token values were found. (codex)
- Docs: Corrected team-agent ownership so `seunghyeon_choi` is the current maintainer/integration lead and baseline collection is unassigned pending a separate team member. (codex)
- Docs: Added `AGENTS.md`, `docs/agent-work-queue.md`, team-member README files, benchmark CSV templates, and PR checklist items so team agents can auto-start assigned benchmark work from the organization repository. (codex)
- Docs: Added `docs/team-collaboration.md` for GitHub team repository setup, branch policy, benchmark file ownership, data rules, and PR checklist. (codex)
- Benchmark: Added Proposed Agent evaluation script `benchmark/scripts/evaluate-proposed-agent.mjs` with Precision@K, NDCG@K, gold DOI hit rate, DOI accuracy, validity, top-journal precision, hallucination, and OA success metrics. (codex)
- Benchmark: Generated three-task Proposed Agent metric outputs in `benchmark/proposed_agent_metrics.csv` and `benchmark/proposed_agent_metrics_summary.json`. (codex)
- Benchmark: Ran a quota-safe three-task Proposed Agent benchmark sample and recorded `benchmark/proposed_agent_jobs.csv` plus `benchmark/proposed_agent_results.csv`. (codex)
- Docs: Recorded the three-task Proposed Agent benchmark sample results in `benchmark/benchmark_summary.md`, `docs/debug-log.md`, and `docs/progress.md`. (codex)
- Added: Added route-level dashboard implementation status panels that distinguish live, partial, mock, and planned features across Research, Ops, and Evaluation pages. (codex)
- Docs: Recorded dashboard implementation status panel verification in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Benchmark: Added Proposed Agent benchmark runner `benchmark/scripts/run-proposed-agent.mjs` and `benchmark:run-proposed` to execute benchmark tasks against the deployed Worker API. (codex)
- Benchmark: Verified the Proposed Agent runner with a quota-safe T001 smoke run that completed Worker job `job-768671a5-346d-4f0f-af54-6f29014ceb27` and returned 5 allowlisted results. (codex)
- Docs: Recorded Proposed Agent runner usage and smoke verification in `benchmark/benchmark_summary.md`, `docs/debug-log.md`, and `docs/progress.md`. (codex)

## 2026-05-17 (codex)

- Benchmark: Promoted two high-confidence gold candidates into the gold paper files and recorded the decisions in `benchmark/gold_promotion_decisions.csv`. (codex)
- Benchmark: Added candidate scoring workflow and `benchmark/gold_candidate_review.csv` to prioritize Crossref candidates by journal allowlist, field match, DOI, type, recency, and Crossref score. (codex)
- Fixed: Normalized benchmark task and candidate `journal_category_id` values to match the shared business-school journal category ids. (codex)
- Benchmark: Added a gold refinement workflow that generates `benchmark/gold_refinement_queue.csv` and `benchmark/gold_crossref_candidates.csv` for manual DOI gold label cleanup. (codex)
- Benchmark: Added a Crossref title-query verification script and `benchmark:verify-gold` npm script for gold DOI label generation. (codex)
- Benchmark: Generated `benchmark/gold_relevant_papers.verified.csv` from the first Crossref pass and recorded the verified, ambiguous, and no-match distribution. (codex)
- Benchmark: Expanded the benchmark fixture from 3 keywords to 20 tasks in `benchmark/keywords.csv` and `benchmark/tasks.jsonl`. (codex)
- Benchmark: Added `benchmark/gold_relevant_papers.csv` with 60 seed gold relevance rows and explicit DOI verification status tracking. (codex)
- Benchmark: Added `benchmark/evaluation_rubric.md` and `benchmark/benchmark_summary.md` to define human scoring, agent-level checks, metrics, and next DOI verification steps. (codex)
- Added: Implemented the final dashboard UI/UX routes `/dashboard/research`, `/dashboard/ops`, and `/dashboard/evaluation` from the three interactive HTML design references. (codex)
- Added: Added separated dashboard mock data in `apps/web/src/dashboard/mockData.ts` for workflow stages, journal pools, agent status, tool logs, critic reviews, literature preview, and evaluation scenarios. (codex)
- Infra: Added Cloudflare Pages SPA fallback `apps/web/public/_redirects` so direct dashboard route URLs resolve to the React app. (codex)
- Docs: Recorded final dashboard route implementation and verification in `docs/progress.md` and `docs/debug-log.md`. (codex)
- Added: Added `paper_agent_enhanced_report.md` as the submission-oriented enhanced planning source document. (codex)
- Docs: Reflected `paper_agent_enhanced_report.md` into `docs/workflow.md`, `docs/benchmark.md`, `docs/mcp.md`, and `docs/progress.md` as the current submission-oriented workflow and roadmap. (codex)
- Docs: Recorded previous work check results in `docs/progress.md`, including the current absence of referenced Gemini prototype files in the worktree. (codex)
- Docs: Committed the existing `GEMINI.md` handoff file after updating its strict agent attribution rules. (codex)
- Docs: Added strict agent attribution rules to `CHANGELOG.md`, `docs/progress.md`, and `GEMINI.md`, requiring `Label: description. (agent-id)` entries. (codex)

## 2026-05-16 (gemini)

- Added: `apps/web/src/test-prototype/` 경로에 독립적인 인터랙티브 UI/UX 프로토타입 환경 구축. (gemini)
- Added: 3가지 디자인 컨셉(Modern, Enterprise, DataViz)을 탭으로 확인할 수 있는 `PrototypeApp.tsx` 구현. (gemini)
- Added: 기존 앱에 영향을 주지 않는 독립 진입점 `apps/web/prototype.html` 추가. (gemini)
- Infra: 프로토타입용 UI 라이브러리(`framer-motion`, `recharts`, `radix-ui`) 설치. (gemini)
- Docs: 프로젝트 규칙 문서 `GEMINI.md` 생성 및 인계 사항 기록. (gemini)

## 2026-05-16 (codex)

- Docs: Applied `Label: description. (codex)` attribution format across all dated `CHANGELOG.md` entries. (codex)
- Docs: Reformatted Codex-authored recent work attribution in `docs/progress.md` to use `Label: description. (codex)` entries. (codex)
- Docs: Recorded Codex-authored recent work attribution in `docs/progress.md`, including the journal category priority and Field/Rank dashboard/reporting commits. (codex)
- Docs: Noted that local `GEMINI.md` is currently untracked and should not be deleted or committed unless explicitly requested. (codex)

## 2026-05-15

- Added: Added matched journal field/rank metadata to `PaperSummary`, dashboard paper rows/details, CSV exports, and Markdown reports. (codex)
- Changed: Added shared journal metadata matching helpers in `packages/shared/src/businessSchoolJournals.ts` so existing stored papers can display their matched category and rank without a D1 schema change. (codex)
- Docs: Recorded Field/Rank UI and output verification in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Docs: Recorded deployed runtime confirmation that the journal category selector and selected-field WoS priority workflow are working normally in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Added: Added business-school journal category metadata from `경영대학 학술지 목록.docx` in `packages/shared/src/businessSchoolJournals.ts`, exposed dashboard category selection in `apps/web/src/main.tsx`, and wired selected categories into Worker WoS search priority. (codex)
- Changed: Updated `apps/worker/src/index.ts` so selected journal fields search `국제 S급` source titles first, then `국제 A1급`, and filter saved results to the selected field's journal set. (codex)
- Docs: Recorded journal category selector implementation and verification in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Docs: Recorded deployed runtime confirmation that expanded WoS retrieval improved `AI interview employer branding` from zero allowed results to one allowlisted result in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Changed: Expanded WoS retrieval in `apps/worker/src/index.ts` with keyword-variant searches, allowlist source-title priority queries, sequential rate-limit spacing, and DOI/UID/title deduplication before journal filtering. (codex)
- Docs: Recorded WoS keyword expansion and allowlist-priority search work in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Changed: Reorganized `CHANGELOG.md` into dated sections so prior and future changes are tracked by modification date. (codex)
- Changed: Updated the dashboard `Max` search option in `apps/web/src/main.tsx` and `apps/web/src/styles.css` to allow numeric typing while enforcing the 1-50 limit on blur and request payload creation. (codex)
- Added: Added dashboard search option controls for max results, start year, and end year in `apps/web/src/main.tsx` and `apps/web/src/styles.css`, wiring them into `POST /api/search-jobs`. (codex)
- Docs: Recorded search option UI work and verification in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Docs: Added deployed runtime confirmation for the dashboard Run failure fix in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Fixed: Capped Web of Science Starter API candidate request size at 50 in `apps/worker/src/index.ts` so dashboard runs with `maxResults=20` no longer send invalid `limit=100` requests. (codex)
- Docs: Recorded dashboard Run failure debugging and WoS 400 resolution in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Changed: Refined dashboard UI/UX in `apps/web/src/main.tsx` and `apps/web/src/styles.css` with a command-focused header, compact status metrics, provider readiness badges, two-column operations area, richer ranked-paper table, side detail panel, and responsive layout improvements. (codex)
- Docs: Recorded dashboard UI/UX verification in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Docs: Recorded latest direct Worker deployment version and WoS smoke verification results in `docs/progress.md` and `docs/debug-log.md`. (codex)
- Fixed: Normalized DOI and email values before Unpaywall requests in `apps/worker/src/index.ts` to avoid malformed lookup URLs from secret/input whitespace. (codex)
- Fixed: Changed WoS year filtering in `apps/worker/src/index.ts` to emit explicit `PY=(YYYY OR YYYY...)` clauses for short ranges because `PY=(start-end)` returned zero Starter API candidates. (codex)
- Fixed: Corrected WoS Starter API response parsing in `apps/worker/src/index.ts` to read the official `hits` array, with `documents` retained as a compatibility fallback. (codex)
- Added: Added `source_result_count` and `allowed_result_count` search job diagnostics in `apps/worker/src/index.ts`, `apps/worker/schema.sql`, and `apps/worker/migrations/0005_add_search_job_result_counts.sql`. (codex)
- Changed: Added a dashboard `Source / Allowed` metric in `apps/web/src/main.tsx` and `apps/web/src/styles.css` to explain zero-result WoS jobs after journal allowlist filtering. (codex)
- Docs: Recorded WoS runtime verification, zero-result troubleshooting, and search result count diagnostics in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Changed: Added WoS API key alias detection and diagnostics source reporting in `apps/worker/src/index.ts` and `apps/web/src/main.tsx` to debug Cloudflare secret naming issues without exposing secret values. (codex)
- Docs: Recorded WoS secret diagnostics debugging in `docs/debug-log.md` and `docs/progress.md`. (codex)

## 2026-05-14

- Docs: Updated `docs/progress.md` and `docs/debug-log.md` with the confirmed dashboard report preview status and the next XLSX/PDF output implementation plan. (codex)
- Added: Added dashboard Markdown report preview in `apps/web/src/main.tsx` and `apps/web/src/styles.css` so completed job reports can be inspected before download. (codex)
- Docs: Recorded dashboard report preview work in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Changed: Expanded Markdown report generation in `apps/worker/src/index.ts` with Report Agent sections for key findings, common themes, method/context differences, research gaps, suggested reading order, screening notes, and limitations. (codex)
- Docs: Recorded Report Agent Markdown enhancement in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Added: Added `apps/mcp/scripts/e2e-check.mjs` and `npm run e2e:reports` to verify deployed Worker API, MCP tools, download endpoints, and R2 report objects for the latest completed job. (codex)
- Docs: Recorded OpenAlex deployed e2e report verification in `docs/debug-log.md`, `docs/progress.md`, `docs/mcp.md`, and `README.md`. (codex)
- Added: Added temporary `SEARCH_PROVIDER=openalex` support in `apps/worker/src/index.ts` so integration testing can run before `WOS_API_KEY` is issued. (codex)
- Changed: Updated dashboard diagnostics in `apps/web/src/main.tsx` to display the active search provider and OpenAlex readiness. (codex)
- Docs: Added `SEARCH_PROVIDER`, `OPENALEX_EMAIL`, and `OPENALEX_API_KEY` to `.env.example` and documented the WoS/OpenAlex switch in `README.md`. (codex)
- Added: Added `apps/mcp` Cloudflare Remote MCP Worker with read-only D1/R2 tools for diagnostics, recent jobs, job details, paper results, and report links. (codex)
- Added: Added `apps/mcp/scripts/smoke-test.mjs` and `npm run smoke:mcp` for deployed MCP protocol verification. (codex)
- Infra: Added `paper-agent-mcp` Wrangler configuration with Durable Object `MCP_OBJECT`, D1 `DB`, R2 `REPORTS`, and `nodejs_compat` for the Cloudflare Agents SDK. (codex)
- Docs: Updated `README.md`, `docs/mcp.md`, `docs/progress.md`, and `docs/debug-log.md` with MCP deployment, verification, smoke test, and troubleshooting details. (codex)
- Changed: Updated `packages/shared/src/index.ts` and `apps/worker/src/index.ts` so final ranking uses persisted relevance, journal fit, Crossref verification, OA, citation, and recency score components. (codex)
- Docs: Added `docs/mcp.md` with a phased MCP attachment plan, safe tool boundaries, deployment options, required bindings/secrets, and audit requirements. (codex)
- Docs: Added `docs/workflow.md` and updated `docs/benchmark.md` to reflect `AI_Agent_프로젝트_전체_통합본.pdf` into the target multi-agent workflow, data architecture, output standard, evaluation plan, blocker status, and WoS-excluded implementation priorities. (codex)
- Added: Added `GET /api/search-jobs?limit=` in `apps/worker/src/index.ts` for recent search job listing. (codex)
- Added: Added a Recent Jobs panel in `apps/web/src/main.tsx` and `apps/web/src/styles.css` so saved jobs can be reloaded without starting a new search. (codex)
- Changed: Improved Markdown report output in `apps/worker/src/index.ts` with executive summary metrics, a top-ranked table, generated timestamp, OA landing page, and license details. (codex)
- Docs: Recorded deployed `UNPAYWALL_EMAIL` diagnostics verification in `docs/debug-log.md` and `docs/progress.md`. (codex)
- Infra: Enabled the `REPORTS` R2 binding for bucket `paper-agent-outputs` in `wrangler.toml` and `apps/worker/wrangler.toml`. (codex)
- Changed: Updated `apps/worker/src/index.ts` to persist CSV and Markdown report outputs to R2 under `reports/<job_id>/` and serve stored R2 objects when available. (codex)
- Docs: Updated `README.md`, `docs/progress.md`, and `docs/debug-log.md` with R2 output storage behavior and verification steps. (codex)
- Added: Added `GET /api/search-jobs/:id/report.md` in `apps/worker/src/index.ts` and a dashboard Markdown report download button in `apps/web/src/main.tsx`. (codex)
- Docs: Recorded Clarivate `wos-starter` subscription approval as priority 0 in `docs/progress.md`. (codex)
- Changed: Replaced OpenAlex search with Clarivate Web of Science Starter API search in `apps/worker/src/index.ts`, using `WOS_API_KEY` and `X-ApiKey` authentication. (codex)
- Changed: Updated dashboard pipeline and System Checks labels in `apps/web/src/main.tsx` from OpenAlex to WoS. (codex)
- Docs: Replaced OpenAlex setup references with Web of Science setup in `.env.example`, `README.md`, `docs/progress.md`, and `docs/debug-log.md`. (codex)
- Added: Added `GET /api/diagnostics` in `apps/worker/src/index.ts` to report D1 schema and Worker environment readiness. (codex)
- Added: Added dashboard System Checks panel in `apps/web/src/main.tsx` and `apps/web/src/styles.css`. (codex)
- Added: Persisted score breakdown columns in `evaluations` via `apps/worker/schema.sql`, `apps/worker/src/index.ts`, and `apps/worker/migrations/0004_add_evaluation_score_columns.sql`. (codex)
- Changed: Updated dashboard score breakdown in `apps/web/src/main.tsx` to prefer persisted evaluation scores and fallback to client-side estimates for older rows. (codex)
- Added: Added score breakdown visualization in `apps/web/src/main.tsx` and `apps/web/src/styles.css` for relevance, journal fit, Crossref verification, OA, citations, and recency. (codex)
- Changed: Included `citedByCount` in `PaperSummary` API mapping through `packages/shared/src/index.ts` and `apps/worker/src/index.ts`. (codex)
- Changed: Updated `apps/worker/src/index.ts` to create search jobs immediately and process OpenAlex, journal filtering, Crossref, Unpaywall, and ranking in the background with persisted step updates. (codex)
- Changed: Updated dashboard polling in `apps/web/src/main.tsx` so selected papers update when asynchronous results arrive. (codex)
- Added: Added pipeline progress visualization to `apps/web/src/main.tsx` and `apps/web/src/styles.css` for search run status. (codex)
- Added: Added `packages/shared/src/businessSchoolJournals.ts` allowlist extracted from `경영대학 학술지 목록.docx`. (codex)
- Changed: Updated `apps/worker/src/index.ts` so only allowed business school journals are saved and returned from search results. (codex)
- Changed: Updated `apps/web/src/main.tsx` and `apps/web/src/styles.css` to handle empty results after journal allowlist filtering. (codex)
- Added: Added Unpaywall DOI open access metadata lookup in `apps/worker/src/index.ts` with D1 persistence and CSV output. (codex)
- Changed: Updated `apps/web/src/main.tsx` to display OA PDF/page availability, Unpaywall status, license, host type, and repository metadata. (codex)
- Docs: Added `apps/worker/migrations/0003_add_unpaywall_columns.sql` for manual D1 repair when deployed tables predate Unpaywall columns. (codex)
- Docs: Added `apps/worker/migrations/0002_add_crossref_columns.sql` for manual D1 repair when deployed tables predate Crossref columns. (codex)
- Docs: Updated `docs/progress.md` and `docs/debug-log.md` with Crossref enrichment verification, deployment requirements, and next-session handoff details. (codex)
- Added: Added Crossref DOI metadata enrichment and DOI/title/year/journal verification fields in `apps/worker/src/index.ts`, `apps/worker/schema.sql`, and CSV output. (codex)
- Fixed: Corrected Crossref verification match counting in `apps/worker/src/index.ts` so `mismatch` is not counted as a successful match. (codex)
- Docs: Added `CROSSREF_EMAIL` to `.env.example` and `README.md` required secrets. (codex)
- Docs: Added `docs/debug-log.md` with CSV endpoint verification and troubleshooting details. (codex)
- Added: Added `GET /api/search-jobs/:id/papers.csv` in `apps/worker/src/index.ts` and a dashboard CSV download button in `apps/web/src/main.tsx`. (codex)

## 2026-05-13

- Fixed: Added OpenAlex `api_key` support, selected response fields, and retry/backoff handling for 429 responses in `apps/worker/src/index.ts`. (codex)
- Docs: Added `OPENALEX_API_KEY` to `.env.example` and `README.md` required secrets. (codex)
- Changed: Replaced demo-only search persistence in `apps/worker/src/index.ts` with OpenAlex Works API search, D1 persistence, and basic relevance scoring. (codex)
- Changed: Extended `apps/worker/schema.sql` and D1 schema backfill checks with `openalex_id`, `abstract`, and `cited_by_count` paper metadata. (codex)
- Docs: Added and expanded `docs/progress.md` as the mandatory session handoff document with current implementation, deployment, D1 verification status, remaining work, and next-session startup instructions. (codex)
- Docs: Added `README.md` session handoff policy requiring `docs/progress.md` updates before ending work sessions. (codex)

## 2026-05-11

- Added: Added `apps/worker/schema.sql` with D1 tables and indexes for search jobs, papers, and evaluations. (codex)
- Fixed: Added Worker route error responses and D1 column backfill checks so older Cloudflare D1 tables can accept search job inserts. (codex)
- Fixed: Included `created_at` values when inserting papers and evaluations to satisfy existing Cloudflare D1 constraints. (codex)
- Changed: Updated `apps/web/src/main.tsx` to show API errors when search creation or refresh fails. (codex)
- Changed: Updated `apps/worker/src/index.ts` so search job POST/GET routes persist demo results to D1 and read them back by job ID. (codex)
- Changed: Connected the dashboard refresh button in `apps/web/src/main.tsx` to reload the active search job from the Worker API. (codex)
- Changed: Updated `apps/web/src/main.tsx` to call the deployed Worker API through `VITE_API_BASE_URL`, defaulting to `https://paper-agent-project.shch3653.workers.dev`, and added Vite environment typings. (codex)
- Infra: Added root `wrangler.toml` so the existing Cloudflare Build configuration can deploy with `npx wrangler deploy` from repository root. (codex)
- Fixed: Renamed Worker in `apps/worker/wrangler.toml` to `paper-agent-project` so it matches the existing Cloudflare Worker service. (codex)
- Fixed: Added missing `build` scripts to `apps/worker/package.json` and `packages/shared/package.json` so Cloudflare root-level `npm run build` succeeds across workspaces. (codex)
- Infra: Configured `apps/worker/wrangler.toml` with D1 database ID `4d622431-3574-4e04-a359-dada93e97438` and disabled R2 binding until billing is available. (codex)
- Added: Created `CHANGELOG.md` and `.github/pull_request_template.md` to enforce strict update history tracking. (codex)
- Added: Set up monorepo structure with `apps/web`, `apps/worker`, `packages/shared`, `docs`, and `benchmark`. (codex)
- Added: Created React/Vite dashboard scaffold in `apps/web`. (codex)
- Added: Created Cloudflare Worker API scaffold in `apps/worker`. (codex)
- Added: Created shared TypeScript types and final score helper in `packages/shared`. (codex)
- Docs: Replaced initial team workspace README with project architecture, local development, Cloudflare setup, and MVP flow. (codex)
- Infra: Added `.env.example`, `.gitignore`, npm workspaces, Wrangler configuration, and Cloudflare compatibility date alignment. (codex)
