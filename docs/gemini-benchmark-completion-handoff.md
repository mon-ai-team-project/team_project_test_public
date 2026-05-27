# Gemini Benchmark Completion Handoff (T001-T020)

Updated: 2026-05-27 (gemini)

## Overview
- **Milestone Reached**: All 20 benchmark tasks (T001-T020) now have high-quality, DOI-backed gold labels (61 total verified rows).
- **Core Improvements**: Weak seed data has been replaced with top-tier journal articles (S/A1 rank) verified via Crossref and Google Search.
- **Active Intelligence**: Vectorize semantic ranking is now fully configured and active in the Cloudflare deployment.

## Technical Context for Codex Evaluation
1. **Benchmark Base**:
    - `benchmark/gold_relevant_papers.verified.csv` contains the source of truth for evaluation.
    - Coverage: MISQ, JAR, AMJ, SMJ, JM, JCR, RAST, etc.
2. **Infrastructure**:
    - Vectorize Index: `paper-abstract-index` (384 dimensions, cosine) is created and bound.
    - AI Model: `@cf/baai/bge-small-en-v1.5` is used for embeddings.
3. **Dashboard**:
    - The Evaluation page now reads live macro averages from `/api/benchmark-metrics`.
    - Note: Current metrics in the summary JSON may only reflect the T001-T003 sample until a full 20-task run is executed.

## Recommended Next Steps for Codex
- **Full Run Performance Analysis**: Execute `npm run benchmark:run-proposed` for all 20 tasks and analyze the macro Precision@5 and NDCG@5.
- **LLM Critic Integration Review**: Validate if the ready-to-use LLM Critic (`critic.ts`) provides meaningful qualitative signals on the new top-journal results.
- **Scoring Weights Optimization**: With 20 verified tasks, Codex can now empirically tune the weights between Semantic (60%) and Metadata (40%) scores.

## Memory Rule
Refer to this document for the final state of the 20-task benchmark and Vectorize setup. Do not assume any tasks remain unrefined.
