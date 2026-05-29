# Cloudflare Worker Build Troubleshooting

Updated: 2026-05-27

This document records the Worker build/deploy incident resolved on 2026-05-27 and the checks required to prevent recurrence.

## Incident Summary

Cloudflare Worker Builds failed before the build command could run. Two separate repository-state defects caused the failures:

1. The repository-root `wrangler.toml` contained unresolved merge-conflict markers.
2. `.worktrees/agent-traces` was accidentally tracked as a Git gitlink/submodule entry without a `.gitmodules` definition.

The deployed Worker runtime was healthy during much of the incident, so the failure was a Git Build / deploy-source problem rather than a D1, R2, WoS, or Worker runtime problem.

## Symptoms

Observed Cloudflare Build failures:

```text
Invalid TOML document: only letter, numbers, dashes and underscores are allowed in keys
wrangler.toml:12:0:
  12 │ <<<<<<< HEAD
```

Then, after `wrangler.toml` was fixed:

```text
Failed: error occurred while updating repository submodules
```

Runtime checks that remained healthy:

```text
GET /api/health
GET /api/diagnostics
GET /api/search-jobs
```

Valid download routes were confirmed with GET requests:

```text
/api/search-jobs/:jobId/papers.csv
/api/search-jobs/:jobId/report.md
/api/search-jobs/:jobId/papers.xlsx
/api/search-jobs/:jobId/report.pdf
```

Do not use `results.csv` or `report.xlsx`; those are not current Worker routes.

## Root Causes

### 1. Root `wrangler.toml` Conflict Markers

Cloudflare Worker Builds were configured with:

```text
Root directory: /
Build command: npm run build
Deploy command: npx wrangler deploy
```

Because `npx wrangler deploy` runs from repository root, Wrangler reads root `wrangler.toml`. The root file still contained:

```text
< < < < < < < HEAD
= = = = = = =
> > > > > > > origin/main
```

It also contained unconfirmed AI/Vectorize bindings:

```toml
[ai]
binding = "AI"

[[vectorize]]
binding = "VECTOR_INDEX"
index_name = "paper-abstract-index"
```

Those bindings were not confirmed production bindings and were removed from root config. The confirmed production root config is:

```toml
name = "paper-agent-project"
main = "apps/worker/src/index.ts"
compatibility_date = "2026-05-03"

[[d1_databases]]
binding = "DB"
database_name = "paper_agent_db"
database_id = "4d622431-3574-4e04-a359-dada93e97438"

[[r2_buckets]]
binding = "REPORTS"
bucket_name = "paper-agent-outputs"
```

### 2. Accidental Gitlink/Submodule

The repository had this tracked entry:

```text
160000 commit 36eada6f684eef1f516d723be014590718c580dc .worktrees/agent-traces
```

That means Git treated `.worktrees/agent-traces` as a submodule/gitlink. There was no `.gitmodules` file, so Cloudflare failed while updating repository submodules.

The fix was to remove the gitlink from tracking while keeping `.worktrees/` ignored:

```bash
git rm --cached .worktrees/agent-traces
```

`.gitignore` already includes:

```text
.worktrees/
```

## Final Fixed Commits

Personal repository `Vulter3653/paper-agent-project`:

```text
8f87038 fix: remove personal worktree gitlink
4369a10 fix: clean root wrangler config
```

Organization repository `mon-ai-team-project/team_project_test_public`:

```text
17530c8 fix: remove tracked worktree gitlink (#14)
2934326 fix: clean organization wrangler config
```

## Verification Commands

Run these before retrying a Cloudflare Git Build:

```bash
git ls-remote --heads origin main
git show origin/main:wrangler.toml
git ls-tree -r origin/main | rg '160000|worktrees'
find . -maxdepth 3 -name .gitmodules -print
npm run build --workspace apps/worker
npx wrangler deploy --dry-run
```

Expected results:

- `origin/main:wrangler.toml` has no conflict markers.
- `git ls-tree -r origin/main | rg '160000|worktrees'` returns no tracked worktree/gitlink entries.
- No `.gitmodules` file exists unless a real submodule is intentionally added.
- Worker build passes.
- Wrangler dry-run lists only confirmed bindings: `DB` and `REPORTS`.

Runtime checks:

```bash
curl -sS https://paper-agent-project.shch3653.workers.dev/api/health
curl -sS https://paper-agent-project.shch3653.workers.dev/api/diagnostics
curl -sS https://paper-agent-project.shch3653.workers.dev/api/search-jobs
```

Expected runtime state:

- `ok: true`
- `searchProvider: "wos"`
- `db.bound: true`
- `db.missingColumns: []`
- `readiness.activeProviderReady: true`

## Cloudflare Build Rule

When Cloudflare shows a failed build, always check the commit SHA shown in the build detail.

If the failed build targets an old commit, do not keep retrying that build. Push or select a fresh build from the latest `main` commit.

Known stale failed commit:

```text
0bfa894
```

That commit still had broken root `wrangler.toml` content.

Current fixed personal build baseline:

```text
8f87038
```

## Recurrence Prevention

Before pushing to any repo connected to Cloudflare Worker Builds:

```bash
rg -n '<<<<<<<|=======|>>>>>>>' wrangler.toml apps/worker/wrangler.toml apps/mcp/wrangler.toml apps/web/wrangler.toml

git ls-files -s | rg '^160000'

git diff --check

npm run build --workspace apps/worker

npx wrangler deploy --dry-run
```

Do not commit `.worktrees/`, local worktree paths, generated local clone directories, `.wrangler/`, `.dev.vars`, or local secret files.

If AI/Vectorize bindings are reintroduced, they must be confirmed in Cloudflare first and documented in `docs/progress.md`, `docs/debug-log.md`, and `CHANGELOG.md` in the same PR.

## Current Status

As of 2026-05-27, the Worker is operational and artifact downloads were confirmed:

- CSV: `papers.csv`
- Markdown: `report.md`
- XLSX: `papers.xlsx`
- PDF: `report.pdf`

The Worker root path `/` may return `{ "error": "Not found" }`; that is expected. Use `/api/health` for health checks and Pages for the dashboard UI.
