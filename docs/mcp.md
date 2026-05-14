# MCP Attachment Plan

This project should attach MCP after the core Worker API, D1, R2, and report paths are stable. MCP is an external tool interface for agents; it should not replace the dashboard API.

Official references:

- Model Context Protocol specification: `https://modelcontextprotocol.io/specification/2025-06-18/basic`
- Cloudflare Remote MCP server guide: `https://developers.cloudflare.com/agents/guides/remote-mcp-server/`
- Cloudflare MCP learning guide: `https://developers.cloudflare.com/labs/mcp`

## Target Shape

```text
MCP Client
-> Remote MCP endpoint /mcp
-> Cloudflare Worker MCP server
-> limited tools
-> existing Worker/D1/R2/Crossref/Unpaywall/Drive/Vectorize functions
```

The dashboard remains:

```text
User
-> Cloudflare Pages dashboard
-> Worker REST API
-> D1/R2
```

MCP is for agent-to-tool execution, not for normal user UI traffic.

## Recommended Rollout

### Phase 1: Read-Only MCP

Expose only safe read tools first.

Tools:

```text
query_recent_jobs(limit)
get_search_job(job_id)
get_paper_results(job_id)
get_report_links(job_id)
get_system_diagnostics()
```

Purpose:

- Let an MCP client inspect current project state.
- Avoid write or external API cost while validating auth, transport, and observability.

Current implementation:

```text
apps/mcp
paper-agent-mcp
/mcp
```

Implemented read-only tools:

```text
query_recent_jobs(limit)
get_search_job(jobId)
get_paper_results(jobId, limit)
get_report_links(jobId)
get_system_diagnostics()
```

Runtime bindings:

```text
MCP_OBJECT  Durable Object for MCP transport
DB          Existing paper_agent_db D1 database
REPORTS     Existing paper-agent-outputs R2 bucket
```

Deployment command:

```bash
npm run deploy:mcp
```

Local test endpoint:

```text
http://localhost:8788/mcp
```

Deployed endpoint after successful Cloudflare deploy:

```text
https://paper-agent-mcp.<account-subdomain>.workers.dev/mcp
```

Health endpoint:

```text
/health
```

### Phase 2: Controlled Write MCP

Expose narrow write tools after read-only behavior is stable.

Tools:

```text
create_search_job(keyword, year_start, year_end, max_results)
regenerate_outputs(job_id)
save_manual_evaluation(paper_id, human_score, notes)
```

Rules:

- No destructive operations.
- Validate all inputs.
- Enforce small `max_results`.
- Log every tool call to D1.

### Phase 3: Storage And Evaluation MCP

Expose workflow-specific tools.

Tools:

```text
check_oa_pdf(doi)
upload_oa_pdf_to_drive(doi, oa_pdf_url)
score_relevance(job_id)
rank_papers(job_id)
generate_report(job_id)
```

Rules:

- Upload only Unpaywall-confirmed OA PDFs.
- Store report outputs in R2.
- Keep metadata in D1.
- Do not expose raw credentials.

## Tools To Avoid

Do not expose:

```text
drop_database
delete_bucket
delete_drive_file
manage_cloudflare_account
execute_command
write_arbitrary_file
fetch_any_url_without_allowlist
```

## Implementation Options

### Option A: Separate Worker

Recommended for safety.

```text
paper-agent-project        -> REST API and dashboard backend
paper-agent-mcp            -> /mcp endpoint and MCP tools
```

Pros:

- Separate deployment and secrets.
- Easier permission boundary.
- Safer for experimentation.

This is now the selected project direction.

Cons:

- More setup.
- Shared code needs package extraction or API calls to the main Worker.

### Option B: Same Worker With `/mcp`

Acceptable for MVP.

```text
paper-agent-project/api/... -> REST API
paper-agent-project/mcp     -> MCP endpoint
```

Pros:

- One deployment.
- Direct access to existing D1/R2 bindings.

Cons:

- Higher blast radius.
- Auth and route separation must be strict.

## Minimum Required Secrets And Bindings

Read-only MCP:

```text
DB
REPORTS
```

Controlled search MCP:

```text
DB
REPORTS
WOS_API_KEY
CROSSREF_EMAIL
UNPAYWALL_EMAIL
```

Drive upload MCP:

```text
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_DRIVE_FOLDER_ID
```

## Security Checklist

- Use OAuth or an equivalent authenticated MCP deployment before exposing write tools.
- Start with read-only tools.
- Use least privilege secrets.
- Keep Cloudflare account-level permissions out of MCP.
- Add D1 audit table before write tools.
- Include timeouts and retry limits.
- Redact secrets and API keys from logs.
- Reject unknown tool names and unexpected parameters.
- Do not let MCP clients choose arbitrary R2 keys or Drive folders.

## Suggested D1 Audit Table

```sql
CREATE TABLE IF NOT EXISTS mcp_tool_calls (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  input_json TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TEXT NOT NULL
);
```

## Next MCP Implementation Step

After ranking/report hardening:

```text
1. Add mcp_tool_calls table.
2. Add read-only tool definitions.
3. Create a separate paper-agent-mcp Worker or a protected /mcp route.
4. Test with MCP Inspector or Cloudflare AI Playground.
5. Add controlled write tools only after read-only verification.
```
