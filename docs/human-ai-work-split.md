# Human And AI Agent Work Split

Updated: 2026-05-25 (codex)

This file separates work that must be done by a human operator from work that an AI agent can safely perform in this repository. It is intended for staging setup, production promotion, and future handoff.

## Rule Of Thumb

Human operators handle external accounts, secrets, billing, approvals, and destructive production decisions.

AI agents handle repository edits, scripts, documentation, local verification, generated checklists, and non-destructive diagnostics.

AI agents must follow:

- `AGENTS.md`
- `docs/agent-writing-rules.md`
- `docs/staging-testbed.md`
- `CHANGELOG.md`

Every meaningful change must update `CHANGELOG.md`. Handoff-impacting work must update `docs/progress.md`. Debugging or verification work must update `docs/debug-log.md`.

## Human-Only Work

| Area | Human responsibility | Reason |
| --- | --- | --- |
| Cloudflare account | Create or delete Workers, Pages projects, D1 databases, R2 buckets, Vectorize indexes, API tokens, and custom domains. | Requires account authority, billing context, and irreversible resource decisions. |
| Billing | Resolve R2/Workers/Pages/D1 billing or plan limitations. | AI agents must not make payment or plan decisions. |
| Secrets | Enter `WOS_API_KEY`, `CROSSREF_EMAIL`, `UNPAYWALL_EMAIL`, OpenAlex keys, Google service-account values, and Cloudflare/GitHub tokens. | Secrets must never be pasted into committed files or chat logs unless explicitly required and safe. |
| OAuth/API portals | Register Clarivate/WoS applications, approve subscriptions, generate API keys, and manage institutional access. | Requires identity, institution, and legal/API terms awareness. |
| GitHub access | Create PATs, approve organization repository access, set branch protection/rulesets, and approve/merge protected PRs. | Requires account-level permission and accountability. |
| Production promotion | Decide when staging changes are safe to promote to production. | Requires project owner judgment and acceptance of user-facing risk. |
| Destructive operations | Delete databases, buckets, Workers, Pages projects, secrets, or production branches. | High-risk and often irreversible. |
| Data policy | Decide whether PDFs, external metadata, or institutional-access materials can be stored or shared. | Requires legal/academic policy judgment. |

## AI-Agent-Allowed Work

| Area | AI agent can do | Boundaries |
| --- | --- | --- |
| Code changes | Edit Worker, Web, MCP, shared packages, scripts, docs, and tests. | Must stay scoped to the assignment and preserve existing user/team changes. |
| Documentation | Maintain `docs/workflow.md`, `docs/staging-testbed.md`, `docs/progress.md`, `docs/debug-log.md`, and handoff docs. | Must use required attribution such as `(codex)`, `(gemini)`, or `(claude)`. |
| Staging config templates | Create or update `*.example.toml`, `.env.*.example`, and script examples. | Must not commit real IDs if the team treats them as sensitive, and must never commit secrets. |
| Local verification | Run `npm run typecheck`, `npm run build`, `npm run build:web:staging`, `node --check`, smoke scripts, and non-destructive reads. | Remote commands requiring credentials should use existing approved credentials only. |
| Smoke diagnostics | Run `npm run smoke:worker`, `npm run smoke:mcp`, and staging variants after humans create resources. | Low-quota search mode must be explicit. |
| Git workflow | Commit and push to the personal repo when requested or when completing assigned personal-repo work. | Do not push to organization main unless explicitly requested. |
| Issue triage | Inspect logs, API responses, build failures, and dashboard behavior. | Do not expose secrets in logs or docs. |
| Benchmark files | Prepare scripts, schemas, and result templates. | Benchmark/performance work is deferred until team results are integrated unless user reprioritizes it. |

## Staging Setup Split

### Human Must Do

1. Create Cloudflare D1 database `paper_agent_db_staging`.
2. Create Cloudflare R2 bucket `paper-agent-outputs-staging`.
3. Create or authorize Worker service `paper-agent-project-staging`.
4. Create or authorize MCP Worker `paper-agent-mcp-staging`.
5. Create Pages project `paper-agent-dashboard-staging`.
6. Add staging Worker secrets and variables:
   - `WOS_API_KEY`
   - `CROSSREF_EMAIL`
   - `UNPAYWALL_EMAIL`
   - optional `SEARCH_PROVIDER=openalex`
   - optional OpenAlex and Google Drive credentials
7. Add Pages staging environment variable:
   - `VITE_API_BASE_URL=https://paper-agent-project-staging.<account-subdomain>.workers.dev`
8. Decide whether staging uses WoS or OpenAlex for quota control.
9. Approve production promotion after staging verification.

### AI Agent Can Do

1. Copy staging example configs after the human provides the staging D1 database ID:
   - `apps/worker/wrangler.staging.example.toml` -> `apps/worker/wrangler.staging.toml`
   - `apps/mcp/wrangler.staging.example.toml` -> `apps/mcp/wrangler.staging.toml`
2. Insert the staging D1 ID into local untracked staging config files.
3. Run local checks:
   - `npm run typecheck`
   - `npm run build:web:staging`
   - `npm run build`
4. Deploy staging when credentials are configured and the user asks:
   - `npm run deploy:worker:staging`
   - `npm run deploy:mcp:staging`
   - `npm run deploy:web:staging`
5. Run remote smoke checks after resources exist:
   - `npm run smoke:worker:staging`
   - `npm run smoke:mcp:staging`
   - `npm run staging:check`
6. Record results in `docs/debug-log.md` and `docs/progress.md`.

## Production Promotion Split

### Human Must Approve

- Confirm staging diagnostics are acceptable.
- Confirm one low-quota staging job is acceptable, or confirm failure is caused by known quota/auth limits.
- Confirm report artifacts download correctly.
- Confirm no secrets or staging-only values are committed.
- Approve production deployment or merge.

### AI Agent Can Execute After Approval

- Re-run final local checks.
- Update docs and changelog.
- Push personal repo `origin/main`.
- Provide exact Cloudflare settings to check.
- Run production smoke checks if credentials and permissions allow.

## Do Not Allow AI Agents To Do Without Explicit Human Approval

- Create paid resources.
- Delete Cloudflare resources.
- Rotate or reveal secrets.
- Force push protected branches.
- Merge organization PRs into protected main.
- Change production custom domains.
- Store non-OA PDFs or institution-only full texts.
- Increase API quota usage beyond the user's requested test.

## Current Next Human Action

Create the staging Cloudflare resources first:

1. D1: `paper_agent_db_staging`
2. R2: `paper-agent-outputs-staging`
3. Worker: `paper-agent-project-staging`
4. MCP Worker: `paper-agent-mcp-staging`
5. Pages: `paper-agent-dashboard-staging`

Then provide the staging D1 database ID or confirm it has been inserted into local untracked staging config files.
