# Team Branch Evaluation - 2026-05-27

This note records the current benchmark branch status after the personal repo sync and the organization PR merge.

## Scope

Reviewed branches:

- `team-origin/benchmark/jin23624-gold-t001-t003`
- `team-origin/benchmark/member-c-baseline-t001-t003`
- `team-origin/benchmark/juilie-proposed-review`

## Summary

| Branch | Main Output | Strength | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| `jin23624-gold-t001-t003` | Refined gold labels for T001-T003 | Strongest benchmark improvement; DOI-backed verified rows are clear and mostly top-journal aligned. | One row (`T001/G003`) is verified but outside the local approved S/A1 allowlist. | Prioritize for any future benchmark review. |
| `member-c-baseline-t001-t003` | `benchmark/baseline_rule_based_results.csv` | Reproducible T001-T003 baseline rows are present. | Derived from the Proposed Agent candidate pool, so it is not an independent retrieval baseline. | Merge only with the limitation clearly documented. |
| `juilie-proposed-review` | Review log, PDF report, and push-test notes | Useful for manual review handoff and workspace discipline. | `push-test.md` may be unnecessary noise if the branch is meant to stay lean. | Keep as documentation support, but review before merging into main. |

## Team Status

- `team-origin/main` now contains the personal-repo sync result that was merged through PR #10.
- The benchmark branches are still separate and should be merged only after review of scope and artifact hygiene.
- The personal repo basis remains the working reference for future review notes and follow-up benchmark handling.

## Recommended Order

1. Review `jin23624-gold-t001-t003` first because it improves benchmark quality the most.
2. Review `member-c-baseline-t001-t003` next, but keep the candidate-pool limitation explicit.
3. Review `juilie-proposed-review` last and decide whether `push-test.md` should stay.
4. Re-run benchmark evaluation after any benchmark branch merge that changes gold labels or baseline rows.

## Troubleshooting And Debugging

- Direct push to `team-origin/main` failed with GH013 repository rules because changes must arrive through a pull request and `main` must not contain merge commits.
- The fix was to create a linear squash PR branch, push that branch, and merge PR #10 into `main`.
- The current sync branch is intentionally kept linear so the organization ruleset remains satisfied.

## Personal Repo Note

This evaluation is recorded in the personal repo first so the next sync step can be reproduced without relying on session memory.
