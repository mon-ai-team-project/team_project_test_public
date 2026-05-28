# Team Task Briefing

Updated: 2026-05-28

This document is the current personal-repo briefing for team agents. Read it after `AGENTS.md` and before editing files.

## Current Main Status

Personal `origin/main` is the active development source of truth. Organization `team-origin/main` is behind and should be updated later through reviewed PR flow only.

Current benchmark state:

| Area | Status |
| --- | --- |
| Gold audit | Complete: 60 rows, 20/20 tasks, 0 errors, 0 active warnings, 2 accepted warnings. |
| Gold audit allowlist | Complete: `benchmark/gold_audit_allowlist.json` tracks T001/G003 and duplicate DOI cross-task exception. |
| Proposed Agent sample | Complete for T001-T003, 15 rows. |
| Proposed Agent manual review | Complete for T001-T003, but refresh is now useful against new baseline comparison needs. |
| Rule-based baseline | Complete for T001-T003, 15 rows. |
| Single-LLM baseline | Complete for T001-T003, 15 fresh repository-grounded rows. |
| member-c stale branch | Reviewed and rejected for direct reuse because it used older task topics/schema. |
| Next maintainer task | Add baseline comparison metrics for Rule-based vs Single-LLM vs Proposed Agent. |

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

## Mandatory Workflow For Every Team Agent

1. Start from the current reviewed main branch assigned by the maintainer.
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
benchmark/jin23624-gold-exception-review
```

Goal: review the two accepted gold-audit exceptions and try to reduce them without weakening benchmark relevance.

Allowed files:

```text
benchmark/gold_relevant_papers.csv
benchmark/gold_relevant_papers.verified.csv
benchmark/gold_audit_allowlist.json
jin23624_cpu/
CHANGELOG.md
docs/progress.md
```

Required steps:

1. Review `benchmark/gold_audit_report.md` and `benchmark/gold_audit_allowlist.json`.
2. For T001/G003, search for a stronger DOI-backed paper in an approved S/A1 journal that directly covers AI recruitment/interview applicant reaction or employer attractiveness.
3. Do not replace T001/G003 unless the replacement is at least as relevant and has verified DOI/title/year/journal metadata.
4. Review the duplicate DOI exception for `10.1016/j.chb.2022.107179`; keep it if the same paper remains genuinely relevant to both T001 and T002.
5. If no stronger replacement exists, leave the allowlist in place and record the search attempts.
6. Update `jin23624_cpu/README.md` with evidence checked and decision.
7. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
```

Definition of done:

- Either the accepted warning count is reduced, or the exception is explicitly reaffirmed with evidence.
- No fabricated DOI, journal, author, or year metadata.
- `CHANGELOG.md` records the work with `(jin23624)`.

## Assignment 2: juilie_bot_hub

Priority: high.

Branch:

```text
benchmark/juilie-single-llm-review-t001-t003
```

Goal: manually review the 15 fresh Single-LLM baseline rows and judge relevance against the same T001-T003 rubric used for Proposed Agent review.

Allowed files:

```text
benchmark/manual_review_single_llm.csv
juilie_bot_hub/
CHANGELOG.md
docs/progress.md
```

Required steps:

1. Read `benchmark/baseline_single_llm_results.csv`.
2. Create `benchmark/manual_review_single_llm.csv` with one row per Single-LLM baseline result.
3. Do not rewrite `benchmark/baseline_single_llm_results.csv`.
4. Add manual fields:
   - `manual_relevance` from 0 to 5
   - `manual_decision` as `include`, `review`, or `reject`
   - `failure_type`
   - `review_note`
5. Use short evidence-based notes.
6. Update `juilie_bot_hub/README.md` with row counts and key concerns.
7. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
```

Definition of done:

- All 15 Single-LLM rows have manual review fields.
- Uncertain cases are marked `review`, not forced into `include`.
- `CHANGELOG.md` records the work with `(juilie)`.

## Assignment 3: unassigned_member_c

Priority: medium.

Branch:

```text
benchmark/member-c-baseline-comparison-qa
```

Goal: QA the baseline comparison inputs before metric comparison is finalized.

Allowed files:

```text
benchmark/baseline_rule_based_results.csv
benchmark/baseline_single_llm_results.csv
unassigned_member_c/
CHANGELOG.md
docs/debug-log.md
docs/progress.md
```

Required steps:

1. Confirm both baseline CSV files have 15 rows: five each for T001, T002, and T003.
2. Confirm every row has `task_id`, `keyword`, `baseline_type`, `result_rank`, `title`, `journal`, `journal_rank`, `doi`, `source_note`, and `review_note`.
3. Confirm no stale dynamic-capabilities/governance/service-quality rows from the rejected member-c branch remain.
4. Confirm `baseline_type` is exactly `rule_based` or `single_llm`.
5. Record findings in `unassigned_member_c/README.md`.
6. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
```

Definition of done:

- Baseline input QA is recorded.
- Any malformed row is fixed only if it is within the allowed files and clearly mechanical.
- `CHANGELOG.md` records the work with `(member-c)` or the assigned member id.

## Assignment 4: shonshinemin_cmd

Priority: high after maintainer adds baseline comparison script.

Branch:

```text
benchmark/shonshinemin-baseline-metric-qa
```

Goal: QA the new Rule-based vs Single-LLM vs Proposed Agent comparison outputs after the maintainer adds `npm run benchmark:compare-baselines`.

Allowed files:

```text
benchmark/baseline_comparison_metrics.csv
benchmark/baseline_comparison_summary.json
shonshinemin_cmd/
CHANGELOG.md
docs/debug-log.md
docs/progress.md
```

Required steps:

1. Wait until `benchmark/scripts/compare-baselines.mjs` and `npm run benchmark:compare-baselines` exist.
2. Run:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:compare-baselines
```

3. Check whether method-level metric differences match the underlying row data.
4. Record suspicious metric behavior, especially duplicate DOI effects and accepted gold-audit exceptions.
5. Update `shonshinemin_cmd/README.md` with a reproducibility note.

Definition of done:

- Baseline comparison metric outputs are regenerated and explained.
- Any suspicious score is documented.
- `CHANGELOG.md` records the work with `(shonshinemin)`.

## Maintainer: seunghyeon_choi

Current maintainer tasks:

1. Add `benchmark/scripts/compare-baselines.mjs`.
2. Add `npm run benchmark:compare-baselines`.
3. Generate `benchmark/baseline_comparison_metrics.csv` and `benchmark/baseline_comparison_summary.json`.
4. Keep personal `origin/main` as the active development source until these benchmark files stabilize.
5. Sync to organization repo only through reviewed PR flow after local validation.

Required maintainer verification:

```bash
npm run benchmark:audit-gold
npm run benchmark:evaluate-proposed
npm run benchmark:compare-baselines
git diff --check
```
