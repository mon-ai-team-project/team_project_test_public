# Agent Operating Guide

Updated: 2026-05-22

This repository is the shared MON AI Team Paper Agent workspace.

Any AI agent or team member that opens this repository must follow this file before editing anything.

## Start Here

Run:

```bash
git status --short --branch
git log --oneline -8
```

Read these files in order:

```text
docs/agent-writing-rules.md
docs/progress.md
docs/team-collaboration.md
docs/agent-work-queue.md
CHANGELOG.md
docs/debug-log.md
```

Do not start from memory or from an old chat transcript. The files above are the source of truth.

## Repository Remotes

Personal source repository:

```text
origin https://github.com/Vulter3653/paper-agent-project.git
```

Team collaboration repository:

```text
team-origin https://github.com/mon-ai-team-project/team_project_test_public.git
```

Team agents should work from `team-origin`:

```bash
git fetch team-origin
git checkout main
git pull team-origin main
```

## Branch Rule

Do not work directly on `main`.

`main` is reserved for maintainer-reviewed integration. The current maintainer is:

```text
seunghyeon_choi
```

Create a branch for one assignment:

```bash
git checkout -b benchmark/<agent-id>-<short-task>
```

Examples:

```text
benchmark/jin23624-gold-t001-t003
benchmark/juilie-proposed-review
benchmark/member-c-baseline-t001-t003
benchmark/shonshinemin-metric-qa
```

## Agent Assignment Map

Use the matching directory README for detailed instructions:

| Agent directory | Primary assignment | Allowed write scope |
| --- | --- | --- |
| `seunghyeon_choi/` | Current maintainer and integration lead | source code, docs, benchmark scripts, `seunghyeon_choi/` |
| `jin23624_cpu/` | Gold label refinement | `benchmark/gold_relevant_papers.csv`, `benchmark/gold_relevant_papers.verified.csv`, `jin23624_cpu/` |
| `juilie_bot_hub/` | Proposed Agent manual review | `benchmark/manual_review_proposed.csv`, `juilie_bot_hub/` |
| `unassigned_member_c` | Baseline result collection | `benchmark/baseline_rule_based_results.csv`, `benchmark/baseline_single_llm_results.csv` |
| `shonshinemin_cmd/` | Metric QA and reproducibility checks | `benchmark/proposed_agent_metrics.csv`, `benchmark/proposed_agent_metrics_summary.json`, `shonshinemin_cmd/` |
| `integrated/` | Maintainer integration notes only | `integrated/`, docs, scripts, source code only when assigned |

If an agent is not explicitly assigned to source-code work, it must not edit `apps/`, `packages/`, `wrangler.toml`, or deployment settings.

## Shared Agent Writing Rules

Codex, Gemini, Claude, and any other AI agent must follow:

```text
docs/agent-writing-rules.md
GEMINI.md
CLAUDE.md
```

Agent-specific work must use the correct lowercase attribution:

```text
(codex)
(gemini)
(claude)
```

Do not remove or rewrite another agent attribution entry.

## Current Benchmark Priority

Current focus: improve T001-T003 benchmark evidence.

1. Refine T001-T003 gold labels with DOI-backed top-journal papers.
2. Manually review the 15 current Proposed Agent result rows.
3. Collect T001-T003 baseline results.
4. Re-run `npm run benchmark:evaluate-proposed`.
5. Decide whether to expand to all 20 tasks.

See:

```text
docs/agent-work-queue.md
benchmark/benchmark_summary.md
```

## Data Quality Rules

Gold labels:

- Use real DOI-backed journal articles.
- Verify DOI, title, author, year, and journal before marking `verified`.
- Do not fabricate missing metadata.
- Prefer approved international S and A1 journals.
- Keep uncertain rows as `ambiguous` or `no_match`.

Manual reviews:

- Do not rewrite the original Proposed Agent result fields.
- Add human judgment in review columns.
- Use short evidence-based notes.

Baselines:

- Keep schema compatible with `benchmark/proposed_agent_results.csv`.
- Clearly mark the baseline method.
- Record enough source detail for another person to reproduce the row.

## Required Documentation

Every meaningful change must update:

```text
CHANGELOG.md
```

If the change affects project handoff, also update:

```text
docs/progress.md
```

If the change investigates a defect or verifies a workflow, also update:

```text
docs/debug-log.md
```

Use this exact attribution format:

```text
- Benchmark: Refined T001-T003 gold labels with verified DOI-backed top-journal papers. (jin23624)
```

Do not remove or rewrite another contributor's attribution.

## Verification

Benchmark-only changes:

```bash
npm run benchmark:evaluate-proposed
```

Source-code changes require maintainer approval and must run:

```bash
npm run typecheck
npm run build:web
```

## Pull Request Checklist

Before opening a PR:

```bash
git status --short
git diff --stat
```

Then push:

```bash
git push team-origin <branch-name>
```

Open the PR into `main` on:

```text
https://github.com/mon-ai-team-project/team_project_test_public
```

The PR must identify the assignment, changed files, verification command, and remaining uncertainty.
