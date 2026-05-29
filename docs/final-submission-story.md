# Final Submission Story

Updated: 2026-05-29 (gemini)

This document freezes the project narrative for the paper, presentation, and live demo. It must stay aligned with `docs/workflow.md`, `docs/progress.md`, benchmark outputs, and the deployed dashboard.

## One-Sentence Claim

The project implements a Cloudflare-deployed multi-agent literature review assistant that turns a research keyword into traceable top-journal paper candidates, verified metadata, ranked results, downloadable reports, and dashboard-visible agent traces, addressing the high friction and fragmentation in business-school scholarly research.

## Problem Definition

Early-stage literature review in business domains is plagued by three core pain points:
1. **Tool Fragmentation**: Researchers must manually navigate between WoS/OpenAlex (search), journal ranking lists (filtering), Crossref (verification), and Unpaywall (access), leading to significant context-switching costs.
2. **Opaque Selection Bias**: Standard search engines often prioritize broad keywords over specific top-tier journal constraints (e.g., FT50 or international S-rank), making it difficult to maintain high academic standards consistently.
3. **Traceability Gap**: The reasoning behind why a specific paper was ranked higher or excluded is often lost in manual spreadsheets, creating a reproducibility crisis in qualitative review.

The target user is a student or researcher preparing an early-stage literature review in management, marketing, accounting, finance, information systems, or related business-school domains.

## Agent Design Rationale

The system utilizes a 12-stage "Agent-as-a-Module" architecture. Unlike a single-pass LLM prompt, this multi-agent workflow ensures:
- **Error Isolation**: Failure in metadata enrichment (Verifier Agent) does not crash the entire retrieval pipeline.
- **Explicit Reasoning**: Each agent records its decision in D1 `agent_traces`, making the system a "White-box" researcher.
- **Qualitative/Quantitative Hybrid**: Combines deterministic screening, metadata scoring, and rule-based critic review by default. LLM-based qualitative review remains an opt-in path that must be reported as optional when used.

| Stage | Agent role | Implemented status | Design Rationale |
| --- | --- | --- | --- |
| 1 | Planner Agent | Implemented | Normalizes research scope and constraints |
| 2 | Journal Selector Agent | Implemented | Enforces business-school specific quality tiers |
| 3 | Search/Retriever Agent | Implemented | Executes API-specific scholarly queries |
| 4 | Verifier Agent | Implemented | Cross-references DOI metadata for integrity |
| 5 | Open Access Agent | Implemented | Locates legal PDF paths to bypass paywalls |
| 6 | Storage Worker | Implemented | Manages R2/D1 persistence and Drive archival |
| 7 | Evaluation Agent | Implemented | Calculates quantitative multi-factor scores |
| 8 | Relevance Agent | Metadata fallback implemented / Vectorize opt-in | Assesses keyword alignment and planned semantic similarity |
| 9 | Ranking Agent | Implemented | Performs weighted multi-criteria sorting |
| 10 | Critic Agent | Rule-based default / LLM opt-in | Detects metadata, relevance, access, and qualitative risks |
| 11 | Report Agent | Implemented | Synthesizes findings into narrative sections |
| 12 | Dashboard Delivery | Implemented | Provides interactive UX for final consumption |

## Implemented System Boundary

The current deployed prototype includes:

- **Cloudflare Pages Dashboard**: Integrated Research, Ops, and Evaluation interfaces.
- **Multi-Agent Backend**: 12-stage pipeline with real-time D1 trace logging.
- **Data Enrichment**: Integrated WoS, OpenAlex, Crossref, and Unpaywall APIs.
- **Output Engine**: Dynamic generation of CSV, Markdown, XLSX, and narrative PDF reports.
- **Benchmark Infrastructure**: Reproducible scripts comparing Rule-based, Single-LLM, and Multi-Agent models.

## Partial Or Planned Components

These components must be described as partial or planned, not as final completed claims:

- **Full Quota Scaling**: The 20-task benchmark fixture and gold audit are complete, but the full 20-task Proposed Agent runtime collection remains pending because provider quotas require batch execution.
- **Deep Semantic Vectorization**: Vectorize semantic ranking is available as an opt-in path, with keyword-metadata scoring as the current high-performance baseline.
- **External Archival**: Google Drive upload is conditional on OA PDF availability.

## Benchmark Claim Boundary

The safe benchmark claim is:
1. **Architectural Verification**: The deployed system successfully executes the end-to-end workflow on live jobs, while the repository benchmark defines T001-T020 as the full evaluation fixture.
2. **Controlled Comparison**: On the T001-T003 control layer, the Proposed Agent demonstrates strong metadata integrity and top-journal compliance, while the repository-grounded Single-LLM baseline has higher exact gold overlap.
3. **Reproducibility**: All benchmark metrics are generated from repository-grounded artifacts, not "cherry-picked" LLM chat sessions.

Do not claim universal performance dominance; emphasize **traceability, reproducibility, and architectural robustness** as the primary wins.

## Dashboard Demo Boundary

The live demo should show:

1. Open the dashboard Research route.
2. Run a keyword search with a conservative max result count.
3. Show job status and the 12-stage trace (proving role separation).
4. Open ranked papers and one paper detail panel (showing score breakdown).
5. Download narrative PDF and XLSX artifacts (showing synthesis).
6. Open Ops diagnostics to show infrastructure health (D1, R2, API readiness).
7. Open Evaluation to show baseline comparison metrics and implementation status labels.

## Professor Evaluation Mapping

| Criterion | Current evidence |
| --- | --- |
| Specific problem definition | High-friction, opaque, and fragmented business literature review process. |
| Agent design justification | 12-stage "White-box" workflow providing error isolation and traceability. |
| Baseline comparison | Automated scripts comparing Rule-based vs. Single-LLM vs. Multi-Agent outputs. |
| Limitations and ethics | Disclosure of provider quotas, journal-list bias, and the use of AI for qualitative critic. |
| Reproducibility | Monorepo with "One-Command" validation scripts and transparent D1 traces. |
| Benchmark quality | DOI-backed gold labels verified via Crossref and automated audit scripts. |
| Live demo | Deployed Cloudflare stack (Pages, Worker, D1, R2), with AI/Vectorize described only as opt-in/planned paths unless explicitly enabled for the demo. |

## Immediate Packaging Tasks

1. Convert `paper/final-paper-draft.tex` into the final manuscript structure.
2. Align `presentation/final-presentation-outline.md` to emphasize the "Problem -> Agent Rationale -> Traceable Evidence" story.
3. Verify that all claims in the paper are backed by `benchmark/` folder outputs.
4. Record any "Failures" or "AI Hallucinations" detected by the Critic Agent as part of the "Ethics & Limitations" section.
