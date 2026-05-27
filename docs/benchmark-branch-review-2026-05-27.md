# Benchmark Branch Review - 2026-05-27

This note records the current state of the organization benchmark branches relative to the org-ready personal repo baseline.

## Finding

The benchmark branches are not safe to merge directly into the current personal-repo sync baseline. Their diffs are computed against the older team-origin/main history, so a direct merge would reintroduce deletions and conflict with the newer org-ready snapshot.

## Branch Status

| Branch | Latest Commit | Current State | Action |
| --- | --- | --- | --- |
| team-origin/benchmark/jin23624-gold-t001-t003 | 500969b | Gold-label refinement is useful, but the branch base is older than the org-ready snapshot. | Rebase or cherry-pick the gold-label changes onto the current personal baseline before merging. |
| team-origin/benchmark/member-c-baseline-t001-t003 | 788954e | Baseline rows exist, but the branch is also based on the older history. | Rebase or cherry-pick only the baseline CSV and README changes onto the current baseline. |
| team-origin/benchmark/juilie-proposed-review | 91057c2 | Review log and PDF assets are present, but the branch is older than the org-ready snapshot. | Rebase or cherry-pick the documentation and PDF assets only if still needed. |

## Recommended Next Step

1. Keep the current org-ready personal baseline as the merge target.
2. Reapply benchmark changes selectively onto a fresh branch created from that baseline.
3. Do not merge the current benchmark branches as-is.
4. Re-run benchmark evaluation after the gold and baseline files are reattached to the current baseline.

## Troubleshooting And Debugging

- Direct comparison against team-origin/main shows that each benchmark branch still carries the older pre-sync history.
- The diff statistics include large deletions in docs and source modules because the benchmark branches do not start from the current org-ready snapshot.
- The safe path is selective rebase or cherry-pick, not direct merge.

## Personal Repo Note

This review is recorded in the personal repo first so the next benchmark integration pass starts from the correct baseline.
