# Integrated Workflow Design

Updated: 2026-05-25 (codex)

Source documents:

- `AI_Agent_프로젝트_전체_통합본.pdf`
- `paper_agent_enhanced_report.md`

This document is the current blueprint for the MON AI Team Paper Agent. It reflects the deployed Cloudflare Worker, Cloudflare Pages dashboard, D1/R2 storage, Google Drive OA archive path, and the remaining planned stages.

## Product Definition

The project goal is an AI Agent system for automated scholarly paper discovery, journal quality screening, metadata verification, ranking, comparison, and report generation.

Core principle:

```text
Return fewer but more trustworthy papers:
real papers, verified metadata, allowlisted or high-quality journals, topic relevance, auditable reasons, and reproducible outputs.
```

Primary user:

```text
Graduate students and researchers preparing a literature review or early-stage research proposal.
```

## Current Implementation Snapshot

As of 2026-05-25, the working implementation covers the full 12-stage workflow skeleton and stores auditable intermediate artifacts.

Implemented:

- Cloudflare Pages research dashboard with live Worker search runs and ranked paper table.
- Cloudflare Worker search API using WoS as active provider and OpenAlex fallback for testing.
- Business-school approved journal filtering with field/category selection and rank priority.
- D1 persistence for search jobs, papers, evaluations, agent traces, critic flags, and job outputs.
- Crossref metadata enrichment and DOI verification fields.
- Unpaywall OA lookup fields.
- Conditional Google Drive upload for Unpaywall-confirmed OA PDF URLs.
- R2-backed CSV, Markdown, XLSX, and PDF report artifacts.
- Rule-based Critic Agent flags for metadata, relevance, inclusion, and access risks.
- Dashboard trace, artifact, critic, diagnostics, and recent-job visibility.

Still planned or partial:

- Vectorize or embedding-based semantic relevance; current relevance uses metadata and keyword fallback.
- Advanced Critic Agent with stronger hallucination/claim review; current critic is rule-based.
- Richer Planner decomposition into sub-questions and query variants.
- External JCR/SCImago/CiteScore enrichment when licensed access is available.
- Benchmark expansion and team-member result integration.
- More polished report PDF layout and narrative literature-review content.

## Target End-To-End Workflow

```text
User
-> Cloudflare Pages dashboard
-> Cloudflare Workers API / agent workflow
-> Planner Agent
-> Journal Selector Agent
-> Search/Retriever Agent
-> Verifier Agent
-> OA Download / Access Agent
-> Storage Agent: R2 + conditional Google Drive
-> Journal Evaluation Agent
-> Relevance Evaluation Agent
-> Ranking Agent
-> Critic Agent
-> Report Agent
-> D1 / R2 / Drive / Vectorize planned
-> User downloads CSV / Markdown / XLSX / PDF outputs
```

## Project Definition

The project should be presented as a verifiable top-journal literature review assistant. The core claim is not broad search coverage, but controlled retrieval, journal-quality filtering, metadata verification, transparent scoring, and reproducible report output.

The enhanced report reframes the submission around three priorities:

1. Current implementation evidence from the deployed Cloudflare stack.
2. Explicit multi-agent roles and traceable intermediate outputs.
3. REPRO-Bench-style evaluation comparing rule-based, single-LLM, and proposed agent workflows.

## Agent Responsibilities

| Agent | Responsibility | Current Status | Next Implementation |
| --- | --- | --- | --- |
| Planner Agent | Convert user topic into keywords, sub-questions, field classification, year constraints, result limit, and enrichment limit. | Partial: dashboard inputs and Worker planner trace are implemented; deep sub-question decomposition is not yet implemented. | Extract richer query decomposition into a dedicated planner module and persist sub-questions. |
| Journal Selector Agent | Select field-specific journal universe and rank priority. | Implemented for business school categories and `국제 S급` -> `국제 A1급` priority; selection trace is persisted. | Expand category/rank diagnostics and add reviewer-editable journal pool controls. |
| Retriever Agent | Retrieve candidate papers from approved scholarly APIs. | Implemented for WoS, with OpenAlex fallback retained for testing and quota resilience. | Split WoS/OpenAlex clients into tool modules and benchmark Recall@20. |
| Verifier Agent | Verify DOI, title, year, journal, authors, publisher, ISSN, and bibliography fields with Crossref. | Implemented as Crossref enrichment with verification fields and trace counts. | Add stronger mismatch explanations and reviewer-facing verification flags. |
| Open Access Agent | Check Unpaywall and record OA PDF, landing page, license, host type, and status. | Implemented. | Add access-route classification for institution login and non-OA manual review paths. |
| Storage Agent | Persist reports in R2 and archive eligible OA PDFs to Google Drive. | Implemented for R2 CSV/Markdown/XLSX/PDF and conditional Drive upload for Unpaywall-confirmed OA PDFs. | Add Drive retry/audit view and stronger per-file failure reporting. |
| Journal Evaluation Agent | Score journal quality using allowlist, field, and rank class. | Implemented through allowlist metadata, field/rank fit, component scores, and final score. | Add optional JCR/SCImago/CiteScore enrichment if API access is available. |
| Relevance Agent | Score title/abstract/topic similarity and explain inclusion. | Partial: keyword, metadata, and manual-review-informed scoring are implemented; Vectorize is not connected. | Add Vectorize or embedding similarity and compare against human labels. |
| Ranking Agent | Combine relevance, journal quality, verification, OA availability, citation count, and recency. | Implemented with persisted component scores and final score. | Validate score weights against benchmark tasks after team baselines are integrated. |
| Critic Agent | Recheck metadata, journal match, relevance, access path, hallucination risk, and unsupported claims. | Partial: rule-based `critic_flags` are implemented and visible in dashboard/Ops. | Add advanced critic review notes, claim-level checks, and benchmarked error detection. |
| Report Agent | Generate CSV, Markdown, XLSX, and PDF outputs and store them in R2. | Implemented for all four artifact types, with dynamic fallback endpoints. | Improve PDF formatting and add richer narrative review sections. |
| MCP Interface | Allow external agents to inspect job/result/report state through controlled tools. | Implemented read-only MCP tools for job/result inspection and traces. | Add controlled critic/output read tools before considering any write tools. |

## Workflow Stages

| Stage | Task | Primary Store / Output | Current Status |
| --- | --- | --- | --- |
| 1 | User enters keyword/topic | Dashboard state | Implemented |
| 2 | Create search job | D1 `search_jobs` | Implemented |
| 3 | Select field and journal universe | D1 traces / shared allowlist | Implemented |
| 4 | Search candidate papers | WoS or OpenAlex fallback results | Implemented |
| 5 | Verify DOI and bibliography | D1 `papers` Crossref fields | Implemented with enrichment limit |
| 6 | Check OA availability | D1 Unpaywall fields | Implemented with enrichment limit |
| 7 | Store OA PDF in Drive | D1 Drive fields / Google Drive URL | Implemented conditionally for Unpaywall-confirmed PDFs |
| 8 | Persist paper metadata | D1 `papers` | Implemented |
| 9 | Evaluate journal quality | D1 `evaluations` | Implemented with allowlist/rank scoring |
| 10 | Evaluate relevance | D1 `evaluations`; Vectorize planned | Partial metadata fallback implemented |
| 11 | Rank and critic-review | D1 scores and `critic_flags` | Ranking implemented; rule-based critic implemented |
| 12 | Generate outputs | R2 + API endpoints | CSV, Markdown, XLSX, and PDF implemented |

## Data Architecture

| Store | Use | Current State |
| --- | --- | --- |
| Cloudflare D1 | Search jobs, papers, Crossref fields, OA metadata, Drive metadata, evaluation scores, agent traces, critic flags, output metadata. | Implemented and used by live Worker APIs. |
| Cloudflare R2 | Durable report artifacts. | Implemented for `reports/<job_id>/papers.csv`, `report.md`, `papers.xlsx`, and `report.pdf`. |
| Cloudflare Vectorize | Abstract/topic embeddings and semantic similarity search. | Planned; current relevance uses metadata fallback. |
| Google Drive | OA PDF originals for team review. | Implemented conditionally for Unpaywall-confirmed OA PDF URLs when service-account secrets are configured. |
| MCP server | Read-only external agent inspection of Paper Agent state. | Implemented for controlled job/result/trace inspection. |

R2 should not become the operational metadata database. Search, filtering, ranking, trace inspection, and job state must remain in D1.

## Output Standard

Final report outputs should include:

- Rank
- Title, authors, year
- Journal and top journal or Q1 status
- DOI and verification status
- Abstract/topic relevance score
- Journal quality score
- Citation and recency scores
- OA status and PDF/link availability
- Google Drive archive status when an OA PDF is stored
- Summary of research question, theory, method, data, and findings
- Commonality with user topic
- Difference from user topic
- Research gap
- Critic note and exclusion/review reason
- Agent trace summary and report artifact metadata

Current outputs:

- CSV: persisted metadata, OA fields, Drive fields, score components, final score, inclusion status.
- Markdown: executive summary, ranked table, paper details, OA links, license, Drive status, score breakdown.
- XLSX: workbook-form ranked paper table for spreadsheet review.
- PDF: text-based report PDF for downloadable handoff and demonstration.

Planned output improvements:

- More polished PDF layout with clearer sections and pagination.
- Trace- and critic-rich report body.
- Benchmark-ready export package after team results are merged.

## Evaluation Plan

Benchmarks should compare:

1. Rule-based keyword search baseline
2. Single LLM recommendation baseline
3. Proposed top-journal-aware agent workflow

Core metrics:

- Precision@5
- Paper validity rate
- DOI accuracy
- Top journal precision
- Hallucination rate
- OA PDF success rate
- Report completeness
- Latency
- Cost and quota usage

Human evaluation rubric:

| Score | Meaning |
| --- | --- |
| 5 | Directly relevant and immediately useful for the research topic. |
| 4 | Highly relevant with minor scope differences. |
| 3 | Indirectly relevant. |
| 2 | Only keyword-level relevance. |
| 1 | Irrelevant or invalid recommendation. |

## Paper-Agent-Bench Plan

The enhanced report proposes a REPRO-Bench-style evaluation adapted for literature review. The benchmark should include at least 20 tasks, each with a keyword, field, year range, max result count, gold relevant papers, DOI labels, and human relevance labels.

Minimum task example:

```json
{"task_id":"T001","keyword":"AI interview employer branding","field":"organization-hr","year_start":2020,"year_end":2026,"max_results":5}
```

Agent-level metrics:

| Agent | Metrics |
| --- | --- |
| Planner | Query Coverage, Field Accuracy |
| Journal Selector | Field Classification Accuracy, Journal Set Precision |
| Retriever | Recall@20, Candidate Validity Rate |
| Verifier | DOI Accuracy, Metadata Match Accuracy |
| OA Agent | OA Status Accuracy, PDF URL Precision |
| Relevance | Human Relevance Correlation, Binary Accuracy |
| Ranking | Precision@5, NDCG@5, Verified@5 |
| Critic | Error Detection Precision/Recall |
| Report | Completeness, Format Validity |
| MCP | Tool Correctness, Safety, E2E Consistency |

## Security And Policy Constraints

- Do not bypass paywalls.
- Store only OA PDFs confirmed by Unpaywall or user-provided files.
- Keep credentials in Cloudflare secrets, never in Git.
- Use minimum-scope MCP/tool permissions.
- Do not expose destructive tools such as database drop, account management, or unrestricted file deletion.
- Treat journal metrics as evidence, not as the only quality signal.

## Submission Roadmap

The enhanced report prioritizes benchmark evidence and reproducibility before additional visual polish. Benchmark/performance work is currently deferred until team outputs are integrated.

| Priority | Work | Completion Standard | Current State |
| --- | --- | --- | --- |
| 1 | Expand benchmark tasks | `benchmark/tasks.jsonl` with at least 20 tasks and gold relevant papers. | Partial; team work pending |
| 2 | Baseline comparison | Rule-based, single-LLM, and proposed-agent result tables. | Deferred until team results are integrated |
| 3 | Critic Agent | D1 critic records with risk level, flags, recommendation, and critic note. | Partial: rule-based `critic_flags` implemented |
| 4 | Agent traces | D1 trace table with each agent input/output summary. | Implemented |
| 5 | XLSX output | `GET /api/search-jobs/:id/papers.xlsx` and R2 `reports/<job_id>/papers.xlsx`. | Implemented |
| 6 | PDF output | `GET /api/search-jobs/:id/report.pdf` and R2 `reports/<job_id>/report.pdf`. | Implemented |
| 7 | Vectorize relevance | Embedding-based relevance scoring and benchmark comparison. | Planned |
| 8 | Drive upload | Store only Unpaywall-confirmed OA PDFs in Google Drive. | Implemented conditionally |
| 9 | Prompt and paper list docs | Complete `docs/prompts.md` and `used_papers.md`. | Planned |
| 10 | Final presentation package | 8-12 page paper, slides, and 2-3 minute demo script. | Planned |

## Immediate Non-Benchmark Priorities

1. Improve live dashboard ergonomics and reduce confusion between implemented, partial, and planned features.
2. Replace metadata-fallback relevance with Vectorize or embedding similarity.
3. Improve PDF report layout and content quality.
4. Add richer critic-review explanations and report integration.
5. Keep personal repo changes verified first, then promote to organization repo only when explicitly requested.
