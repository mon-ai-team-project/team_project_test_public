import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

export interface Env {
  DB?: D1Database;
  REPORTS?: R2Bucket;
  MCP_OBJECT: DurableObjectNamespace<PaperAgentMcp>;
}

type SearchJobRow = {
  id: string;
  keyword: string;
  status: string;
  current_step: string;
  total_steps: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
};

type AgentTraceRow = {
  id: string;
  job_id: string;
  step_order: number;
  step_id: string;
  agent_name: string;
  status: string;
  summary: string;
  detail: string | null;
  input_count: number | null;
  output_count: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
};

type PaperRow = {
  id: string;
  rank: number;
  title: string;
  authors: string;
  year: number;
  journal_name: string;
  doi: string;
  oa_status: string;
  cited_by_count: number | null;
  publisher: string | null;
  verification_status: string | null;
  oa_pdf_url: string | null;
  oa_landing_page_url: string | null;
  unpaywall_status: string | null;
  drive_file_id: string | null;
  drive_web_url: string | null;
  drive_status: string | null;
  drive_reason: string | null;
  abstract_score: number | null;
  relevance_score: number | null;
  journal_fit_score: number | null;
  verification_score: number | null;
  oa_score: number | null;
  citation_score: number | null;
  recency_score: number | null;
  final_score: number | null;
  include_status: string | null;
  relevance_reason: string | null;
};

type DiagnosticsColumnCheck = {
  table: string;
  column: string;
  ok: false;
};

const REQUIRED_COLUMNS = [
  {
    table: "search_jobs",
    columns: ["id", "keyword", "status", "current_step", "total_steps", "created_at", "completed_at", "error_message"]
  },
  {
    table: "papers",
    columns: [
      "id",
      "job_id",
      "rank",
      "title",
      "authors",
      "year",
      "journal_name",
      "doi",
      "oa_status",
      "openalex_id",
      "abstract",
      "cited_by_count",
      "crossref_id",
      "publisher",
      "issn",
      "publication_type",
      "published_date",
      "verification_status",
      "verification_reason",
      "oa_pdf_url",
      "oa_landing_page_url",
      "oa_license",
      "oa_host_type",
      "oa_repository",
      "unpaywall_status",
      "unpaywall_reason",
      "drive_file_id",
      "drive_web_url",
      "drive_status",
      "drive_reason",
      "created_at"
    ]
  },
  {
    table: "evaluations",
    columns: [
      "id",
      "paper_id",
      "abstract_score",
      "relevance_score",
      "journal_fit_score",
      "verification_score",
      "oa_score",
      "citation_score",
      "recency_score",
      "final_score",
      "include_status",
      "relevance_reason",
      "created_at"
    ]
  },
  {
    table: "agent_traces",
    columns: ["id", "job_id", "step_order", "step_id", "agent_name", "status", "summary", "detail", "input_count", "output_count", "started_at", "completed_at", "error_message", "created_at"]
  }
] as const;

export class PaperAgentMcp extends McpAgent<Env> {
  server = new McpServer({
    name: "paper-agent-mcp",
    version: "0.1.0"
  });

  async init(): Promise<void> {
    this.server.registerTool(
      "get_system_diagnostics",
      {
        title: "Get system diagnostics",
        description: "Read Cloudflare binding and D1 schema readiness for the Paper Agent project. This tool does not mutate data."
      },
      async () => jsonContent(await getDiagnostics(this.env))
    );

    this.server.registerTool(
      "query_recent_jobs",
      {
        title: "Query recent search jobs",
        description: "List recent Paper Agent search jobs from Cloudflare D1. Limit is clamped to 1-25.",
        inputSchema: {
          limit: z.number().int().min(1).max(25).optional().describe("Maximum number of recent jobs to return.")
        }
      },
      async ({ limit }) => {
        const db = requireDb(this.env);
        const jobs = await listSearchJobs(db, limit ?? 10);
        return jsonContent({ jobs });
      }
    );

    this.server.registerTool(
      "get_search_job",
      {
        title: "Get search job",
        description: "Fetch one search job and its progress metadata by job ID from Cloudflare D1.",
        inputSchema: {
          jobId: z.string().min(1).describe("Search job ID, for example job-...")
        }
      },
      async ({ jobId }) => {
        const db = requireDb(this.env);
        const job = await getSearchJob(db, jobId);
        return jsonContent(job ? { job } : { error: "Search job not found", jobId });
      }
    );

    this.server.registerTool(
      "get_paper_results",
      {
        title: "Get paper results",
        description: "Fetch ranked paper results for one search job from Cloudflare D1. Limit is clamped to 1-50.",
        inputSchema: {
          jobId: z.string().min(1).describe("Search job ID, for example job-..."),
          limit: z.number().int().min(1).max(50).optional().describe("Maximum number of paper rows to return.")
        }
      },
      async ({ jobId, limit }) => {
        const db = requireDb(this.env);
        const [job, papers] = await Promise.all([getSearchJob(db, jobId), listPapers(db, jobId, limit ?? 20)]);
        return jsonContent(job ? { job, papers } : { error: "Search job not found", jobId, papers: [] });
      }
    );

    this.server.registerTool(
      "get_report_links",
      {
        title: "Get report links",
        description: "Return dashboard API download paths and R2 object presence for a job's CSV and Markdown report.",
        inputSchema: {
          jobId: z.string().min(1).describe("Search job ID, for example job-...")
        }
      },
      async ({ jobId }) => {
        const csvKey = `reports/${jobId}/papers.csv`;
        const markdownKey = `reports/${jobId}/report.md`;
        const [csvObject, markdownObject] = await Promise.all([
          this.env.REPORTS?.head(csvKey) ?? null,
          this.env.REPORTS?.head(markdownKey) ?? null
        ]);
        return jsonContent({
          jobId,
          workerApiBaseUrl: "https://paper-agent-project.shch3653.workers.dev",
          csv: {
            apiPath: `/api/search-jobs/${jobId}/papers.csv`,
            r2Key: csvKey,
            existsInR2: Boolean(csvObject),
            size: csvObject?.size ?? null,
            uploadedAt: csvObject?.uploaded?.toISOString() ?? null
          },
          markdownReport: {
            apiPath: `/api/search-jobs/${jobId}/report.md`,
            r2Key: markdownKey,
            existsInR2: Boolean(markdownObject),
            size: markdownObject?.size ?? null,
            uploadedAt: markdownObject?.uploaded?.toISOString() ?? null
          }
        });
      }
    );
  }
}

const mcpHandler = PaperAgentMcp.serve("/mcp", {
  binding: "MCP_OBJECT",
  corsOptions: {
    origin: "*",
    methods: "GET, POST, OPTIONS",
    headers: "Content-Type, mcp-session-id",
    exposeHeaders: "mcp-session-id"
  }
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "paper-agent-mcp", endpoint: "/mcp" });
    }
    return mcpHandler.fetch(request, env, ctx);
  }
};

function requireDb(env: Env): D1Database {
  if (!env.DB) throw new Error("D1 database binding is not configured.");
  return env.DB;
}

async function getDiagnostics(env: Env) {
  const missingColumns = env.DB ? await getMissingColumns(env.DB) : [];
  return {
    ok: Boolean(env.DB) && missingColumns.length === 0,
    db: {
      bound: Boolean(env.DB),
      missingColumns
    },
    env: {
      r2Reports: Boolean(env.REPORTS)
    },
    mcp: {
      service: "paper-agent-mcp",
      endpoint: "/mcp",
      mode: "read_only"
    }
  };
}

async function getMissingColumns(db: D1Database): Promise<DiagnosticsColumnCheck[]> {
  const missing: DiagnosticsColumnCheck[] = [];
  for (const table of REQUIRED_COLUMNS) {
    const existing = await db.prepare(`PRAGMA table_info(${table.table})`).all<{ name: string }>();
    const names = new Set(existing.results.map((column) => column.name));
    for (const column of table.columns) {
      if (!names.has(column)) missing.push({ table: table.table, column, ok: false });
    }
  }
  return missing;
}

async function listAgentTraces(db: D1Database, jobId: string) {
  const rows = await db
    .prepare(
      `SELECT id, job_id, step_order, step_id, agent_name, status, summary, detail,
              input_count, output_count, started_at, completed_at, error_message
       FROM agent_traces
       WHERE job_id = ?
       ORDER BY step_order ASC, started_at ASC`
    )
    .bind(jobId)
    .all<AgentTraceRow>();
  return rows.results.map((row) => ({
    id: row.id,
    jobId: row.job_id,
    stepOrder: row.step_order,
    stepId: row.step_id,
    agentName: row.agent_name,
    status: row.status,
    summary: row.summary,
    detail: row.detail ?? undefined,
    inputCount: row.input_count ?? 0,
    outputCount: row.output_count ?? 0,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    errorMessage: row.error_message ?? undefined
  }));
}

async function listSearchJobs(db: D1Database, limit: number) {
  const rows = await db
    .prepare(
      `SELECT id, keyword, status, current_step, total_steps, created_at, completed_at, error_message
       FROM search_jobs
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .bind(clampInteger(limit, 1, 25))
    .all<SearchJobRow>();
  return rows.results.map(mapSearchJob);
}

async function getSearchJob(db: D1Database, jobId: string) {
  const row = await db
    .prepare(
      `SELECT id, keyword, status, current_step, total_steps, created_at, completed_at, error_message
       FROM search_jobs
       WHERE id = ?`
    )
    .bind(jobId)
    .first<SearchJobRow>();
  return row ? mapSearchJob(row) : null;
}

async function listPapers(db: D1Database, jobId: string, limit: number) {
  const rows = await db
    .prepare(
      `SELECT
        p.id,
        p.rank,
        p.title,
        p.authors,
        p.year,
        p.journal_name,
        p.doi,
        p.oa_status,
        p.cited_by_count,
        p.publisher,
        p.verification_status,
        p.oa_pdf_url,
        p.oa_landing_page_url,
        p.unpaywall_status,
        p.drive_file_id,
        p.drive_web_url,
        p.drive_status,
        p.drive_reason,
        e.abstract_score,
        e.relevance_score,
        e.journal_fit_score,
        e.verification_score,
        e.oa_score,
        e.citation_score,
        e.recency_score,
        e.final_score,
        e.include_status,
        e.relevance_reason
       FROM papers p
       LEFT JOIN evaluations e ON e.paper_id = p.id
       WHERE p.job_id = ?
       ORDER BY p.rank ASC
       LIMIT ?`
    )
    .bind(jobId, clampInteger(limit, 1, 50))
    .all<PaperRow>();
  return rows.results.map(mapPaper);
}

function mapSearchJob(row: SearchJobRow) {
  return {
    id: row.id,
    keyword: row.keyword,
    status: row.status,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message
  };
}

function mapPaper(row: PaperRow) {
  return {
    id: row.id,
    rank: row.rank,
    title: row.title,
    authors: row.authors,
    year: row.year,
    journalName: row.journal_name,
    doi: row.doi,
    oaStatus: row.oa_status,
    citedByCount: row.cited_by_count ?? 0,
    publisher: row.publisher ?? "",
    verificationStatus: row.verification_status ?? "unverified",
    oaPdfUrl: row.oa_pdf_url ?? "",
    oaLandingPageUrl: row.oa_landing_page_url ?? "",
    unpaywallStatus: row.unpaywall_status ?? "skipped",
    driveFileId: row.drive_file_id ?? "",
    driveWebUrl: row.drive_web_url ?? "",
    driveStatus: row.drive_status ?? "skipped",
    driveReason: row.drive_reason ?? "",
    scores: {
      abstract: row.abstract_score ?? 0,
      relevance: row.relevance_score ?? 0,
      journalFit: row.journal_fit_score ?? 0,
      verification: row.verification_score ?? 0,
      openAccess: row.oa_score ?? 0,
      citation: row.citation_score ?? 0,
      recency: row.recency_score ?? 0,
      final: row.final_score ?? 0
    },
    includeStatus: row.include_status ?? "review",
    relevanceReason: row.relevance_reason ?? ""
  };
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
