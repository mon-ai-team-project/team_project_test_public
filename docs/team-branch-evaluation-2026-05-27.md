# Team Branch Evaluation - 2026-05-27

This note records a personal-repo review of the latest organization benchmark branches so the team can decide what to merge next and what still needs cleanup.

## Scope

Reviewed branches:

- `team-origin/benchmark/member-c-baseline-t001-t003`
- `team-origin/benchmark/jin23624-gold-t001-t003`
- `team-origin/benchmark/juilie-proposed-review`

## Summary

| Branch | Main Output | Strength | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| `member-c-baseline-t001-t003` | `benchmark/baseline_rule_based_results.csv` | Reproducible T001-T003 baseline rows are present. | The baseline is derived from the existing Proposed Agent candidate pool, so it is not an independent retrieval baseline. | Merge after labeling the limitation clearly in the benchmark notes. |
| `jin23624-gold-t001-t003` | Refined gold labels for T001-T003 | Strongest benchmark improvement so far; DOI-backed verified rows are clear and mostly top-journal aligned. | One row (`T001/G003`) is verified but not in the local approved S/A1 allowlist, so it should be replaced later if a better top-journal candidate is found. | Prioritize for integration. |
| `juilie-proposed-review` | Review log, PDF report, and push-test notes | Useful for manual review handoff and workspace discipline. | `push-test.md` may be unnecessary noise if the branch is meant to stay lean. | Keep as documentation support, but review before merging into main. |

## Branch Notes

### `member-c-baseline-t001-t003`

- Added 15 rule-based baseline rows for T001-T003.
- The ranking method is deterministic and reproducible.
- The baseline is still a candidate-pool lexical baseline, not a separate retrieval pipeline.
- `baseline_single_llm_results.csv` remains header-only.

### `jin23624-gold-t001-t003`

- Replaced weak seed gold rows with DOI-backed journal articles.
- T001-T003 coverage is materially better than the seed version.
- The branch is the clearest benchmark-quality improvement in the current org set.

### `juilie-proposed-review`

- The branch keeps the manual review worklog inside the assigned workspace.
- The PDF asset is useful as a record of the proposed-agent review.
- The branch is mostly safe documentation work, but the extra push-test artifact should be checked for necessity before merge.

## Recommended Order

1. Merge `jin23624-gold-t001-t003` first after a final allowlist check for the remaining disputed row.
2. Merge `member-c-baseline-t001-t003` next, with explicit note that it is a candidate-pool baseline.
3. Merge `juilie-proposed-review` last after confirming the PDF and test-note files are intentional.

## Troubleshooting And Debugging

- File edits were applied with a Node script because `apply_patch` hit a bwrap file-capabilities error in this environment. (codex)
- Shell-safe inspection used `git show` and `git diff --stat` so the review stayed read-only before the edit pass. (codex)
- Final validation after the edit pass used `git status --short`, `git diff --stat`, and `git diff --check`. (codex)

## Personal Repo Note

This evaluation is recorded in the personal repo first so that the integration decision is traceable before mirroring the final state into the organization repository.
