# Project Handoff & Rules (2026-05-17)

이 repository는 Vulter3653/paper-agent-project 이며, 현재 main 브랜치 기준으로 이어서 작업한다.

작업 시작 전 반드시 다음을 확인하라.

1. 현재 상태 확인
git status --short --branch
git log --oneline -8

2. 필수 인계 문서 확인
docs/progress.md
docs/debug-log.md
CHANGELOG.md
README.md

3. 현재 기준 상태
- Cloudflare Pages 대시보드: https://paper-agent-project.pages.dev/
- Worker API: https://paper-agent-project.shch3653.workers.dev
- MCP Worker: https://paper-agent-mcp.shch3653.workers.dev/mcp
- D1 database ID: 4d622431-3574-4e04-a359-dada93e97438
- R2 bucket: paper-agent-outputs
- 최신 주요 커밋:
    - 91799a4 feat: show journal field rank
    - b4826d6 docs: record category search confirmation
    - eb2dbe3 feat: add journal category search priority

4. 반드시 유지할 규칙
- 모든 작업 내역 및 문서 업데이트 시 작업자 명칭을 엄격하게 병기한다.
- 작업 이력은 반드시 `Label: description. (agent-id)` 형식을 사용한다.
- Gemini가 작성한 작업은 **(gemini)**, Codex가 작성한 작업은 **(codex)**로 기록한다.
- 다른 에이전트가 작성한 기존 attribution을 임의로 삭제하거나 변경하지 않는다.
- 의미 있는 코드/문서/설정 변경 시 반드시 CHANGELOG.md를 수정한다.
- 세션 종료 전 반드시 docs/progress.md를 최신 상태로 수정한다.
- 디버깅, 오류, 검증 결과는 반드시 docs/debug-log.md에 기록한다.
- UI/UX 실험 및 테스트 작업은 **`apps/web/src/test-prototype/`** 경로에서 독립적으로 수행하며, 운영 코드(`main.tsx` 등)를 직접 수정하지 않는다.
- 기존 미추적 참조 파일은 삭제하거나 커밋하지 않는다.
    - AI_Agent_프로젝트_전체_통합본.pdf
    - 경영대학 학술지 목록.docx
- 사용자 변경사항을 임의로 되돌리지 않는다.
- Cloudflare, D1, R2, Worker, Pages 설정 변경 시 문서에 정확히 기록한다.

5. 현재 구현 완료 상태
- Web of Science 기반 검색 작동
- 대시보드 Run 작동
- D1 저장 작동
- R2 CSV/Markdown report 저장 작동
- 경영대학 학술지 목록 기반 allowlist 작동
- 대시보드 Field 선택 작동
- 선택 Field 기준 국제 S급 우선, 국제 A1급 후순위 검색 작동
- 선택 Field 외 학술지는 결과에서 제외
- 결과 테이블/상세/CSV/Markdown report에 Field / Rank 표시 구현
- 예: 2. 조직인사 / 국제 S급

6. 작업 전 검증 명령
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/worker/wrangler.toml

7. 다음 추천 작업
우선순위 1:
검색 설정 요약 바를 추가한다.
대시보드에서 현재 job의 검색 조건을 명확히 보여준다.
표시 항목:
- keyword
- selected field
- priority order: 국제 S급 -> 국제 A1급
- year range
- max results
- source / allowed count

우선순위 2:
Recent Jobs에 검색 조건을 표시한다.
- keyword
- field
- year range
- source / allowed count
- status
- score, year, citation 정렬

8. 작업 완료 전 필수 수행
npm run typecheck
npm run build
npx wrangler deploy --dry-run --config apps/worker/wrangler.toml
git status --short
CHANGELOG.md 업데이트 확인
docs/progress.md 업데이트 확인
docs/debug-log.md 업데이트 확인

9. 커밋/푸시 규칙
검증이 통과하면 관련 파일만 스테이징한다. 참조 PDF/DOCX는 커밋하지 않는다.

예:
git add CHANGELOG.md docs/progress.md docs/debug-log.md apps/web/src/main.tsx apps/web/src/styles.css apps/worker/src/index.ts packages/shared/src/index.ts packages/shared/src/businessSchoolJournals.ts
git commit -m "feat: add search settings summary"
git push

10. 최종 응답에는 다음을 포함하라
- 변경 요약
- 검증 결과
- 커밋 해시
- 배포 후 확인해야 할 항목
- 남은 작업
