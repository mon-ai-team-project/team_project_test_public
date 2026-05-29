# shonshinemin_cmd Assignment

Role: Metric QA And Reproducibility

Branch:

```text
benchmark/shonshinemin-metric-qa
```

Read first:

```text
AGENTS.md
docs/agent-work-queue.md
benchmark/proposed_agent_metrics_summary.json
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

Current task:

Re-run `npm run benchmark:evaluate-proposed` after gold/manual-review updates and explain metric changes.

Do not edit evaluation script logic unless explicitly assigned.

## Work Summary

- Current `main` status: metric QA output exists for the T001-T003 Proposed Agent sample.
- `benchmark/proposed_agent_metrics.csv` has 3 task rows.
- `benchmark/proposed_agent_metrics_summary.json` reports Precision@5=0.0667, NDCG@5=0.1601, Gold DOI Hit Rate@5=0.3333, DOI Accuracy@5=1.0000, Top Journal Precision@5=1.0000, Hallucination Rate@5=0.0000, and OA Success@5=0.0000.
- Next action: wait until gold labels, baseline rows, or Proposed Agent result rows change, then rerun `npm run benchmark:evaluate-proposed` and update this workspace.
## 2026-05-28 Next Assignment

- New assignment: QA upcoming baseline comparison metrics after npm run benchmark:compare-baselines is added. (codex)
- Check Rule-based vs Single-LLM vs Proposed Agent metric consistency against source CSV rows. (codex)
- Required verification once available: npm run benchmark:audit-gold, npm run benchmark:evaluate-proposed, and npm run benchmark:compare-baselines. (codex)
