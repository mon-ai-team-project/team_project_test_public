# jin23624_cpu Assignment

Role: Gold Label Refinement

Branch:

```text
benchmark/jin23624-gold-t001-t003
```

Read first:

```text
AGENTS.md
docs/agent-work-queue.md
benchmark/benchmark_summary.md
```

Allowed files:

```text
benchmark/gold_relevant_papers.csv
benchmark/gold_relevant_papers.verified.csv
jin23624_cpu/
CHANGELOG.md
docs/progress.md
```

Current task:

Refine T001-T003 gold labels with DOI-backed, title-verified, top-journal papers where possible.

Do not edit Worker, dashboard, deployment, or unrelated benchmark files.

Completion note:

Add a short summary below before opening a PR.

## Work Summary

- Created branch from organization main and reviewed the assigned T001-T003 gold label refinement task.
- Current branch status: T001-T003 gold labels were refined with DOI-backed journal articles.
- Updated G001-G009 in both gold CSV files; existing G061 from shonshinemin was preserved.
- T001 now has three verified DOI rows; two are in approved local allowlist journals and one is DOI-backed but outside the local S/A1 allowlist.
- T002 now has three verified DOI rows, all in locally approved A1 journals.
- T003 now has three updated verified DOI rows plus the existing G061 verified Marketing Science row.
- Required verification `npm run benchmark:evaluate-proposed` passed; metric outputs were not committed because this branch is scoped to gold labels, not Metric QA outputs.


## 2026-05-27 Gold Refinement

- Replaced weak T001-T003 seed rows G001-G009 with DOI-backed journal articles verified through Crossref metadata and publisher/DOI landing page search. (jin23624)
- T001 replacements: Park & Jung 2025 in `Human Resource Management`; Gonzalez et al. 2022 in `Computers in Human Behavior`; Kochling, Wehner & Warkocz 2022 in `Review of Managerial Science`. (jin23624)
- T002 replacements: Lavanchy et al. 2023 in `Journal of Business Ethics`; Gonzalez et al. 2022 in `Computers in Human Behavior`; Bedemariam & Wessel 2023 in `Computers in Human Behavior`. (jin23624)
- T003 replacements: Hartmann, Exner & Domdey 2025 in `International Journal of Research in Marketing`; Heitmann et al. 2025 in `Journal of Marketing`; Grewal et al. 2024/2025 in `Journal of the Academy of Marketing Science`. Existing G061 Kapoor & Kumar 2025 in `Marketing Science` was preserved. (jin23624)
- Verification command passed: `npm run benchmark:evaluate-proposed`. Observed macro metrics after gold refinement: Precision@5=0.1333, NDCG@5=0.3579, Gold DOI Hit Rate@5=0.1944, verifiedGold=10, goldMatches=2. (jin23624)
- Remaining uncertainty: T001 G003 is relevant and DOI-backed but not in the local approved S/A1 allowlist; replace it later if a stronger top-journal AI recruitment/employer-attraction paper is identified. (jin23624)

