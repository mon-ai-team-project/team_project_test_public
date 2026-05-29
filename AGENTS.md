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
docs/team-task-briefing.md
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

Personal-repo development should use `origin/main` as the default working branch and source of truth:

```bash
git fetch origin
git checkout main
git pull origin main
```

For the personal repository, do not treat a feature branch as the default branch. Temporary branches may be used for experiments, but accepted work must be merged or pushed back to `origin/main` unless the user explicitly says otherwise.

Team agents working against the organization repository should use `team-origin` and PR branches:

```bash
git fetch team-origin
git checkout main
git pull team-origin main
```

## Branch Rule

Personal repository rule:

- `origin/main` is the default branch and active development baseline.
- Push completed personal-repo work to `origin/main` unless the user explicitly requests a branch-only push.

Organization repository rule:

- Do not work directly on `team-origin/main`.
- `team-origin/main` is reserved for maintainer-reviewed integration. The current maintainer is:

```text
seunghyeon_choi
```

Create an organization PR branch for one assignment:

```bash
git checkout -b benchmark/<agent-id>-<short-task>
```

Examples:

```text
benchmark/jin23624-gold-t001-t003
benchmark/juilie-auto-review-qa
benchmark/member-c-baseline-t001-t003
benchmark/shonshinemin-metric-qa
```

## Agent Assignment Map

Use the matching directory README for detailed instructions:

| Agent directory | Primary assignment | Allowed write scope |
| --- | --- | --- |
| `seunghyeon_choi/` | Current maintainer and integration lead | source code, docs, benchmark scripts, `seunghyeon_choi/` |
| `jin23624_cpu/` | Gold label refinement | `benchmark/gold_relevant_papers.csv`, `benchmark/gold_relevant_papers.verified.csv`, `jin23624_cpu/` |
| `juilie_bot_hub/` | Automated baseline review QA | `benchmark/auto_review_baseline_results.csv`, `benchmark/auto_review_baseline_summary.json`, `benchmark/scripts/auto-review-baselines.mjs`, `juilie_bot_hub/` |
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

Automatic enforcement:

```text
.github/workflows/agent-rules.yml
scripts/validate-agent-rules.mjs
```

Team benchmark branches that skip the assigned personal folder, change files outside scope, or omit matching changelog attribution should fail PR validation.

## Current Benchmark Priority

Current focus: improve T001-T003 benchmark evidence through reproducible automation.

1. Refine T001-T003 gold labels with DOI-backed top-journal papers.
2. Re-run Proposed Agent metrics with `npm run benchmark:evaluate-proposed`.
3. Re-run baseline comparison with `npm run benchmark:compare-baselines`.
4. Re-run automated baseline review with `npm run benchmark:auto-review-baselines`.
5. Expand beyond T001-T003 only through scripts, tracked datasets, and reproducible verification outputs.

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

Automated reviews and legacy review files:

- Do not create new human-only manual review workflows.
- Encode review rules in scripts and generated CSV/JSON outputs whenever possible.
- Treat existing `manual_review_*` files as legacy evidence or seed references unless the maintainer explicitly requests a one-time audit.
- Do not rewrite original Agent result fields; add automated decisions and evidence in separate generated columns/files.

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
