# juilie_bot_hub Assignment

Role: Automated Baseline Review QA

Branch:

```text
benchmark/juilie-auto-review-qa
```

Read first:

```text
AGENTS.md
docs/agent-work-queue.md
benchmark/auto_review_baseline_results.csv
juilie_bot_hub/paper_agent_enhanced_report.pdf section 8
```

Allowed files:

```text
benchmark/auto_review_baseline_results.csv
benchmark/auto_review_baseline_summary.json
benchmark/scripts/auto-review-baselines.mjs
juilie_bot_hub/
CHANGELOG.md
docs/progress.md
```

Current task:

Maintain and QA the automated baseline review pipeline. Run `npm run benchmark:auto-review-baselines`, inspect the generated CSV/JSON outputs, and improve rules only when the decision is reproducible from tracked metadata.

Required generated outputs:

```text
benchmark/auto_review_baseline_results.csv
benchmark/auto_review_baseline_summary.json
```

Do not create new human-only manual review files. Do not rewrite original Agent or baseline result fields.

## Work Summary

- Legacy record: Completed manual review for all 15 T001-T003 Proposed Agent rows in `benchmark/manual_review_proposed.csv` before the project moved to automation-first review. (historical)
- Reflected `juilie_bot_hub/paper_agent_enhanced_report.pdf` section 8, which frames the benchmark as REPRO-Bench-style Paper-Agent-Bench evaluation using human relevance labels, Precision@5/NDCG@5, DOI accuracy, top-journal precision, hallucination checks, and report completeness.
- Used `manual_relevance` scores from 1 to 5 and `manual_decision` values limited to `include`, `review`, and `reject`.
- Marked the one direct T003 advertising-effectiveness match as `include`, four adjacent papers as `review`, and ten off-topic or weak-subtopic papers as `reject`.
- Kept original Proposed Agent result metadata unchanged and added only manual judgment fields.

## Current Main Status - 2026-05-22

- Assignment 2 is complete on organization `main` for the current T001-T003 Proposed Agent sample.
- Do not add or rewrite manual-review rows unless the maintainer requests a refresh after new Proposed Agent results are generated.
- Stale branch-only push-test/work-log notes do not need to be merged unless the maintainer explicitly asks for them.

## 2026-05-20 Branch Push Notes

- Confirmed this workspace tracks `team-origin/benchmark/juilie-proposed-review`.
- Added `push-test.md` to verify direct pushes to the personal branch.
- Added `work-log-2026-05-20.md` to record the `main/juilie_bot_hub` folder check and continued personal-folder workflow.
- Kept `main` untouched and did not open a pull request.
- Left local-only `juilie_bot_hub/paper_agent_enhanced_report.pdf` untracked and out of commits.
## 2026-05-28 Next Assignment

- New assignment: maintain automated baseline review QA for `benchmark/baseline_rule_based_results.csv` and `benchmark/baseline_single_llm_results.csv`. (codex)
- Output files: `benchmark/auto_review_baseline_results.csv` and `benchmark/auto_review_baseline_summary.json`. (codex)
- Required verification: `npm run benchmark:audit-gold`, `npm run benchmark:evaluate-proposed`, `npm run benchmark:compare-baselines`, and `npm run benchmark:auto-review-baselines`. (codex)
- Legacy manual review files remain preserved as historical evidence, but new review decisions must be encoded in reproducible scripts and generated outputs. (codex)
