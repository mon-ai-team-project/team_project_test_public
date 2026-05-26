# Gemini Session State

Updated: 2026-05-26 (codex)

This file exists because Gemini may not retain prior-session memory. Gemini must read and update this file at the start and end of every substantial session.

## Current Source Of Truth

Read these files before editing:

- `AGENTS.md`
- `GEMINI.md`
- `docs/agent-writing-rules.md`
- `docs/gemini-handoff-blueprint.md`
- `docs/gemini-review-feedback.md`
- `docs/progress.md`
- `docs/debug-log.md`
- `CHANGELOG.md`

## Current Repository Policy

- Work from the personal repository first unless the user explicitly asks for organization repo integration.
- Do not push automatically. Ask for the target remote/branch unless the user has already specified it in the current session.
- Do not enable production Cloudflare bindings for resources that have not been created and confirmed by the user.
- Do not commit local attachment/reference files or worktree metadata.

## Latest Reviewed State

- Gemini's Worker modularization was reviewed by Codex. (codex)
- Optional LLM Critic and Vectorize code paths are acceptable as code-ready features, but runtime activation remains gated by Cloudflare resource setup. (codex)
- Tracked Wrangler configs currently exclude `AI` and `VECTOR_INDEX` bindings to avoid deployment failure before human setup. (codex)
- LLM Critic severity values are sanitized before critic flags are persisted. (codex)

## Required End-Of-Session Snapshot

Gemini must replace this section at the end of its next work session:

- Active task:
- Changed files:
- Verification run:
- Verification not run and why:
- Human-gated blockers:
- Next recommended action:
- Git status summary:

## Memory Rule

If Gemini is uncertain whether a fact came from the current repository state or from memory, it must re-read the repository file or run a local command before acting.