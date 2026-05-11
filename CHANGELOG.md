# Changelog

All notable repository changes must be recorded in this file.

This project follows a strict manual changelog policy. Every commit or pull request that changes source code, infrastructure configuration, documentation, benchmark data, prompts, schema, or deployment behavior must update this file in the same commit or pull request.

## Rules

- Add a new entry under `Unreleased` before committing a meaningful change.
- Use one of these labels: `Added`, `Changed`, `Fixed`, `Removed`, `Security`, `Infra`, `Docs`, `Benchmark`.
- Include the affected path when practical.
- Do not bundle unrelated changes into one vague entry.
- Do not remove historical entries.
- If a change is intentionally not user-visible, still record it as `Infra`, `Docs`, or `Changed`.

## Unreleased

- `Infra`: Configured `apps/worker/wrangler.toml` with D1 database ID `4d622431-3574-4e04-a359-dada93e97438` and disabled R2 binding until billing is available.
- `Added`: Created `CHANGELOG.md` and `.github/pull_request_template.md` to enforce strict update history tracking.

## 2026-05-11

- `Added`: Set up monorepo structure with `apps/web`, `apps/worker`, `packages/shared`, `docs`, and `benchmark`.
- `Added`: Created React/Vite dashboard scaffold in `apps/web`.
- `Added`: Created Cloudflare Worker API scaffold in `apps/worker`.
- `Added`: Created shared TypeScript types and final score helper in `packages/shared`.
- `Docs`: Replaced initial team workspace README with project architecture, local development, Cloudflare setup, and MVP flow.
- `Infra`: Added `.env.example`, `.gitignore`, npm workspaces, Wrangler configuration, and Cloudflare compatibility date alignment.
