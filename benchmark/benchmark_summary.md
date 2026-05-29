# Paper-Agent-Bench Summary

Updated: 2026-05-28

## Status

The first benchmark fixture layer is now initialized from `paper_agent_enhanced_report.md`.

Current files:

- `benchmark/tasks.jsonl`: 20 benchmark tasks covering organization/HR, marketing, strategy, accounting/finance, operations, and information systems.
- `benchmark/scripts/audit-gold-labels.mjs`: internal consistency audit for gold labels, task coverage, DOI format, duplicate DOI/title cases, and CSV parsing issues.
- `benchmark/gold_audit_report.md` and `benchmark/gold_audit_report.json`: latest generated gold-label audit outputs.
- `benchmark/keywords.csv`: compatibility keyword list expanded from 3 to 20 queries.
- `benchmark/gold_relevant_papers.csv`: 60 seed gold relevance rows, 3 per task.
- `benchmark/gold_relevant_papers.verified.csv`: first Crossref title-query verification pass.
- `benchmark/gold_promotion_decisions.csv`: historical promotion decisions for high-confidence candidate rows.
- `benchmark/gold_refinement_queue.csv`: historical non-verified seed rows that need exact-title replacement or scripted review.
- `benchmark/gold_crossref_candidates.csv`: Crossref candidate pool generated from task-level queries.
- `benchmark/gold_candidate_review.csv`: scored candidate review file with allowlist, field, type, DOI, and priority labels.
- `benchmark/evaluation_rubric.md`: scoring rubric, core metrics, and agent-level checks.
- `benchmark/scripts/verify-gold-crossref.mjs`: local Crossref verification utility.
- `benchmark/scripts/refine-gold-candidates.mjs`: local refinement queue and candidate generation utility.
- `benchmark/scripts/score-gold-candidates.mjs`: local candidate scoring utility based on journal allowlist, field match, type, DOI, recency, and Crossref score.
- `benchmark/scripts/run-proposed-agent.mjs`: deployed Worker runner for collecting Proposed Agent benchmark outputs.
- `benchmark/scripts/compare-baselines.mjs`: reproducible Rule-based vs Single-LLM vs Proposed Agent comparison utility.
- `benchmark/scripts/auto-review-baselines.mjs`: fully automated baseline review utility; replaces human-only Single-LLM manual review queues.

## Important Constraint

Earlier seed rows intentionally avoided fabricated DOI values and required Crossref/scripted verification. After Gemini expansion and Codex correction, the current `benchmark/gold_relevant_papers.csv` has 60 DOI-backed rows across 20 tasks.

The current internal audit command is:

```bash
npm run benchmark:audit-gold
```

Latest audit result:

| Metric | Value |
| --- | ---: |
| Gold rows | 60 |
| Tasks covered | 20 / 20 |
| Verified rows | 60 |
| DOI-backed rows | 60 |
| Errors | 0 |
| Warnings | 0 |
| Accepted warnings | 2 |

No active audit warnings remain. Two warnings are tracked as accepted exceptions in `benchmark/gold_audit_allowlist.json`: one non-approved top-journal flag for T001/G003 and one duplicate DOI warning where the same paper is intentionally relevant to T001 and T002. The audit output is reproducible and no longer changes only because of a run timestamp.

## Gold Refinement Queue

The first refinement queue has been generated:

| File | Rows | Purpose |
| --- | ---: | --- |
| `benchmark/gold_refinement_queue.csv` | 52 | Historical non-verified gold rows requiring exact-title replacement or scripted review. |
| `benchmark/gold_crossref_candidates.csv` | 200 | Task-level Crossref candidates, 10 per task, originally marked for follow-up review. |
| `benchmark/gold_candidate_review.csv` | 200 | Candidate list sorted by task and review score, with automatic priority labels. |

T001-T020 now have three DOI-backed rows per task. The immediate next priority is not adding more gold rows, but resolving or accepting the three audit warnings and then refreshing Proposed Agent/baseline comparisons against the audited gold set. Crossref task-level candidates are intentionally not auto-accepted because many results are broad, non-top-journal, book-chapter, dissertation, or otherwise outside the approved journal universe.

The first candidate scoring pass produced:

| Priority | Count | Meaning |
| --- | ---: | --- |
| `promote_candidate` | 2 | Journal article, DOI present, same field, and approved S/A1 journal match. |
| `topic_only_review` | 90 | Journal article with DOI, but outside approved field/journal universe. |
| `reject_low_priority` | 108 | Non-article, missing DOI, old, or otherwise weak candidate. |

New promotion decisions should be backed by reproducible evidence in scripts or tracked data, not human-only review notes.

## Promotion Decisions

Two `promote_candidate` rows have been reviewed and promoted:

| Task | Gold ID | Title | Journal | DOI | Rank |
| --- | --- | --- | --- | --- | --- |
| T004 | G010 | The Role of Human Managers within Algorithmic Performance Management Systems: A Process Model of Employee Trust in Managers through Reflexivity | Academy of Management Review | 10.5465/amr.2022.0058 | 국제 S급 |
| T019 | G055 | The omnichannel continuum: Integrating online and offline channels along the customer journey | Journal of Retailing | 10.1016/j.jretai.2022.02.003 | 국제 A1급 |

The decisions are recorded in `benchmark/gold_promotion_decisions.csv`. The promoted rows replaced broad seed titles in both `benchmark/gold_relevant_papers.csv` and `benchmark/gold_relevant_papers.verified.csv`.

## Baseline Comparison

The benchmark now compares:

1. Rule-based scholarly search baseline
2. Single LLM recommendation baseline
3. Proposed top-journal-aware multi-agent workflow

Current baseline rows:

| Baseline | T001 | T002 | T003 | Total | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| Rule-based | 5 | 5 | 5 | 15 | Integrated from current proposed-agent candidate pool. |
| Single-LLM | 5 | 5 | 5 | 15 | Fresh repository-grounded Codex single-pass baseline; not copied from stale member-c branch. |

Generated outputs:

```text
benchmark/baseline_comparison_metrics.csv
benchmark/baseline_comparison_summary.json
benchmark/auto_review_baseline_results.csv
benchmark/auto_review_baseline_summary.json
```

Automated baseline review command:

```bash
npm run benchmark:auto-review-baselines
```

Current automated review counts:

| Method | Rows | Include | Review by rule | Reject | Average auto relevance |
| --- | ---: | ---: | ---: | ---: | ---: |
| Rule-based | 15 | 2 | 9 | 4 | 2.4667 |
| Single-LLM | 15 | 9 | 5 | 1 | 3.8667 |

Run command:

```bash
npm run benchmark:compare-baselines
```

Current T001-T003 macro comparison:

| Method | Precision@5 | NDCG@5 | Gold DOI Hit Rate@5 | DOI Presence@5 | Top Journal Precision@5 | Paper Validity@5 | Accepted Exceptions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proposed Agent | 0.1333 | 0.3579 | 0.1944 | 1.0000 | 1.0000 | 1.0000 | 0.0000 |
| Rule-based | 0.1333 | 0.3579 | 0.1944 | 1.0000 | 1.0000 | 1.0000 | 0.0000 |
| Single-LLM | 0.6667 | 0.9949 | 1.0000 | 1.0000 | 0.9333 | 1.0000 | 1.0000 |

Interpretation caution: the Single-LLM baseline is repository-grounded and intentionally selected from DOI-backed gold/proposed metadata, so its high exact-overlap score should be treated as an upper-bound or controlled baseline until a formal external model-run protocol is defined.

## Proposed Agent Runner

The Proposed Agent runner is implemented and smoke-tested:

```bash
npm run benchmark:run-proposed -- --limit 1 --max-results 5 --poll-ms 5000 --timeout-ms 300000 --output /tmp/proposed_smoke.csv --jobs-output /tmp/proposed_jobs_smoke.csv
```

Smoke result:

| Task | Job ID | Status | Source | Allowed | Result Rows |
| --- | --- | --- | ---: | ---: | ---: |
| T001 | `job-768671a5-346d-4f0f-af54-6f29014ceb27` | completed | 8 | 5 | 5 |

Quota-safe three-task sample:

```bash
npm run benchmark:run-proposed -- --limit 3 --max-results 5 --poll-ms 5000 --timeout-ms 300000
```

Sample result:

| Task | Job ID | Status | Source | Allowed | Result Rows |
| --- | --- | --- | ---: | ---: | ---: |
| T001 | `job-e97a70f1-b041-492e-b54f-d60cc6cd8065` | completed | 8 | 5 | 5 |
| T002 | `job-b9fb9c4b-58d0-4774-9e38-6d5a99975b19` | completed | 25 | 5 | 5 |
| T003 | `job-700ef0e4-a2dd-450a-a785-c590f5e4bab3` | completed | 25 | 5 | 5 |

Recorded outputs:

```text
benchmark/proposed_agent_jobs.csv
benchmark/proposed_agent_results.csv
```

## Proposed Agent Metrics

The first metric pass has been generated from the three-task sample:

```bash
npm run benchmark:evaluate-proposed
```

Metric outputs:

```text
benchmark/proposed_agent_metrics.csv
benchmark/proposed_agent_metrics_summary.json
```

Macro-average sample metrics:

| Metric | Value | Interpretation |
| --- | ---: | --- |
| Precision@5 | 0.1333 | Exact DOI/title overlap against current gold labels. |
| NDCG@5 | 0.3579 | Rank quality against current gold labels. |
| Gold DOI Hit Rate@5 | 0.1944 | Exact DOI hits against verified DOI gold rows. |
| DOI Accuracy@5 | 1.0000 | Returned DOI-bearing papers marked Crossref-verified by the Worker. |
| Paper Validity@5 | 1.0000 | Returned papers with DOI, verified status, title match, and journal match. |
| Top Journal Precision@5 | 1.0000 | Returned papers in approved international S/A1 journals. |
| Hallucination Rate@5 | 0.0000 | One minus paper validity. |
| OA Success@5 | 0.0000 | Returned papers with successful OA metadata or OA URLs. |

Important interpretation: exact gold overlap is now partially meaningful for the T001-T003 sample because 10 verified DOI gold rows are available, but the sample is still too small for final performance claims. Continue T004-T006 gold refinement and collect baseline rows before using Precision@5 and NDCG@5 as final evidence.

The full run command should be executed only when ready to spend WoS quota:

```bash
npm run benchmark:run-proposed
```

Default outputs:

```text
benchmark/proposed_agent_jobs.csv
benchmark/proposed_agent_results.csv
```

## Current Integration Note

As of 2026-05-27, selected T001-T003 team outputs have been reapplied onto the current personal main baseline. The stricter gold set reduced exact-overlap metrics but improved benchmark validity by using DOI-backed rows.

## Next Step

Use the audited gold set as the benchmark control layer:

1. Keep the 2 accepted warnings in `benchmark/gold_audit_allowlist.json` under scripted review, especially if a stronger T001/G003 approved-journal replacement is found.
2. Re-run `npm run benchmark:evaluate-proposed` after any gold-label or allowlist cleanup.
3. Re-run `npm run benchmark:compare-baselines` and `npm run benchmark:auto-review-baselines` after any baseline, proposed-agent, or gold-label input change.
4. Run the full 20 tasks through the deployed Worker only when ready to spend WoS quota, then update:

```text
benchmark/proposed_agent_results.csv
benchmark/proposed_agent_jobs.csv
benchmark/proposed_agent_metrics.csv
benchmark/proposed_agent_metrics_summary.json
```

5. Keep `npm run benchmark:audit-gold` as a required pre-merge check before any organization-main synchronization involving gold-label changes.
