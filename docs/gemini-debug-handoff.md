# Gemini Debug Handoff

Updated: 2026-05-26 (codex)

This file is the strict debug handoff for Gemini. Gemini must read this before changing Worker code, Worker scripts, Wrangler configuration, or Cloudflare-related docs.

## Non-Negotiable Startup Checks

Before touching Worker code or config, Gemini must run or inspect:

```bash
git status --short --branch
git log --oneline -8
```

Then read:

```text
GEMINI.md
docs/gemini-session-state.md
docs/local-worker-troubleshooting.md
docs/debug-log.md
docs/progress.md
CHANGELOG.md
```

Gemini must not rely on memory for Worker behavior. Re-check the files above every session.

## Confirmed Worker Debug Facts

- Production Worker read-only smoke passed with `npm run smoke:worker`. (codex)
- Production minimal search smoke passed with `RUN_SEARCH=true`, `SMOKE_MAX_RESULTS=1`, keyword `AI interview employer branding`. (codex)
- The confirmed production test job was `job-1ce620dd-1588-474c-b07b-61f76010e33b`. (codex)
- CSV, Markdown, XLSX, and PDF endpoints returned HTTP 200 for that job. (codex)
- Local Worker starts with `npm run dev:worker:local`. (codex)
- Local `/api/health` returns `ok: true`. (codex)
- Local `/api/diagnostics` can return `ok: false` when provider secrets are missing; this is expected unless `.dev.vars` is configured. (codex)
- `npm run smoke:worker:local` is designed for local no-secret read-only checks and sets `REQUIRE_READY=false`. (codex)

## Known Failure Pattern

Do not run:

```bash
npm run dev:worker -- --port 8787
```

This can be forwarded as `wrangler dev 8787`, causing:

```text
The entry-point file at "8787" was not found.
```

Use this instead:

```bash
npm run dev:worker:local
npm run smoke:worker:local
```

## Debug Decision Rules

- If production smoke passes but local diagnostics is not ready, check `.dev.vars` before changing source code. (codex)
- If local health passes but Wrangler prints `NOSENTRY RPC connection broken`, do not treat it as a source-code failure unless requests fail. (codex)
- If Worker code is changed, run `npm run typecheck`, `npm run build`, and the relevant smoke command. (codex)
- If Worker config is changed, explicitly document whether the required Cloudflare resource already exists. (codex)
- Do not add `AI` or `VECTOR_INDEX` bindings back to tracked Wrangler configs until a human confirms Cloudflare Workers AI and Vectorize setup. (codex)
- Do not commit `.dev.vars`, tokens, local attachment files, or worktree metadata. (codex)

## Required End-Of-Session Debug Record

When Gemini touches Worker behavior, it must update:

- `CHANGELOG.md` for the change. (gemini)
- `docs/progress.md` for handoff state. (gemini)
- `docs/debug-log.md` for the actual debug result. (gemini)
- `docs/gemini-session-state.md` with the final status snapshot. (gemini)

The debug record must include:

- exact command run
- pass/fail result
- job id if a search was created
- whether local secrets were configured
- whether a finding is source-code, local-env, or Cloudflare-runtime related

## Current Safe Baseline

- Personal repo `origin/main` contains the local Worker troubleshooting fix at commit `15210c7`. (codex)
- Current safe local no-secret check is `npm run smoke:worker:local`. (codex)
- Current safe production read-only check is `npm run smoke:worker`. (codex)
