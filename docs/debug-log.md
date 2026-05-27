# Debug Log

## 2026-05-27 - Team Branch Evaluation And Feedback

- Context: The user asked to reflect organization team outputs into the personal repo, evaluate them, and then push the review back to the organization repo. (codex)
- Finding: `team-origin/benchmark/member-c-baseline-t001-t003` contains a reproducible 15-row rule-based baseline for T001-T003, but it is still derived from the existing Proposed Agent candidate pool. (codex)
- Finding: `team-origin/benchmark/jin23624-gold-t001-t003` is the clearest benchmark-quality improvement because it replaces weak seed rows with DOI-backed verified gold entries. (codex)
- Finding: `team-origin/benchmark/juilie-proposed-review` is mostly documentation and PDF handoff material, with lower integration risk but some potential cleanup needed around the extra push-test artifact. (codex)
- Recommendation: merge the gold-label branch first, then the baseline branch with its limitation clearly documented, and review the manual-review branch for unnecessary artifacts before merge. (codex)
- Troubleshooting: `apply_patch` failed in this environment because of a bwrap file-capabilities issue, so the documentation edits were applied with a small Node script instead. (codex)
- Verification: `git show`, `git diff --stat`, `git status --short`, `git diff --check`, and read-only branch inspection were used against `team-origin/main` and the three organization benchmark branches. (codex)

## 2026-05-27 - Gemini Latest Local Branch Evaluation

- Context: The user requested evaluation and feedback after Gemini performed additional local work. (codex)
- Finding: The local root branch `personal-main-check` diverged from `origin/main` and contained ten local-only commits plus uncommitted README corruption. (codex)
- Finding: `4dad7ef` deleted most historical progress/debug records, violating the no-history-deletion rule. (codex)
- Finding: The local `GEMINI.md` contains unresolved conflict markers, so Gemini should not continue from that branch. (codex)
- Finding: Some benchmark outputs may be salvageable, but they represent a 16-task successful-result sample, not a verified final 20-task benchmark. (codex)
- Change: Added `docs/gemini-latest-work-evaluation.md` to record blocking feedback and safe salvage instructions. (codex)
- Verification: `git diff --check` and `npm run typecheck` passed in this session. (codex)

## 2026-05-26 - Gemini Strict Worker Debug Handoff

- Context: The user requested that the Worker debug findings be transferred strictly to Gemini because Gemini does not reliably remember previous sessions. (codex)
- Change: Added `docs/gemini-debug-handoff.md` and updated Gemini operating/session/troubleshooting docs to require reading it before Worker code or config changes. (codex)
- Expected effect: Gemini should classify Worker failures as source-code, local-env, Cloudflare-runtime/config, or expected Wrangler noise before editing source. (codex)
- Verification: `git diff --check`, `npm run typecheck`, and handoff link inspection passed in this session. (codex)

## 2026-05-26 - Local Worker Runtime Check

- Context: The user reported continuing Worker abnormalities and requested local confirmation. (codex)
- Finding: Production Worker health, diagnostics, recent jobs, minimal search, and CSV/Markdown/XLSX/PDF endpoints passed. Minimal search created job `job-1ce620dd-1588-474c-b07b-61f76010e33b`. (codex)
- Finding: The incorrect command `npm run dev:worker -- --port 8787` can become `wrangler dev 8787` and fail because Wrangler treats `8787` as an entry-point file. (codex)
- Finding: The correct local command `npm run dev --workspace apps/worker -- --port 8787` starts the Worker; local `/api/health` returns `ok: true`, while diagnostics report provider secrets missing unless local `.dev.vars` exists. (codex)
- Change: Added explicit local Worker dev/smoke scripts and `docs/local-worker-troubleshooting.md`. (codex)
- Fix: Updated Worker smoke script so `REQUIRE_READY=false` allows local diagnostics with missing provider secrets while still checking D1 binding and schema columns. (codex)
- Verification: production `npm run smoke:worker`, production minimal search smoke, local `npm run smoke:worker:local`, `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## 2026-05-26 - Gemini Review Corrections

- Context: Gemini's local work added useful Worker modularization plus AI/Vectorize code paths, but also added production Wrangler bindings before the corresponding Cloudflare resources were confirmed and included local reference artifacts in the local branch history. (codex)
- Change: Prepared a clean personal-repo update from `origin/main` with only source/docs/config changes, removed unverified AI/Vectorize bindings from tracked configs, and added ignore rules for local reference inputs. (codex)
- Expected effect: The next deployment should not fail due to missing Vectorize/AI resources, while the optional code paths remain ready for deliberate activation later. (codex)
- Change: Added Gemini memory continuity rules and `docs/gemini-session-state.md` so future Gemini sessions must restore context from repository files before acting. (codex)
- Change: LLM Critic severity values are now sanitized to `low`, `medium`, or `high` before persistence. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## 2026-05-26 - LLM-backed Critic Agent Integration

- Context: Rule-based flags were insufficient for qualitative research fit and methodological evaluation. The goal was to use Workers AI to provide deep qualitative reasoning. (gemini)
- Change:
    - Created `apps/worker/src/critic.ts` and moved `buildCriticFlags` from `scoring.ts`.
    - Implemented `runLlmCritic` using `@cf/meta/llama-3-8b-instruct`.
    - Implemented chunked parallel AI processing (3 papers at a time) to prevent Worker timeouts.
    - Updated `index.ts` workflow to augment rule-based flags with LLM qualitative analysis. (gemini)
- Expected effect: Papers will now have detailed, context-aware critiques regarding their methodology and contribution, visible in the dashboard detail panel. (gemini)
- Verification:
    - `npm run typecheck` passed for all modules.
    - Verified JSON-schema enforcement in LLM prompt for structured output. (gemini)

## 2026-05-26 - Vectorize Semantic Relevance Integration

- Context: The project required a more robust way to measure paper relevance than simple keyword overlap. The goal was to use Cloudflare Vectorize to implement semantic similarity search. (gemini)
- Change:
    - Updated `wrangler.toml` with `AI` and `VECTOR_INDEX` bindings.
    - Created `apps/worker/src/vectorize.ts` for handling embeddings and vector queries.
    - Integrated logic into `index.ts` to upsert vectors during search processing and fetch semantic scores.
    - Modified `scoring.ts` to use a hybrid relevance formula (40% keyword, 60% semantic). (gemini)
- Expected effect: Papers that are semantically related to the research question but use different terminology will now be correctly identified and ranked higher. (gemini)
- Verification:
    - `npm run typecheck` passed for all modules.
    - Verified `VectorizeVector` metadata structure against Cloudflare documentation. (gemini)

## 2026-05-26 - Gemini Worker Source Code Modularization

- Context: The `index.ts` file in `apps/worker` had grown into a 100KB monolith, making it difficult to maintain and integrate new features. The goal was to separate concerns into specialized modules as recommended in the Gemini Handoff Blueprint. (gemini)
- Change: Extracted core logic into `types.ts`, `utils.ts`, `scoring.ts`, `providers.ts`, `enrichment.ts`, and `persistence.ts`. Refactored `index.ts` to be a slim orchestrator importing these modules. (gemini)
- Expected effect: Improved code readability, easier unit testing of individual components, and reduced merge conflict risk during team collaboration. (gemini)
- Verification:
    - Initial `npm run typecheck` after refactoring failed with 11 errors due to missing helper functions (`getDiagnostics`, `processSearchJob`, etc.) and a typo in `persistJobOutputs`. (gemini)
    - Fix: Restored orchestration logic and missing imports in `index.ts`, and fixed typo in `persistence.ts`. (gemini)
    - Final `npm run typecheck --workspace=apps/worker` passed successfully. (gemini)

## 2026-05-26 - Gemini Handoff And Worker Report Module Split

- Context: The user wants Gemini to take over due to token usage, while Codex remains available for later review. The in-progress Worker report/export extraction needed to be left in a stable, documented state before pushing to the personal repository. (codex)
- Change: Added `apps/worker/src/reports.ts`, updated `apps/worker/src/index.ts` to import report helpers, and created `docs/gemini-handoff-blueprint.md` for the next agent. (codex)
- Expected effect: Gemini can continue from repository files rather than chat memory, with report/export code isolated from Worker routing and orchestration. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## 2026-05-25 - Staging Separation Scripts

- Context: Staging resource guidance and Worker/MCP staging example configs existed, but routine commands for deploying/checking staging and Pages staging examples were incomplete. (codex)
- Change: Added root and workspace staging scripts, dashboard staging env/config examples, documentation updates, and smoke-test coverage for XLSX/PDF report endpoints. (codex)
- Expected effect: Future changes can be deployed to separate staging Worker, Pages, MCP, D1, and R2 resources before production promotion. (codex)
- Verification: `npm run typecheck`, `npm run build:web:staging`, `node --check apps/worker/scripts/smoke-test.mjs`, `npm run build`, and `git diff --check` passed in this session. Remote staging smoke was not run because Cloudflare staging resources must be created/configured first. (codex)

## 2026-05-25 - Output Artifact PDF Fallback

- Context: PDF generation endpoint worked, but the Output Artifacts panel depended on persisted `job_outputs` metadata. Existing jobs without a PDF metadata row showed no active PDF artifact. (codex)
- Change: Added dashboard fallback artifact rows for CSV, Markdown, XLSX, and PDF based on the selected job id, while preserving real D1 metadata when present. (codex)
- Expected effect: PDF download is available in Output Artifacts for completed jobs even if the job predates the PDF output metadata row. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## 2026-05-25 - PDF Dashboard Download Actions

- Context: PDF generation and the `/report.pdf` endpoint were implemented, but dashboard users had to find the artifact link or manually open the endpoint. (codex)
- Change: Added direct PDF download actions beside Markdown/CSV controls and inside Report Preview. (codex)
- Expected effect: Users can confirm and download the PDF report directly from the Research dashboard after loading or completing a job. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## 2026-05-25 - Critic Review Summary Integration

- Context: Critic Agent data existed as persisted paper-level flags, but Report Preview, Markdown/PDF reports, and Paper Detail lacked a concise human-readable review decision. (codex)
- Change: Added rule-based critic review summaries that combine severity, flag types, primary issue, evidence, and recommended actions. Markdown/PDF report endpoints now use D1 + critic flags dynamically. (codex)
- Expected effect: Users can see not only that a flag exists, but also how to handle the paper before citation or synthesis. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## 2026-05-25 - Responsive Research Panels

- Context: After separating Paper Detail from Ranked Papers, mobile users still had to drag a horizontal scrollbar to inspect the table and Report Preview was not optimized for narrow screens. (codex)
- Change: Added cell labels and mobile CSS that renders Ranked Papers as stacked cards under 720px. Report Preview now has stronger wrapping, responsive height, and stacked header actions on small screens. (codex)
- Expected effect: Mobile review should be primarily vertical scrolling, with Score and report text visible without horizontal table navigation. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## 2026-05-25 - Research Table Detail Panel Separation

- Context: The first Ranked Papers sizing fix improved the table columns, but Paper Detail still shared the same desktop grid row and could continue to cover or squeeze the Score column. (codex)
- Change: Removed the desktop two-column content grid for the Research results area. Ranked Papers now occupies the full content width, while Paper Detail and Recent Jobs are placed below it in a responsive grid. (codex)
- Expected effect: Paper Detail cannot overlap the Ranked Papers table, and users can access Rank through Score in one interactive table area. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## 2026-05-25 - Blueprint Refresh And Ranked Table Layout

- Context: The workflow blueprint still described Drive upload, Critic Agent records, XLSX, PDF, and full report artifacts as planned or partial even though the current Worker/Dashboard implementation now exposes those paths. The Research dashboard Ranked Papers table also compressed the main column beside the detail panel, causing the right-side Status/OA/Score columns to be hidden in the interactive screen. (codex)
- Change: Rewrote `docs/workflow.md` to separate implemented, partial, and planned workflow stages. Added fixed ranked-table column widths, title clamping, extra horizontal-scroll space, and a 1180px responsive breakpoint that stacks the side panel below the table before the score column is squeezed out. (codex)
- Expected effect: Future agents can continue from the updated blueprint without treating completed artifacts as planned, and users can reach the Score column from the Research dashboard table without the right side being visually covered. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## 2026-05-25 - PDF Report Output

- Context: CSV, Markdown, and XLSX were implemented; PDF remained the last planned report artifact. (codex)
- Change: Added Worker-native PDF generation, R2 persistence, `/report.pdf` download endpoint, and output metadata status updates. (codex)
- Expected effect: New completed jobs expose all four report artifacts as generated or stored: CSV, Markdown, XLSX, and PDF. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, and `npm run build` passed in this session. (codex)

## 2026-05-25 - XLSX Output Generation

- Context: After Critic and output artifacts were visible in the dashboard, XLSX remained a planned artifact and was the next lowest-risk report output to implement before PDF. (codex)
- Change: Added minimal OOXML XLSX generation in the Worker, R2 persistence, `/papers.xlsx` download endpoint, and output metadata status updates. (codex)
- Expected effect: New completed jobs expose CSV, Markdown, and XLSX as generated/stored artifacts, leaving only PDF as planned. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, and `npm run build` passed in this session. (codex)

## 2026-05-25 - Dashboard Artifact Visibility

- Context: After `critic_flags` and `job_outputs` were verified through direct API calls, the dashboard still lacked visible panels for those artifacts. (codex)
- Change: Connected the Research dashboard to paper-level critic flags and job output artifacts, and connected Ops to output metadata, critic severity summaries, and live critic flag rows. (codex)
- Expected effect: Users can verify Critic and Report/Delivery stages from the UI without manually opening API URLs. (codex)
- Verification: `npm run typecheck` and `npm run build:web` passed in this session. (codex)

## 2026-05-25 - Full Workflow Skeleton Persistence

- Context: The user decided to implement all workflow stages first and defer quality optimization/refinement until after end-to-end coverage exists. (codex)
- Change: Added persistent Critic Agent flags, output metadata records, read APIs for both, and changed the Relevance Agent trace to completed metadata fallback while keeping Vectorize as a planned enhancement. (codex)
- Expected effect: New jobs should no longer have Critic/Report/Delivery as purely conceptual stages; each stage now leaves a D1-backed audit artifact even where Vectorize remains planned. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, and `npm run build` passed in this session. (codex)

## 2026-05-25 - Enrichment Trace Visibility

- Context: The latest production run completed successfully with `enrichmentLimit: 10`, but the dashboard did not clearly explain why Crossref and Unpaywall processed 10 rows and skipped 10 rows. (codex)
- Change: Added UI parsing of `agent_traces.detail` JSON so main trace cards, Ops metric tiles, pipeline cards, agent cards, and console logs show enrichment limits, processed counts, skipped counts, OA counts, and Drive upload/skip counts. (codex)
- Expected effect: Users can distinguish intentional subrequest-limit skipping from actual workflow failure directly in the dashboard. (codex)
- Verification: `npm run typecheck` and `npm run build:web` passed in this session. (codex)

## 2026-05-24 - Enrichment Limit

- Context: The deployed job confirmed Google Drive wiring, but Crossref plus Unpaywall calls over 50 results hit Cloudflare Worker subrequest limits. (codex)
- Change: Added `enrichmentLimit` to cap Crossref and Unpaywall processing, defaulting to 10 and recording skipped rows instead of attempting every allowed paper. (codex)
- Expected effect: Search jobs should complete without Unpaywall-wide `Too many subrequests` failures; Drive upload can be tested when one of the enriched top rows has an OA PDF URL. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## 2026-05-24 - Google Drive OA PDF Archive

- Context: Google Drive was listed as planned while Unpaywall already captured OA PDF URLs. The user prioritized Drive connection before remaining benchmark work. (codex)
- Change: Added Worker service-account Drive upload for OA PDF URLs only, persisted Drive metadata in `papers`, and exposed it through diagnostics, CSV, Markdown, dashboard detail, and MCP paper result paths. (codex)
- Expected effect: Jobs with direct OA PDF URLs upload those files to the configured Drive folder when Google credentials and folder sharing are correct; failures are recorded per paper without failing the whole search job. (codex)
- Verification: `npm run typecheck`, paper insert placeholder count check, and `npm run build:web` passed in this session. (codex)

## 2026-05-24 - Ops Trace Dashboard Binding

- Context: After `agent_traces` was verified in production, `/dashboard/ops` still showed mock-only agent board, pipeline, and console state. (codex)
- Change: Connected Ops to recent Worker jobs and `GET /api/search-jobs/:id/traces`; Launch now posts a real search job and refreshes trace state. (codex)
- Expected effect: Ops should visually distinguish live D1 trace-backed execution from remaining planned items such as Vectorize and Google Drive. (codex)
- Verification: `npm run typecheck` and `npm run build:web` passed in this session. (codex)

## 2026-05-24 - Agent Trace Persistence
- Follow-up fix: `/api/diagnostics` initially reported 14 missing `agent_traces` columns because it checked schema before running bootstrap. Diagnostics now calls `ensureSchema`, new jobs use 12 total steps, and completed traces get completion timestamps. (codex)

- Context: Benchmark work is deferred until team outputs are merged, so the next product priority is replacing dashboard mock workflow state with persisted execution traces. (codex)
- Change: Added D1 `agent_traces` schema, Worker trace recording, Worker trace API, MCP trace read tool, and dashboard trace panel. (codex)
- Expected effect: A completed or failed search job now has inspectable step-level records, making the 12-step workflow auditable without relying only on static mock UI data. (codex)
- Verification: `npm run typecheck` and `npm run build:web` passed in this session. (codex)

## 2026-05-24 - Dashboard Mock Clarity

- Context: The final dashboard routes displayed static mock numbers and statuses that could be mistaken for completed benchmark or agent execution results. (codex)
- Change: Replaced mock performance values and mock operation states with explicit `미완성 Mock`, `미완성`, or `부분 구현` wording. (codex)
- Expected effect: Users should no longer confuse evaluation scenario placeholders, agent console logs, Vectorize, Google Drive, Critic, or 12-step trace previews with live system output. (codex)
- Verification: `npm run typecheck` and `npm run build:web` passed in this session. (codex)


## 2026-05-22 - Manual Review Informed Scoring

- Context: `benchmark/manual_review_proposed.csv` shows repeated `wrong_subtopic` failures, especially broad AI papers that match approved journals but miss employer branding, applicant reaction, recruitment, or advertising-effectiveness specifics. (codex)
- Change: Added subtopic-fit scoring groups in `apps/worker/src/index.ts` and included the resulting score in `relevanceReason`. (codex)
- Expected effect: T001/T002/T003 candidates that only match general AI terms should receive lower relevance and rank below papers matching the required subtopic groups. (codex)
- Verification: `npm run typecheck` and `npm run build:web` passed in this session. (codex)


This file records debugging and troubleshooting work that affects implementation, deployment, or verification. Update it whenever a defect is investigated or a verification run changes project confidence.

## 2026-05-20 - Worker Smoke Test Verification (codex)

### Context

Added a no-quota Worker API smoke test so personal-repo and future staging deployments can be checked without consuming Web of Science quota by default.

### Verification Command

```bash
npm run smoke:worker
```

### Result

- Passed: `/api/health` returned `ok: true` and service `paper-agent-worker`. (codex)
- Passed: `/api/diagnostics` returned `ok: true`, `searchProvider: wos`, active provider ready, D1 bound, no missing columns, and R2 reports enabled. (codex)
- Passed: `/api/search-jobs?limit=3` returned three recent jobs, latest `job-f1d1b55a-85c4-4908-8d99-32cf660d7e76` with `status: completed`. (codex)
- Passed: `npm run typecheck` completed successfully across all workspaces after adding the Worker smoke script. (codex)

### Notes

- Default mode does not create a search job and does not consume WoS quota. (codex)
- Use `RUN_SEARCH=true SMOKE_MAX_RESULTS=3 npm run smoke:worker` only for staging low-quota end-to-end checks. (codex)

## 2026-05-20 - MCP Installation Baseline Verification (codex)

### Context

The user requested MCP servers from `awesome-mcp-servers` that are necessary for Paper Agent work. The selected set was limited to Paper Agent MCP, GitHub MCP, Cloudflare Docs/Builds/Observability/Browser MCP, Playwright MCP, and restricted filesystem MCP.

### Verification Command

```bash
npm run smoke:mcp
```

### Result

- Passed: Deployed MCP endpoint `https://paper-agent-mcp.shch3653.workers.dev/mcp` returned the expected read-only tool list. (codex)
- Passed: `get_system_diagnostics` returned `ok: true`, D1 bound, no missing columns, R2 reports enabled, and MCP mode `read_only`. (codex)
- Passed: Recent jobs, selected job details, paper results, and report link tool calls returned data. (codex)

### Notes

- Local Codex config was updated for next-session loading of Paper Agent, Cloudflare Docs/Builds/Observability/Browser, Playwright, and restricted filesystem MCP servers. (codex)
- GitHub MCP was not added to local Codex config because Docker is unavailable; the current session already has the GitHub MCP connector. (codex)

## 2026-05-18 - Proposed Agent Metric QA Re-evaluation After Gold Update (shonshinemin)

### Context

Metric QA reviewer (shonshinemin) performed manual review of all 15 proposed agent papers across T001–T003 and updated `benchmark/gold_relevant_papers.verified.csv` with one promoted gold entry (G061). Re-evaluated proposed agent metrics to measure the impact.

### Manual Review Summary

All 15 papers reviewed and recorded in `benchmark/manual_review_proposed.csv`. Key findings:

| task_id | include | review | exclude | gold_promoted |
|---|---|---|---|---|
| T001 (AI interview employer branding) | 0 | 2 | 3 | 0 |
| T002 (AI recruitment applicant reaction) | 0 | 0 | 5 | 0 |
| T003 (generative AI advertising effectiveness) | 1 | 2 | 2 | 1 |

T002 papers were entirely off-topic (strategic management AI papers, not applicant reaction to recruitment AI).

### Gold Update

Added G061 to `benchmark/gold_relevant_papers.verified.csv`:

```
T003,G061,Frontiers: Generative AI and Personalized Video Advertisements,Kapoor; Anuj; Kumar; Madhav,2025,MARKETING SCIENCE,10.1287/mksc.2023.0494,5,yes,verified
```

Promotion rationale: DOI Crossref-confirmed (`verification_status=verified`, `verification_reason=title match; year match; journal match`); `manual_relevance=5`, `manual_decision=include`; Marketing Science 국제 S급.

### Verification Command

```bash
npm run benchmark:evaluate-proposed
```

(Node.js required. Metrics computed analytically from script source and updated data files.)

### Before / After Metrics

| Metric | Before | After | Δ |
|---|---|---|---|
| precision_at_k | 0.0000 | 0.0667 | +0.0667 |
| ndcg_at_k | 0.0000 | 0.1601 | +0.1601 |
| gold_doi_hit_rate_at_k | 0.0000 | 0.3333 | +0.3333 |
| doi_accuracy_at_k | 1.0000 | 1.0000 | 0 |
| paper_validity_rate_at_k | 1.0000 | 1.0000 | 0 |
| top_journal_precision_at_k | 1.0000 | 1.0000 | 0 |
| hallucination_rate_at_k | 0.0000 | 0.0000 | 0 |
| oa_success_rate_at_k | 0.0000 | 0.0000 | 0 |

### Findings

- T003 rank-1 paper is a confirmed core-relevance match (precision gain driven by top-ranked result).
- T002 retrieval is fundamentally off-topic; keyword decomposition or sub-query refinement needed.
- oa_success_rate = 0 confirmed as a Unpaywall email-normalization pipeline bug (pre-existing; see 2026-05-15 entry).
- Full analysis in `shonshinemin_cmd/metric-change-report.md`.

## 2026-05-18 - Repository Secret Exposure Audit

### Context

Before switching the team workflow to the organization repository, the user asked whether security issues from the earlier personal repository work could affect the project.

### Scope

Checked:

- Current tracked files.
- Full Git history from `git rev-list --all`.
- Local workspace, including untracked reference files, excluding `.git`, `node_modules`, `dist`, and `.wrangler`.

Patterns checked:

- GitHub fine-grained and classic token prefixes.
- Cloudflare `cfut_` token prefix.
- Previously shared OpenAlex key value.
- Private key blocks.
- AWS access key prefix.
- npm token prefix.
- Slack token prefix.
- Common secret variable assignments, reviewed as redacted output.

### Findings

- No `github_pat_` token was found in tracked files, Git history, or local workspace.
- No classic GitHub token prefix was found in tracked files, Git history, or local workspace.
- No Cloudflare `cfut_` token prefix was found in tracked files, Git history, or local workspace.
- The previously shared OpenAlex key value was not found in tracked files, Git history, or local workspace.
- No private key, AWS, npm, or Slack token pattern was found in Git history.
- The only tracked `.env`-style file is `.env.example`.
- Secret-related matches in `README.md`, `docs/debug-log.md`, and `docs/progress.md` are variable names or placeholders such as `<Clarivate issued key>`, `<optional>`, or redacted example syntax.

### Residual Risk

The repository audit does not cover secrets pasted into external chat history or GitHub/Cloudflare web UIs. Any token pasted into chat should remain revoked/rotated even though it was not found in the repository.

### Resolution

No repository history rewrite is required based on this audit. Continue using organization-repository branches and PRs, and keep real credentials only in GitHub/Cloudflare secret stores.

## 2026-05-18 - Team Agent Auto-Start Guidance Verification

### Context

The team collaboration repository is now synchronized, and the user requested repository-level instructions so organization agents can automatically continue assigned benchmark work.

### Changes Under Test

- Added root `AGENTS.md`.
- Added `docs/agent-work-queue.md`.
- Added role-specific README files under:
  - `jin23624_cpu/`
  - `juilie_bot_hub/`
  - `seunghyeon_choi/`
  - `shonshinemin_cmd/`
  - `integrated/`
- Added benchmark CSV templates for manual review and baseline collection.
- Updated the pull request template with assignment and benchmark verification checks.

### Verification

Run:

```bash
npm run benchmark:evaluate-proposed
```

Expected result:

- The existing Proposed Agent metric generation should still succeed.
- Empty manual-review and baseline templates should not affect the current Proposed Agent metric calculation.

Observed result:

- Command passed.
- Totals remained stable: `tasks=3`, `results=15`, `gold=9`, `verifiedGold=1`.
- Macro averages remained stable: `DOI Accuracy@5=1.0000`, `Paper Validity@5=1.0000`, `Top Journal Precision@5=1.0000`, `Hallucination Rate@5=0.0000`.

## 2026-05-18 - Proposed Agent Benchmark Metric Calculation

### Context

The three-task Proposed Agent sample needed a repeatable metric calculation step before expanding to all 20 benchmark tasks.

### Code Changes Under Test

- Added `benchmark/scripts/evaluate-proposed-agent.mjs`.
- Added npm script `benchmark:evaluate-proposed`.
- Generated:
  - `benchmark/proposed_agent_metrics.csv`
  - `benchmark/proposed_agent_metrics_summary.json`

### Verification Command

```bash
npm run benchmark:evaluate-proposed
```

Observed summary:

```json
{
  "tasks": 3,
  "results": 15,
  "gold": 9,
  "verifiedGold": 1,
  "goldMatches": 0,
  "doiMatches": 0,
  "macroAverages": {
    "precision_at_k": 0,
    "ndcg_at_k": 0,
    "gold_doi_hit_rate_at_k": 0,
    "doi_accuracy_at_k": 1,
    "paper_validity_rate_at_k": 1,
    "top_journal_precision_at_k": 1,
    "hallucination_rate_at_k": 0,
    "oa_success_rate_at_k": 0
  }
}
```

### Troubleshooting Notes

- Gold-overlap metrics are intentionally strict: exact DOI or normalized title match against task gold rows with `human_relevance >= 4`.
- DOI hit rate uses only verified DOI gold labels. Across T001-T003 there is currently only one verified DOI gold row, so Precision@5 and NDCG@5 are not ready for final claims.
- Worker validity metrics are separate from gold overlap. The sample produced Crossref-verified, approved top-journal papers, but they do not yet overlap with the incomplete gold labels.

### Resolution

Metric generation is working. The next benchmark quality step is to refine T001-T003 gold labels or add strict accepted-paper labels from the sample results, then rerun `npm run benchmark:evaluate-proposed`.

## 2026-05-18 - Proposed Agent Benchmark Three-Task Sample

### Context

The user asked to resume the previously paused first benchmark execution step. To avoid unnecessary WoS quota consumption, the run was limited to the first three benchmark tasks and five saved results per task.

### Verification Command

```bash
npm run benchmark:run-proposed -- --limit 3 --max-results 5 --poll-ms 5000 --timeout-ms 300000
```

Observed summary:

```json
{
  "workerUrl": "https://paper-agent-project.shch3653.workers.dev",
  "tasksRequested": 3,
  "jobRows": 3,
  "resultRows": 15,
  "output": "benchmark/proposed_agent_results.csv",
  "jobsOutput": "benchmark/proposed_agent_jobs.csv"
}
```

### Job Results

| Task | Job ID | Status | Source | Allowed | Papers |
| --- | --- | --- | ---: | ---: | ---: |
| T001 | `job-e97a70f1-b041-492e-b54f-d60cc6cd8065` | completed | 8 | 5 | 5 |
| T002 | `job-b9fb9c4b-58d0-4774-9e38-6d5a99975b19` | completed | 25 | 5 | 5 |
| T003 | `job-700ef0e4-a2dd-450a-a785-c590f5e4bab3` | completed | 25 | 5 | 5 |

### Resolution

The deployed Proposed Agent path completed the three-task sample without failed jobs. The output CSV files are now the benchmark evidence for the next overlap-metric step:

```text
benchmark/proposed_agent_jobs.csv
benchmark/proposed_agent_results.csv
```

## 2026-05-18 - Dashboard Implementation Status Panels

### Context

The user requested that the dashboard clearly distinguish implemented features from mock or unimplemented features. This is important because the final UI contains real Worker-backed functionality and design-complete panels that are not yet connected to live APIs.

### Code Changes Under Test

- Added structured implementation status data in `apps/web/src/dashboard/mockData.ts`.
- Added `ImplementationStatusPanel` to `apps/web/src/dashboard/DashboardPages.tsx`.
- Added status panels to:
  - `/dashboard/research`
  - `/dashboard/ops`
  - `/dashboard/evaluation`
- Added CSS for status chips and implementation cards in `apps/web/src/dashboard/dashboard.css`.

Status categories:

- `구현됨`: live Worker/D1/R2/API or deployed functionality.
- `부분 구현`: partial real implementation with remaining API/UI integration.
- `Mock`: static final UI data, not yet API-connected.
- `미구현`: planned but not yet implemented.

### Verification Commands

```bash
npm run typecheck
npm run build:web
```

Both passed.

## 2026-05-18 - Proposed Agent Benchmark Runner

### Context

After initializing benchmark tasks and gold-label cleanup workflows, the next recommended step was to collect Proposed Agent outputs from the real deployed Worker pipeline. The runner must preserve WoS quota by supporting partial runs.

### Code Changes Under Test

- Added `benchmark/scripts/run-proposed-agent.mjs`.
- Added root npm script `benchmark:run-proposed`.

The runner:

- reads `benchmark/tasks.jsonl`
- calls `POST /api/search-jobs`
- polls `GET /api/search-jobs/:id` until `completed` or `failed`
- writes job summaries to `benchmark/proposed_agent_jobs.csv` by default
- writes paper rows to `benchmark/proposed_agent_results.csv` by default
- supports `--limit`, `--start`, `--max-results`, `--poll-ms`, `--timeout-ms`, and custom output paths

### Verification Commands

```bash
npm run benchmark:run-proposed -- --limit 0 --output /tmp/proposed_empty.csv --jobs-output /tmp/proposed_jobs_empty.csv
npm run benchmark:run-proposed -- --limit 1 --max-results 5 --poll-ms 5000 --timeout-ms 300000 --output /tmp/proposed_smoke.csv --jobs-output /tmp/proposed_jobs_smoke.csv
```

Smoke result:

```text
task_id=T001
job_id=job-768671a5-346d-4f0f-af54-6f29014ceb27
status=completed
source_result_count=8
allowed_result_count=5
paper_count=5
```

### Finding

The deployed Worker benchmark path is operational. T001 returned 5 allowlisted Organization/HR results with Crossref verification metadata. The full 20-task run should be started only when ready to spend WoS quota and then committed as `benchmark/proposed_agent_jobs.csv` and `benchmark/proposed_agent_results.csv`.

## 2026-05-17 - Benchmark Gold Candidate Promotion

### Context

The candidate scoring workflow produced two strict `promote_candidate` rows. The requested next step was to process item 1: review those candidates and decide whether they should be promoted into the gold set.

### Reviewed Candidates

| Task | Gold ID | Decision | Journal | DOI | Reason |
| --- | --- | --- | --- | --- | --- |
| T004 | G010 | promoted | Academy of Management Review | 10.5465/amr.2022.0058 | Same field, DOI present, journal article, approved international S journal, directly covers algorithmic performance management and employee trust. |
| T019 | G055 | promoted | Journal of Retailing | 10.1016/j.jretai.2022.02.003 | Same field, DOI present, journal article, approved international A1 journal, directly covers omnichannel channels along the customer journey. |

### Files Updated

- Updated `benchmark/gold_relevant_papers.csv`.
- Updated `benchmark/gold_relevant_papers.verified.csv`.
- Removed promoted rows from `benchmark/gold_refinement_queue.csv`.
- Added `benchmark/gold_promotion_decisions.csv`.

### Verification Command

```bash
node -e "const fs=require('fs'); function parse(text){const lines=text.trim().split(/\n/); const header=lines.shift().split(','); const out=[]; for(const line of lines){const cols=[];let cur='',q=false; for(let i=0;i<line.length;i++){const ch=line[i]; if(ch==='\"'&&line[i+1]==='\"'){cur+='\"';i++;} else if(ch==='\"') q=!q; else if(ch===','&&!q){cols.push(cur);cur='';} else cur+=ch;} cols.push(cur); out.push(Object.fromEntries(header.map((h,i)=>[h,cols[i]||''])));} return out;} const rows=parse(fs.readFileSync('benchmark/gold_relevant_papers.verified.csv','utf8')); const counts={}; for(const r of rows) counts[r.doi_label_status]=(counts[r.doi_label_status]||0)+1; const queue=fs.readFileSync('benchmark/gold_refinement_queue.csv','utf8').trim().split(/\n/).length-1; console.log(JSON.stringify({goldRows:rows.length,counts,queueRows:queue}));"
```

Result:

```json
{"goldRows":60,"counts":{"ambiguous":17,"verified":8,"no_match":35},"queueRows":52}
```

## 2026-05-17 - Benchmark Candidate Scoring Workflow

### Context

The Crossref candidate pool had 200 rows, but broad Crossref queries produced mixed result quality. The next step was to score candidates against the approved business-school journal universe so manual review can start from the strongest rows.

### Code Changes Under Test

- Added `benchmark/scripts/score-gold-candidates.mjs`.
- Added root npm script `benchmark:score-gold`.
- Generated `benchmark/gold_candidate_review.csv`.
- Normalized benchmark `journal_category_id` values to match shared category ids:
  - `strategy-international` -> `international-business`
  - `accounting-finance` -> `accounting`
  - `operations-supply-chain` -> `operations`

The script scores each candidate by:

- Crossref type is `journal-article`
- DOI presence
- approved business-school journal allowlist match
- same-field category match
- S/A1 rank
- year >= 2020
- Crossref score

### Verification Commands

```bash
npm run benchmark:score-gold
rg -n "promote_candidate" benchmark/gold_candidate_review.csv
```

Results:

```json
{
  "candidates": 200,
  "priorityCounts": {
    "topic_only_review": 90,
    "reject_low_priority": 108,
    "promote_candidate": 2
  }
}
```

### Finding

Only two rows are automatic promotion candidates by strict S/A1 same-field journal criteria. This confirms that final gold labels should not be auto-created from broad Crossref search. Manual relevance review and, where needed, WoS/source-title targeted search are still required.

## 2026-05-17 - Benchmark Gold Refinement Workflow

### Context

The first Crossref DOI pass produced only 6 verified rows from 60 seed gold rows. The next requirement was to create a practical refinement workflow rather than manually scanning the full CSV.

### Code Changes Under Test

- Added `benchmark/scripts/refine-gold-candidates.mjs`.
- Added root npm script `benchmark:refine-gold`.
- Generated `benchmark/gold_refinement_queue.csv`.
- Generated `benchmark/gold_crossref_candidates.csv`.

The script:

- reads `benchmark/tasks.jsonl`
- reads `benchmark/gold_relevant_papers.verified.csv`
- writes a queue of non-verified rows requiring exact-title replacement or manual review
- queries Crossref once per task for task-level candidates
- writes candidate rows with DOI, title, authors, journal, year, publisher, Crossref score, target field, and manual review status

### Verification Commands

```bash
npm run benchmark:refine-gold -- --limit-tasks 1 --candidates-per-task 3 --delay-ms 200 --queue /tmp/gold_queue_sample.csv --candidates /tmp/gold_candidates_sample.csv
npm run benchmark:refine-gold
wc -l benchmark/gold_refinement_queue.csv benchmark/gold_crossref_candidates.csv benchmark/scripts/refine-gold-candidates.mjs
```

Results:

```json
{
  "tasks": 20,
  "refinementQueueRows": 54,
  "queriedTasks": 20,
  "candidateRows": 200
}
```

### Finding

The workflow now produces a manageable manual review queue. Candidate quality is intentionally not trusted automatically: Crossref broad queries return mixed materials such as non-top-journal articles, book chapters, dissertations, and adjacent-topic papers. The next step is to promote only valid candidates into the gold file, then rerun `npm run benchmark:verify-gold`.

## 2026-05-17 - Benchmark Gold Crossref Verification Pass

### Context

After initializing 20 benchmark tasks and 60 seed gold relevance rows, the next required benchmark step was to stop relying on title-level labels and begin DOI verification through Crossref.

### Code Changes Under Test

- Added `benchmark/scripts/verify-gold-crossref.mjs`.
- Added root npm script `benchmark:verify-gold`.
- Generated `benchmark/gold_relevant_papers.verified.csv`.

The script:

- reads `benchmark/gold_relevant_papers.csv`
- queries Crossref by title
- chooses a candidate by title similarity and year proximity
- writes `verified`, `ambiguous`, `no_match`, or `lookup_failed`
- preserves rows without inventing DOI values

### Verification Commands

```bash
npm run benchmark:verify-gold -- --limit 0 --output /tmp/gold_verified_limit0.csv
npm run benchmark:verify-gold -- --limit 5 --output /tmp/gold_verified_sample.csv --delay-ms 250
npm run benchmark:verify-gold -- --output benchmark/gold_relevant_papers.verified.csv
node -e "const fs=require('fs'); const rows=fs.readFileSync('benchmark/gold_relevant_papers.verified.csv','utf8').trim().split(/\n/).slice(1); const counts={}; for(const row of rows){ const cols=[]; let cur='',q=false; for(let i=0;i<row.length;i++){const ch=row[i]; if(ch==='\"'&&row[i+1]==='\"'){cur+='\"';i++;} else if(ch==='\"') q=!q; else if(ch===','&&!q){cols.push(cur);cur='';} else cur+=ch;} cols.push(cur); const status=cols[9]; counts[status]=(counts[status]||0)+1;} console.log(JSON.stringify(counts));"
```

Results:

```json
{"ambiguous":17,"verified":6,"no_match":37}
```

### Finding

Crossref access and CSV generation are working. The low verified count means the first seed gold titles are too broad for final DOI-accuracy scoring. The next benchmark step should refine ambiguous/no-match rows with exact paper titles from WoS or Crossref before running baseline comparisons.

## 2026-05-17 - Benchmark Fixture Expansion

### Context

`paper_agent_enhanced_report.md` identifies benchmark expansion as the highest priority because the final project needs evidence that the proposed multi-agent workflow outperforms rule-based search and single-LLM recommendation.

### Changes Under Test

- Expanded `benchmark/keywords.csv` from 3 keywords to 20 benchmark queries.
- Added `benchmark/tasks.jsonl` with 20 structured tasks including task id, keyword, research question, field, journal category id, year range, max results, expected journal priority, and evaluation focus.
- Added `benchmark/gold_relevant_papers.csv` with 60 seed gold relevance rows, 3 per task.
- Added `benchmark/evaluation_rubric.md` defining human relevance scores, core metrics, and agent-level checks.
- Added `benchmark/benchmark_summary.md` documenting current benchmark status and the next DOI verification step.

### Verification Commands

```bash
node -e "const fs=require('fs'); const lines=fs.readFileSync('benchmark/tasks.jsonl','utf8').trim().split(/\n/); for (const line of lines) JSON.parse(line); console.log('tasks', lines.length);"
wc -l benchmark/keywords.csv benchmark/gold_relevant_papers.csv benchmark/tasks.jsonl benchmark/evaluation_rubric.md benchmark/benchmark_summary.md
```

Results:

- `benchmark/tasks.jsonl` parsed successfully.
- Task count: 20.
- `benchmark/keywords.csv`: 21 lines including header.
- `benchmark/gold_relevant_papers.csv`: 61 lines including header.

### Important Constraint

The gold CSV intentionally does not invent DOI values. Rows are title-level seed labels with `doi_label_status=needs_crossref_verification`. The next benchmark step should use Crossref verification to fill verified DOI, author, journal, and year values before computing DOI Accuracy.

## 2026-05-17 - Final Dashboard Route UI/UX Implementation

### Context

The three attached HTML files were provided as the final dashboard UI/UX design references:

- `01_interactive_research_studio.html`
- `02_interactive_agent_ops.html`
- `03_interactive_evaluation_dashboard.html`

The implementation needed to preserve the layout, color system, card/table structure, workflow visualization, console log behavior, detail panels, and evaluation scenario interaction while integrating with the existing React dashboard and deployed Worker API.

### Code Changes Under Test

- Added route detection and top navigation for:
  - `/dashboard/research`
  - `/dashboard/ops`
  - `/dashboard/evaluation`
- Kept the existing real dashboard `Run` flow on the research route.
- Added a 12-step literature review workflow visualization.
- Added Top Journal Pool, Q1/top-journal status, literature review preview, and final UI cards on the research route.
- Added Multi-Agent status board, tool call console, D1/R2/Drive/Vectorize/MCP status cards, and Critic Review on the ops route.
- Added baseline evaluation scenario switching and Rule-based vs Single LLM vs Proposed Multi-Agent comparison on the evaluation route.
- Separated static dashboard mock data into `apps/web/src/dashboard/mockData.ts` for future API replacement.
- Added `apps/web/public/_redirects` so Cloudflare Pages direct route loads fall back to `index.html`.

### Verification Commands

```bash
npm run typecheck
npm run build:web
test -f apps/web/dist/_redirects
```

All passed locally. Build output included `apps/web/dist/_redirects`, confirming the Cloudflare Pages SPA fallback file is copied into the deployment artifact.

### Runtime Check

After GitHub/Cloudflare deploys this commit, verify:

- `https://paper-agent-project.pages.dev/dashboard/research`
- `https://paper-agent-project.pages.dev/dashboard/ops`
- `https://paper-agent-project.pages.dev/dashboard/evaluation`

The research route should still call the deployed Worker API when `Run` is clicked. The ops and evaluation routes currently use separated static mock data and are ready for later API wiring.

## 2026-05-15 - Result Field And Rank Visibility

### Context

After the selected-field search workflow was confirmed, the next dashboard UX priority was result transparency. Reviewers need to see why an allowlisted result is accepted, specifically which `경영대학 학술지 목록.docx` field and rank class matched the journal.

### Code Changes Under Test

- Added shared journal matching helpers that map a journal name to:
  - category label, for example `2. 조직인사`
  - rank label, for example `국제 S급` or `국제 A1급`
- Extended `PaperSummary` with optional `journalField` and `journalRank`.
- Worker API row mapping now derives `journalField` and `journalRank` from persisted `journal_name`, so older D1 rows can display the new metadata without a schema migration.
- Dashboard ranked-paper table now includes a `Field / Rank` column.
- Paper detail now includes `Field / Rank`.
- CSV export now includes `journal_field` and `journal_rank`.
- Markdown report top table and ranked-paper detail sections now include Field/Rank.

### Verification Commands

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/worker/wrangler.toml
```

All passed locally.

### Runtime Check

After Cloudflare deploys the commit, open a completed job in the dashboard and confirm each paper row shows `Field / Rank`. Then download CSV and Markdown report for the same job and confirm the field/rank values are present.

## 2026-05-15 - Journal Category Selector And Ranked Source Priority

### Context

The dashboard needed to expose the numbered categories from `경영대학 학술지 목록.docx`, such as `1. 공통`, `2. 조직인사`, and the remaining field groups. When a category is selected, WoS retrieval should prioritize that category's `국제 S급` journals first, then `국제 A1급` journals.

### Code Changes Under Test

- Added structured category metadata in `packages/shared/src/businessSchoolJournals.ts`.
- Added dashboard `Field` selector options from the shared category list.
- `POST /api/search-jobs` now accepts optional `journalCategoryId`.
- Worker normalizes the category id against the shared list before processing.
- Selected category WoS query order is:
  1. keyword variant + selected category `국제 S급` source titles
  2. keyword variant + selected category `국제 A1급` source titles
  3. exact keyword fallback
- Selected category result filtering now saves only journals that belong to that selected category.
- If no category is selected, the existing all-field allowlist behavior remains available.

### Verification Commands

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/worker/wrangler.toml
```

All passed locally.

### Runtime Check

After Cloudflare deploys the commit, open the dashboard and confirm the `Field` selector appears next to `Max`, `From`, and `To`. Run one small quota-safe search with a selected field, for example:

```json
{"keyword":"employer branding","yearStart":2020,"maxResults":3,"journalCategoryId":"organization-hr"}
```

Expected behavior: the job completes, `Source / Allowed` updates, and saved papers are restricted to the selected field's journal list.

### Runtime Confirmation

After the `eb2dbe3` push and Cloudflare deployment, the user confirmed the category selector workflow works normally from the dashboard. This means the next session can treat selected-field search priority and selected-field result filtering as the current deployed baseline.

Next recommended debugging target is not search execution itself, but result transparency: expose the matched journal field/rank on paper rows, paper detail, CSV, and Markdown report output so reviewers can see whether each saved result matched `국제 S급` or `국제 A1급`.

## 2026-05-15 - WoS Keyword Expansion And Allowlist Priority Search

### Context

The dashboard `Run` failure was fixed, but low-result queries such as `AI interview employer branding` could still complete with very few WoS candidates and zero allowlisted papers. The requested next work was:

1. Keyword decomposition search.
2. Approved journal / allowlist-priority search.

### Code Changes Under Test

- `searchWebOfScience` now builds multiple WoS queries from the input keyword.
- The first query remains the exact user keyword.
- Additional queries use token pairs and domain-oriented expansions such as:
  - `artificial intelligence`
  - `algorithmic hiring OR digital interview OR AI interview`
  - `employer branding OR organizational attractiveness OR recruitment branding`
- Added source-title-priority queries with `SO=(...)` for a curated subset of approved business school journals.
- WoS requests are executed sequentially with a short delay to reduce 429 risk.
- Candidate records are deduplicated by DOI, WoS UID, or title/year before downstream allowlist filtering.
- Existing API payloads and dashboard controls remain unchanged.

### Verification Commands

```bash
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/worker/wrangler.toml
```

All passed.

### Runtime Check

After Cloudflare deploys this commit, run a low-result query with a small `Max` value first to preserve WoS quota. Confirm `sourceResultCount` increases compared with the previous exact-only behavior.

### Runtime Confirmation

After Cloudflare deployment, this payload:

```json
{"keyword":"AI interview employer branding","yearStart":2020,"maxResults":3}
```

completed as:

```text
job-9da78c65-3f85-479d-9ee0-7354c3f1f4dd
status=completed
sourceResultCount=15
allowedResultCount=1
```

This confirms keyword expansion plus source-title-priority retrieval improved the previous low-result behavior for the same keyword family.

## 2026-05-15 - Dashboard Search Options

### Context

After fixing the dashboard `Run` failure, the next bottleneck was search tuning. The dashboard had fixed request values:

```json
{"yearStart":2020,"maxResults":20}
```

This made it hard to test broader WoS queries or adjust candidate volume from the UI.

### Code Changes Under Test

- Added `Max`, `From`, and `To` controls to the dashboard command area.
- `Max` accepts numeric typing and is clamped to the Worker-supported range of 1-50 on blur and when creating the request payload.
- `From` and `To` are optional year fields.
- Empty year fields are omitted from the request payload.
- `Run` now sends `keyword`, `maxResults`, and optional `yearStart`/`yearEnd` from UI state instead of hard-coded values.

### Verification Commands

```bash
npm run typecheck
npm run build
```

Both passed.

### Follow-Up Adjustment

The `Max` input now keeps its local value as a string so users can type naturally. Invalid, empty, or out-of-range values are normalized to the 1-50 range before `POST /api/search-jobs`.

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
