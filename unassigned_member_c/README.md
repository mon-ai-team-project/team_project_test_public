# unassigned_member_c Workspace

Role: Baseline Result Collection

This workspace is reserved for the team member who is assigned to collect Rule-based and Single-LLM baseline results.

Branch:

```text
benchmark/member-c-baseline-t001-t003
```

Allowed files:

```text
benchmark/baseline_rule_based_results.csv
benchmark/baseline_single_llm_results.csv
unassigned_member_c/
CHANGELOG.md
docs/progress.md
docs/debug-log.md
```

Required personal-folder rule:

Every baseline branch must update this folder with a README or work-log note. The PR validation workflow fails if the branch changes baseline CSV files without also changing `unassigned_member_c/`.

## Work Summary

- Current branch status: T001-T003 rule-based baseline rows are collected in `benchmark/baseline_rule_based_results.csv`.
- `benchmark/baseline_rule_based_results.csv` contains 15 rows: five rows each for T001, T002, and T003.
- `benchmark/baseline_single_llm_results.csv` contains 15 fresh repository-grounded Single-LLM rows: five rows each for T001, T002, and T003. (codex)
- Next action for the assigned member or maintainer: add baseline comparison metrics across Rule-based, Single-LLM, and Proposed Agent rows. (codex)


## 2026-05-27 Baseline Collection

- Added 15 rule-based baseline rows for T001-T003. (member-c)
- Method: reused the existing `benchmark/proposed_agent_results.csv` candidate pool, kept rows with `verification_status=verified`, and ranked candidates by deterministic title keyword overlap for each task, then journal rank, year, and original row order. (member-c)
- DOI/journal metadata was not invented; it was copied from rows already marked Crossref-verified in the Proposed Agent sample. (member-c)
- Limitation: this is a candidate-pool lexical baseline, not an independent Web of Science/Crossref retrieval baseline. It should be treated as a first reproducible baseline until a separate retrieval baseline is assigned. (member-c)
- Single-LLM baseline was pending in this 2026-05-27 pass; it was later populated by Codex on 2026-05-28 as a repository-grounded baseline. (codex)
## 2026-05-28 Fresh Single-LLM Baseline
- Added 15 fresh Single-LLM baseline rows for T001-T003. (codex)
- Method: Codex single-pass recommendation using current task definitions and repository DOI-backed gold/proposed metadata as the verification source. (codex)
- Scope: five rows each for T001 AI interview employer branding, T002 AI recruitment applicant reaction, and T003 generative AI advertising effectiveness. (codex)
- Guardrail: did not reuse stale team-origin member-c CSV rows because that branch used older task topics and an older schema. (codex)
- Limitation: this is a repository-grounded Single-LLM baseline, not an external live LLM/API run; treat it as a conservative reproducible baseline until a separate model-run protocol is assigned. (codex)
## 2026-05-28 Next Assignment

- New assignment: QA baseline input CSVs before comparison metrics are finalized. (codex)
- Confirm rule-based and Single-LLM files each contain 15 current-topic rows and no stale member-c branch topics. (codex)
- Required verification: npm run benchmark:audit-gold and npm run benchmark:evaluate-proposed. (codex)
