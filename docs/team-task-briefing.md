# Team Task Briefing

Updated: 2026-05-22

This document is the current organization-main briefing for team agents. Read it after `AGENTS.md` and before editing files.

## Current Main Status

Organization `main` now includes the automated Agent rules workflow:

```text
Agent rules / validate-agent-rules
```

The ruleset blocks merge when a PR misses `CHANGELOG.md`, changes files outside the assignment scope, omits the assigned personal folder, or fails to add the correct attribution in newly added changelog lines.

Current benchmark state on `main`:

| Area | Status |
| --- | --- |
| Proposed Agent manual review | Complete for T001-T003, 15 rows reviewed. |
| Metric QA sample | Complete for T001-T003 after current manual/gold state. |
| Gold label refinement | Not complete; next active team priority. |
| Rule-based baseline | Not started; CSV has header only. |
| Single-LLM baseline | Not started; CSV has header only. |

Current metric snapshot:

```text
Precision@5: 0.0667
NDCG@5: 0.1601
Gold DOI Hit Rate@5: 0.3333
DOI Accuracy@5: 1.0000
Top Journal Precision@5: 1.0000
Hallucination Rate@5: 0.0000
OA Success@5: 0.0000
```

## Mandatory Workflow For Every Team Agent

1. Start from organization main.
2. Create the assigned branch only.
3. Edit only allowed files.
4. Update `CHANGELOG.md` with the correct attribution.
5. Update the assigned personal folder with a README or work-log entry.
6. Run the required verification command.
7. Push to `team-origin` and open a PR into `main`.

Do not work directly on `main`. Do not edit Cloudflare, Worker, dashboard, MCP, or deployment files unless explicitly assigned by the maintainer.

## Immediate Assignment 1: jin23624_cpu

Priority: highest.

Branch:

```text
benchmark/jin23624-gold-t001-t003
```

Goal: improve T001-T003 gold labels with DOI-backed, title-verified, approved-journal papers.

Allowed files:

```text
benchmark/gold_relevant_papers.csv
benchmark/gold_relevant_papers.verified.csv
jin23624_cpu/
CHANGELOG.md
docs/progress.md
```

Required steps:

1. Review only T001, T002, and T003 rows.
2. Use DOI landing pages, Crossref, Web of Science, journal publisher pages, or institutional library pages to verify title, DOI, year, authors, and journal.
3. Promote or correct rows only when evidence is strong.
4. Keep uncertain cases as `ambiguous` or `no_match`; do not fabricate metadata.
5. Prefer approved international S and A1 journals.
6. Update `jin23624_cpu/README.md` with what was checked, what changed, and remaining uncertainty.
7. Add a `CHANGELOG.md` entry ending with `(jin23624)`.
8. Run:

```bash
npm run benchmark:evaluate-proposed
```

Definition of done:

- T001-T003 have stronger verified DOI evidence than before.
- Changed gold rows include evidence notes.
- PR passes `Agent rules / validate-agent-rules`.

## Immediate Assignment 2: member-c Baselines

Priority: high, assign to the next available team member.

Branch:

```text
benchmark/member-c-baseline-t001-t003
```

Goal: collect comparable baseline outputs for T001-T003.

Allowed files:

```text
benchmark/baseline_rule_based_results.csv
benchmark/baseline_single_llm_results.csv
unassigned_member_c/
CHANGELOG.md
docs/progress.md
docs/debug-log.md
```

Required steps:

1. Add up to five Rule-based baseline rows per task.
2. Add up to five Single-LLM baseline rows per task.
3. Keep schema compatible with the existing CSV headers.
4. Record `baseline_type` as either `rule_based` or `single_llm`.
5. Add enough `source_note` detail for another person to reproduce the row.
6. Verify DOI and journal when available.
7. Update `unassigned_member_c/README.md` with row counts and known limitations.
8. Add a `CHANGELOG.md` entry ending with `(member-c)`.

Definition of done:

- At least one baseline type has rows for T001-T003.
- No fabricated DOI, journal, or author data.
- PR passes `Agent rules / validate-agent-rules`.

## Assignment 3: juilie_bot_hub

Status: complete for the current T001-T003 manual review.

Do not add new manual-review rows unless the maintainer asks for a review refresh. If asked to continue, use the existing branch pattern and update only:

```text
benchmark/manual_review_proposed.csv
juilie_bot_hub/
CHANGELOG.md
docs/progress.md
```

Next possible support task: review new Proposed Agent result rows after gold labels or retrieval settings change.

## Assignment 4: shonshinemin_cmd

Status: metric QA output exists and is reflected in benchmark metrics.

Next action should wait until either:

1. jin23624 updates gold labels, or
2. member-c adds baseline rows, or
3. the maintainer reruns Proposed Agent retrieval.

Then rerun:

```bash
npm run benchmark:evaluate-proposed
```

Update only:

```text
benchmark/proposed_agent_metrics.csv
benchmark/proposed_agent_metrics_summary.json
shonshinemin_cmd/
CHANGELOG.md
docs/debug-log.md
docs/progress.md
```

## Maintainer: seunghyeon_choi

Current maintainer tasks:

1. Keep `main` protected with required PR and `Agent rules / validate-agent-rules`.
2. Close or delete stale test branches after confirming they are no longer needed.
3. Review jin23624 and member-c PRs first.
4. After merge, rerun benchmark evaluation and update progress notes.
5. Do not merge PRs that bypass the assigned personal-folder and changelog-attribution rules.
