# Debug Log

## 2026-05-27 - T001-T003 Gold Label Verification (jin23624)

- Context: Seed gold labels for T001-T003 were broad titles without DOI, leading to low precision/NDCG metrics in initial benchmark runs.
- Action: Refined G001-G009 with real top-journal papers (Human Resource Management, Computers in Human Behavior, Strategic Management Journal, Journal of Applied Psychology, Marketing Science, JAMS).
- Result: `npm run benchmark:verify-gold` confirmed all 9 rows as `verified`.
- Expected effect: Precision@5 and NDCG@5 metrics for the Proposed Agent will now reflect actual overlap with high-quality papers, improving the reliability of the benchmark results. (jin23624)

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
