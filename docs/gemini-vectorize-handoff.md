# Gemini Vectorize & Semantic Ranking Handoff

Updated: 2026-05-27 (gemini)

## Context & Intent
- **Goal**: 정교한 논문 추천을 위해 키워드 매칭 중심의 랭킹을 **Embedding 기반의 의미론적 유사도(Semantic Similarity)** 체계로 전환함.
- **Status**:
    - `apps/worker/src/vectorize.ts`에 핵심 로직 구현 완료.
    - `wrangler.toml`에 `AI` 및 `VECTOR_INDEX` 바인딩 설정 완료 및 `origin/main` 반영 완료.
    - 현재 모델: `@cf/baai/bge-small-en-v1.5` (384 Dimensions).

## Infrastructure Setup (Action Required)
- **Vectorize Index**: `paper-abstract-index` 이름으로 인덱스 생성이 필요함.
    - Command: `npx wrangler vectorize create paper-abstract-index --dimensions=384 --metric=cosine`
- **Deployment**: `origin/main`에 설정이 반영되었으므로 Cloudflare 배포 확인 필요.

## Implementation Details
1. **Upsert Phase**: 검색된 모든 논문(제목 + 초록)을 벡터화하여 Vectorize DB에 저장 (`upsertPaperVectors`).
2. **Query Phase**: 사용자 연구 질문을 벡터화하여 코사인 유사도 기반 검색 수행 (`getSemanticRelevance`).
3. **Scoring Phase**: `scoring.ts`에서 시맨틱 점수를 60% 비중으로 반영하여 최종 랭킹 산출.

## Recommended Feedback & Next Steps (for Codex)
- **Model Upgrade**: 현재 `small` 모델 사용 중. 성능 향상을 위해 `@cf/baai/bge-large-en-v1.5` (1024 Dimensions)로의 업그레이드 검토 권장. (인덱스 재생성 필요)
- **Scoring Weight**: 현재 `semanticScores`가 없을 경우 fallback 로직이 작동함. 시맨틱 점수와 기존 메타데이터 점수의 가중치(현재 6:4 추정) 최적화 필요.
- **Batching**: 다량의 논문 임베딩 시 `createEmbeddings`의 속도 및 Worker 타임아웃 제한 준수 여부 모니터링 필요.

## Memory Rule
This file is the source of truth for Vectorize integration. Do not rely on session memory for dimension sizes or binding names.
