# Paper Agent Project

AI Agent 기반 학술논문 탐색 및 문헌검토 자동화 시스템입니다.

이 저장소는 개인 GitHub repo에서 시작해 Cloudflare Pages 대시보드와 Cloudflare Workers backend를 함께 관리하는 monorepo입니다. 이후 GitHub Organization으로 이전해도 같은 구조를 유지할 수 있습니다.

## Architecture

```text
apps/web
  -> Cloudflare Pages dashboard
  -> calls Workers API

apps/worker
  -> Cloudflare Workers API
  -> D1 metadata
  -> R2 reports
  -> Vectorize abstract search
  -> Google Drive / OpenAlex / Crossref / Unpaywall tools
```

## Repository Structure

```text
apps/
  web/          # Frontend dashboard
  worker/       # Cloudflare Workers backend and agent workflow API
packages/
  shared/       # Shared types and scoring helpers
docs/
  prompts.md
  benchmark.md
benchmark/
  keywords.csv
```

## Local Development

Install dependencies after cloning:

```bash
npm install
```

Run the dashboard:

```bash
npm run dev:web
```

Run the Worker locally:

```bash
npm run dev:worker
```

## Cloudflare Setup

Create two Cloudflare projects from this single GitHub repository.

| Target | Cloudflare Product | Root directory |
| --- | --- | --- |
| Dashboard | Pages | `apps/web` |
| Backend API | Workers | `apps/worker` |

Recommended names:

- Pages: `paper-agent-dashboard`
- Worker: `paper-agent-worker`
- D1: `paper_agent_db`
- R2: `paper-agent-outputs`
- Vectorize: `paper-abstract-index`

## Required Secrets

Never commit real credentials. Use `.env.example` as a template and set production secrets in Cloudflare.

```text
OPENALEX_EMAIL
UNPAYWALL_EMAIL
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_DRIVE_FOLDER_ID
```

## MVP Flow

1. User enters a keyword in the dashboard.
2. Worker creates a search job.
3. Search Agent queries OpenAlex and Crossref.
4. Results are saved to D1.
5. Ranking Agent computes Top 5 papers.
6. Dashboard displays status, ranked papers, scores, and report links.

## Strict Change Tracking

Every meaningful repository change must update `CHANGELOG.md` in the same commit or pull request. This includes source code, infrastructure configuration, documentation, benchmark data, prompts, schema, and deployment behavior.

Pull requests must use `.github/pull_request_template.md` and confirm the changelog update checklist before merge.

## GitHub Remote

The personal repository is configured as `origin`:

```text
https://github.com/Vulter3653/paper-agent-project.git
```

The previous team test repository is preserved as `team-origin`.
