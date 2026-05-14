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
  -> Google Drive / Web of Science / Crossref / Unpaywall tools

apps/mcp
  -> Cloudflare Remote MCP server
  -> read-only D1/R2 inspection tools for agent clients
```

## Repository Structure

```text
apps/
  web/          # Frontend dashboard
  worker/       # Cloudflare Workers backend and agent workflow API
  mcp/          # Cloudflare Remote MCP server
packages/
  shared/       # Shared types and scoring helpers
docs/
  workflow.md
  mcp.md
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

Run the Remote MCP Worker locally:

```bash
npm run dev:mcp
```

Deploy the Remote MCP Worker:

```bash
npm run deploy:mcp
```

Verify the deployed Remote MCP Worker:

```bash
npm run smoke:mcp
```

To test another endpoint or a specific D1 job:

```bash
MCP_URL=https://paper-agent-mcp.shch3653.workers.dev/mcp MCP_JOB_ID=job-... npm run smoke:mcp
```

## Cloudflare Setup

Create three Cloudflare projects from this single GitHub repository.

| Target | Cloudflare Product | Root directory |
| --- | --- | --- |
| Dashboard | Pages | `apps/web` |
| Backend API | Workers | `apps/worker` |
| Remote MCP | Workers | `apps/mcp` |

Recommended names:

- Pages: `paper-agent-dashboard`
- Worker: `paper-agent-project`
- MCP Worker: `paper-agent-mcp`
- D1: `paper_agent_db`
- R2: `paper-agent-outputs`
- Vectorize: `paper-abstract-index`

## Required Secrets

Never commit real credentials. Use `.env.example` as a template and set production secrets in Cloudflare.

```text
WOS_API_KEY
CROSSREF_EMAIL
UNPAYWALL_EMAIL
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_DRIVE_FOLDER_ID
```

## MVP Flow

1. User enters a keyword in the dashboard.
2. Worker creates a search job.
3. Search Agent queries Web of Science and Crossref.
4. Results are saved to D1.
5. Ranking Agent computes Top 5 papers.
6. CSV and Markdown report outputs are stored in R2 when the `REPORTS` binding is available.
7. Dashboard displays status, ranked papers, scores, and report links.

## Strict Change Tracking

Every meaningful repository change must update `CHANGELOG.md` in the same commit or pull request. This includes source code, infrastructure configuration, documentation, benchmark data, prompts, schema, and deployment behavior.

Pull requests must use `.github/pull_request_template.md` and confirm the changelog update checklist before merge.

## Session Handoff

Before ending any work session, update `docs/progress.md`. This file is the required handoff source for the next session and must include current status, verification results, deployment URLs, blockers, local-only state, and the next concrete tasks.

Any update to `docs/progress.md` must also be recorded in `CHANGELOG.md`.

## GitHub Remote

The personal repository is configured as `origin`:

```text
https://github.com/Vulter3653/paper-agent-project.git
```

The previous team test repository is preserved as `team-origin`.
