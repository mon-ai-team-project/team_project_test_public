# Agent Work Queue

Updated: 2026-05-28

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
- Do not reuse stale rows from `team-origin/benchmark/member-c-baseline-t001-t003`; see `docs/member-c-baseline-review-2026-05-28.md`.

## Current Status Snapshot

| Assignment | Owner | Current status | Next action |
| --- | --- | --- | --- |
| Gold exception review | `jin23624_cpu` | 60 gold rows audited; 0 active warnings; 2 accepted warnings remain. | Review T001/G003 and duplicate DOI exception; reduce or reaffirm exceptions with evidence. |
| Single-LLM manual review | `juilie_bot_hub` | Proposed Agent manual review is complete; Single-LLM baseline now has 15 fresh rows. | Create `benchmark/manual_review_single_llm.csv` and manually review all 15 rows. |
| Baseline input QA | `unassigned_member_c` | Rule-based and Single-LLM baselines each have 15 rows. | QA both baseline CSV inputs and confirm no stale branch rows remain. |
| Baseline metric QA | `shonshinemin_cmd` | Proposed Agent metrics are current; baseline comparison script is not implemented yet. | Wait for maintainer comparison script, then verify comparison metrics. |
| Integration | `seunghyeon_choi` | Maintainer and integration lead. | Implement baseline comparison metrics and keep org sync PR-gated. |

## Assignment 1 - Gold Exception Review

Owner:

```text
jin23624_cpu
```

Branch:

```text
benchmark/jin23624-gold-exception-review
```

Allowed files:

```text
benchmark/gold_relevant_papers.csv
benchmark/gold_relevant_papers.verified.csv
benchmark/gold_audit_allowlist.json
jin23624_cpu/
CHANGELOG.md
docs/progress.md
```

Goal:

Review accepted gold-audit exceptions and try to reduce them without weakening benchmark relevance.

Procedure:

1. Review `benchmark/gold_audit_report.md` and `benchmark/gold_audit_allowlist.json`.
2. For T001/G003, search for a stronger approved S/A1 journal replacement that directly covers AI recruitment/interview applicant reaction or employer attractiveness.
3. Review the duplicate DOI exception for `10.1016/j.chb.2022.107179`.
4. Replace rows only when DOI/title/year/journal are verified and relevance is not weaker.
5. If no replacement is better, keep the exception and document why.
6. Update `jin23624_cpu/README.md`.

Definition of done:

- Accepted warnings are reduced or explicitly reaffirmed with evidence.
- `npm run benchmark:audit-gold` and `npm run benchmark:evaluate-proposed` pass.
- `CHANGELOG.md` records the work with `(jin23624)`.

## Assignment 2 - Single-LLM Manual Review

Owner:

```text
juilie_bot_hub
```

Branch:

```text
benchmark/juilie-single-llm-review-t001-t003
```

Allowed files:

```text
benchmark/manual_review_single_llm.csv
juilie_bot_hub/
CHANGELOG.md
docs/progress.md
```

Goal:

Manually review the 15 fresh Single-LLM baseline rows in `benchmark/baseline_single_llm_results.csv`.

Procedure:

1. Create `benchmark/manual_review_single_llm.csv`.
2. Review all T001-T003 Single-LLM rows.
3. Keep original baseline metadata unchanged.
4. Add manual fields:
   - `manual_relevance` from 0 to 5
   - `manual_decision` as `include`, `review`, or `reject`
   - `failure_type`
   - `review_note`
5. Update `juilie_bot_hub/README.md`.

Recommended failure types:

```text
none
low_relevance
wrong_subtopic
wrong_field
not_top_journal
metadata_problem
gold_exception
duplicate_cross_task
```

Definition of done:

- All 15 Single-LLM rows have manual review fields.
- `npm run benchmark:audit-gold` and `npm run benchmark:evaluate-proposed` pass.
- `CHANGELOG.md` records the work with `(juilie)`.

## Assignment 3 - Baseline Input QA

Owner:

```text
unassigned_member_c
```

Branch:

```text
benchmark/member-c-baseline-comparison-qa
```

Allowed files:

```text
benchmark/baseline_rule_based_results.csv
benchmark/baseline_single_llm_results.csv
unassigned_member_c/
CHANGELOG.md
docs/debug-log.md
docs/progress.md
```

Goal:

QA the baseline CSV inputs before metric comparison is finalized.

Procedure:

1. Confirm `benchmark/baseline_rule_based_results.csv` has 15 rows: five each for T001, T002, and T003.
2. Confirm `benchmark/baseline_single_llm_results.csv` has 15 rows: five each for T001, T002, and T003.
3. Confirm each row has the current schema fields.
4. Confirm stale branch topics do not appear:
   - dynamic capabilities for T001
   - governance or agency theory for T002
   - generic service quality for T003
5. Record findings in `unassigned_member_c/README.md`.

Definition of done:

- Baseline input QA is recorded.
- `npm run benchmark:audit-gold` and `npm run benchmark:evaluate-proposed` pass.
- `CHANGELOG.md` records the work with `(member-c)` or the assigned member id.

## Assignment 4 - Baseline Metric QA

Owner:

```text
shonshinemin_cmd
```

Branch:

```text
benchmark/shonshinemin-baseline-metric-qa
```

Allowed files:

```text
benchmark/baseline_comparison_metrics.csv
benchmark/baseline_comparison_summary.json
shonshinemin_cmd/
CHANGELOG.md
docs/debug-log.md
docs/progress.md
```

Goal:

QA Rule-based vs Single-LLM vs Proposed Agent metric outputs after the maintainer adds baseline comparison script.

Procedure:

1. Wait for `npm run benchmark:compare-baselines` to exist.
2. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:compare-baselines
```

3. Check metric consistency against source CSV rows.
4. Record findings in `shonshinemin_cmd/README.md`.

Definition of done:

- Baseline comparison metric outputs are regenerated and explained.
- `CHANGELOG.md` records the work with `(shonshinemin)`.

## Integration Queue

Owner:

```text
seunghyeon_choi
```

Maintainer integration steps:

1. Implement baseline comparison metrics:
   - `benchmark/scripts/compare-baselines.mjs`
   - `benchmark/baseline_comparison_metrics.csv`
   - `benchmark/baseline_comparison_summary.json`
   - `npm run benchmark:compare-baselines`
2. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:compare-baselines
git diff --check
```

3. Review team branches against allowed file scope.
4. Keep organization synchronization PR-gated.
