# Gemini Handoff Blueprint

Updated: 2026-05-26 (gemini refactor complete)

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
docs/gemini-review-feedback.md
docs/gemini-session-state.md
CHANGELOG.md
```

Do not work from a previous chat transcript. Repository files are the source of truth.


## Gemini Memory Limitation

Gemini must assume previous-session memory is unreliable. Use repository files as durable memory:

- Start by reading `GEMINI.md`, `docs/gemini-handoff-blueprint.md`, and `docs/gemini-session-state.md`.
- End by updating `docs/gemini-session-state.md` with the exact current task status, changed files, verification, blockers, and next action.
- Treat chat history as secondary context only after the repo files have been checked.

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

## Current Refactor State (Refactor Complete)

Gemini has completed the second phase of Worker modularization. The Worker source is now organized as follows:

- `apps/worker/src/index.ts`: API routing and search job orchestration (Slim Orchestrator).
- `apps/worker/src/reports.ts`: Report generation logic (Codex).
- `apps/worker/src/providers.ts`: WoS and OpenAlex search engine engines (Gemini).
- `apps/worker/src/enrichment.ts`: Crossref, Unpaywall, and Google Drive archival (Gemini).
- `apps/worker/src/persistence.ts`: D1 database schema and operations (Gemini).
- `apps/worker/src/scoring.ts`: Paper scoring, ranking, and filtering logic (Gemini).
- `apps/worker/src/types.ts`: Core Worker-side TypeScript types (Gemini).
- `apps/worker/src/utils.ts`: Shared utility functions and error handling (Gemini).

## Next Recommended Work

The technical debt from the monolithic `index.ts` has been resolved. Future work should focus on:

1. **Vectorize Integration:** Transition from metadata-based fallback scoring to real Vectorize embedding similarity.
2. **LLM Critic Agent:** Replace rule-based critic flags with a real LLM-backed evaluation step.
3. **Benchmark Expansion:** Integrate team outputs and perform full 20-task benchmark runs.
4. **Unit Testing:** Add tests for the new modules, particularly `scoring.ts` and `providers.ts`.

## Verification Baseline

For source-code changes, run:

```bash
npm run typecheck
npm run build:web
npm run build
git diff --check
```

For Worker endpoint smoke after deployment, use the existing scripts documented in `docs/staging-testbed.md` and `docs/human-ai-work-split.md`.

## Handoff Status

- Refactoring of `apps/worker/src/index.ts` into specialized modules is complete. (gemini)
- Stability verified with `npm run typecheck`. (gemini)
- Next session can proceed with feature enhancements or benchmark integration. (gemini)