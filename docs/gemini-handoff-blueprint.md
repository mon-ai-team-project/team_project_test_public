# Gemini Handoff Blueprint

Updated: 2026-05-26 (codex)

This file is the immediate handoff note for Gemini. It complements, but does not replace, `AGENTS.md`, `GEMINI.md`, `docs/progress.md`, `docs/workflow.md`, and `CHANGELOG.md`.

## Required Startup

Run these commands before editing:

```bash
git status --short --branch
git log --oneline -8
```

Read these files in order:

```text
AGENTS.md
GEMINI.md
docs/agent-writing-rules.md
docs/progress.md
docs/workflow.md
docs/human-ai-work-split.md
docs/debug-log.md
CHANGELOG.md
```

Do not work from a previous chat transcript. Repository files are the source of truth.

## Current Branch And Repository Policy

- Continue on the personal repository first: `origin https://github.com/Vulter3653/paper-agent-project.git`.
- Do not push to the organization repository unless the user explicitly requests it.
- Keep all meaningful changes recorded in `CHANGELOG.md` with `(gemini)` attribution when Gemini edits the repository.
- If a change affects handoff, update `docs/progress.md`.
- If a change investigates a defect, validates a workflow, or records verification, update `docs/debug-log.md`.

## Current Implemented System

The project is a Cloudflare-based Paper Agent prototype with these implemented paths:

- Cloudflare Pages dashboard routes: `/dashboard/research`, `/dashboard/ops`, `/dashboard/evaluation`.
- Cloudflare Worker API for health, diagnostics, search jobs, traces, papers, critic flags, and report outputs.
- D1 persistence for search jobs, papers, evaluations, agent traces, critic flags, and job output metadata.
- R2 persistence for generated report artifacts when the bucket binding is available.
- Web of Science search provider with OpenAlex fallback/test path already represented in code and docs.
- Crossref metadata enrichment and Unpaywall OA enrichment with bounded enrichment limits.
- Conditional Google Drive upload for OA PDFs when service account credentials and folder sharing are configured.
- CSV, Markdown, XLSX, and PDF report endpoints.
- Read-only MCP Worker for system diagnostics and result inspection.

## Current Refactor State

The most recent codex work split Worker report/export generation out of `apps/worker/src/index.ts` into:

```text
apps/worker/src/reports.ts
```

The new module owns:

- CSV response and body generation.
- Markdown report response and body generation.
- XLSX workbook generation.
- PDF report generation.
- R2 output persistence helpers.
- Report output key and filename helpers.
- Report-specific critic summary helpers.
- `SearchResult`, `CriticFlag`, and `JobOutputRecord` shared Worker-side types.

`apps/worker/src/index.ts` now imports those helpers and should remain focused on:

- API routing.
- D1 schema bootstrap and persistence.
- Search job orchestration.
- Provider search and enrichment.
- Critic flag persistence.
- Agent trace persistence.
- JSON and CORS API utilities.

## Next Recommended Work

Human-only tasks remain deferred. Benchmark/performance work is also deferred until team outputs are integrated. Continue with AI-safe repository work in this order:

1. Verify the Worker report module split after this handoff commit.
2. Improve source-code modularity further by extracting provider/enrichment logic from `apps/worker/src/index.ts` into focused modules such as `providers.ts`, `enrichment.ts`, or `persistence.ts`.
3. Keep each extraction behavior-preserving and run verification after each step.
4. Avoid changing Cloudflare production settings unless the user explicitly asks.

## Verification Baseline

For source-code changes, run:

```bash
npm run typecheck
npm run build:web
npm run build
git diff --check
```

For Worker endpoint smoke after deployment, use the existing scripts documented in `docs/staging-testbed.md` and `docs/human-ai-work-split.md`.

## Known Deferred Items

- PDF visual quality enhancement is intentionally deferred.
- Remote staging smoke requires actual Cloudflare staging Worker/Pages/D1/R2/MCP resources and remains human-gated.
- Benchmark and performance improvement should wait for team result integration unless the user changes priority.
- Organization main updates should happen later through reviewed integration, not automatically from this personal repo work.

## Handoff Status

- This handoff was prepared after the Worker report module split was made buildable. (codex)
- Gemini should start by checking the latest commit, then continue from `docs/gemini-handoff-blueprint.md`. (codex)
