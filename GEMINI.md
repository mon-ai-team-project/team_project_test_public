# Gemini Operating Guide

Updated: 2026-05-26

This file gives Gemini the same repository rules used by Codex and Claude. Gemini must follow this file before editing anything.

## Start Here

Run:

```bash
git status --short --branch
git log --oneline -8
```

Read in this order:

```text
AGENTS.md
docs/agent-writing-rules.md
docs/progress.md
docs/team-collaboration.md
docs/agent-work-queue.md
CHANGELOG.md
docs/debug-log.md
docs/gemini-session-state.md
docs/gemini-debug-handoff.md
docs/local-worker-troubleshooting.md
```

Do not start from memory or an old chat transcript.

## Gemini Attribution

Gemini-authored work must use:

```text
(gemini)
```

Example:

```text
- Docs: Updated prototype notes for dashboard UI review. (gemini)
```

Do not rewrite `(codex)`, `(claude)`, or any team-member attribution.

## Repository & Push Protocol

1. **Personal Repo Priority:** All development work and pushes are based on the personal repository (`origin`) by default.
   - `origin https://github.com/Vulter3653/paper-agent-project.git`
2. **Inquiry Before Push:** After completing any task, Gemini must summarize the changes and explicitly inquire: **"Where (which remote/branch) and what should be pushed?"**
3. **No Automatic Push:** Never perform `git push` without explicit user confirmation of the target and content.

## Scope

Gemini may edit only the files assigned in the current user request or in `docs/agent-work-queue.md`.

Do not edit source code, Cloudflare configuration, D1/R2 configuration, or deployment files unless the user explicitly assigns that work.

`seunghyeon_choi/` is the current maintainer workspace. Do not edit it unless explicitly assigned.

## Required Documentation & Logging

Follow `docs/agent-writing-rules.md`.

<<<<<<< HEAD
1. **Strict Management & Historical Preservation:** 
=======
1. **Strict Management & Historical Preservation:**
>>>>>>> origin/main
   - **No Deletion:** Never delete, summarize, or overwrite existing historical records, especially attributions like `(codex)`, `(shonshinemin)`, or `(claude)`.
   - **Full Integration:** New logs must be prepended to the top of historical files while preserving 100% of the previous content.
   - **Tool Discipline:** Prefer `replace` for targeted updates. If using `write_file` for large files, Gemini MUST verify the total line count before and after to ensure zero data loss.
2. **Mandatory Updates:**
   - Update `CHANGELOG.md` for meaningful changes.
   - Update `docs/progress.md` for handoff-affecting changes.
   - Update `docs/debug-log.md` for defects, verification, or troubleshooting (including refactoring errors).
   - **Self-Correction:** Any mistake in file management or violation of these rules must be documented in `docs/debug-log.md` with a root-cause analysis and correction steps.
<<<<<<< HEAD
=======


## Memory Continuity Protocol

Gemini must assume it does not remember previous sessions. Repository files are the memory layer.

Before any task:

1. Read the required startup files listed above.
2. Read `docs/gemini-handoff-blueprint.md` and `docs/gemini-session-state.md` if present.
3. Compare `git log --oneline -8` with the latest entries in `CHANGELOG.md` and `docs/progress.md`.
4. Do not rely on chat memory for architecture, branch policy, deployment state, secrets, or deferred tasks.

During work:

- Record important decisions, assumptions, blockers, and verification commands in the relevant docs as they happen.
- Keep code-ready but runtime-disabled features explicitly labeled when human Cloudflare/GitHub setup is still required.
- Preserve existing Codex, Claude, Gemini, and team-member attribution entries exactly.

Before ending a session:

1. Update `docs/gemini-session-state.md` with current status, changed files, verification results, blockers, and next recommended action.
2. Update `CHANGELOG.md` for all meaningful source, config, docs, schema, prompt, benchmark, or deployment changes.
3. Update `docs/progress.md` when the handoff state changes.
4. Update `docs/debug-log.md` when a defect, review correction, or verification workflow occurred.
5. Run `git status --short --branch` and include any remaining uncommitted or untracked files in the handoff note.
>>>>>>> origin/main

## Worker Debug Discipline

When Worker behavior is involved, Gemini must treat `docs/gemini-debug-handoff.md` and `docs/local-worker-troubleshooting.md` as mandatory instructions, not optional references.

Gemini must not change Worker source code until it has classified the issue as one of:

- source-code defect
- local environment or missing `.dev.vars`
- Cloudflare runtime/configuration issue
- expected local Wrangler noise

Required baseline commands:

```bash
npm run smoke:worker
npm run dev:worker:local
npm run smoke:worker:local
```

Do not use `npm run dev:worker -- --port 8787`; use `npm run dev:worker:local` instead.

Do not re-add `AI` or `VECTOR_INDEX` to tracked Wrangler configs unless the user confirms the Cloudflare resources and asks for activation.

## Verification

Use the same verification rules as Codex:

```bash
npm run benchmark:evaluate-proposed
npm run typecheck
npm run build:web
npm run smoke:worker
npm run smoke:mcp
```

Run only the commands relevant to the change and record what passed or was not run.
