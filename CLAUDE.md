# Claude Operating Guide

Updated: 2026-05-22

This file gives Claude the same repository rules used by Codex and Gemini. Claude must follow this file before editing anything.

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
```

Do not start from memory or an old chat transcript.

## Claude Attribution

Claude-authored work must use:

```text
(claude)
```

Example:

```text
- Docs: Updated benchmark handoff notes for baseline collection. (claude)
```

Do not rewrite `(codex)`, `(gemini)`, or any team-member attribution.

## Repository Role

The personal repository is the current development source of truth:

```text
origin https://github.com/Vulter3653/paper-agent-project.git
```

The organization repository is used for team collaboration and later integration:

```text
team-origin https://github.com/mon-ai-team-project/team_project_test_public.git
```

Claude must check the current remote state before merging or pushing.

## Scope

Claude may edit only the files assigned in the current user request or in `docs/agent-work-queue.md`.

Do not edit source code, Cloudflare configuration, D1/R2 configuration, or deployment files unless the user explicitly assigns that work.

`seunghyeon_choi/` is the current maintainer workspace. Do not edit it unless explicitly assigned.

## Required Documentation

Follow `docs/agent-writing-rules.md`.

At minimum:

- Update `CHANGELOG.md` for meaningful changes.
- Update `docs/progress.md` for handoff-affecting changes.
- Update `docs/debug-log.md` for defects, verification, or troubleshooting.

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
