# Gold Label Audit Report

Generated: reproducible-current-inputs

This report checks internal consistency of `benchmark/gold_relevant_papers.csv` against `benchmark/tasks.jsonl`. It does not replace external DOI, publisher, Crossref, or Web of Science verification.

Accepted exceptions are loaded from `benchmark/gold_audit_allowlist.json` and separated from active issues.

## Summary

| Metric | Value |
| --- | ---: |
| Gold rows | 60 |
| Tasks covered | 20 / 20 |
| Verified rows | 60 |
| DOI-backed rows | 60 |
| top_journal_expected=yes rows | 59 |
| Duplicate DOI groups | 1 |
| Errors | 0 |
| Warnings | 0 |
| Accepted warnings | 2 |

## Task Coverage

| Task | Rows | Verified | DOI-backed | Top journal expected |
| --- | ---: | ---: | ---: | ---: |
| T001 | 3 | 3 | 3 | 2 |
| T002 | 3 | 3 | 3 | 3 |
| T003 | 3 | 3 | 3 | 3 |
| T004 | 3 | 3 | 3 | 3 |
| T005 | 3 | 3 | 3 | 3 |
| T006 | 3 | 3 | 3 | 3 |
| T007 | 3 | 3 | 3 | 3 |
| T008 | 3 | 3 | 3 | 3 |
| T009 | 3 | 3 | 3 | 3 |
| T010 | 3 | 3 | 3 | 3 |
| T011 | 3 | 3 | 3 | 3 |
| T012 | 3 | 3 | 3 | 3 |
| T013 | 3 | 3 | 3 | 3 |
| T014 | 3 | 3 | 3 | 3 |
| T015 | 3 | 3 | 3 | 3 |
| T016 | 3 | 3 | 3 | 3 |
| T017 | 3 | 3 | 3 | 3 |
| T018 | 3 | 3 | 3 | 3 |
| T019 | 3 | 3 | 3 | 3 |
| T020 | 3 | 3 | 3 | 3 |

## Active Issue Counts

| Issue | Count |
| --- | ---: |
| none | 0 |

## Active Issues

| Severity | Code | Location | Message |
| --- | --- | --- | --- |
| none | none | none | No active issues detected. |

## Accepted Issue Counts

| Issue | Count |
| --- | ---: |
| warning:duplicate_doi_same_title | 1 |
| warning:not_top_journal_expected | 1 |

## Accepted Issues

| Severity | Code | Location | Decision | Reason |
| --- | --- | --- | --- | --- |
| warning | not_top_journal_expected | T001/G003 | accepted_relevance_exception | The paper is DOI-backed and directly relevant to AI recruitment affective responses, but the journal is not in the current approved S/A1 allowlist. Keep as a controlled exception until a stronger approved-journal replacement is selected. |
| warning | duplicate_doi_same_title | 10.1016/j.chb.2022.107179 | accepted_cross_task_overlap | The same DOI is intentionally relevant to both T001 and T002 because it covers AI/ML hiring process reactions across applicant and recruitment fairness contexts. |

## Maintainer Notes

- Treat active `error` rows as blockers before organization-main synchronization.
- Treat active `warning` rows as review items that still need a decision.
- Accepted warnings are controlled exceptions; review them again when a stronger gold replacement or task split is available.
- Re-run with `npm run benchmark:audit-gold` after any gold-label or allowlist edit.
