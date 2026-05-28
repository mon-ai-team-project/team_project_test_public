# member-c Baseline Branch Review

Date: 2026-05-28
Reviewer: codex
Branch reviewed: `team-origin/benchmark/member-c-baseline-t001-t003`
Current basis: personal `origin/main` at `df00b24`

## Decision

Do not merge `team-origin/benchmark/member-c-baseline-t001-t003` directly.

The branch is stale relative to the current personal-repo baseline and contains broad historical diffs outside the member-c assignment scope. Only the member-c baseline CSVs and `unassigned_member_c/README.md` were inspected.

## Reviewed Files

- `benchmark/baseline_rule_based_results.csv`
- `benchmark/baseline_single_llm_results.csv`
- `unassigned_member_c/README.md`

## Findings

### Rule-based Baseline

The branch rule-based rows should not replace the current personal-repo rows.

Reasons:

- The branch uses an older schema: `task_id,rank,title,authors,year,journal,doi,doi_verified,oa_url,baseline_type,source_note`.
- The current personal repo uses the richer benchmark schema: `task_id,keyword,baseline_type,result_rank,title,authors,year,journal,journal_field,journal_rank,doi,source_note,review_note`.
- The branch T001-T003 topics are not aligned with current tasks. For example, T001 rows are about dynamic capabilities and strategic management, while current T001 is `AI interview employer branding`.
- The current personal repo already has 15 rule-based rows aligned to current T001-T003 proposed-agent candidate pools.

### Single-LLM Baseline

The branch single-LLM rows should not be imported as benchmark evidence.

Reasons:

- The schema is outdated and not compatible with the current personal-repo baseline files.
- The task topics are stale or inferred from older project context.
- T001 single-LLM rows focus on dynamic capabilities and organizational knowledge, not AI interview/employer branding.
- T002 rows focus on governance/agency theory, not AI recruitment applicant reactions.
- T003 rows focus on broad service quality/customer satisfaction, not generative AI advertising effectiveness.
- The branch README itself notes that task topics were inferred from project context and need confirmation against `gold_relevant_papers.csv`.

## Accepted Reuse

No CSV rows from this branch should be reused directly.

Reusable parts:

- The branch confirms that member-c attempted the intended row counts: 15 rule-based and 15 single-LLM rows.
- The README limitation note is useful evidence that the branch should be treated as stale and not merged.

## Required member-c Rework

member-c should create a fresh branch from current personal or organization main after synchronization and recollect only Single-LLM baseline rows using current task definitions.

Required target file:

```text
benchmark/baseline_single_llm_results.csv
```

Required schema:

```text
task_id,keyword,baseline_type,result_rank,title,authors,year,journal,journal_field,journal_rank,doi,source_note,review_note
```

Required current tasks:

| Task | Keyword | Research question |
| --- | --- | --- |
| T001 | AI interview employer branding | How does disclosure of AI interview use influence applicants' employer brand perceptions? |
| T002 | artificial intelligence recruitment applicant reaction | Which AI recruitment practices affect applicant fairness perceptions and organizational attractiveness? |
| T003 | generative AI advertising effectiveness | How does generative AI-created advertising affect consumer persuasion, trust, and brand response? |

Rules for new Single-LLM rows:

1. Add exactly five rows per task where possible.
2. Use `baseline_type=single_llm`.
3. Use current T001-T003 keywords and research questions, not older strategic management/governance/service-quality topics.
4. Prefer DOI-backed journal articles from the approved journal universe.
5. Mark uncertainty in `review_note`; do not fabricate DOI, journal, authors, or year.
6. Include the prompting method and verification source in `source_note`.
7. Run `npm run benchmark:audit-gold` and `npm run benchmark:evaluate-proposed` after editing.

## Current Next Step

Do not integrate stale member-c CSV rows. Request or perform a fresh Single-LLM baseline collection against the current benchmark task definitions.
