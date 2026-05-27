# Agent Work Queue

Updated: 2026-05-27

This file defines the current team-agent assignments. Agents should pick only their assigned section and avoid unrelated files.

## Global Rules

- Work on a branch, not directly on `main`.
- Keep changes small and reviewable.
- Do not edit deployment configuration unless explicitly assigned.
- Do not delete reference files or generated benchmark evidence.
- Update `CHANGELOG.md` for every meaningful change.
- Preserve attribution format: `Label: description. (agent-id)`.
- Automatic PR enforcement runs through `.github/workflows/agent-rules.yml`.
- Every team benchmark branch must update its assigned personal folder or the PR check fails.
- Read `docs/team-task-briefing.md` for the current team status snapshot and detailed task instructions.

## Current Status Snapshot

| Assignment | Owner | Current status | Next action |
| --- | --- | --- | --- |
| Gold label refinement | `jin23624_cpu` | T001-T003 selected outputs are integrated into personal `main`; verified gold count is now 10 across the three-task sample. | Expand DOI-backed refinement to T004-T006, starting with promoted/near-promoted candidate rows. |
| Proposed Agent manual review | `juilie_bot_hub` | T001-T003 review notes and enhanced report artifact are integrated into personal `main`. | Wait until T004-T006 Proposed Agent rows exist, then review only those new rows. |
| Baseline result collection | `unassigned_member_c` | Rule-based T001-T003 baseline rows are integrated; Single-LLM baseline remains open. | Add Single-LLM T001-T003 rows or start comparable T004-T006 baselines after runner output exists. |
| Metric QA | `shonshinemin_cmd` | Proposed Agent metrics were regenerated after selective team-output reapply. | Review the stricter gold-label impact and rerun after any T004-T006 expansion. |
| Integration | `seunghyeon_choi` | Maintainer and integration lead. | Review PRs and keep `main` protected by Agent rules. |

## Assignment 1 - Gold Label Refinement

Owner:

```text
jin23624_cpu
```

Branch:

```text
benchmark/jin23624-gold-t004-t006
```

Allowed files:

```text
benchmark/gold_relevant_papers.csv
benchmark/gold_relevant_papers.verified.csv
jin23624_cpu/
CHANGELOG.md
docs/progress.md
```

Goal:

T001-T003 refinement has been integrated. Next, refine T004-T006 so each task has at least three DOI-backed, title-verified, top-journal candidate papers where possible.

Procedure:

1. Review rows with `task_id` in `T004`, `T005`, `T006`; do not rewrite the already integrated T001-T003 evidence unless correcting a verified error.
2. Search DOI/title metadata in Crossref, Web of Science, publisher pages, or DOI landing pages.
3. Replace weak seed rows only when a stronger DOI-backed paper is found.
4. Set `doi_label_status=verified` only when title, DOI, year, and journal are confirmed.
5. Keep uncertain rows as `ambiguous` and explain why in `notes`.
6. Add a short summary in `jin23624_cpu/README.md`.

Definition of done:

- T004-T006 have stronger verified DOI evidence than before.
- `npm run benchmark:evaluate-proposed` runs successfully.
- `CHANGELOG.md` records the work with `(jin23624)`.

## Assignment 2 - Proposed Agent Manual Review

Owner:

```text
juilie_bot_hub
```

Branch:

```text
benchmark/juilie-proposed-review
```

Allowed files:

```text
benchmark/manual_review_proposed.csv
juilie_bot_hub/
CHANGELOG.md
docs/progress.md
```

Goal:

Review the 15 current rows in `benchmark/proposed_agent_results.csv` and add human relevance judgments.

Procedure:

1. Create or update `benchmark/manual_review_proposed.csv`.
2. Review only T001-T003 rows first.
3. Keep original result metadata unchanged.
4. Add manual fields:
   - `manual_relevance` from 0 to 5
   - `manual_decision` as `include`, `review`, or `reject`
   - `failure_type`
   - `review_note`
5. Add a short summary in `juilie_bot_hub/README.md`.

Recommended failure types:

```text
none
low_relevance
wrong_subtopic
wrong_field
not_top_journal
metadata_problem
oa_missing
gold_missing
```

Definition of done:

- All 15 T001-T003 Proposed Agent rows have manual review fields.
- Uncertain cases are marked `review`, not forced into `include`.
- `CHANGELOG.md` records the work with `(juilie)`.

## Assignment 3 - Baseline Result Collection

Owner:

```text
unassigned_member_c
```

Branch:

```text
benchmark/member-c-baseline-t001-t003
```

Allowed files:

```text
benchmark/baseline_rule_based_results.csv
benchmark/baseline_single_llm_results.csv
unassigned_member_c/
CHANGELOG.md
docs/progress.md
```

Goal:

Collect comparable baseline rows for T001-T003.

Procedure:

1. Add up to five Rule-based baseline rows per task.
2. Add up to five Single-LLM baseline rows per task.
3. Keep columns compatible with `benchmark/proposed_agent_results.csv` where possible.
4. Add `baseline_type` and `source_note`.
5. Verify DOI when available.
6. Add a short summary in the assigned member directory README.

Definition of done:

- T001-T003 keep their integrated Rule-based baseline rows, and the next baseline batch is either Single-LLM T001-T003 or comparable T004-T006 rows.
- DOI and journal metadata are not fabricated.
- `CHANGELOG.md` records the work with the assigned member id.

## Assignment 4 - Metric QA

Owner:

```text
shonshinemin_cmd
```

Branch:

```text
benchmark/shonshinemin-metric-qa
```

Allowed files:

```text
benchmark/proposed_agent_metrics.csv
benchmark/proposed_agent_metrics_summary.json
shonshinemin_cmd/
CHANGELOG.md
docs/debug-log.md
docs/progress.md
```

Goal:

Re-run and inspect the metric calculation after Assignment 1 or Assignment 2 changes.

Procedure:

1. Run `npm run benchmark:evaluate-proposed`.
2. Confirm metric outputs changed only for expected reasons.
3. Check whether exact gold overlap remains low because of missing gold labels or real retrieval mismatch.
4. Record findings in `shonshinemin_cmd/README.md`.

Definition of done:

- Metric command result is recorded.
- Any suspicious score is explained.
- `CHANGELOG.md` records the work with `(shonshinemin)`.

## Integration Queue

Owner:

```text
seunghyeon_choi
```

Use `integrated/` for integration notes after PR review.

Maintainer integration steps:

1. Review changed files against each assignment's allowed scope.
2. Confirm `CHANGELOG.md` attribution is present.
3. Run `npm run benchmark:evaluate-proposed`.
4. If source code changed, run `npm run typecheck` and `npm run build:web`.
5. Merge PR.
6. Update `docs/progress.md` if the project state changed.

Allowed maintainer files:

```text
source code
docs/
benchmark/scripts/
benchmark/*metrics*
integrated/
seunghyeon_choi/
CHANGELOG.md
```
