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
- `benchmark/baseline_single_llm_results.csv` still contains only the header; no Single-LLM baseline was generated in this pass.
- Next action for the assigned member or maintainer: decide whether this deterministic candidate-pool baseline is sufficient for the first comparison, or replace it with an independently retrieved rule-based baseline and add Single-LLM rows.


## 2026-05-27 Baseline Collection

- Added 15 rule-based baseline rows for T001-T003. (member-c)
- Method: reused the existing `benchmark/proposed_agent_results.csv` candidate pool, kept rows with `verification_status=verified`, and ranked candidates by deterministic title keyword overlap for each task, then journal rank, year, and original row order. (member-c)
- DOI/journal metadata was not invented; it was copied from rows already marked Crossref-verified in the Proposed Agent sample. (member-c)
- Limitation: this is a candidate-pool lexical baseline, not an independent Web of Science/Crossref retrieval baseline. It should be treated as a first reproducible baseline until a separate retrieval baseline is assigned. (member-c)
- Single-LLM baseline remains pending because no model/API run was requested or configured for this assignment. (member-c)
