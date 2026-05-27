# Gemini Session State

Updated: 2026-05-26 (codex)

This file exists because Gemini may not retain prior-session memory. Gemini must read and update this file at the start and end of every substantial session.

## Current Source Of Truth

Read these files before editing:

- `AGENTS.md`
- `GEMINI.md`
- `docs/agent-writing-rules.md`
- `docs/gemini-handoff-blueprint.md`
- `docs/gemini-review-feedback.md`
- `docs/gemini-debug-handoff.md`
- `docs/local-worker-troubleshooting.md`
- `docs/progress.md`
- `docs/debug-log.md`
- `CHANGELOG.md`

## Current Repository Policy

- Work from the personal repository first unless the user explicitly asks for organization repo integration.
- Do not push automatically. Ask for the target remote/branch unless the user has already specified it in the current session.
- Do not enable production Cloudflare bindings for resources that have not been created and confirmed by the user.
- Do not commit local attachment/reference files or worktree metadata.

## Latest Reviewed State


## 2026-05-27 Codex Handoff For Gemini

- Active next task: T004-T006 benchmark gold-label refinement only. (codex)
- Required guide: `docs/gemini-t004-t006-benchmark-handoff.md`. (codex)
- Stable system state: Worker runtime, diagnostics, search jobs, and CSV/Markdown/XLSX/PDF artifact downloads are operational. (codex)
- Do not edit Worker, dashboard, Cloudflare, D1, R2, MCP, package, or deployment files for the T004-T006 benchmark task. (codex)
- Work from personal repo first and ask the user before pushing. (codex)

- Gemini's Worker modularization was reviewed by Codex. (codex)
- Optional LLM Critic and Vectorize code paths are acceptable as code-ready features, but runtime activation remains gated by Cloudflare resource setup. (codex)
- Tracked Wrangler configs currently exclude `AI` and `VECTOR_INDEX` bindings to avoid deployment failure before human setup. (codex)
- LLM Critic severity values are sanitized before critic flags are persisted. (codex)
- Local Worker troubleshooting scripts and docs were added after verifying production smoke and local health behavior. (codex)
- Latest local Gemini branch evaluation is recorded in `docs/gemini-latest-work-evaluation.md`; do not continue from divergent `personal-main-check` as-is. (codex)
- Gemini must classify Worker issues before editing source code: source-code defect, local environment, Cloudflare runtime/config, or expected Wrangler noise. (codex)

## Required End-Of-Session Snapshot

- Active task: T001-T003 Gold Label Refinement (jin23624_cpu 역할 수행)
- Changed files:
    - benchmark/gold_relevant_papers.csv
    - benchmark/gold_relevant_papers.verified.csv (auto-generated)
    - jin23624_cpu/README.md
    - CHANGELOG.md
    - docs/progress.md
    - docs/debug-log.md
- Verification run: `npm run benchmark:verify-gold` (Passed: 9 rows verified for T001-T003)
- Verification not run and why: Deployed worker smoke tests (Not relevant to CSV changes), `npm run benchmark:evaluate-proposed` (Will run in next step to see metric improvement)
- Human-gated blockers: None for this task.
- Next recommended action: Run `npm run benchmark:evaluate-proposed` to confirm metric improvement for T001-T003. Then proceed to Baseline collection for T001-T003 or continue Gold refinement for T004-T006.
- Git status summary: Modified benchmark CSVs, README, and doc files. No source code changes.

## Memory Rule

If Gemini is uncertain whether a fact came from the current repository state or from memory, it must re-read the repository file or run a local command before acting.
