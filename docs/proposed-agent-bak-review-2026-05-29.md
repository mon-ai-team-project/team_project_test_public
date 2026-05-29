# Untracked Benchmark Backup Review (2026-05-29)

(gemini)

## 1. Overview
This document evaluates two benchmark backup files initially found as untracked local files in the `benchmark/` directory. These files contain runtime outputs for the Proposed Agent on Task IDs T004 and T005, which are not currently included in the main tracked benchmark dataset (T001-T003).

### Inspected Files
- `benchmark/proposed_agent_jobs.csv.bak`
- `benchmark/proposed_agent_results.csv.bak`

## 2. Content Summary

### Job Data (`proposed_agent_jobs.csv.bak`)
- **Task IDs**: T004, T005
- **Job IDs**:
  - `job-74a505c6-3e69-47f9-a5d8-0b653e4fb23f` (T004)
  - `job-d528a255-be7c-4b48-b9bd-3185c9b20407` (T005)
- **Status**: Completed (Delivery step reached)
- **Counts**: 32 total paper rows across 2 jobs (T004: 20 rows, T005: 12 rows).

### Result Data (`proposed_agent_results.csv.bak`)
- **Coverage**: T004 (Algorithmic management employee trust), T005 (AI transparency consumer trust).
- **Quality Indicators**:
  - Contains successful `verified` rows with high relevance scores.
  - Contains several `partial` verification status rows.
  - Verification Reason: `Enrichment limit 10 reached; Crossref lookup skipped to stay within Worker subrequest limits.`
  - Unpaywall Status: `skipped` or `failed` for many entries.

## 3. Comparison with Tracked Files
The tracked files (`proposed_agent_jobs.csv` and `proposed_agent_results.csv`) exclusively cover **T001-T003**. The `.bak` files are **not** backups of these tracked files; they are expansion candidates representing later runs.

| Feature | Tracked (T001-T003) | .bak Files (T004-T005) |
|---------|---------------------|-----------------------|
| Task Count | 3 | 2 |
| Total Results | 15 | 32 |
| Data Density | 5 results/task | Variable (up to 20/task) |
| Consistency | High (Fully verified) | Mixed (Partial verification due to limits) |

## 4. Integration Risks
1. **Partial Verification**: Rows marked as `partial` lack Crossref metadata confirmation, which may lead to inaccurate metric calculations (e.g., DOI accuracy, year validation).
2. **Enrichment Limits**: The "Enrichment limit 10 reached" warning indicates that the Worker hit execution limits. This means the data is not as "clean" as the T001-T003 baseline.
3. **Comparison Skew**: Merging this data directly into the comparison layer would introduce tasks for which the Single-LLM or Rule-based baselines might not have matching results in their current tracked state.
4. **Metadata Gaps**: The high frequency of `unpaywall_status=skipped/failed` limits the utility for Open Access analysis compared to the primary benchmark.

## 5. Recommendation
**Do NOT overwrite or merge these `.bak` files into the existing `proposed_agent_*.csv` files at this time.**

- **Preserve**: Keep the `.bak` files as they contain valuable expansion data for T004 and T005.
- **Isolate**: If these are to be used for benchmarking, they should be processed into a separate `proposed_agent_expanded.csv` or similar, after addressing the partial verification gaps.
- **Verify**: Before any future integration, a "cleanup" run or a manual audit of the `partial` rows is required to ensure academic integrity.

---
**Status**: Review complete. No changes made to the controlled T001-T003 benchmark data. Codex review accepted the recommendation to preserve these files as raw T004-T005 expansion evidence, not as replacements for tracked T001-T003 CSVs. (gemini)
