# Gemini T004-T006 Benchmark Handoff

Updated: 2026-05-27 (codex)

This is the conservative handoff guide for Gemini. It exists because Gemini must not rely on previous chat memory. Repository files are the source of truth.

## Current Goal

Continue the benchmark evidence work for T004-T006 only:

- T004: algorithmic management employee trust
- T005: AI transparency consumer trust
- T006: chatbot service failure customer satisfaction

The objective is to improve DOI-backed gold labels in the benchmark CSVs. Do not change Worker, dashboard, Cloudflare, D1, R2, MCP, or deployment code for this task.

## Required Startup

Before editing, run:

```bash
git status --short --branch
git log --oneline -8
```

Read these files in order:

```text
AGENTS.md
GEMINI.md
docs/agent-writing-rules.md
docs/progress.md
docs/debug-log.md
docs/agent-work-queue.md
benchmark/benchmark_summary.md
jin23624_cpu/README.md
CHANGELOG.md
```

If Worker or Cloudflare behavior appears related, also read:

```text
docs/cloudflare-worker-build-troubleshooting.md
docs/gemini-debug-handoff.md
docs/local-worker-troubleshooting.md
```

## Repository And Branch Policy

Work in the personal repository first:

```text
origin https://github.com/Vulter3653/paper-agent-project.git
```

Use a new branch, not `main`:

```bash
git checkout -b benchmark/gemini-t004-t006-gold-refinement
```

Do not push to `team-origin` unless the user explicitly asks.

Before pushing anywhere, summarize changed files and ask the user which remote/branch to push.

## Allowed Files For This Task

Gemini may edit only:

```text
benchmark/gold_relevant_papers.csv
benchmark/gold_relevant_papers.verified.csv
jin23624_cpu/README.md
CHANGELOG.md
docs/progress.md
docs/debug-log.md
docs/gemini-session-state.md
```

Do not edit:

```text
apps/
packages/
wrangler.toml
apps/*/wrangler*.toml
.github/
benchmark/proposed_agent_results*.csv
benchmark/proposed_agent_metrics*.csv
benchmark/baseline_*.csv
```

## Conservative Data Rules

Only mark a row as `verified` when all of these are true:

1. DOI exists.
2. Title, year, journal, and authors are verified from Crossref, publisher page, DOI landing page, or Web of Science metadata.
3. The paper is substantively relevant to the task research question.
4. The notes field explains why the paper is relevant and what was verified.

Prefer approved international S/A1 journals. If a relevant DOI-backed paper is not in the approved local allowlist, keep `top_journal_expected=no` and explain the limitation in notes.

Do not fabricate metadata. If uncertain, leave `doi_label_status=ambiguous` or `no_match`.

## Current T004-T006 Starting State

Current rows needing review:

- T004 G010 is already verified: Academy of Management Review, DOI `10.5465/amr.2022.0058`.
- T004 G011-G012 are weak/no-match seed rows.
- T005 G013-G015 are weak/no-match seed rows.
- T006 G016 is ambiguous and should not be treated as verified without stronger evidence.
- T006 G017-G018 are weak/no-match seed rows.

Use current candidate files as inputs, not automatic truth:

```text
benchmark/gold_candidate_review.csv
benchmark/gold_crossref_candidates.csv
benchmark/gold_promotion_decisions.csv
```

Candidate file warnings:

- Many T005/T006 candidates are not approved S/A1 journals even when they have DOI values.
- Conference papers, SSRN/posted content, books, dissertations, and weak journals should not be promoted as final gold labels unless explicitly justified as temporary `ambiguous` evidence.
- T004 has one strong existing verified row. Additional rows require careful top-journal search beyond the current candidate list.

## Suggested Procedure

1. Inspect T004-T006 rows in both gold CSV files.
2. Search DOI/title metadata using reliable sources.
3. Replace only weak seed rows when the replacement is stronger.
4. Keep row IDs stable where practical: G011-G018.
5. Update both CSV files consistently.
6. Add a short T004-T006 work summary to `jin23624_cpu/README.md` with `(gemini)` attribution.
7. Update `CHANGELOG.md` with `(gemini)` attribution.
8. Update `docs/progress.md` if handoff state changes.
9. Update `docs/debug-log.md` if a verification problem or uncertainty is discovered.
10. Update `docs/gemini-session-state.md` before ending.

## Verification

Minimum required checks after editing:

```bash
git diff --check
npm run benchmark:evaluate-proposed
```

If any Worker, dashboard, package, or config file is accidentally touched, stop and ask the user. Do not continue by widening the scope.

## Current Stable System State

As of this handoff:

- Worker is operating normally.
- Cloudflare Git Build issues were traced to root `wrangler.toml` conflict markers and an accidental `.worktrees/agent-traces` gitlink.
- Personal `origin/main` no longer tracks the gitlink.
- Worker artifact downloads are confirmed:
  - `papers.csv`
  - `report.md`
  - `papers.xlsx`
  - `report.pdf`

Gemini must not revisit or modify Cloudflare deployment files for this benchmark task.
