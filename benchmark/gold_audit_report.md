# Gold Label Audit Report

Generated: reproducible-current-inputs

This report checks internal consistency of `benchmark/gold_relevant_papers.csv` against `benchmark/tasks.jsonl`. It does not replace external DOI, publisher, Crossref, or Web of Science verification.

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
| Warnings | 2 |

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

## Issue Counts

| Issue | Count |
| --- | ---: |
| warning:duplicate_doi_same_title | 1 |
| warning:not_top_journal_expected | 1 |

## Issues

| Severity | Code | Location | Message |
| --- | --- | --- | --- |
| warning | not_top_journal_expected | T001/G003 | top_journal_expected is 'no'. |
| warning | duplicate_doi_same_title | 10.1016/j.chb.2022.107179 | DOI 10.1016/j.chb.2022.107179 appears in multiple gold rows: T001/G002, T002/G005. |

## Maintainer Notes

- Treat `error` rows as blockers before organization-main synchronization.
- Treat `warning` rows as review items. Some duplicate DOI warnings are acceptable when the same paper is intentionally relevant to multiple benchmark tasks.
- Re-run with `npm run benchmark:audit-gold` after any gold-label edit.
