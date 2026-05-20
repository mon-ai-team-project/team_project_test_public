# Project Progress And Session Handoff

Updated: 2026-05-20 (juilie direct-push test)

## juilie — Direct Push Test (2026-05-20)

- Docs: Added `juilie_bot_hub/push-test.md` to verify direct push access on `benchmark/juilie-proposed-review`. (juilie)
- Docs: Updated `CHANGELOG.md` for the push-test documentation change. (juilie)
- Verification: Local branch is configured to track `team-origin/benchmark/juilie-proposed-review`; push target is protected by the local pre-push hook. (juilie)
- Local-only state: `paper_agent_enhanced_report.pdf` remains untracked and was not included. (juilie)

## shonshinemin — Benchmark QA Re-evaluation (2026-05-18)

- Filled: `benchmark/manual_review_proposed.csv` — 15 papers reviewed across T001-T003. (shonshinemin)
- Promoted: T003 rank-1 paper added as G061 to `benchmark/gold_relevant_papers.verified.csv`. (shonshinemin)
- Updated: `benchmark/proposed_agent_metrics.csv` and `benchmark/proposed_agent_metrics_summary.json` post gold update. (shonshinemin)
- Key metric change: `precision_at_k` 0.0000 → 0.0667, `ndcg_at_k` 0.0000 → 0.1601, `gold_doi_hit_rate_at_k` 0.0000 → 0.3333. Stable: doi_accuracy=1.0, paper_validity=1.0, top_journal_precision=1.0. (shonshinemin)
- Added: `shonshinemin_cmd/metric-change-report.md` — full delta analysis and QA recommendations. (shonshinemin)
- Added: `shonshinemin_cmd/qa-notes.md` — QA workflow, scope, and re-run instructions. (shonshinemin)
- See: `docs/debug-log.md` §2026-05-18 Metric QA Re-evaluation for raw numbers and reviewer notes.

## Mandatory Session Handoff Rules

This file is the required handoff document for future sessions. Before ending any work session, update this file in the same commit or final repository state.

Strict rules:

- Always update `Updated:` to the current date.
- Record all meaningful work completed during the session.
- Record all dated work entries in the strict attribution format `Label: description. (agent-id)`.
- Use lowercase agent identifiers such as `(codex)` or `(gemini)`, and preserve other agents' attribution labels unless the user explicitly requests correction.
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
5. Re-run a WoS job after the Unpaywall DOI/email normalization change and confirm whether `unpaywallStatus` changes from `failed` to `found` or `not_found`.
6. Confirm D1 `search_jobs.source_result_count` and `search_jobs.allowed_result_count` are populated for new jobs.
7. If allowed results remain zero for broad business keywords, improve WoS retrieval by adding source-title-aware query expansion or multi-page candidate collection before the allowlist filter.
8. Confirm D1 `papers.openalex_id` stores the external source identifier. The column name is retained for schema compatibility.
9. Verify deployed CSV and Markdown report downloads include Crossref, Unpaywall, and evaluation score data.
10. In R2 bucket `paper-agent-outputs`, confirm `reports/<job_id>/papers.csv` and `reports/<job_id>/report.md` are created for completed jobs with allowed papers.
11. Confirm the Markdown report includes executive summary metrics, Report Agent synthesis sections, top-ranked table, paper details, OA landing page, and license details.
12. Confirm the dashboard Recent Jobs panel lists saved jobs and can reload prior job results.
13. Confirm new jobs use persisted component-score final ranking: relevance 35%, journal fit 20%, Crossref verification 15%, OA 10%, citation 10%, recency 10%.
14. Use `docs/mcp.md` as the current source of truth for MCP attachment and the implemented read-only MCP Worker.
15. Deployed MCP is verified at `https://paper-agent-mcp.shch3653.workers.dev/health`.
16. MCP protocol connectivity and read-only tool calls are verified with `npm run smoke:mcp`.
17. Use `paper_agent_enhanced_report.md` as the current submission-oriented master plan.
18. Use `docs/workflow.md` as the current source of truth for the integrated multi-agent target workflow.
19. After Cloudflare Pages deploys the final dashboard route UI/UX refresh, verify these production routes across desktop and mobile widths:
    - `https://paper-agent-project.pages.dev/dashboard/research`
    - `https://paper-agent-project.pages.dev/dashboard/ops`
    - `https://paper-agent-project.pages.dev/dashboard/evaluation`
20. Dashboard `Run` no longer fails with `Web of Science request failed with 400`.
21. Search option controls for `Max`, `From`, and `To` are implemented locally; after Cloudflare Pages deploy, verify they appear and that different settings change `sourceResultCount`.
22. Keyword decomposition and source-title-aware WoS retrieval are implemented locally; after Cloudflare deploy, verify `sourceResultCount` and `allowedResultCount` improve for low-result queries.
23. `CHANGELOG.md` is now organized by modification date. Continue moving completed entries from `Unreleased` into the current `YYYY-MM-DD` section before each commit.
24. Journal category selection from `경영대학 학술지 목록.docx` is deployed and user-confirmed as working. Use this as the baseline for the next UI/reporting step.
25. Result `Field / Rank` visibility is implemented locally. After Cloudflare deploy, verify dashboard rows/details plus CSV and Markdown report downloads show values such as `2. 조직인사 / 국제 S급`.
26. Next recommended implementation for product UX: add a search settings summary bar that records keyword, selected field, priority order, year range, and max count for each active job.
27. Benchmark fixture expansion is initialized.
    - `benchmark/tasks.jsonl` contains 20 tasks.
    - `benchmark/keywords.csv` contains 20 runnable benchmark queries.
    - `benchmark/gold_relevant_papers.csv` contains 60 seed gold relevance rows.
    - `benchmark/evaluation_rubric.md` defines human scoring and agent-level checks.
    - `benchmark/benchmark_summary.md` records the current benchmark status.
28. First Crossref title-query verification pass is complete.
    - Script: `benchmark/scripts/verify-gold-crossref.mjs`
    - Command: `npm run benchmark:verify-gold`
    - Output: `benchmark/gold_relevant_papers.verified.csv`
    - Result distribution: `verified=6`, `ambiguous=17`, `no_match=37`
29. Next benchmark step: refine ambiguous/no-match gold rows with exact paper titles and approved-journal targets, then rerun `npm run benchmark:verify-gold`.
    - `benchmark/gold_refinement_queue.csv` now lists 54 non-verified rows.
    - `benchmark/gold_crossref_candidates.csv` now lists 200 Crossref candidates for manual review.
    - Command: `npm run benchmark:refine-gold`
30. Candidate scoring workflow is available.
    - `benchmark/gold_candidate_review.csv` scores 200 Crossref candidates.
    - Result distribution: `promote_candidate=2`, `topic_only_review=90`, `reject_low_priority=108`
    - Command: `npm run benchmark:score-gold`
31. The two strict `promote_candidate` rows have been promoted into the gold files.
    - Decision log: `benchmark/gold_promotion_decisions.csv`
    - Current verified gold distribution: `verified=8`, `ambiguous=17`, `no_match=35`
    - Current refinement queue size: 52 rows
32. After enough DOI labels are verified, compare rule-based, single-LLM, and proposed-agent outputs.
33. After benchmark scaffolding, implement Critic Agent and `agent_traces`, then XLSX output, then PDF output.
34. Next dashboard integration target: replace static mock data in `apps/web/src/dashboard/mockData.ts` with real API responses while preserving the current route/component contracts.
35. Proposed Agent benchmark runner is implemented.
    - Script: `benchmark/scripts/run-proposed-agent.mjs`
    - Command: `npm run benchmark:run-proposed`
    - Default outputs: `benchmark/proposed_agent_jobs.csv` and `benchmark/proposed_agent_results.csv`
    - Quota-safe smoke command verified T001 with `--limit 1 --max-results 5`.
    - Smoke job: `job-768671a5-346d-4f0f-af54-6f29014ceb27`, `sourceResultCount=8`, `allowedResultCount=5`, `resultRows=5`.
36. A quota-safe three-task Proposed Agent benchmark sample has been run and recorded.
    - Command: `npm run benchmark:run-proposed -- --limit 3 --max-results 5 --poll-ms 5000 --timeout-ms 300000`
    - Outputs: `benchmark/proposed_agent_jobs.csv` and `benchmark/proposed_agent_results.csv`
    - T001 job: `job-e97a70f1-b041-492e-b54f-d60cc6cd8065`, `sourceResultCount=8`, `allowedResultCount=5`, `resultRows=5`.
    - T002 job: `job-b9fb9c4b-58d0-4774-9e38-6d5a99975b19`, `sourceResultCount=25`, `allowedResultCount=5`, `resultRows=5`.
    - T003 job: `job-700ef0e4-a2dd-450a-a785-c590f5e4bab3`, `sourceResultCount=25`, `allowedResultCount=5`, `resultRows=5`.
37. Proposed Agent metric calculation is implemented and run for the three-task sample.
    - Script: `benchmark/scripts/evaluate-proposed-agent.mjs`
    - Command: `npm run benchmark:evaluate-proposed`
    - Outputs: `benchmark/proposed_agent_metrics.csv` and `benchmark/proposed_agent_metrics_summary.json`
    - Current sample macro metrics: `Precision@5=0.0000`, `NDCG@5=0.0000`, `Gold DOI Hit Rate@5=0.0000`, `DOI Accuracy@5=1.0000`, `Paper Validity@5=1.0000`, `Top Journal Precision@5=1.0000`, `Hallucination Rate@5=0.0000`, `OA Success@5=0.0000`.
    - Interpretation: exact gold overlap is low because only one verified DOI gold label exists across T001-T003; continue gold refinement before final benchmark claims.
38. Next benchmark execution step: refine T001-T003 gold labels or add strict accepted-paper labels from the Proposed Agent sample, then rerun `npm run benchmark:evaluate-proposed`.
39. Dashboard implementation status panels are implemented on all three final routes.
    - `/dashboard/research` distinguishes live API features from mock workflow/top-journal/preview panels.
    - `/dashboard/ops` distinguishes live MCP/D1/R2 from mock Agent Status Board, Tool Console, Critic Review, and planned Vectorize/Drive work.
    - `/dashboard/evaluation` distinguishes live benchmark fixtures/runner from mock scenario metrics and planned baseline bindings.
40. Team GitHub collaboration repository is configured locally as `team-origin`.
    - Repository: `https://github.com/mon-ai-team-project/team_project_test_public`
    - GitHub MCP confirmed admin, maintain, push, triage, and pull permissions.
    - `docs/team-collaboration.md` defines branch policy, benchmark file ownership, data rules, changelog attribution, and review checklist.
    - Use `team-origin` for team collaboration while keeping the existing personal `origin` remote intact.
41. Team-agent auto-start guidance is now defined for organization repository collaboration.
    - `AGENTS.md` is the root operating guide for any agent entering the repository.
    - `docs/agent-work-queue.md` defines current benchmark assignments and allowed file scopes.
    - `seunghyeon_choi` is the current maintainer and integration lead.
    - Baseline result collection is now marked as `unassigned_member_c` until a separate team member is assigned.
    - `jin23624_cpu/`, `juilie_bot_hub/`, `seunghyeon_choi/`, `shonshinemin_cmd/`, and `integrated/` each contain a role-specific README.
    - Benchmark collaboration templates are initialized: `benchmark/manual_review_proposed.csv`, `benchmark/baseline_rule_based_results.csv`, and `benchmark/baseline_single_llm_results.csv`.
    - `.github/pull_request_template.md` now asks contributors to confirm `AGENTS.md`, assignment scope, and benchmark verification.
42. Proposed Agent manual review for the `juilie_bot_hub` assignment is complete on branch `benchmark/juilie-proposed-review`.
    - Benchmark: Filled all 15 T001-T003 rows in `benchmark/manual_review_proposed.csv` with `manual_relevance`, `manual_decision`, `failure_type`, `review_note`, and `reviewer`. (juilie)
    - Docs: Reflected `paper_agent_enhanced_report.pdf` section 8 as the Paper-Agent-Bench evaluation basis in `juilie_bot_hub/README.md`. (juilie)
    - Verification: Local PDF text extraction with `pdfjs-dist` confirmed section 8 covers REPRO-Bench-style Agent-level evaluation, human relevance labels, Precision@5/NDCG@5, DOI accuracy, top-journal precision, hallucination checks, and report completeness. (juilie)
43. Repository secret exposure audit completed before continuing organization-repository work.
    - Current tracked files, full Git history, and local workspace were checked for GitHub PAT, Cloudflare `cfut_`, the previously shared OpenAlex key, private key, AWS, npm, and Slack token patterns.
    - No actual token values were found in repository files or history.
    - Only `.env.example` is tracked as an env-style file.
    - Secret-related documentation matches are placeholders or variable names.
    - Any token pasted into external chat should remain revoked/rotated because the repository audit cannot remove external exposure.
44. Cloudflare organization repository migration settings are documented.
    - Use `docs/cloudflare-org-repo-migration.md` to reconnect Worker Builds and Pages builds from `Vulter3653/paper-agent-project` to `mon-ai-team-project/team_project_test_public`.
    - No D1, R2, Worker name, Pages project name, or runtime secret change is required.
    - Actual Cloudflare dashboard Git connection changes still require Cloudflare account access.

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
- Latest confirmed WoS runtime job `job-b83c7239-03a0-4376-98bc-cee2ed8a5b6e` returned `sourceResultCount=50`, `allowedResultCount=8`, and 8 stored papers.
- Latest smoke job after Unpaywall normalization `job-3939c7f5-d674-4069-bacd-e18d5ebff919` returned `sourceResultCount=10`, `allowedResultCount=0`; use a larger candidate window for full allowlist validation.
- Unpaywall DOI/email request values are normalized before lookup; this requires one more deployed runtime check because the last confirmed job returned Unpaywall 422 responses.
- Dashboard UI/UX has been refreshed locally with an improved command header, operational status layout, ranked-paper table, detail panel, and responsive CSS. Static checks passed and the local Vite server returned HTTP 200.
- Latest dashboard `Run` failure was traced to WoS `limit=100` from dashboard `maxResults=20`; Worker code now caps WoS candidate requests at the Starter API maximum of 50.
- Runtime confirmation job `job-6639c061-9c43-43bf-bbc7-063de355f974` completed with `sourceResultCount=2` and `allowedResultCount=0`, confirming the WoS 400 failure is resolved.
- Dashboard search options now expose `Max`, `From`, and `To` fields and send them to the existing Worker search API.
- Dashboard `Max` accepts typed numeric input and enforces the 1-50 limit before the search request is sent.
- `CHANGELOG.md` has been reorganized into dated sections for `2026-05-15`, `2026-05-14`, `2026-05-13`, and `2026-05-11`, with `Unreleased` reserved for in-progress changes.
- WoS retrieval now uses keyword decomposition, curated allowlist source-title priority queries, sequential request spacing, and DOI/UID/title deduplication before journal filtering.
- Runtime confirmation job `job-9da78c65-3f85-479d-9ee0-7354c3f1f4dd` completed with `sourceResultCount=15` and `allowedResultCount=1` for `AI interview employer branding`, confirming expanded WoS retrieval improves low-result queries.
- The `경영대학 학술지 목록.docx` numbered field groups are now represented as shared category metadata with `국제 S급`, `국제 A1급`, and `국내 A급` lists.
- Dashboard search options now include a `Field` selector. When selected, the Worker prioritizes that field's `국제 S급` WoS source-title query first, then `국제 A1급`, and filters saved papers to that selected field.
- Deployed journal category selection was user-confirmed as normally working after the `eb2dbe3` push.
- Result `Field / Rank` metadata is now derived from stored journal names and displayed in dashboard rows, paper details, CSV exports, and Markdown reports without a D1 schema migration.
- `paper_agent_enhanced_report.md` has been reviewed and reflected into `docs/workflow.md`, `docs/benchmark.md`, and `docs/mcp.md`.
- The enhanced report shifts the next major priority from feature-only work to submission evidence: benchmark expansion, baseline comparison, Critic Agent, agent traces, XLSX/PDF outputs, and demo-ready documentation.
- The final dashboard UI/UX design references from `01_interactive_research_studio.html`, `02_interactive_agent_ops.html`, and `03_interactive_evaluation_dashboard.html` have been ported into React routes.
- Dashboard routes are now:
  - `/dashboard/research`: keeps the real Worker-backed search/run flow and adds the final 12-step workflow, Top Journal Pool, and literature review preview panels.
  - `/dashboard/ops`: adds the Multi-Agent status board, tool call console, D1/R2/Google Drive/Vectorize/MCP status cards, and Critic Review.
  - `/dashboard/evaluation`: adds evaluation scenario switching, baseline metrics, score breakdown, error analysis, and Rule-based vs Single LLM vs Proposed Multi-Agent comparison.
- Static mock data for the new route UI is separated in `apps/web/src/dashboard/mockData.ts` so future API wiring can replace data sources without redesigning the components.
- Cloudflare Pages direct route fallback is configured through `apps/web/public/_redirects`.
- Benchmark priority 1 from `paper_agent_enhanced_report.md` is now initialized:
  - 20 structured benchmark tasks in `benchmark/tasks.jsonl`.
  - 20 runnable keywords in `benchmark/keywords.csv`.
  - 60 seed gold relevance rows in `benchmark/gold_relevant_papers.csv`.
  - Human and agent-level scoring rules in `benchmark/evaluation_rubric.md`.
  - Current status and next steps in `benchmark/benchmark_summary.md`.
- The benchmark gold file intentionally tracks DOI values as `needs_crossref_verification` rather than storing unverified DOI strings. Crossref verification is the next required benchmark task.
- A first Crossref verification pass has generated `benchmark/gold_relevant_papers.verified.csv`. The result distribution is `verified=6`, `ambiguous=17`, and `no_match=37`, so the gold set needs exact-title refinement before baseline scoring.
- Gold refinement workflow files are now available:
  - `benchmark/gold_refinement_queue.csv` contains 54 rows requiring manual/exact-title cleanup.
  - `benchmark/gold_crossref_candidates.csv` contains 200 task-level Crossref candidates marked `needs_manual_review`.
  - `npm run benchmark:refine-gold` regenerates both files.
- Candidate scoring workflow is now available:
  - `benchmark/gold_candidate_review.csv` contains 200 scored candidates.
  - Strict automatic scoring found 2 `promote_candidate` rows, 90 `topic_only_review` rows, and 108 `reject_low_priority` rows.
  - `npm run benchmark:score-gold` regenerates the scored review file.
- Two strict gold candidates have been manually promoted:
  - T004/G010: Academy of Management Review, DOI `10.5465/amr.2022.0058`
  - T019/G055: Journal of Retailing, DOI `10.1016/j.jretai.2022.02.003`
  - `benchmark/gold_promotion_decisions.csv` records the promotion rationale.
- Proposed Agent benchmark runner has been added and smoke-tested against the deployed Worker. T001 completed as `job-768671a5-346d-4f0f-af54-6f29014ceb27` with 5 allowlisted result rows.
- Dashboard now has visible implementation status panels on Research, Ops, and Evaluation routes, using `구현됨`, `부분 구현`, `Mock`, and `미구현` labels so users can distinguish real features from UI previews.

## Agent Work Attribution

The following recent repository work was implemented and/or recorded by Codex in this session history and should be treated as Codex-authored project state unless later commits supersede it:

- Added: Added `Field / Rank` visibility to dashboard rows, paper details, CSV exports, and Markdown reports. Commit `91799a4`. (codex)
- Added: Added shared journal matching helpers so existing D1 rows can display field/rank without a schema migration. Commit `91799a4`. (codex)
- Docs: Recorded user-confirmed deployed behavior for category selection and selected-field WoS priority. Commit `b4826d6`. (codex)
- Added: Added numbered business-school journal category selection from `경영대학 학술지 목록.docx`. Commit `eb2dbe3`. (codex)
- Changed: Wired selected categories into WoS search priority: selected `국제 S급` first, then selected `국제 A1급`. Commit `eb2dbe3`. (codex)
- Changed: Restricted selected-field saved results to the selected category journal set. Commit `eb2dbe3`. (codex)
- Docs: Recorded deployed runtime confirmation for expanded WoS retrieval. Commit `0b98a25`. (codex)
- Changed: Expanded WoS retrieval with keyword variants, curated source-title priority queries, sequential spacing, and deduplication. Commit `2a49e1e`. (codex)

Current policy note: `GEMINI.md` is now a repository handoff/rules file and must preserve strict agent attribution. Do not remove or rewrite existing `(codex)` or `(gemini)` attribution labels unless the user explicitly requests correction.

## Previous Work Check - 2026-05-17

- Docs: Confirmed latest pushed Codex commit before this check is `a738203 docs: apply codex attribution format`. (codex)
- Docs: Found pending `CHANGELOG.md` entries for Gemini prototype work dated `2026-05-16 (gemini)`. (codex)
- Docs: Verified current worktree does not contain the referenced Gemini prototype files or dependency changes: `apps/web/prototype.html`, `PrototypeApp.tsx`, `framer-motion`, `recharts`, and `radix-ui` were not found. (codex)
- Docs: Confirmed `apps/web/src/test-prototype` exists only as an empty directory, which Git does not track by itself. (codex)
- Docs: Added strict attribution rules so future records must preserve `Label: description. (agent-id)` and must not rewrite another agent's attribution without explicit user instruction. (codex)

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
- Latest direct Worker version ID: `c827fe7b-37cc-40db-8755-fb8031031fdb`

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
- Dashboard layout uses a command header, compact status band, operations grid, main ranked-paper workspace, side detail panel, and recent job list.
- Dashboard command header includes search option controls for result count and optional year range.
- Dashboard command header includes a journal field selector sourced from the shared business school journal category list.
- Ranked paper rows and paper detail show matched journal `Field / Rank` values.
- Paper Detail panel shows Score Breakdown for relevance, journal fit, Crossref verification, open access, citations, and recency.
- System Checks panel calls `GET /api/diagnostics` to display D1 schema readiness and Worker environment variable presence.
- Report Preview panel fetches `GET /api/search-jobs/:id/report.md` for completed jobs and displays the Markdown report in the dashboard before download.
- Final route navigation is implemented in `apps/web/src/dashboard/DashboardPages.tsx`.
- `/dashboard/research` includes the existing real Run workflow plus final-design research studio panels.
- `/dashboard/ops` includes mock-backed agent operations, tool call console, infrastructure status, and critic review panels.
- `/dashboard/evaluation` includes mock-backed scenario selection and baseline comparison panels.

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
- Web of Science candidate request limit is capped at 50 to satisfy the Starter API limit range.
- Web of Science retrieval expands low-result keywords and runs allowlist source-title-priority queries before downstream filtering.
- Optional `journalCategoryId` request payloads restrict selected-field jobs to the selected category's approved journals and prioritize selected `국제 S급` before `국제 A1급` source-title searches.
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
- CSV and Markdown report output include matched journal field/rank values derived from the shared business school journal metadata.
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
