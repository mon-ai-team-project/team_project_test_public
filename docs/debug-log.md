# Debug Log

## 2026-05-27 - Benchmark Work Queue Update

- Context: After the selective team-output reapply reached personal `main`, the handoff queue still described the older T001-T003 startup state. (codex)
- Fix: Updated the work queue, benchmark summary date, sample metric values, and next-step wording to point agents toward T004-T006 expansion. (codex)
- Verification: `git diff --check` and `npm run benchmark:evaluate-proposed` passed before committing this branch. (codex)

## 2026-05-27 - Personal Repo Sync And Organization PR Merge

- Context: The user requested that the current personal-repo basis be pushed again and reflected back into organization main. (codex)
- Finding: A direct `git push team-origin main` failed with GH013 repository rules because changes must arrive through a pull request and `main` must not contain merge commits. (codex)
- Fix: Created a linear squash PR branch, pushed it to `team-origin`, opened PR #10, and merged it into organization `main`. (codex)
- Follow-up: Pushed the same sync branch to `origin` so the personal repo keeps the org-ready baseline, then prepared this branch for any local follow-up review. (codex)
- Verification: Confirmed that `team-origin/main` advanced to commit `8c3a228` and that the matching sync branch exists on both remotes. (codex)

## 2026-05-27 - Benchmark Branch Review

- Context: The user asked to continue the next recommended task after the org-ready sync was completed. (codex)
- Finding: Direct diff inspection showed that the benchmark branches are still based on the older team-origin/main history, so merging them now would reintroduce deletions against the newer personal baseline. (codex)
- Fix: Added docs/benchmark-branch-review-2026-05-27.md to record the safe path: rebase or cherry-pick benchmark changes onto a fresh branch from the org-ready baseline. (codex)
- Action: Created `benchmark/reapply-team-work-2026-05-27` from current `main` and reapplied only selected benchmark artifacts from jin23624, member-c, and juilie. (codex)
- Exclusion: Did not reapply `juilie_bot_hub/push-test.md` because it is not evidence or benchmark data. (codex)
- Verification: Branch diffs and latest commits were checked for jin23624, member-c, and juilie before reapplying selected files. `npm run benchmark:evaluate-proposed` passed after reapply. (codex)
- Result: The stricter DOI-backed gold set produced macro Precision@5=0.1333, NDCG@5=0.3579, Gold DOI Hit Rate@5=0.1944, and retained DOI Accuracy/Paper Validity/Top Journal Precision at 1.0000. (codex)

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
- Finding: The correct local command `npm run dev --workspace apps/worker -- --port 8787` starts the Worker; local `/api/health` returns `ok: true`, while diagnostics report provider secrets missing unless local .dev.vars exists. (codex)
- Change: Added explicit local Worker dev/smoke scripts and `docs/local-worker-troubleshooting.md`. (codex)
- Fix: Updated Worker smoke script so `REQUIRE_READY=false` allows local diagnostics with missing provider secrets while still checking D1 binding and schema columns. (codex)
- Verification: production `npm run smoke:worker`, production minimal search smoke, local `npm run smoke:worker:local`, `npm run typecheck`, `npm run build:web`, `npm run build`, and `git diff --check` passed in this session. (codex)
