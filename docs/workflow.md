# Integrated Workflow Design

Updated: 2026-05-28 (codex)

Source documents:

- `AI_Agent_프로젝트_전체_통합본.pdf`
- `paper_agent_enhanced_report.md`
- `docs/progress.md`
- `benchmark/benchmark_summary.md`

This document is the current blueprint for the MON AI Team Paper Agent. It reflects the deployed Cloudflare Worker, Cloudflare Pages dashboard, D1/R2 storage, Google Drive OA archive path, read-only MCP inspection, automated benchmark review, and the remaining planned stages.

## Operating Baseline

Personal repository work uses `origin/main` as the default branch and source of truth. Temporary branches may be used for local experiments, but accepted personal-repo work should be pushed back to `origin/main` unless the user explicitly requests branch-only work.

Organization repository work remains PR-gated through `team-origin` assignment branches. Do not push directly to `team-origin/main`.

All benchmark review and QA work must be automated first. If a result needs review, encode the rule as a script, generated CSV/JSON output, and reproducible npm command before creating any human-only workflow.

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

As of 2026-05-28, the implementation is a deployed prototype beyond basic MVP. The full 12-stage workflow skeleton is implemented, runtime traces are persisted, and CSV/Markdown/XLSX/PDF outputs are available.

Implemented:

- Cloudflare Pages dashboard with Research, Ops, and Evaluation routes.
- Cloudflare Worker search API using WoS as active provider and OpenAlex fallback for testing/quota resilience.
- Dashboard Run fast path that defaults semantic Vectorize scoring and LLM Critic to off unless explicitly requested.
- Business-school approved journal filtering with field/category selection and `국제 S급` to `국제 A1급` priority.
- D1 persistence for search jobs, papers, evaluations, agent traces, critic flags, and job outputs.
- Crossref metadata enrichment and DOI verification fields.
- Unpaywall OA lookup fields.
- Conditional Google Drive upload for Unpaywall-confirmed OA PDF URLs.
- R2-backed CSV, Markdown, XLSX, and PDF report artifacts, with dynamic endpoint fallback.
- Rule-based Critic Agent flags for metadata, relevance, inclusion, and access risks.
- Dashboard trace, artifact, critic, diagnostics, and recent-job visibility.
- Read-only MCP tools for job/result/report inspection.
- 20-task benchmark fixture with audited DOI-backed gold labels.
- Automated gold audit, baseline comparison, and baseline auto-review scripts.

Still planned or partial:

- Vectorize or embedding-based semantic relevance; current default relevance uses metadata and keyword fallback.
- Advanced LLM Critic claim review; current production-safe default is rule-based critic review.
- Richer Planner decomposition into sub-questions and query variants.
- External JCR/SCImago/CiteScore enrichment when licensed API access is available.
- Full 20-task Proposed Agent runtime collection, limited by WoS quota.
- More polished report PDF layout and richer narrative literature-review content.
- Replacement of remaining dashboard mock/partial panels with live APIs or stricter planned-state display.

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
-> D1 / R2 / Drive / MCP inspection / Vectorize planned
-> User downloads CSV / Markdown / XLSX / PDF outputs
```

## Project Definition

The project should be presented as a verifiable top-journal literature review assistant. The core claim is not broad search coverage, but controlled retrieval, journal-quality filtering, metadata verification, transparent scoring, reproducible outputs, and benchmark-backed evaluation.

The enhanced report reframes the submission around three priorities:

1. Current implementation evidence from the deployed Cloudflare stack.
2. Explicit multi-agent roles and traceable intermediate outputs.
3. REPRO-Bench-style evaluation comparing Rule-based, Single-LLM, and Proposed Agent workflows.

## Course Requirement Blueprint

This section maps the current project to the final team-project announcement so the team can track what is already implemented, what is partial, and what still needs to be packaged for submission.

| Course requirement | Current implementation | Remaining packaging work |
| --- | --- | --- |
| Domain problem definition | Clear domain: literature review automation for academic paper discovery, screening, ranking, and report generation. | Write a concise introduction that states the user, pain point, and why the current manual workflow is inefficient. |
| Agent architecture | Multi-Agent workflow with Planner, Retriever, Verifier, Journal Selector, Relevance, Ranking, Critic, Report, and MCP inspection. | Make the paper narrative explicit about why each role exists and why a single LLM is not enough. |
| RAG / Tool use / MCP | WoS, Crossref, Unpaywall, Google Drive, D1, R2, and read-only MCP are integrated. | Document the tool interface, prompts, and failure handling in a reproducible appendix. |
| Reflection / self-correction | Rule-based critic flags and dashboard review panels exist; LLM Critic is opt-in. | Add a short section explaining the reflection loop and its limitations. |
| Benchmark design | 20-task benchmark fixture, gold audit, baseline comparison, and auto-review scripts are implemented. | Freeze the benchmark protocol for the final paper and slides, including metric definitions and sample counts. |
| Baseline comparison | Rule-based, Single-LLM, and Proposed Agent comparison is already available for T001-T003. | Decide whether to report the current T001-T003 control-layer result or extend the full 20-task run before final submission. |
| Evaluation metrics | Precision@5, NDCG@5, DOI accuracy, top-journal precision, hallucination rate, OA success, latency, and report completeness are tracked. | Present the metrics in a single table with a brief interpretation of strengths and failure modes. |
| Limitations & ethics | Paywall constraints, quota limits, hallucination risk, and journal bias are already acknowledged in docs. | Turn those notes into a formal Limitations & Ethics section for the paper. |
| Reproducibility | GitHub repo, npm scripts, benchmark CSV/JSON artifacts, and deployment notes are available. | Add a final "How to run" section with exact commands, required env vars, and expected outputs. |
| Final deliverables | Paper, slides, live demo, and GitHub repository are all required. | Package the repo README, demo script, and presentation outline for submission. |

## Submission Blueprint

Use the following order when preparing the final submission package:

1. Freeze the implementation snapshot and note which parts are live, partial, and mocked.
2. Finalize the benchmark story: task set, metric definitions, baseline comparison, and any scope limits.
3. Draft the paper sections in this order: Abstract, Introduction, Related Work, Method, Experiments, Limitations, Conclusion.
4. Prepare the slide deck around the same story: problem, architecture, benchmark, results, limitations, demo.
5. Prepare a short live-demo script that demonstrates search, ranking, trace visibility, and artifact download.
6. Ensure the GitHub repository contains README, prompts, benchmark files, and run instructions.


## Agent Responsibilities

| Agent | Responsibility | Current Status | Next Implementation |
| --- | --- | --- | --- |
| Planner Agent | Convert user topic into keywords, field classification, year constraints, result limit, and enrichment limit. | Partial: dashboard inputs and Worker planner trace are implemented; deep sub-question decomposition is not yet implemented. | Extract richer query decomposition into a dedicated planner module and persist sub-questions/query variants. |
| Journal Selector Agent | Select field-specific journal universe and rank priority. | Implemented for business school categories and `국제 S급` -> `국제 A1급` priority; selection trace is persisted. | Expand category/rank diagnostics and add reviewer-editable journal pool controls. |
| Retriever Agent | Retrieve candidate papers from approved scholarly APIs. | Implemented for WoS, with OpenAlex fallback retained for testing and quota resilience. | Split WoS/OpenAlex clients into tool modules and benchmark Recall@20. |
| Verifier Agent | Verify DOI, title, year, journal, authors, publisher, ISSN, and bibliography fields with Crossref. | Implemented as Crossref enrichment with verification fields and trace counts. | Add stronger mismatch explanations and dashboard-facing verification flags. |
| Open Access Agent | Check Unpaywall and record OA PDF, landing page, license, host type, and status. | Implemented. | Add access-route classification for institution login, DOI landing pages, and non-OA alternatives. |
| Storage Agent | Persist reports in R2 and archive eligible OA PDFs to Google Drive. | Implemented for R2 CSV/Markdown/XLSX/PDF and conditional Drive upload for Unpaywall-confirmed OA PDFs. | Add Drive retry/audit view and stronger per-file failure reporting. |
| Journal Evaluation Agent | Score journal quality using allowlist, field, and rank class. | Implemented through allowlist metadata, field/rank fit, component scores, and final score. | Add optional JCR/SCImago/CiteScore enrichment if API access is available. |
| Relevance Agent | Score title/abstract/topic similarity and explain inclusion. | Partial: keyword and metadata scoring are implemented; Vectorize path is opt-in/planned for production use. | Add Vectorize or embedding similarity and compare against automated benchmark labels. |
| Ranking Agent | Combine relevance, journal quality, verification, OA availability, citation count, and recency. | Implemented with persisted component scores and final score; dashboard fast path separates scoring/ranking/reviewing status. | Validate score weights against expanded benchmark tasks. |
| Critic Agent | Recheck metadata, journal match, relevance, access path, hallucination risk, and unsupported claims. | Partial: rule-based `critic_flags` are implemented and visible in dashboard/Ops; LLM Critic remains opt-in. | Add advanced critic review notes, claim-level checks, and benchmarked error detection. |
| Report Agent | Generate CSV, Markdown, XLSX, and PDF outputs and store them in R2. | Implemented for all four artifact types, with dynamic fallback endpoints. | Improve PDF formatting and add richer narrative review sections. |
| MCP Interface | Allow external agents to inspect job/result/report state through controlled tools. | Implemented read-only MCP tools for job/result/report inspection. | Add controlled critic/output read tools before considering any write tools. |
| Benchmark QA Agent | Audit gold labels, compare baselines, and auto-review baseline rows. | Implemented through `benchmark:audit-gold`, `benchmark:compare-baselines`, and `benchmark:auto-review-baselines`. | Extend comparison beyond T001-T003 after quota-safe Proposed Agent collection. |

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
| 10 | Evaluate relevance | D1 `evaluations`; Vectorize planned/opt-in | Partial metadata fallback implemented |
| 11 | Rank and critic-review | D1 scores and `critic_flags` | Ranking implemented; rule-based critic implemented; LLM Critic opt-in |
| 12 | Generate outputs | R2 + API endpoints | CSV, Markdown, XLSX, and PDF implemented |
| 13 | Benchmark audit and auto-review | `benchmark/*.csv`, `benchmark/*.json` | Implemented for gold audit, baseline comparison, and baseline auto-review |

## Data Architecture

| Store | Use | Current State |
| --- | --- | --- |
| Cloudflare D1 | Search jobs, papers, Crossref fields, OA metadata, Drive metadata, evaluation scores, agent traces, critic flags, output metadata. | Implemented and used by live Worker APIs. |
| Cloudflare R2 | Durable report artifacts. | Implemented for `reports/<job_id>/papers.csv`, `report.md`, `papers.xlsx`, and `report.pdf`. |
| Cloudflare Vectorize | Abstract/topic embeddings and semantic similarity search. | Planned/opt-in; default production path uses metadata fallback to avoid ranking latency. |
| Google Drive | OA PDF originals for team review. | Implemented conditionally for Unpaywall-confirmed OA PDF URLs when service-account secrets are configured. |
| MCP server | Read-only external agent inspection of Paper Agent state. | Implemented for controlled job/result/report inspection. |
| Benchmark files | Gold labels, proposed results, baselines, metrics, automated review outputs. | Implemented for T001-T003 comparison and 20-task gold audit. |

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
- Benchmark CSV/JSON: gold audit, proposed-agent metrics, baseline comparison, and baseline auto-review outputs.

Planned output improvements:

- More polished PDF layout with clearer sections and pagination.
- Trace- and critic-rich report body.
- Benchmark-ready export package after full 20-task runtime collection.

## Evaluation Plan

Benchmarks compare:

1. Rule-based keyword/search baseline
2. Single-LLM recommendation baseline
3. Proposed top-journal-aware multi-agent workflow

Core metrics:

- Precision@5
- NDCG@5
- Gold DOI hit rate@5
- DOI presence and accuracy
- Paper validity rate
- Top journal precision
- Accepted exception count
- Hallucination rate
- OA PDF success rate
- Report completeness
- Latency
- Cost and quota usage

Automated review policy:

- Gold labels are audited with `npm run benchmark:audit-gold`.
- Baseline/proposed metrics are regenerated with `npm run benchmark:compare-baselines`.
- Baseline rows are automatically reviewed with `npm run benchmark:auto-review-baselines`.
- Human-only review queues should not be added; encode repeatable judgment as script rules and generated outputs.

Relevance rubric retained for scripted labels and interpretation:

| Score | Meaning |
| --- | --- |
| 5 | Directly relevant and immediately useful for the research topic. |
| 4 | Highly relevant with minor scope differences. |
| 3 | Indirectly relevant. |
| 2 | Only keyword-level relevance. |
| 1 | Irrelevant or invalid recommendation. |

## Paper-Agent-Bench Status

The enhanced report proposes a REPRO-Bench-style evaluation adapted for literature review. The benchmark now includes 20 tasks, each with a keyword, field, year range, max result count, gold relevant papers, DOI labels, and relevance labels.

Minimum task example:

```json
{"task_id":"T001","keyword":"AI interview employer branding","field":"organization-hr","year_start":2020,"year_end":2026,"max_results":5}
```

Current benchmark artifacts:

| Artifact | Status |
| --- | --- |
| `benchmark/tasks.jsonl` | 20 tasks implemented |
| `benchmark/gold_relevant_papers.csv` | 60 DOI-backed rows |
| `benchmark/gold_relevant_papers.verified.csv` | 60 verified rows |
| `benchmark/gold_audit_report.md/json` | 0 errors, 0 active warnings, 2 accepted warnings |
| `benchmark/proposed_agent_results.csv` | T001-T003 sample, 15 rows |
| `benchmark/baseline_rule_based_results.csv` | T001-T003, 15 rows |
| `benchmark/baseline_single_llm_results.csv` | T001-T003, 15 rows |
| `benchmark/baseline_comparison_metrics.csv/json` | Implemented |
| `benchmark/auto_review_baseline_results.csv/json` | Implemented for 30 baseline rows |

Current T001-T003 macro comparison:

| Method | Precision@5 | NDCG@5 | Gold DOI Hit Rate@5 | DOI Presence@5 | Top Journal Precision@5 | Paper Validity@5 | Accepted Exceptions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proposed Agent | 0.1333 | 0.3579 | 0.1944 | 1.0000 | 1.0000 | 1.0000 | 0.0000 |
| Rule-based | 0.1333 | 0.3579 | 0.1944 | 1.0000 | 1.0000 | 1.0000 | 0.0000 |
| Single-LLM | 0.6667 | 0.9949 | 1.0000 | 1.0000 | 0.9333 | 1.0000 | 1.0000 |

Interpretation caution: the Single-LLM baseline is repository-grounded and intentionally selected from DOI-backed gold/proposed metadata. Treat it as a controlled upper-bound baseline until a formal external model-run protocol is defined.

Agent-level metrics:

| Agent | Metrics |
| --- | --- |
| Planner | Query Coverage, Field Accuracy |
| Journal Selector | Field Classification Accuracy, Journal Set Precision |
| Retriever | Recall@20, Candidate Validity Rate |
| Verifier | DOI Accuracy, Metadata Match Accuracy |
| OA Agent | OA Status Accuracy, PDF URL Precision |
| Relevance | Relevance Correlation, Binary Accuracy |
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
- Avoid human-only benchmark review queues; prefer reproducible scripts and generated artifacts.

## Submission Roadmap

The enhanced report prioritizes benchmark evidence and reproducibility before additional visual polish.

| Priority | Work | Completion Standard | Current State |
| --- | --- | --- | --- |
| 1 | Expand benchmark tasks and gold labels | `benchmark/tasks.jsonl` with at least 20 tasks and DOI-backed gold relevant papers. | Implemented: 20 tasks, 60 DOI-backed verified rows |
| 2 | Baseline comparison | Rule-based, Single-LLM, and Proposed Agent result tables with reproducible metrics. | Implemented for T001-T003; full 20-task run pending WoS quota |
| 3 | Automated baseline review | Generated auto-review decisions for baseline rows. | Implemented for 30 baseline rows |
| 4 | Critic Agent | D1 critic records with risk level, flags, recommendation, and critic note. | Partial: rule-based `critic_flags` implemented; LLM Critic opt-in |
| 5 | Agent traces | D1 trace table with each agent input/output summary. | Implemented |
| 6 | XLSX output | `GET /api/search-jobs/:id/papers.xlsx` and R2 `reports/<job_id>/papers.xlsx`. | Implemented |
| 7 | PDF output | `GET /api/search-jobs/:id/report.pdf` and R2 `reports/<job_id>/report.pdf`. | Implemented |
| 8 | Vectorize relevance | Embedding-based relevance scoring and benchmark comparison. | Planned/opt-in; default fast path uses metadata fallback |
| 9 | Drive upload | Store only Unpaywall-confirmed OA PDFs in Google Drive. | Implemented conditionally |
| 10 | Prompt and paper list docs | Complete `docs/prompts.md` and `used_papers.md`. | Planned |
| 11 | Final presentation package | 8-12 page paper, slides, and 2-3 minute demo script. | Planned |

## Immediate Priorities

1. Replace remaining dashboard mock/partial panels with live APIs or stricter planned-state display.
2. Improve PDF report layout and narrative literature-review sections.
3. Add richer rule-based/LLM Critic explanations and report integration.
4. Decide whether to run the full 20-task Proposed Agent collection after checking WoS quota.
5. Add Vectorize relevance only after dashboard fast-path behavior remains stable.
6. Promote personal `origin/main` changes to organization repo only when explicitly requested and through PR flow.
