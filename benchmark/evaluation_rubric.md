# Paper-Agent-Bench Evaluation Rubric

Source document: `paper_agent_enhanced_report.md`

This rubric defines the first benchmark fixture layer for Paper Agent Project. It is intentionally strict: a result should not receive high credit unless it is relevant, real, verifiable, and aligned with the approved business-school journal scope.

## Audited Relevance Score

| Score | Meaning | Required Evidence |
| --- | --- | --- |
| 5 | Directly relevant and immediately useful for the research question. | Title, abstract, and journal scope directly match the task. |
| 4 | Highly relevant with minor scope differences. | Main construct or method matches, but context or population differs. |
| 3 | Indirectly relevant. | Useful background paper, but not a core target paper. |
| 2 | Keyword-level relevance only. | Shares terms but weak conceptual fit. |
| 1 | Irrelevant, invalid, or unverifiable. | Wrong field, fabricated metadata, missing DOI when DOI is required, or unrelated topic. |

## Core Metrics

- `Precision@5`: number of top-5 returned papers with audited relevance score >= 4 divided by 5.
- `NDCG@5`: graded relevance ranking quality using the 1-5 audited score.
- `Paper Validity Rate`: returned papers with real title, real journal, real year, and non-fabricated metadata.
- `DOI Accuracy`: returned DOI matches Crossref metadata for the title/year/journal.
- `Top Journal Precision`: returned papers published in the approved field/rank journal universe.
- `Hallucination Rate`: returned papers or claims that cannot be verified from scholarly metadata.
- `OA PDF Success Rate`: returned papers with valid Unpaywall-confirmed OA PDF URL.
- `Report Completeness`: report includes summary, commonality, difference, gap, critic note, DOI, score, and field/rank.

## Agent-Level Checks

| Agent | Required Output | Failure Condition |
| --- | --- | --- |
| Planner | query concepts, field guess, year window | misses core construct or chooses wrong field |
| Journal Selector | selected field/rank pool | uses journals outside selected field without marking review |
| Retriever | candidate papers with source IDs | duplicates or low scholarly validity |
| Verifier | DOI and metadata match state | accepts mismatched DOI/title/year/journal |
| OA Agent | OA PDF/page/license status | marks closed or invalid URL as downloadable PDF |
| Relevance Agent | relevance score and reason | high score for keyword-only matches |
| Ranking Agent | final score and rank | unverified or irrelevant papers dominate top-5 |
| Critic Agent | flags, risk level, critic note | misses metadata mismatch or overstates journal quality |
| Report Agent | structured review output | omits evidence, DOI, field/rank, or limitations |
| MCP | read-only inspection consistency | exposes unsafe write tools or returns inconsistent D1/R2 data |

## Current Gold Label Policy

`benchmark/gold_relevant_papers.csv` is a seed gold file. Its first version uses title-level targets and marks DOI values as `needs_crossref_verification` instead of inventing unverified DOI strings.

Before computing final DOI Accuracy, run Crossref verification and update:

- `doi`
- `authors`
- `journal`
- `year`
- `doi_label_status=verified`

Rows that cannot be verified should remain in the file with `doi_label_status=rejected` and a note explaining why.
New review, QA, and refinement decisions must be reproducible. Encode selection rules in scripts and generated CSV/JSON outputs; preserve legacy manual review files as historical evidence instead of extending them as the active workflow.
