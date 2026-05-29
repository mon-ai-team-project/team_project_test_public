# Agent Work Queue

Updated: 2026-05-28

This file defines the current team-agent assignments. Agents should pick only their assigned section and avoid unrelated files.

## Global Rules

- Personal repo work uses `origin/main` as the default branch and source of truth.
- Organization repo work uses assignment branches and PRs; do not push directly to `team-origin/main`.
- Keep changes small and reviewable.
- Do not edit deployment configuration unless explicitly assigned.
- Do not delete reference files or generated benchmark evidence.
- Update `CHANGELOG.md` for every meaningful change.
- Preserve attribution format: `Label: description. (agent-id)`.
- Automatic PR enforcement runs through `.github/workflows/agent-rules.yml`.
- Every team benchmark branch must update its assigned personal folder or the PR check fails.
- Read `docs/team-task-briefing.md` for the current team status snapshot and detailed task instructions.
- Do not reuse stale rows from `team-origin/benchmark/member-c-baseline-t001-t003`; see `docs/member-c-baseline-review-2026-05-28.md`.

## Automation Policy

All benchmark review work must be automated first. Do not create new human-only manual review workflows. If a result needs review, encode the rule as a script, generated CSV/JSON output, and reproducible npm command.

Current automated review command:

```bash
npm run benchmark:auto-review-baselines
```

Current generated outputs:

```text
benchmark/auto_review_baseline_results.csv
benchmark/auto_review_baseline_summary.json
```

## Current Status Snapshot

| Assignment | Owner | Current status | Next action |
| --- | --- | --- | --- |
| Gold exception automation | `jin23624_cpu` | 60 gold rows audited; 0 active warnings; 2 accepted warnings remain. | Improve or reaffirm accepted exceptions through reproducible evidence; avoid ad hoc manual-only decisions. |
| Baseline auto review | `juilie_bot_hub` | Rule-based and Single-LLM baseline rows now have automated review outputs. | QA `benchmark:auto-review-baselines` output and propose rule improvements only through code/data changes. |
| Baseline input QA automation | `unassigned_member_c` | Rule-based and Single-LLM baselines each have 15 rows. | Verify schema/topic guardrails and record reproducible findings. |
| Baseline metric QA automation | `shonshinemin_cmd` | Baseline comparison script and auto-review outputs exist. | Verify comparison metrics and auto-review consistency. |
| Integration | `seunghyeon_choi` | Maintainer and integration lead. | Maintain automation scripts and keep org sync PR-gated. |

## Assignment 1 - Gold Exception Automation

Owner:

```text
jin23624_cpu
```

Branch:

```text
benchmark/jin23624-gold-exception-automation
```

Allowed files:

```text
benchmark/gold_relevant_papers.csv
benchmark/gold_relevant_papers.verified.csv
benchmark/gold_audit_allowlist.json
benchmark/scripts/audit-gold-labels.mjs
jin23624_cpu/
CHANGELOG.md
docs/progress.md
```

Goal:

Reduce or reaffirm accepted gold-audit exceptions using reproducible rules and evidence, not one-off human judgment.

Procedure:

1. Review `benchmark/gold_audit_report.md` and `benchmark/gold_audit_allowlist.json`.
2. If replacing T001/G003, use only DOI/title/year/journal verified rows.
3. If keeping T001/G003, encode the reason in `benchmark/gold_audit_allowlist.json`.
4. If keeping the duplicate DOI exception for `10.1016/j.chb.2022.107179`, keep the exception explicit and reproducible.
5. Update `jin23624_cpu/README.md` with the exact commands and files checked.

Definition of done:

- Accepted warnings are reduced or explicitly reaffirmed in data/config.
- `npm run benchmark:audit-gold` and `npm run benchmark:evaluate-proposed` pass.
- `CHANGELOG.md` records the work with `(jin23624)`.

## Assignment 2 - Baseline Auto Review

Owner:

```text
juilie_bot_hub
```

Branch:

```text
benchmark/juilie-baseline-auto-review-t001-t003
```

Allowed files:

```text
benchmark/auto_review_baseline_results.csv
benchmark/auto_review_baseline_summary.json
benchmark/scripts/auto-review-baselines.mjs
juilie_bot_hub/
CHANGELOG.md
docs/progress.md
```

Goal:

Use automated rules to review Rule-based and Single-LLM baseline rows. Do not create `manual_review_single_llm.csv` unless explicitly requested later.

Procedure:

1. Run `npm run benchmark:auto-review-baselines`.
2. Inspect generated counts for include, review_by_rule, reject, failure_type, matched_gold_id, and auto_relevance.
3. Improve `benchmark/scripts/auto-review-baselines.mjs` only when a rule is clearly wrong and reproducible.
4. Keep original baseline metadata unchanged unless a mechanical schema defect is found.
5. Update `juilie_bot_hub/README.md` with command output summary and remaining rule limitations.

Definition of done:

- `benchmark/auto_review_baseline_results.csv` covers all 30 baseline rows.
- `benchmark/auto_review_baseline_summary.json` explains method-level counts.
- `npm run benchmark:audit-gold`, `npm run benchmark:evaluate-proposed`, and `npm run benchmark:auto-review-baselines` pass.
- `CHANGELOG.md` records the work with `(juilie)`.

## Assignment 3 - Baseline Input QA Automation

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
benchmark/scripts/auto-review-baselines.mjs
unassigned_member_c/
CHANGELOG.md
docs/debug-log.md
docs/progress.md
```

Goal:

QA the baseline CSV inputs through reproducible schema and stale-topic checks.

Procedure:

1. Confirm `benchmark/baseline_rule_based_results.csv` has 15 rows: five each for T001, T002, and T003.
2. Confirm `benchmark/baseline_single_llm_results.csv` has 15 rows: five each for T001, T002, and T003.
3. Confirm each row has the current schema fields.
4. Confirm stale branch topics do not appear:
   - dynamic capabilities for T001
   - governance or agency theory for T002
   - generic service quality for T003
5. If a repeatable guardrail is missing, add it to `benchmark/scripts/auto-review-baselines.mjs`.
6. Record findings in `unassigned_member_c/README.md`.

Definition of done:

- Baseline input QA is recorded with commands and output paths.
- `npm run benchmark:audit-gold`, `npm run benchmark:evaluate-proposed`, and `npm run benchmark:auto-review-baselines` pass.
- `CHANGELOG.md` records the work with `(member-c)` or the assigned member id.

## Assignment 4 - Baseline Metric QA Automation

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
benchmark/auto_review_baseline_results.csv
benchmark/auto_review_baseline_summary.json
shonshinemin_cmd/
CHANGELOG.md
docs/debug-log.md
docs/progress.md
```

Goal:

QA Rule-based vs Single-LLM vs Proposed Agent metric outputs and compare them with automated baseline review outputs.

Procedure:

1. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:compare-baselines
npm run benchmark:auto-review-baselines
```

2. Check metric consistency against source CSV rows and generated auto-review counts.
3. Record findings in `shonshinemin_cmd/README.md`.

Definition of done:

- Baseline comparison metric outputs and automated review outputs are regenerated and explained.
- `CHANGELOG.md` records the work with `(shonshinemin)`.

## Integration Queue

Owner:

```text
seunghyeon_choi
```

Maintainer integration steps:

1. Maintain baseline comparison metrics after input changes.
2. Maintain automated review scripts and generated outputs.
3. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:compare-baselines
npm run benchmark:auto-review-baselines
git diff --check
```

4. Review team branches against allowed file scope.
5. Keep organization synchronization PR-gated.
