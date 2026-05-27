# jin23624_cpu Assignment

Role: Gold Label Refinement

Branch:

```text
benchmark/jin23624-gold-t001-t003
```

Read first:

```text
AGENTS.md
docs/agent-work-queue.md
benchmark/benchmark_summary.md
```

Allowed files:

```text
benchmark/gold_relevant_papers.csv
benchmark/gold_relevant_papers.verified.csv
jin23624_cpu/
CHANGELOG.md
docs/progress.md
```

Current task:

Refine T001-T003 gold labels with DOI-backed, title-verified, top-journal papers where possible.

Do not edit Worker, dashboard, deployment, or unrelated benchmark files.

Completion note:

Add a short summary below before opening a PR.

## Work Summary

- Current `main` status: T001-T003 gold label refinement is complete. (jin23624)
- Verified and refined T001-T003 DOI-backed gold labels (G001-G009) using real top-journal papers found via cross-referencing and Proposed Agent results.
- All 9 rows for T001-T003 are now `verified` with correct DOI, title, author, and journal metadata.
- Updated `benchmark/gold_relevant_papers.csv` and confirmed with `npm run benchmark:verify-gold`.
- This improvement ensures that Precision@5 and NDCG@5 metrics for the initial tasks are now based on high-quality, verifiable evidence.
