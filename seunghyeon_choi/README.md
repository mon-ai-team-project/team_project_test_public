# seunghyeon_choi Workspace

This directory belongs to the current active project worker:

```text
seunghyeon_choi
```

Role: Current Maintainer, Integration Lead, And Active Development Owner

Branch:

```text
maintainer/seunghyeon-<short-task>
```

Read first:

```text
AGENTS.md
docs/agent-work-queue.md
docs/progress.md
docs/debug-log.md
```

Allowed files:

```text
source code
docs/
benchmark/scripts/
benchmark/*metrics*
integrated/
seunghyeon_choi/
CHANGELOG.md
docs/progress.md
docs/debug-log.md
```

Current task:

Maintain the integrated project workflow, continue active development, review team PRs, update benchmark scripts and metrics, and keep handoff documentation current.

Baseline result collection is not assigned to `seunghyeon_choi`; it is currently marked as `unassigned_member_c` in `docs/agent-work-queue.md`.

## Responsibility Boundary

`seunghyeon_choi` is the owner for integrated implementation work after team-member benchmark contributions are reviewed. Other team agents should not edit this directory unless explicitly assigned by the maintainer.

Primary responsibilities:

- Maintain source-code integration across Worker, Pages dashboard, MCP, benchmark scripts, and shared packages.
- Review and merge team-member benchmark branches into organization `main`.
- Keep `CHANGELOG.md`, `docs/progress.md`, and `docs/debug-log.md` accurate before ending each work session.
- Protect organization `main` from direct unreviewed edits by non-maintainer agents.

## Work Summary

- Active workspace for maintainer-reviewed integration and current project development.
- Organization `main` now includes `Agent rules / validate-agent-rules` for PR enforcement.
- Next maintainer actions: keep stale test branches closed/deleted, review `jin23624_cpu` gold-label PR first, assign the baseline owner, and reject PRs that skip changelog attribution or personal-folder updates.
