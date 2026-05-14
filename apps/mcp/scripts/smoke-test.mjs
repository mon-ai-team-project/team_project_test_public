import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const mcpUrl = process.env.MCP_URL ?? "https://paper-agent-mcp.shch3653.workers.dev/mcp";
const jobId = process.env.MCP_JOB_ID;

const client = new Client({
  name: "paper-agent-mcp-smoke-test",
  version: "0.1.0"
});

const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));

try {
  await client.connect(transport);

  const tools = await client.listTools();
  const toolNames = tools.tools.map((tool) => tool.name).sort();
  console.log(JSON.stringify({ mcpUrl, toolNames }, null, 2));

  const diagnostics = await client.callTool({
    name: "get_system_diagnostics",
    arguments: {}
  });
  console.log("get_system_diagnostics");
  console.log(JSON.stringify(diagnostics, null, 2));

  const recentJobs = await client.callTool({
    name: "query_recent_jobs",
    arguments: { limit: 3 }
  });
  console.log("query_recent_jobs");
  console.log(JSON.stringify(recentJobs, null, 2));

  const selectedJobId = jobId ?? getFirstCompletedJobId(recentJobs) ?? getFirstJobId(recentJobs);
  if (selectedJobId) {
    console.log(`selected_job_id ${selectedJobId}`);
    for (const [name, args] of [
      ["get_search_job", { jobId: selectedJobId }],
      ["get_paper_results", { jobId: selectedJobId, limit: 3 }],
      ["get_report_links", { jobId: selectedJobId }]
    ]) {
      const result = await client.callTool({ name, arguments: args });
      console.log(name);
      console.log(JSON.stringify(result, null, 2));
    }
  } else {
    console.log("No D1 search jobs found. Tool listing and diagnostics still passed.");
  }
} finally {
  await client.close();
}

function getFirstCompletedJobId(result) {
  return parseToolJson(result).jobs?.find((job) => job.status === "completed")?.id;
}

function getFirstJobId(result) {
  return parseToolJson(result).jobs?.[0]?.id;
}

function parseToolJson(result) {
  const text = result.content?.find((item) => item.type === "text")?.text ?? "{}";
  return JSON.parse(text);
}
