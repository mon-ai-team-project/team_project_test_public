# Agent Writing Rules

Updated: 2026-05-22

These rules apply to every AI agent working in this repository, including Codex, Gemini, Claude, and any future agent. The goal is to keep handoff, attribution, debugging, and repository state consistent even when multiple agents contribute.

## Source Of Truth

Do not work from chat memory alone. Before editing, read:

```text
AGENTS.md
docs/progress.md
docs/team-collaboration.md
docs/agent-work-queue.md
CHANGELOG.md
docs/debug-log.md
```

If agent-specific files exist, read the matching file too:

```text
GEMINI.md
CLAUDE.md
```

## Attribution

Every meaningful dated entry must use this exact format:

```text
- Label: Description. (agent-id)
```

Allowed labels are the labels defined in `CHANGELOG.md`:

```text
Added
Changed
Fixed
Removed
Security
Infra
Docs
Benchmark
```

Use lowercase agent identifiers:

```text
(codex)
(gemini)
(claude)
```

Do not remove, rewrite, or normalize another contributor's attribution unless the user explicitly asks for correction.

## Required Files

Every meaningful change must update:

```text
CHANGELOG.md
```

If the change affects handoff, workflow, deployment, repository policy, or next-session state, also update:

```text
docs/progress.md
```

If the change investigates a defect, verifies a workflow, records test output, or changes project confidence, also update:

```text
docs/debug-log.md
```

## Repository Policy

The current development source of truth is the personal repository:

```text
origin https://github.com/Vulter3653/paper-agent-project.git
```

The organization repository is used for team collaboration and later integration:

```text
team-origin https://github.com/mon-ai-team-project/team_project_test_public.git
```

Do not assume `team-origin/main` is newer than `origin/main`. Check both before merging:

```bash
git fetch origin
git fetch team-origin
git log --oneline --left-right --cherry-pick origin/main...team-origin/main
git diff --name-status origin/main team-origin/main
```

## Branch And Scope Rules

Do not work directly on organization `main` for team-member benchmark edits.

`seunghyeon_choi/` is the current active maintainer workspace. Other agents must not edit it unless explicitly assigned by the maintainer.

If an agent is not explicitly assigned source-code work, it must not edit:

```text
apps/
packages/
wrangler.toml
apps/*/wrangler.toml
deployment settings
```

Team-member benchmark work should stay inside the assigned directory and assigned benchmark files.

## Reference Files

Do not delete, rename, or commit existing untracked reference files unless explicitly requested:

```text
01_interactive_research_studio.html
02_interactive_agent_ops.html
03_interactive_evaluation_dashboard.html
AI_Agent_프로젝트_전체_통합본.pdf
경영대학 학술지 목록.docx
```

## Verification

Benchmark-only changes should run:

```bash
npm run benchmark:evaluate-proposed
```

Source-code changes should run:

```bash
npm run typecheck
npm run build:web
```

Worker/API readiness can be checked without consuming Web of Science quota:

```bash
npm run smoke:worker
```

MCP readiness can be checked with:

```bash
npm run smoke:mcp
```

Record verification results in `docs/progress.md`; record defect investigations or workflow-confidence checks in `docs/debug-log.md`.

## Automatic Enforcement

The repository includes a PR validation workflow:

```text
.github/workflows/agent-rules.yml
scripts/validate-agent-rules.mjs
```

Team benchmark branches must satisfy these checks:

- `CHANGELOG.md` changed.
- The branch name matches a known assignment prefix.
- Changed files stay inside the assignment allowlist.
- The assigned personal workspace folder changed.
- `CHANGELOG.md` contains the matching attribution, such as `(jin23624)`, `(juilie)`, `(shonshinemin)`, or `(member-c)`.

Local pre-PR check:

```bash
npm run validate:agent-rules
```

Maintainers should enable GitHub branch protection so `Agent rules` and CODEOWNER review are required before merging into `main`.

## Final Response Requirements

When finishing a work session, report:

- Changed files.
- Verification commands and results.
- Commit hash, if committed.
- Push target, if pushed.
- Remaining risks or manual follow-up.

If tests were not run, say so explicitly.
