# GitHub Main Branch Protection

Updated: 2026-05-20

## Goal

Protect the organization repository `main` branch so team agents cannot modify it directly.

Repository:

```text
mon-ai-team-project/team_project_test_public
```

Protected branch:

```text
main
```

Current maintainer:

```text
seunghyeon_choi
```

## Required GitHub Setting

Use a repository ruleset or branch protection rule.

Recommended path:

```text
GitHub
-> mon-ai-team-project/team_project_test_public
-> Settings
-> Rules
-> Rulesets
-> New ruleset
-> New branch ruleset
```

Ruleset name:

```text
Protect main - maintainer only
```

Target branches:

```text
main
```

Enable:

- Restrict updates
- Restrict deletions
- Require a pull request before merging
- Block force pushes
- Require linear history if the team wants squash/rebase-only history

Bypass list:

```text
Only the exact GitHub account that corresponds to seunghyeon_choi
```

Do not add general teams or all organization owners to the bypass list unless explicitly intended.

## If Using Classic Branch Protection Instead

Path:

```text
Repository
-> Settings
-> Branches
-> Add branch protection rule
```

Branch name pattern:

```text
main
```

Enable:

- Require a pull request before merging
- Restrict who can push to matching branches
- Do not allow force pushes
- Do not allow deletions

Restrict push access to:

```text
Exact GitHub account for seunghyeon_choi
```

## Team Workflow After Protection

Team members must work through branches:

```bash
git checkout main
git pull team-origin main
git checkout -b benchmark/<agent-id>-<task>
```

Push branch:

```bash
git push team-origin benchmark/<agent-id>-<task>
```

Open PR into:

```text
main
```

The maintainer reviews, verifies, and merges.

## Current Limitation

This repository has been updated with policy documentation, but branch protection cannot be applied from the currently available GitHub MCP tools because no branch-protection or ruleset mutation tool is exposed.

To apply the protection, use GitHub UI or a GitHub API token with repository administration permission.
