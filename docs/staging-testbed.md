# Staging Test Bed

Updated: 2026-05-25

This project uses the personal repository as the active development source of truth. The staging test bed exists to verify Worker, Pages, MCP, D1, R2, and benchmark flows before production-facing changes are treated as stable.

## Purpose

Use staging to test real Cloudflare behavior without polluting production data.

Staging must verify:

- Worker health and diagnostics.
- D1 schema compatibility.
- Web of Science, Crossref, and Unpaywall readiness.
- Search job creation and step progression.
- CSV, Markdown, XLSX, and PDF report output.
- R2 report object creation.
- MCP read-only tool access.
- Dashboard routing and API connectivity.

## Recommended Cloudflare Resources

Create these resources separately from production:

| Resource | Production | Staging |
| --- | --- | --- |
| Worker API | `paper-agent-project` | `paper-agent-project-staging` |
| Dashboard Pages | `paper-agent-dashboard` or current Pages project | `paper-agent-dashboard-staging` |
| MCP Worker | `paper-agent-mcp` | `paper-agent-mcp-staging` |
| D1 database | `paper_agent_db` | `paper_agent_db_staging` |
| R2 bucket | `paper-agent-outputs` | `paper-agent-outputs-staging` |

Do not reuse production D1 or production R2 for staging runs.

## Required Secrets

Configure these on the staging Worker service:

```text
WOS_API_KEY
CROSSREF_EMAIL
UNPAYWALL_EMAIL
```

Optional temporary fallback secrets:

```text
SEARCH_PROVIDER=openalex
OPENALEX_EMAIL
OPENALEX_API_KEY
```

Rules:

- Store real values only in Cloudflare variables/secrets.
- Do not commit `.dev.vars`, `.env`, API keys, or copied dashboard secret values.
- Keep staging WoS runs small because API quota is limited.

## Create Staging D1

Cloudflare dashboard path:

```text
Workers & Pages
-> D1
-> Create database
```

Use:

```text
Database name: paper_agent_db_staging
```

After creation, record the generated database ID outside public docs if it is sensitive for your workflow, then apply the schema.

Recommended schema source:

```text
apps/worker/schema.sql
```

If applying manually in the D1 Console, run the schema first, then only run missing migration files if diagnostics reports missing columns:

```text
apps/worker/migrations/0002_add_crossref_columns.sql
apps/worker/migrations/0003_add_unpaywall_columns.sql
apps/worker/migrations/0004_add_evaluation_score_columns.sql
apps/worker/migrations/0005_add_search_job_result_counts.sql
```

Validation query:

```sql
PRAGMA table_info(search_jobs);
PRAGMA table_info(papers);
PRAGMA table_info(evaluations);
```

## Create Staging R2

Cloudflare dashboard path:

```text
R2
-> Create bucket
```

Use:

```text
Bucket name: paper-agent-outputs-staging
Location: Automatic
Storage class: Standard
```

Validation after a completed staging job:

```text
reports/<job_id>/papers.csv
reports/<job_id>/report.md
```

## Worker Staging Config

The current production Worker config is:

```text
apps/worker/wrangler.toml
```

For staging, copy the example config only after the staging D1 database ID exists:

```bash
cp apps/worker/wrangler.staging.example.toml apps/worker/wrangler.staging.toml
```

Then replace `<staging-d1-database-id>` in:

```text
apps/worker/wrangler.staging.toml
```

Tracked example file:

```toml
name = "paper-agent-project-staging"
main = "src/index.ts"
compatibility_date = "2026-05-03"

[[d1_databases]]
binding = "DB"
database_name = "paper_agent_db_staging"
database_id = "<staging-d1-database-id>"

[[r2_buckets]]
binding = "REPORTS"
bucket_name = "paper-agent-outputs-staging"
```

Deploy command:

```bash
npx wrangler deploy --config apps/worker/wrangler.staging.toml
```

## MCP Staging Config

The current production MCP config is:

```text
apps/mcp/wrangler.toml
```

For staging, copy the example config only after the staging D1 database ID exists:

```bash
cp apps/mcp/wrangler.staging.example.toml apps/mcp/wrangler.staging.toml
```

Then replace `<staging-d1-database-id>` in:

```text
apps/mcp/wrangler.staging.toml
```

Tracked example file:

```toml
name = "paper-agent-mcp-staging"
main = "src/index.ts"
compatibility_date = "2026-05-03"
compatibility_flags = ["nodejs_compat"]

[[durable_objects.bindings]]
name = "MCP_OBJECT"
class_name = "PaperAgentMcp"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["PaperAgentMcp"]

[[d1_databases]]
binding = "DB"
database_name = "paper_agent_db_staging"
database_id = "<staging-d1-database-id>"

[[r2_buckets]]
binding = "REPORTS"
bucket_name = "paper-agent-outputs-staging"
```

Deploy command:

```bash
npx wrangler deploy --config apps/mcp/wrangler.staging.toml
```

## Pages Staging

Create a separate Cloudflare Pages project:

```text
Project name: paper-agent-dashboard-staging
Repository: Vulter3653/paper-agent-project
Production branch: staging
Root directory: /
Build command: npm run build:web:staging
Build output directory: apps/web/dist
```

Set:

```text
VITE_API_BASE_URL=https://paper-agent-project-staging.<account-subdomain>.workers.dev
```

Tracked frontend staging examples:

```text
apps/web/.env.staging.example
apps/web/wrangler.staging.example.toml
```

Local Pages staging build/deploy commands:

```bash
npm run build:web:staging
npm run deploy:web:staging
```

If no staging branch exists yet, create it from personal `main` only after local checks pass.

## Smoke Test Procedure

Run locally before deploying:

```bash
npm run typecheck
npm run build:web
npm run smoke:mcp
```

Root staging convenience commands:

```bash
npm run deploy:worker:staging
npm run deploy:mcp:staging
npm run deploy:web:staging
npm run smoke:worker:staging
npm run smoke:mcp:staging
npm run staging:check
```

`npm run staging:check` uses `STAGING_WORKER_URL` and `STAGING_MCP_URL` when set. If they are not set, it falls back to:

```text
https://paper-agent-project-staging.shch3653.workers.dev
https://paper-agent-mcp-staging.shch3653.workers.dev/mcp
```

Run a no-quota Worker smoke check against production or staging:

```bash
npm run smoke:worker
WORKER_URL=https://paper-agent-project-staging.<account-subdomain>.workers.dev npm run smoke:worker
```

This checks:

```text
GET /api/health
GET /api/diagnostics
GET /api/search-jobs?limit=3
```

After staging deploy, run one low-quota search only when needed:

```bash
WORKER_URL=https://paper-agent-project-staging.<account-subdomain>.workers.dev RUN_SEARCH=true SMOKE_MAX_RESULTS=3 npm run smoke:worker
```

The search mode additionally checks:

```text
POST /api/search-jobs
GET /api/search-jobs/:id
GET /api/search-jobs/:id/papers.csv
GET /api/search-jobs/:id/report.md
GET /api/search-jobs/:id/papers.xlsx
GET /api/search-jobs/:id/report.pdf
```

Use a low quota request:

```json
{
  "keyword": "AI interview employer branding",
  "maxResults": 3,
  "yearStart": 2020,
  "yearEnd": 2026
}
```

Expected diagnostics:

```json
{
  "ok": true,
  "db": {
    "bound": true,
    "missingColumns": []
  },
  "env": {
    "wosApiKey": true,
    "crossrefEmail": true,
    "unpaywallEmail": true,
    "r2Reports": true
  }
}
```

## Promotion Rule

Promote staging work to the personal `main` production path only when:

- Local typecheck passes.
- Web build passes.
- Staging diagnostics return `ok: true`.
- One low-quota staging search completes or fails with a known external quota/auth reason.
- CSV, Markdown, XLSX, and PDF endpoints return HTTP 200 for a completed job.
- R2 contains the expected report objects for CSV, Markdown, XLSX, and PDF.
- `CHANGELOG.md` and `docs/progress.md` are updated.
- Defect investigations are recorded in `docs/debug-log.md`.

## Team Integration Rule

Team-member files from the organization repository should be imported into the personal repository only after review.

Safe import targets:

```text
jin23624_cpu/
juilie_bot_hub/
shonshinemin_cmd/
benchmark/manual_review_proposed.csv
benchmark/gold_relevant_papers.csv
benchmark/gold_relevant_papers.verified.csv
benchmark/proposed_agent_metrics.csv
benchmark/proposed_agent_metrics_summary.json
```

Do not import team branch versions of these files without maintainer review:

```text
apps/
packages/
wrangler.toml
apps/*/wrangler.toml
CHANGELOG.md
docs/progress.md
docs/debug-log.md
```

The maintainer should consolidate project-level history files manually.
