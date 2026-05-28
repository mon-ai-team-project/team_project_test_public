# Gemini Session State

Updated: 2026-05-28 (gemini baseline comparison prep)

## Current Source Of Truth
- `AGENTS.md`
- `GEMINI.md`
- `docs/agent-writing-rules.md`
- `docs/progress.md`
- `docs/agent-work-queue.md`
- `docs/team-task-briefing.md`
- `docs/debug-log.md`
- `CHANGELOG.md`
- `docs/member-c-baseline-review-2026-05-28.md`

## Current Personal Repo State

- Personal `origin/main` is the active working baseline.
- Working branch: `benchmark/gemini-baseline-comparison-prep`.
- Baseline input data (T001-T003) for Rule-based, Single-LLM, and Proposed Agent verified for consistency.

## Latest Reviewed State

- Gold audit is complete (60 rows).
- Fresh Single-LLM baseline rows (15 rows) exist for T001-T003.
- Input CSVs reviewed; baseline CSVs found to be missing some metadata fields relative to proposed-agent schema.

## What Gemini Must Do Next

Next maintainer task: Implement the baseline comparison script.

Required focus:

1. Create `benchmark/scripts/compare-baselines.mjs`.
2. Add `npm run benchmark:compare-baselines` to `package.json`.
3. Ensure the script handles schema differences between baseline CSVs and proposed-agent CSVs.
4. Generate `benchmark/baseline_comparison_metrics.csv` and `benchmark/baseline_comparison_summary.json`.
5. Update `CHANGELOG.md`, `docs/progress.md`, `docs/debug-log.md`, and this file before ending the session.

## Gemini Constraints

- Do not modify Worker, Cloudflare, deployment, or dashboard files.
- Keep all edits within assigned benchmark/docs files.
- Ensure (gemini) attribution is used.

## Required Verification Baseline

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
git diff --check
```

If the maintainer adds a comparison script, then also run:

```bash
npm run benchmark:compare-baselines
```

## Handoff Memory Rule

Repository files are the memory layer.
Gemini must read this file before editing and update it again before ending.
Do not rely on chat history for task status.
