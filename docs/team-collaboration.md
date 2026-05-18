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

## Branch Policy

Do not commit directly to `main` for team-member benchmark edits.

Use one branch per task:

```bash
git checkout main
git pull team-origin main
git checkout -b benchmark/<owner>-<short-task>
```

Examples:

```text
benchmark/member-a-gold-t001-t003
benchmark/member-b-proposed-review
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
| Current maintainer | integration, scripts, Worker, dashboard, metrics | source code, docs, benchmark scripts |
| Member A | gold label refinement | `benchmark/gold_relevant_papers.csv`, `benchmark/gold_relevant_papers.verified.csv` |
| Member B | Proposed Agent manual review | `benchmark/manual_review_proposed.csv` |
| Member C | baseline result collection | `benchmark/baseline_rule_based_results.csv`, `benchmark/baseline_single_llm_results.csv` |

Do not modify unrelated files in a benchmark branch.

## Benchmark Data Rules

Gold labels:

- Use DOI-backed journal articles whenever possible.
- Verify DOI through Crossref, Web of Science, the publisher page, or the DOI landing page.
- Do not invent DOI, author, year, journal, or rank values.
- Match journal names to the approved business-school journal list when possible.
- Prefer international S and international A1 journals for final benchmark evidence.
- Keep ambiguous rows marked as `ambiguous` until the title, DOI, journal, and year are verified.

Manual review:

- Review only the assigned task rows.
- Keep the original Agent output fields unchanged.
- Add human judgment in separate review columns.
- Use short, factual notes.

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

The current benchmark priority is to improve the quality of T001-T003 evaluation evidence:

1. Refine T001-T003 gold labels with verified DOI-backed top-journal papers.
2. Manually review the 15 rows in `benchmark/proposed_agent_results.csv`.
3. Collect T001-T003 baseline results.
4. Re-run `npm run benchmark:evaluate-proposed`.
5. Use the improved metric outputs to decide whether to expand to all 20 benchmark tasks.
