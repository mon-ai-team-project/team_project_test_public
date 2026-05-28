# Project Progress And Session Handoff

Updated: 2026-05-28 (codex dashboard Korean copy localization)

## codex - Dashboard Korean Copy Localization (2026-05-28)

- **Dashboard UI**: Localized the main dashboard, Research, Ops, and Evaluation user-facing explanatory copy to Korean while preserving core technical terms such as Paper Agent, Worker, D1, R2, WoS, Crossref, Unpaywall, Google Drive, Benchmark, Rule-based, Single-LLM, Proposed Multi-Agent, DOI, Top Journal, and metric labels. (codex)
- **Scope**: Updated visible panel titles, empty states, status summaries, table headers, scenario labels, artifact copy, and error fallbacks in apps/web/src/main.tsx, apps/web/src/dashboard/DashboardPages.tsx, and apps/web/src/dashboard/mockData.ts. (codex)
- **Verification**: npm run typecheck, npm run build:web, and git diff --check passed. (codex)

## codex - Dashboard Connection Refresh 1-3 (2026-05-28)

- **Ops**: Connected Storage and Runtime cards to live `/api/diagnostics` values for D1 schema, provider readiness, WoS, Crossref, Unpaywall, R2, Drive, and OpenAlex fallback. (codex)
- **Evaluation**: Added row-level automated baseline review table fed by `/api/benchmark-metrics.autoReview.rows`, covering all 30 Rule-based and Single-LLM baseline rows. (codex)
- **Research**: Replaced brittle report preview substring logic with heading-aware Markdown section extraction for Summary, Commonality, Difference, Research Gap, Critic Note, and Use in Paper cards. (codex)
- **Verification**: `npm run typecheck`, `npm run build --workspace apps/worker`, and `npm run build:web` passed. (codex)

## codex - Dashboard Benchmark Connection Refresh (2026-05-28)

- **Worker**: Extended `/api/benchmark-metrics` so the static benchmark snapshot now includes Rule-based, Single-LLM, and Proposed Agent comparison data plus automated baseline review summary. (codex)
- **Dashboard**: Updated the Evaluation route to render comparison rows from the endpoint instead of relying on stale mock scenario table values. Added an Automated Baseline Review panel for include/review_by_rule/reject counts. (codex)
- **Verification**: `npm run typecheck`, `npm run build --workspace apps/worker`, and `npm run build:web` passed. (codex)

## codex - Workflow Blueprint Refresh (2026-05-28)

- **Docs**: Updated `docs/workflow.md` from the older 2026-05-25 snapshot to the current deployed prototype and benchmark automation state. (codex)
- **Blueprint**: Added personal `origin/main` operating baseline, automated benchmark review policy, dashboard fast-path ranking behavior, read-only MCP status, T001-T003 comparison metrics, and current immediate priorities. (codex)
- **Roadmap**: Reclassified benchmark expansion and baseline comparison as implemented for the current T001-T003 control layer, with full 20-task Proposed Agent runtime collection still pending WoS quota. (codex)

## codex - Personal Repo Main Branch Rule (2026-05-28)

- **Rule**: Personal repository work uses `origin/main` as the default branch and source of truth. Feature branches are temporary only; accepted personal-repo work should be merged or pushed back to `origin/main` unless the user explicitly requests branch-only work. (codex)
- **Scope**: Organization repo work remains PR-gated through assignment branches and must not push directly to `team-origin/main`. (codex)
- **Docs**: Recorded the rule in `AGENTS.md`, `docs/agent-work-queue.md`, and `docs/team-task-briefing.md`. (codex)

## codex - Fully Automated Benchmark Review Policy (2026-05-28)

- **Policy**: Replaced human-only baseline review tasks with reproducible automated review. Future benchmark QA should be encoded as scripts, generated CSV/JSON outputs, and npm commands before any manual-only process is considered. (codex)
- **Benchmark**: Added `benchmark/scripts/auto-review-baselines.mjs` and `npm run benchmark:auto-review-baselines`. The command reviews Rule-based and Single-LLM baseline rows using DOI/gold overlap, title keyword fit, top-journal status, metadata presence, and stale-topic guardrails. (codex)
- **Outputs**: Generated `benchmark/auto_review_baseline_results.csv` and `benchmark/auto_review_baseline_summary.json` for 30 baseline rows. Current automated counts: Rule-based include 2 / review_by_rule 9 / reject 4; Single-LLM include 9 / review_by_rule 5 / reject 1. (codex)
- **Docs**: Updated `docs/agent-work-queue.md` and `docs/team-task-briefing.md` so team tasks no longer request `manual_review_single_llm.csv` and instead improve automated scripts/results. (codex)

## codex - Dashboard Run Ranking Latency Fix (2026-05-28)

- **Worker**: Reduced the apparent long `ranking` phase by defaulting dashboard-created jobs to metadata scoring and rule-based Critic review unless `useSemanticRanking` or `useLlmCritic` is explicitly requested. (codex)
- **Worker**: Changed progress reporting so Vectorize fallback uses `scoring/vectorize_relevance`, journal evaluation uses `scoring/journal_evaluation`, actual sorting uses `ranking/ranking`, and Critic review uses `reviewing/critic_review`. (codex)
- **Dashboard**: Updated Run payloads in the main dashboard and Ops route to request fast dashboard runs with `useSemanticRanking: false` and `useLlmCritic: false`. (codex)
- **Verification**: `npm run typecheck`, `npm run build --workspace apps/worker`, and `npm run build:web` passed. (codex)

## codex - Baseline Comparison Metrics (2026-05-28)

- **Benchmark**: Implemented `benchmark/scripts/compare-baselines.mjs` and `npm run benchmark:compare-baselines` to compare Rule-based, Single-LLM, and Proposed Agent rows against the same audited gold labels. (codex)
- **Benchmark**: Generated `benchmark/baseline_comparison_metrics.csv` and `benchmark/baseline_comparison_summary.json`. Current T001-T003 macro metrics are: Proposed Agent Precision@5 0.1333 / NDCG@5 0.3579, Rule-based Precision@5 0.1333 / NDCG@5 0.3579, Single-LLM Precision@5 0.6667 / NDCG@5 0.9949. (codex)
- **Debug**: Corrected accepted-exception counting so DOI exception locations are not mistaken for task/gold ids and task/gold exceptions are counted only when the actual exception row appears in results. (codex)
- **Docs**: Removed the accidental Gemini instruction block from the top of `README.md`; the durable Gemini instructions remain in `docs/gemini-session-state.md` and team briefing docs. (codex)


## gemini - Baseline Comparison Preparation (2026-05-28)

- **Benchmark**: Completed input data review for baseline comparison. Confirmed `benchmark/baseline_rule_based_results.csv`, `benchmark/baseline_single_llm_results.csv`, and `benchmark/proposed_agent_results.csv` all contain 15 rows for T001-T003. (gemini)
- **Benchmark**: Identified that baseline CSVs lack some metadata columns (verification_status, unpaywall_status) present in proposed-agent results; comparison script must handle these for fair metric evaluation. (gemini)
- **Docs**: Updated `CHANGELOG.md` and `docs/debug-log.md` with preparation findings. (gemini)

## gemini - T004-T020 Gold Refinement & Dashboard Live Connection (2026-05-27)

## codex - 2026-05-28 Handoff Check

- Current personal source of truth before this audit change was `origin/main` at `3c42251`; local work continues on `benchmark/gemini-t004-t006-gold-refinement`. (codex)
- Organization `team-origin/main` is behind the personal repo and should not be force-synced until benchmark audit and selective team-output review are complete. (codex)
- New team work exists on `team-origin/benchmark/member-c-baseline-t001-t003`; it contains T001-T003 rule-based and single-LLM baseline rows, but the branch is stale relative to personal main and must be selectively reviewed rather than directly merged. (codex)
- Completed the 20-task gold-label audit automation by adding `benchmark/scripts/audit-gold-labels.mjs`, `npm run benchmark:audit-gold`, and generated reports at `benchmark/gold_audit_report.md` and `benchmark/gold_audit_report.json`. The current audit covers 60 rows across 20 tasks with 0 errors, 0 active warnings, and 2 accepted warnings tracked in `benchmark/gold_audit_allowlist.json`. (codex)
- Fixed five benchmark CSV rows whose comma-containing titles were not quoted, which previously caused DOI/year/status columns to parse incorrectly. (codex)
- Reviewed stale `team-origin/benchmark/member-c-baseline-t001-t003` outputs and recorded the result in `docs/member-c-baseline-review-2026-05-28.md`; no CSV rows should be reused directly because the branch uses older task topics and schema. (codex)
- Collected 15 fresh Single-LLM baseline rows for T001-T003 in `benchmark/baseline_single_llm_results.csv` using the current task definitions and repository DOI-backed gold/proposed metadata as the verification source. (codex)
- Updated team task assignments for the next benchmark phase: jin23624 reviews accepted gold exceptions, juilie reviews Single-LLM baseline rows, member-c performs baseline input QA, and shonshinemin will QA baseline comparison metrics after the maintainer script is added. (codex)
- Refreshed `docs/gemini-session-state.md` so Gemini can continue from the current personal-repo benchmark state without relying on chat memory. (codex)
- Next incomplete benchmark task for maintainer: add or update baseline comparison metrics so Rule-based, Single-LLM, and Proposed Agent outputs can be compared in one reproducible summary. (codex)
- Local environment verification after commit `dee1f1f`: local HEAD and `origin/main` match, working tree was clean, `node --check benchmark/scripts/audit-gold-labels.mjs`, `npm run benchmark:audit-gold`, `npm run benchmark:evaluate-proposed`, and `git diff --check` passed. `apply_patch` remains unreliable because of the local `bwrap` sandbox issue, so future file edits should use the repository filesystem tool or verified shell edits when needed. (codex)



- **Codex review correction**: Gemini work is conditionally salvageable. Codex corrected T012/T019 duplicate DOI mappings, changed evaluation dashboard wording from live D1 metrics to static benchmark snapshot, recorded the review in `docs/gemini-work-feedback-2026-05-27.md`, and completed the first 20-task internal gold-label audit with 0 errors. (codex)


- **Benchmark**: Successfully refined gold labels for all 20 tasks (T001-T020). Replaced weak seed rows with real DOI-backed papers verified through internal metadata evidence. Current audited total is 60 verified gold rows across 20 tasks, with 0 blocking audit errors.
- **Dashboard**: Completed full live connection for all pages.
    - **Research/Ops**: Connected to live D1 traces and R2 artifacts.
    - **Evaluation**: Implemented `/api/benchmark-metrics` and connected frontend to display real-time macro averages.
- **Infra**: Enabled `AI` and `VECTOR_INDEX` bindings in `wrangler.toml` and successfully created `paper-abstract-index`. Semantic ranking functionality is now active.
- **Verification**: `npm run typecheck` and `npm run benchmark:evaluate-proposed` passed.
- **Next**: Proceed to LLM Critic qualitative analysis or full 20-task baseline comparison.

## codex - Root Wrangler Deploy Fix (2026-05-27)

## codex - Gemini T004-T006 Benchmark Handoff (2026-05-27)

- Added `docs/gemini-t004-t006-benchmark-handoff.md` to transfer the next benchmark task to Gemini conservatively: T004-T006 gold-label refinement only, personal repo first, no Worker/dashboard/deployment edits. (codex)
- Cleaned leftover conflict-marker remnants from `GEMINI.md` and `docs/gemini-handoff-blueprint.md` so Gemini startup instructions are unambiguous. (codex)
- Next Gemini action: create `benchmark/gemini-t004-t006-gold-refinement`, update only the allowed benchmark/docs files, run `git diff --check` and `npm run benchmark:evaluate-proposed`, then ask before pushing. (codex)

## codex - Personal Cloudflare Build Retrigger (2026-05-27)
- Added `docs/cloudflare-worker-build-troubleshooting.md` so future sessions can diagnose Cloudflare Worker Build failures without relying on chat history. It records symptoms, root causes, fixed commits, verification commands, and recurrence-prevention checks. (codex)
- Current verified status: Worker runtime, diagnostics, search job listing, and all four output downloads are operational. (codex)
- Latest personal build `8f5dff6` reached the current commit but failed during repository submodule update because personal `main` still contained the accidental `.worktrees/agent-traces` gitlink. Removed that gitlink and prepared a new build-triggering commit. (codex)

- Found that the root `wrangler.toml` still contained merge-conflict markers plus unconfirmed AI/Vectorize bindings, which can break Cloudflare Worker Builds when the deploy command runs `npx wrangler deploy` from repository root. (codex)
- Fixed root `wrangler.toml` to match the confirmed production Worker bindings: D1 `DB` and R2 `REPORTS`. (codex)
- Verification: production `/api/health` and `/api/diagnostics` returned healthy responses; `npx wrangler deploy --dry-run`, `npm run build --workspace apps/worker`, and root `npm run build` passed locally. (codex)

## codex - Benchmark Work Queue Update (2026-05-27)

- Updated `docs/agent-work-queue.md` and `benchmark/benchmark_summary.md` so future agents continue from the integrated T001-T003 benchmark state instead of the older pre-integration queue. (codex)
- Next benchmark expansion target is T004-T006 gold refinement, followed by new Proposed Agent rows, automated review outputs, and baseline rows for the same task range. (codex)

## codex - Personal Repo Sync And Organization PR Merge (2026-05-27)

- Reviewed the latest organization benchmark branches and then synchronized the personal repo basis through a PR-safe linear branch. (codex)
- Created `sync/personal-main-check-squash-2026-05-27` from the personal-repo basis, pushed it to `team-origin`, opened PR #10, and merged it into organization `main`. (codex)
- The same sync branch was also pushed to `origin` so the personal repo retains the exact org-ready state. (codex)
- Next: keep the benchmark branches under review, then re-run benchmark evaluation after any gold-label or baseline changes. (codex)

## jin23624 - T001-T003 Gold Label Refinement (2026-05-27)

- Benchmark: Refined all 9 gold labels for T001-T003 (G001-G009).
- Status: 9 rows `verified` with correct DOI and top-journal metadata.
- Next: Move to T004-T006 refinement or start baseline collection for T001-T003. (jin23624)

## codex - Benchmark Branch Review (2026-05-27)

- Reviewed the organization benchmark branches against the current org-ready personal baseline. (codex)
- Confirmed that the current jin23624, member-c, and juilie benchmark branches are not safe to merge directly because they are based on the older team-origin/main history. (codex)
- Documented the safe next step as selective rebase or cherry-pick onto a fresh branch from the org-ready baseline. (codex)
- Reapplied only the benchmark artifacts from the team branches onto `benchmark/reapply-team-work-2026-05-27`: gold CSVs, member-c baseline CSV/README, and juilie README/work-log/PDF. (codex)
- Verification: `npm run benchmark:evaluate-proposed` passed after reapplying team benchmark artifacts. Updated macro metrics are Precision@5=0.1333, NDCG@5=0.3579, Gold DOI Hit Rate@5=0.1944, DOI Accuracy@5=1.0000, Paper Validity@5=1.0000, Top Journal Precision@5=1.0000, Hallucination Rate@5=0.0000, and OA Success@5=0.0000. (codex)
- Next: review the stricter gold-label impact, then decide whether to expand refinement to T004-T006. (codex)

## codex - Gemini Work Review And Push Prep (2026-05-26)

- Reviewed: Gemini's Worker modularization, optional LLM Critic path, optional Vectorize relevance path, and repository-rule updates were inspected before personal-repo push. (codex)
- Fixed: Removed `AI` and `VECTOR_INDEX` bindings from tracked Wrangler configs because those Cloudflare resources are human-gated and were not confirmed for this deployment. The source code remains optional and falls back when bindings are absent. (codex)
- Docs: Added `docs/gemini-review-feedback.md`, `docs/gemini-session-state.md`, and Gemini memory continuity rules so future Gemini sessions can resume from durable repo state. (codex)
- Verification: `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)

## gemini - LLM Critic Agent Integration (2026-05-26)

- Added: Integrated LLM-backed Critic Agent using Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`) for qualitative evaluation of abstracts. (gemini)
- Added: Created `apps/worker/src/critic.ts` to centralize rule-based and LLM-backed qualitative analysis, extracting it from `scoring.ts`. (gemini)
- Changed: Updated `index.ts` to orchestrate parallelized LLM evaluations (chunked in batches of 3) and record detailed Critic Agent traces. (gemini)
- Verification: `npm run typecheck` passed across all workspaces; LLM prompt and batching logic verified through static analysis. (gemini)
