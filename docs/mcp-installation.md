# MCP Installation Guide

Updated: 2026-05-20

This repository uses a limited MCP set for Paper Agent development. Do not install every server from `awesome-mcp-servers`; install only servers that map to the current workflow and can be given least-privilege access.

## Selected MCP Servers

| Priority | MCP server | Source | Purpose | Status |
| --- | --- | --- | --- | --- |
| Required | Paper Agent MCP | `apps/mcp`, deployed remote endpoint | Read D1 jobs, paper results, report links, and diagnostics. | Installed and deployed |
| Required | GitHub MCP | `github/github-mcp-server` | Inspect repository state, issues, PRs, Actions, and review collaboration work. | Configure per maintainer |
| Required | Cloudflare Docs MCP | `cloudflare/mcp-server-cloudflare` | Query current Cloudflare documentation while configuring Workers, Pages, D1, R2, and MCP. | Configure in client |
| Required | Cloudflare Builds MCP | `cloudflare/mcp-server-cloudflare` | Inspect Worker Builds configuration and deployment failures. | Configure in client |
| Required | Cloudflare Observability MCP | `cloudflare/mcp-server-cloudflare` | Inspect Worker logs, traces, and runtime failures. | Configure in client |
| Recommended | Cloudflare Browser MCP | `cloudflare/mcp-server-cloudflare` | Fetch pages, convert pages to markdown, and take screenshots for deployed dashboard checks. | Configure in client |
| Recommended | Playwright MCP | `microsoft/playwright-mcp` | Browser-driven dashboard UI/UX verification. | Configure in client |
| Conditional | Filesystem MCP | `modelcontextprotocol/servers` filesystem server | Local docs, benchmark, and MCP source inspection only. | Local-only |

## Deferred MCP Servers

| MCP server type | Reason |
| --- | --- |
| Google Drive / Sheets MCP | Needed later for OA PDF and team review workflows, but should wait until OAuth ownership and storage policy are finalized. |
| Generic database MCP | Production D1 must remain behind the custom Paper Agent MCP tools. Use direct SQL only through Cloudflare dashboard or approved maintainer commands. |
| Generic web search MCP | Use official scholarly APIs, Cloudflare Browser MCP, or explicit web verification first. Avoid broad unrestricted fetch tools. |
| Aggregator / meta MCP | Deferred because it increases tool sprawl and permission ambiguity before benchmark evidence is stable. |

## Client Config

Use [`docs/mcp-client-config.example.json`](./mcp-client-config.example.json) as the shared baseline for MCP clients that support JSON `mcpServers`.

For Codex-style TOML clients, translate each entry into:

```toml
[mcp_servers.paper-agent]
command = "npx"
args = ["-y", "mcp-remote", "https://paper-agent-mcp.shch3653.workers.dev/mcp"]
```

Repeat the same shape for each selected server.

## Required Environment Variables

Do not commit secrets. Set these outside the repository:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=...
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
```

GitHub token rule:

- Contributors: prefer read-only GitHub MCP with `GITHUB_READ_ONLY=1`.
- Maintainer `seunghyeon_choi`: write-capable MCP is allowed only for reviewed PR/issue work, never for direct unreviewed changes to organization `main`.

Cloudflare token rule:

- Start with read/observability scopes where possible.
- Add write/deploy scopes only when the task explicitly requires deployment or build setting changes.
- Never expose token values in MCP config files, commits, logs, screenshots, or issue comments.

## Verification

After configuring MCP in the client and restarting the client, verify:

```bash
npm run smoke:mcp
```

Expected deployed Paper Agent MCP health:

```text
https://paper-agent-mcp.shch3653.workers.dev/health
```

Expected tools:

```text
query_recent_jobs
get_search_job
get_paper_results
get_report_links
get_system_diagnostics
```

## Installation Notes

- `paper-agent`, `cloudflare-*`, and remote HTTP MCP servers are attached through `mcp-remote`.
- `playwright` uses `npx -y @playwright/mcp@latest`.
- `filesystem-paper-agent-readonly` is intentionally limited to `docs/`, `benchmark/`, and `apps/mcp/`.
- `github-readonly` uses Docker image `ghcr.io/github/github-mcp-server`; use the existing GitHub connector if Docker is unavailable.
- Do not add these packages to application runtime dependencies unless a future task requires reproducible offline MCP server startup.
