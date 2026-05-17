# Paper-Agent-Bench Summary

Updated: 2026-05-17

## Status

The first benchmark fixture layer is now initialized from `paper_agent_enhanced_report.md`.

Current files:

- `benchmark/tasks.jsonl`: 20 benchmark tasks covering organization/HR, marketing, strategy, accounting/finance, operations, and information systems.
- `benchmark/keywords.csv`: compatibility keyword list expanded from 3 to 20 queries.
- `benchmark/gold_relevant_papers.csv`: 60 seed gold relevance rows, 3 per task.
- `benchmark/evaluation_rubric.md`: human scoring, core metrics, and agent-level checks.

## Important Constraint

The seed gold rows intentionally do not fabricate DOI values. Each DOI field is blank and marked with:

```text
doi_label_status=needs_crossref_verification
```

The next benchmark step is to run Crossref-based DOI verification and replace title-level seed labels with verified DOI gold labels.

## Planned Baseline Comparison

The benchmark will compare:

1. Rule-based scholarly search baseline
2. Single LLM recommendation baseline
3. Proposed top-journal-aware multi-agent workflow

Target metrics:

- Precision@5
- NDCG@5
- Paper Validity Rate
- DOI Accuracy
- Top Journal Precision
- Hallucination Rate
- OA PDF Success Rate
- Report Completeness

## Next Step

Create a DOI verification script or Worker endpoint that reads `benchmark/gold_relevant_papers.csv`, queries Crossref by title, and writes a verified gold file:

```text
benchmark/gold_relevant_papers.verified.csv
```

After DOI verification, run the 20 tasks through the deployed Worker and record:

```text
benchmark/proposed_agent_results.csv
benchmark/baseline_results.csv
```
