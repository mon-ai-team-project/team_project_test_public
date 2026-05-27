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

- Current `main` status: gold label refinement is not complete.
- A remote readiness branch exists, but no gold CSV changes are merged into `main`.
- Next action: verify and refine T001-T003 DOI-backed gold labels using Crossref, DOI landing pages, Web of Science, publisher pages, or library metadata.
- Required PR contents: updated gold CSV rows, this workspace README/work-log, `CHANGELOG.md` entry ending with `(jin23624)`, and `docs/progress.md` if handoff context changes.
