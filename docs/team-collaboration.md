# Team Collaboration Guide

Updated: 2026-05-18

## Repository Setup

Team collaboration repository:

```text
https://github.com/mon-ai-team-project/team_project_test_public
```

Local remote name:

```text
team-origin
```

Keep the personal project remote as `origin` and use `team-origin` for team sharing:

```bash
git remote -v
git fetch origin
git fetch team-origin
```

## Agent Auto-Start Documents

Any team agent that enters the repository must read these files before changing files:

```text
AGENTS.md
docs/agent-work-queue.md
docs/progress.md
CHANGELOG.md
```

`AGENTS.md` defines the repository-wide operating rules. `docs/agent-work-queue.md` defines the current benchmark assignments and allowed file scopes.

## Branch Policy

Do not commit directly to `main` for team-member benchmark edits.

`main` is reserved for maintainer-reviewed integration by `seunghyeon_choi`. Configure GitHub branch protection or rulesets according to:

```text
docs/github-main-protection.md
```

Use one branch per task:

```bash
git checkout main
git pull team-origin main
git checkout -b benchmark/<owner>-<short-task>
```

Examples:

```text
benchmark/member-a-gold-t001-t003
benchmark/member-b-auto-review-qa
benchmark/member-c-baseline-t001-t003
```

Push the branch to the team repository:

```bash
git push team-origin benchmark/<owner>-<short-task>
```

Then open a pull request into `main`.

## Work Ownership

Team members who are not maintaining the Worker, dashboard, or scripts should edit only their assigned benchmark files.

Recommended ownership:

| Owner | Scope | Files |
| --- | --- | --- |
| seunghyeon_choi | current maintainer, integration, scripts, Worker, dashboard, metrics | source code, docs, benchmark scripts, `seunghyeon_choi/`, `integrated/` |
| Member A | gold label refinement | `benchmark/gold_relevant_papers.csv`, `benchmark/gold_relevant_papers.verified.csv` |
| Member B | Automated baseline review QA | `benchmark/auto_review_baseline_results.csv`, `benchmark/auto_review_baseline_summary.json`, `benchmark/scripts/auto-review-baselines.mjs` |
| Unassigned Member C | baseline result collection | `benchmark/baseline_rule_based_results.csv`, `benchmark/baseline_single_llm_results.csv` |

Do not modify unrelated files in a benchmark branch.

## Benchmark Data Rules

Gold labels:

- Use DOI-backed journal articles whenever possible.
- Verify DOI through Crossref, Web of Science, the publisher page, or the DOI landing page.
- Do not invent DOI, author, year, journal, or rank values.
- Match journal names to the approved business-school journal list when possible.
- Prefer international S and international A1 journals for final benchmark evidence.
- Keep ambiguous rows marked as `ambiguous` until the title, DOI, journal, and year are verified.

Automated review:

- Do not create new human-only manual review workflows.
- Keep original Agent and baseline output fields unchanged.
- Encode decisions in scripts and generated CSV/JSON outputs.
- Use short evidence-based notes in generated review columns.
- Treat existing `manual_review_*` files as legacy evidence unless the maintainer requests a one-time audit.

Baseline rows:

- Keep the schema close to `benchmark/proposed_agent_results.csv`.
- Record the source method in a `source` or `baseline_type` column.
- Do not mix Rule-based and Single-LLM rows in one file unless a column clearly separates them.

## Required Changelog Format

Every pull request that changes benchmark data, docs, code, or generated outputs must update `CHANGELOG.md`.

Use this exact dated entry format:

```text
- Benchmark: Refined T001-T003 gold labels with verified DOI-backed top-journal papers. (member-a)
```

Rules:

- Use one of the approved labels from `CHANGELOG.md`.
- Use lowercase agent or member identifiers in parentheses.
- Do not remove or rewrite another contributor's attribution.
- Keep `docs/progress.md` updated when the work changes project handoff state.

## Review Checklist

Before opening a PR:

```bash
git status --short
git diff --stat
```

For benchmark metric changes, run:

```bash
npm run benchmark:evaluate-proposed
```

For source-code changes, ask the maintainer before editing. The maintainer should run:

```bash
npm run typecheck
npm run build:web
```

## Current Priority

The current benchmark priority is to improve the quality of T001-T003 evaluation evidence through reproducible automation:

1. Refine T001-T003 gold labels with verified DOI-backed top-journal papers.
2. Run `npm run benchmark:evaluate-proposed` for Proposed Agent metrics.
3. Run `npm run benchmark:compare-baselines` for Rule-based, Single-LLM, and Proposed Agent comparison.
4. Run `npm run benchmark:auto-review-baselines` for automated baseline QA.
5. Expand to all 20 benchmark tasks only after the automated checks are stable.
