# Gemini Latest Work Evaluation Feedback

Updated: 2026-05-27 (codex)

This document evaluates the latest Gemini local work observed on the root worktree branch `personal-main-check` after it diverged from `origin/main`.

## Reviewed Local State

Local branch state at review time:

```text
personal-main-check...origin/main [ahead 10, behind 2]
```

Relevant local commits reviewed:

- `4dad7ef feat(benchmark): refine gold labels for T001-T003 (jin23624)`
- `a035e44 feat(dashboard): connect real data and fix source code conflicts`
- `b088556 fix(worker): ensure job state consistency in processSearchJob pipeline`
- `2acdfae fix(worker): fix wrangler config and search job status types`

## Overall Decision

Do not push or merge the current `personal-main-check` branch as-is. (codex)

The branch contains potentially useful benchmark output, but it also contains blocking repository hygiene and correctness issues:

- documentation history deletion
- unresolved conflict markers
- local branch divergence from `origin/main`
- uncommitted README corruption
- dashboard changes that were not backed by confirmed API contracts
- Worker changes made on top of a branch that already had conflict-resolution damage

## Blocking Findings

### 1. Historical documentation was deleted

The commit `4dad7ef` removed most of the existing handoff/debug history:

- `docs/debug-log.md`: about 2405 deleted lines
- `docs/progress.md`: about 873 deleted lines

This violates the project rule that historical records and agent attributions must not be deleted, summarized, or overwritten. The gold-label changes from this commit cannot be accepted together with those documentation deletions. (codex)

### 2. Conflict markers remain in Gemini instructions

The local `GEMINI.md` contains unresolved merge conflict markers around strict documentation and memory-continuity rules:

```text
[conflict marker: HEAD]
[conflict separator]
[conflict marker: origin/main]
```

This is a hard blocker because Gemini is required to read `GEMINI.md` before editing. If the operating guide itself is conflicted, future Gemini sessions start from corrupted instructions. (codex)

### 3. Local README corruption exists

The root worktree has an uncommitted README change with inserted blank lines and a standalone `22` near the Architecture section. This appears accidental and should be discarded. (codex)

### 4. Dashboard changes need API-contract review

The dashboard commit `a035e44` attempts to connect Research workflow panels to live traces and parse Markdown reports. The direction is valid, but it needs a clean implementation branch because:

- it was made on top of a conflicted local branch
- report-section parsing uses assumptions that may not match the Worker Markdown report section names
- implementation status text should not claim live behavior unless the exact endpoint and fallback state are verified in the deployed dashboard

This work should be redone as a small, separate PR/commit from clean `origin/main`. (codex)

### 5. Worker pipeline changes need isolated review

The commits `b088556` and `2acdfae` modify job progress updates and Worker status transitions. Some corrections are plausible, but they are mixed with conflict cleanup and invalid-status fixes. Reintroduce only the intended job-state changes from clean `origin/main`, then verify with:

```bash
npm run typecheck
npm run build
npm run smoke:worker
RUN_SEARCH=true SMOKE_MAX_RESULTS=1 npm run smoke:worker
```

Do not re-add `AI` or `VECTOR_INDEX` bindings unless a human confirms the Cloudflare resources. (codex)

## Potentially Useful Work To Salvage

### Benchmark output

The full benchmark files may be useful as raw evidence, but they should be imported carefully:

- `benchmark/proposed_agent_jobs_full.csv`
- `benchmark/proposed_agent_results_full.csv`
- `benchmark/proposed_agent_metrics_full.csv`
- `benchmark/proposed_agent_metrics_summary_full.json`

Observed summary from the local file:

```json
{
  "tasks": 16,
  "results": 80,
  "verifiedGold": 7,
  "goldMatches": 1,
  "precision_at_k": 0.0125,
  "doi_accuracy_at_k": 1,
  "paper_validity_rate_at_k": 0.9875,
  "top_journal_precision_at_k": 1,
  "hallucination_rate_at_k": 0.0125
}
```

This is not a complete 20-task benchmark despite the commit title saying 20-task expansion. It should be documented as a 16-task successful-result sample unless T004, T005, T019, and T020 are resolved or explicitly excluded. (codex)

### T001-T003 gold refinement

The T001-T003 gold-label refinement may be useful, but only if re-applied without deleting `docs/debug-log.md` or `docs/progress.md`. Gemini should place its review notes in `jin23624_cpu/README.md` and preserve all existing history. (codex)

## Required Gemini Correction Workflow

Gemini must not continue from the current divergent `personal-main-check` branch. Use this workflow instead:

1. Start from clean `origin/main`.
2. Read `GEMINI.md`, `docs/gemini-debug-handoff.md`, `docs/local-worker-troubleshooting.md`, and `docs/gemini-session-state.md`.
3. Pick one task only: benchmark salvage, dashboard trace UI, or Worker job-state transition cleanup.
4. Do not mix benchmark data, dashboard UI, Worker source, and documentation cleanup in one commit.
5. Preserve historical documentation exactly; prepend new sections only.
6. Run task-specific verification.
7. Ask before pushing.

## Recommended Next Task

Recommended first salvage task:

- Re-apply only the benchmark full-result CSV/JSON outputs from a clean branch.
- Clearly label them as `16-task successful-result sample`, not final 20-task benchmark.
- Update `CHANGELOG.md`, `docs/progress.md`, and `docs/debug-log.md` without deleting existing history.
- Run `npm run benchmark:evaluate-proposed` only if the target files are compatible with the existing script inputs. (codex)

## Current Safe Baseline

The safe repository baseline remains `origin/main` at the latest Codex-pushed state. Do not treat the root local `personal-main-check` branch as safe until it is reset or rebuilt from `origin/main`. (codex)
