# Team Task Briefing

Updated: 2026-05-28

This document is the current personal-repo briefing for team agents. Read it after `AGENTS.md` and before editing files.

## Current Main Status

Personal `origin/main` is the active development source of truth and default working branch. Do not treat a feature branch as the personal-repo default. Organization `team-origin/main` is behind and should be updated later through reviewed PR flow only.

Current benchmark state:

| Area | Status |
| --- | --- |
| Gold audit | Complete: 60 rows, 20/20 tasks, 0 errors, 0 active warnings, 2 accepted warnings. |
| Gold audit allowlist | Complete: `benchmark/gold_audit_allowlist.json` tracks T001/G003 and duplicate DOI cross-task exception. |
| Proposed Agent sample | Complete for T001-T003, 15 rows. |
| Rule-based baseline | Complete for T001-T003, 15 rows. |
| Single-LLM baseline | Complete for T001-T003, 15 fresh repository-grounded rows. |
| Baseline auto review | Complete initial automation: 30 rows reviewed by `npm run benchmark:auto-review-baselines`. |
| Baseline comparison | Complete initial comparison across Rule-based, Single-LLM, and Proposed Agent. |
| member-c stale branch | Reviewed and rejected for direct reuse because it used older task topics/schema. |
| Next maintainer task | Maintain automated review and comparison metrics after benchmark input changes. |

Current metric snapshot for Proposed Agent T001-T003:

```text
Precision@5: 0.1333
NDCG@5: 0.3579
Gold DOI Hit Rate@5: 0.1944
DOI Accuracy@5: 1.0000
Paper Validity@5: 1.0000
Top Journal Precision@5: 1.0000
Hallucination Rate@5: 0.0000
OA Success@5: 0.0000
```

Current baseline auto-review snapshot:

```text
Rows reviewed: 30
Rule-based: include 2, review_by_rule 9, reject 4
Single-LLM: include 9, review_by_rule 5, reject 1
Output CSV: benchmark/auto_review_baseline_results.csv
Output JSON: benchmark/auto_review_baseline_summary.json
```

## Automation Policy

All review and QA work must be automated first. Do not add new human-only review queues. If a team member finds an issue, they should encode it as a reproducible script rule, generated artifact, or documented command output.

Primary commands:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:compare-baselines
npm run benchmark:auto-review-baselines
```

## Mandatory Workflow For Every Team Agent

1. For personal-repo work, start from `origin/main`; for organization work, start from the current reviewed branch assigned by the maintainer.
2. Create the assigned branch only.
3. Edit only allowed files.
4. Update `CHANGELOG.md` with the correct attribution.
5. Update the assigned personal folder with a README or work-log entry.
6. Run the required verification command.
7. Push to `team-origin` and open a PR into `main` only after maintainer approval.

Do not work directly on `main`. Do not edit Cloudflare, Worker, dashboard, MCP, or deployment files unless explicitly assigned by the maintainer.

## Assignment 1: jin23624_cpu

Priority: medium.

Branch:

```text
benchmark/jin23624-gold-exception-automation
```

Goal: reduce or reaffirm the two accepted gold-audit exceptions through reproducible evidence and config, not one-off manual judgment.

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

Required steps:

1. Review `benchmark/gold_audit_report.md` and `benchmark/gold_audit_allowlist.json`.
2. For T001/G003, replace only if a stronger DOI-backed approved S/A1 journal row is verified.
3. If no better row exists, keep the exception and encode the rationale in `benchmark/gold_audit_allowlist.json`.
4. Review the duplicate DOI exception for `10.1016/j.chb.2022.107179`; keep it only if the same paper remains relevant to both T001 and T002.
5. Update `jin23624_cpu/README.md` with commands and evidence checked.
6. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
```

Definition of done:

- Accepted warning count is reduced or the exception remains explicitly configured with evidence.
- No fabricated DOI, journal, author, or year metadata.
- `CHANGELOG.md` records the work with `(jin23624)`.

## Assignment 2: juilie_bot_hub

Priority: high.

Branch:

```text
benchmark/juilie-baseline-auto-review-t001-t003
```

Goal: QA and improve automated baseline review rules. Do not create `benchmark/manual_review_single_llm.csv` unless the maintainer explicitly reopens human review.

Allowed files:

```text
benchmark/auto_review_baseline_results.csv
benchmark/auto_review_baseline_summary.json
benchmark/scripts/auto-review-baselines.mjs
juilie_bot_hub/
CHANGELOG.md
docs/progress.md
```

Required steps:

1. Run `npm run benchmark:auto-review-baselines`.
2. Inspect include, review_by_rule, reject, failure_type, matched_gold_id, and auto_relevance counts.
3. Improve `benchmark/scripts/auto-review-baselines.mjs` only when a rule error is reproducible.
4. Do not rewrite source baseline rows unless a mechanical schema defect is found.
5. Update `juilie_bot_hub/README.md` with command output summary and remaining rule limitations.
6. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:auto-review-baselines
```

Definition of done:

- All 30 baseline rows are covered by automated review output.
- Rule limitations are documented as reproducible criteria.
- `CHANGELOG.md` records the work with `(juilie)`.

## Assignment 3: unassigned_member_c

Priority: medium.

Branch:

```text
benchmark/member-c-baseline-comparison-qa
```

Goal: QA the baseline comparison inputs through reproducible schema and stale-topic checks.

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

Required steps:

1. Confirm both baseline CSV files have 15 rows: five each for T001, T002, and T003.
2. Confirm every row has `task_id`, `keyword`, `baseline_type`, `result_rank`, `title`, `journal`, `journal_rank`, `doi`, `source_note`, and `review_note`.
3. Confirm no stale dynamic-capabilities/governance/service-quality rows from the rejected member-c branch remain.
4. If a repeatable guardrail is missing, add it to `benchmark/scripts/auto-review-baselines.mjs`.
5. Record findings in `unassigned_member_c/README.md`.
6. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:auto-review-baselines
```

Definition of done:

- Baseline input QA is recorded with command output.
- Any malformed row is fixed only if it is within the allowed files and clearly mechanical.
- `CHANGELOG.md` records the work with `(member-c)` or the assigned member id.

## Assignment 4: shonshinemin_cmd

Priority: high.

Branch:

```text
benchmark/shonshinemin-baseline-metric-qa
```

Goal: QA Rule-based vs Single-LLM vs Proposed Agent comparison outputs and compare them with automated baseline review outputs.

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

Required steps:

1. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:compare-baselines
npm run benchmark:auto-review-baselines
```

2. Check whether method-level metric differences match the source CSV rows and auto-review counts.
3. Record suspicious metric behavior, especially duplicate DOI effects and accepted gold-audit exceptions.
4. Update `shonshinemin_cmd/README.md` with a reproducibility note.

Definition of done:

- Baseline comparison metric outputs and auto-review outputs are regenerated and explained.
- Any suspicious score is documented through reproducible evidence.
- `CHANGELOG.md` records the work with `(shonshinemin)`.

## Maintainer: seunghyeon_choi

Current maintainer tasks:

1. Maintain `benchmark/scripts/compare-baselines.mjs` after benchmark input changes.
2. Maintain `benchmark/scripts/auto-review-baselines.mjs` and generated outputs.
3. Keep personal `origin/main` as the active development source until these benchmark files stabilize.
4. Sync to organization repo only through reviewed PR flow after local validation.

Required maintainer verification:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:compare-baselines
npm run benchmark:auto-review-baselines
git diff --check
```
