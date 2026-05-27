import {
  getBusinessSchoolJournalMatch,
  type AgentTrace,
  type AgentTraceStatus,
  type PaperSummary,
  type SearchJob
} from "@paper-agent/shared";
import { type PaperRecord, type EvaluationScores } from "./types";
import { calculateEvaluationScores, getIncludeStatus, roundScore, scoreRecency } from "./scoring";
import { getErrorMessage } from "./utils";
import {
  type CriticFlag,
  type JobOutputRecord,
  type SearchResult
} from "./reports";

export type SearchJobRow = {
  id: string;
  keyword: string;
  status: SearchJob["status"];
  current_step: string;
  total_steps: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  source_result_count: number | null;
  allowed_result_count: number | null;
};

export type AgentTraceRow = {
  id: string;
  job_id: string;
  step_order: number;
  step_id: string;
  agent_name: string;
  status: AgentTraceStatus;
  summary: string;
  detail: string | null;
  input_count: number | null;
  output_count: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
};

export type AgentTraceInput = {
  stepOrder: number;
  stepId: string;
  agentName: string;
  status?: AgentTraceStatus;
  summary: string;
  detail?: string;
  inputCount?: number;
  outputCount?: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
};

export type PaperSummaryRow = {
  id: string;
  rank: number;
  title: string;
  authors: string;
  year: number;
  journal_name: string;
  doi: string;
  oa_status: PaperSummary["oaStatus"];
  cited_by_count: number | null;
  abstract_score: number | null;
  relevance_score: number | null;
  journal_fit_score: number | null;
  verification_score: number | null;
  oa_score: number | null;
  citation_score: number | null;
  recency_score: number | null;
  final_score: number | null;
  include_status: PaperSummary["includeStatus"] | null;
  relevance_reason: string | null;
  publisher: string | null;
  issn: string | null;
  publication_type: string | null;
  published_date: string | null;
  verification_status: PaperRecord["verificationStatus"] | null;
  verification_reason: string | null;
  oa_pdf_url: string | null;
  oa_landing_page_url: string | null;
  oa_license: string | null;
  oa_host_type: string | null;
  oa_repository: string | null;
  unpaywall_status: PaperRecord["unpaywallStatus"] | null;
  unpaywall_reason: string | null;
  drive_file_id: string | null;
  drive_web_url: string | null;
  drive_status: PaperRecord["driveStatus"] | null;
  drive_reason: string | null;
};

export async function ensureSchema(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS search_jobs (
        id TEXT PRIMARY KEY,
        keyword TEXT NOT NULL,
        status TEXT NOT NULL,
        current_step TEXT NOT NULL,
        total_steps INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        error_message TEXT,
        source_result_count INTEGER DEFAULT 0,
        allowed_result_count INTEGER DEFAULT 0
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS papers (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        rank INTEGER NOT NULL,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        year INTEGER NOT NULL,
        journal_name TEXT NOT NULL,
        doi TEXT NOT NULL,
        oa_status TEXT NOT NULL,
        openalex_id TEXT,
        abstract TEXT,
        cited_by_count INTEGER DEFAULT 0,
        crossref_id TEXT,
        publisher TEXT,
        issn TEXT,
        publication_type TEXT,
        published_date TEXT,
        verification_status TEXT,
        verification_reason TEXT,
        oa_pdf_url TEXT,
        oa_landing_page_url TEXT,
        oa_license TEXT,
        oa_host_type TEXT,
        oa_repository TEXT,
        unpaywall_status TEXT,
        unpaywall_reason TEXT,
        FOREIGN KEY (job_id) REFERENCES search_jobs(id) ON DELETE CASCADE
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS evaluations (
        id TEXT PRIMARY KEY,
        paper_id TEXT NOT NULL,
        abstract_score REAL NOT NULL,
        relevance_score REAL DEFAULT 0,
        journal_fit_score REAL DEFAULT 0,
        verification_score REAL DEFAULT 0,
        oa_score REAL DEFAULT 0,
        citation_score REAL DEFAULT 0,
        recency_score REAL DEFAULT 0,
        final_score REAL NOT NULL,
        include_status TEXT NOT NULL,
        relevance_reason TEXT NOT NULL,
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS critic_flags (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        paper_id TEXT NOT NULL,
        paper_rank INTEGER NOT NULL,
        severity TEXT NOT NULL,
        flag_type TEXT NOT NULL,
        message TEXT NOT NULL,
        evidence TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES search_jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS job_outputs (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        output_type TEXT NOT NULL,
        status TEXT NOT NULL,
        storage TEXT NOT NULL,
        object_key TEXT,
        url_path TEXT,
        content_type TEXT,
        detail TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES search_jobs(id) ON DELETE CASCADE
      )`
    )
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS agent_traces (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        step_order INTEGER NOT NULL,
        step_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        detail TEXT,
        input_count INTEGER DEFAULT 0,
        output_count INTEGER DEFAULT 0,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (job_id) REFERENCES search_jobs(id) ON DELETE CASCADE
      )`
    )
    .run();

  await ensureColumn(db, "search_jobs", "id", "TEXT");
  await ensureColumn(db, "search_jobs", "keyword", "TEXT DEFAULT ''");
  await ensureColumn(db, "search_jobs", "status", "TEXT DEFAULT 'completed'");
  await ensureColumn(db, "search_jobs", "current_step", "TEXT DEFAULT 'ranking'");
  await ensureColumn(db, "search_jobs", "total_steps", "INTEGER DEFAULT 12");
  await ensureColumn(db, "search_jobs", "created_at", "TEXT");
  await ensureColumn(db, "search_jobs", "completed_at", "TEXT");
  await ensureColumn(db, "search_jobs", "error_message", "TEXT");
  await ensureColumn(db, "search_jobs", "source_result_count", "INTEGER DEFAULT 0");
  await ensureColumn(db, "search_jobs", "allowed_result_count", "INTEGER DEFAULT 0");

  await ensureColumn(db, "papers", "id", "TEXT");
  await ensureColumn(db, "papers", "job_id", "TEXT");
  await ensureColumn(db, "papers", "rank", "INTEGER DEFAULT 0");
  await ensureColumn(db, "papers", "title", "TEXT DEFAULT ''");
  await ensureColumn(db, "papers", "authors", "TEXT DEFAULT ''");
  await ensureColumn(db, "papers", "year", "INTEGER DEFAULT 0");
  await ensureColumn(db, "papers", "journal_name", "TEXT DEFAULT ''");
  await ensureColumn(db, "papers", "doi", "TEXT DEFAULT ''");
  await ensureColumn(db, "papers", "oa_status", "TEXT DEFAULT 'unknown'");
  await ensureColumn(db, "papers", "openalex_id", "TEXT");
  await ensureColumn(db, "papers", "abstract", "TEXT");
  await ensureColumn(db, "papers", "cited_by_count", "INTEGER DEFAULT 0");
  await ensureColumn(db, "papers", "crossref_id", "TEXT");
  await ensureColumn(db, "papers", "publisher", "TEXT");
  await ensureColumn(db, "papers", "issn", "TEXT");
  await ensureColumn(db, "papers", "publication_type", "TEXT");
  await ensureColumn(db, "papers", "published_date", "TEXT");
  await ensureColumn(db, "papers", "verification_status", "TEXT");
  await ensureColumn(db, "papers", "verification_reason", "TEXT");
  await ensureColumn(db, "papers", "oa_pdf_url", "TEXT");
  await ensureColumn(db, "papers", "oa_landing_page_url", "TEXT");
  await ensureColumn(db, "papers", "oa_license", "TEXT");
  await ensureColumn(db, "papers", "oa_host_type", "TEXT");
  await ensureColumn(db, "papers", "oa_repository", "TEXT");
  await ensureColumn(db, "papers", "unpaywall_status", "TEXT");
  await ensureColumn(db, "papers", "unpaywall_reason", "TEXT");
  await ensureColumn(db, "papers", "drive_file_id", "TEXT");
  await ensureColumn(db, "papers", "drive_web_url", "TEXT");
  await ensureColumn(db, "papers", "drive_status", "TEXT");
  await ensureColumn(db, "papers", "drive_reason", "TEXT");
  await ensureColumn(db, "papers", "created_at", "TEXT");

  await ensureColumn(db, "evaluations", "id", "TEXT");
  await ensureColumn(db, "evaluations", "paper_id", "TEXT");
  await ensureColumn(db, "evaluations", "abstract_score", "REAL DEFAULT 0");
  await ensureColumn(db, "evaluations", "relevance_score", "REAL DEFAULT 0");
  await ensureColumn(db, "evaluations", "journal_fit_score", "REAL DEFAULT 0");
  await ensureColumn(db, "evaluations", "verification_score", "REAL DEFAULT 0");
  await ensureColumn(db, "evaluations", "oa_score", "REAL DEFAULT 0");
  await ensureColumn(db, "evaluations", "citation_score", "REAL DEFAULT 0");
  await ensureColumn(db, "evaluations", "recency_score", "REAL DEFAULT 0");
  await ensureColumn(db, "evaluations", "final_score", "REAL DEFAULT 0");
  await ensureColumn(db, "evaluations", "include_status", "TEXT DEFAULT 'review'");
  await ensureColumn(db, "evaluations", "relevance_reason", "TEXT DEFAULT ''");
  await ensureColumn(db, "evaluations", "created_at", "TEXT");

  await ensureColumn(db, "critic_flags", "id", "TEXT");
  await ensureColumn(db, "critic_flags", "job_id", "TEXT");
  await ensureColumn(db, "critic_flags", "paper_id", "TEXT");
  await ensureColumn(db, "critic_flags", "paper_rank", "INTEGER DEFAULT 0");
  await ensureColumn(db, "critic_flags", "severity", "TEXT DEFAULT 'low'");
  await ensureColumn(db, "critic_flags", "flag_type", "TEXT DEFAULT ''");
  await ensureColumn(db, "critic_flags", "message", "TEXT DEFAULT ''");
  await ensureColumn(db, "critic_flags", "evidence", "TEXT");
  await ensureColumn(db, "critic_flags", "created_at", "TEXT");

  await ensureColumn(db, "job_outputs", "id", "TEXT");
  await ensureColumn(db, "job_outputs", "job_id", "TEXT");
  await ensureColumn(db, "job_outputs", "output_type", "TEXT DEFAULT ''");
  await ensureColumn(db, "job_outputs", "status", "TEXT DEFAULT 'planned'");
  await ensureColumn(db, "job_outputs", "storage", "TEXT DEFAULT 'planned'");
  await ensureColumn(db, "job_outputs", "object_key", "TEXT");
  await ensureColumn(db, "job_outputs", "url_path", "TEXT");
  await ensureColumn(db, "job_outputs", "content_type", "TEXT");
  await ensureColumn(db, "job_outputs", "detail", "TEXT");
  await ensureColumn(db, "job_outputs", "created_at", "TEXT");

  await ensureColumn(db, "agent_traces", "id", "TEXT");
  await ensureColumn(db, "agent_traces", "job_id", "TEXT");
  await ensureColumn(db, "agent_traces", "step_order", "INTEGER DEFAULT 0");
  await ensureColumn(db, "agent_traces", "step_id", "TEXT DEFAULT ''");
  await ensureColumn(db, "agent_traces", "agent_name", "TEXT DEFAULT ''");
  await ensureColumn(db, "agent_traces", "status", "TEXT DEFAULT 'pending'");
  await ensureColumn(db, "agent_traces", "summary", "TEXT DEFAULT ''");
  await ensureColumn(db, "agent_traces", "detail", "TEXT");
  await ensureColumn(db, "agent_traces", "input_count", "INTEGER DEFAULT 0");
  await ensureColumn(db, "agent_traces", "output_count", "INTEGER DEFAULT 0");
  await ensureColumn(db, "agent_traces", "started_at", "TEXT");
  await ensureColumn(db, "agent_traces", "completed_at", "TEXT");
  await ensureColumn(db, "agent_traces", "error_message", "TEXT");
  await ensureColumn(db, "agent_traces", "created_at", "TEXT");

  await db.batch([
    db.prepare("CREATE INDEX IF NOT EXISTS idx_papers_job_id ON papers(job_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_evaluations_paper_id ON evaluations(paper_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_critic_flags_job_id ON critic_flags(job_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_critic_flags_paper_id ON critic_flags(paper_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_job_outputs_job_id ON job_outputs(job_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_agent_traces_job_id ON agent_traces(job_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_agent_traces_job_order ON agent_traces(job_id, step_order)")
  ]);
}

async function ensureColumn(db: D1Database, tableName: string, columnName: string, definition: string): Promise<void> {
  const columns = await db.prepare(`PRAGMA table_info(${tableName})`).all<{ name: string }>();
  if (columns.results.some((column) => column.name === columnName)) return;
  await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
}

export async function saveSearchJob(db: D1Database, job: SearchJob): Promise<void> {
  await db
    .prepare(
      `INSERT INTO search_jobs (id, keyword, status, current_step, total_steps, created_at, completed_at, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(job.id, job.keyword, job.status, job.currentStep, job.totalSteps, job.createdAt, job.completedAt ?? null, job.errorMessage ?? null)
    .run();
}

export async function updateSearchJobProgress(db: D1Database, job: SearchJob, status: SearchJob["status"], currentStep: string): Promise<SearchJob> {
  const updated = {
    ...job,
    status,
    currentStep
  };
  await db
    .prepare(
      `UPDATE search_jobs
       SET status = ?, current_step = ?, error_message = ?
       WHERE id = ?`
    )
    .bind(updated.status, updated.currentStep, updated.errorMessage ?? null, updated.id)
    .run();
  return updated;
}

export async function saveSearchFailure(db: D1Database, job: SearchJob, error: unknown): Promise<void> {
  await db
    .prepare(
      `UPDATE search_jobs
       SET status = ?, current_step = ?, completed_at = ?, error_message = ?
       WHERE id = ?`
    )
    .bind("failed", job.currentStep, new Date().toISOString(), getErrorMessage(error), job.id)
    .run();
}

export async function recordAgentTrace(db: D1Database, job: SearchJob, trace: AgentTraceInput): Promise<void> {
  const now = new Date().toISOString();
  const status = trace.status ?? "completed";
  const startedAt = trace.startedAt ?? now;
  const completedAt = trace.completedAt ?? (status === "running" || status === "pending" ? undefined : now);
  const id = job.id + "-trace-" + String(trace.stepOrder).padStart(2, "0") + "-" + trace.stepId;
  await db
    .prepare(
      `INSERT OR REPLACE INTO agent_traces (
        id, job_id, step_order, step_id, agent_name, status, summary, detail,
        input_count, output_count, started_at, completed_at, error_message, created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      job.id,
      trace.stepOrder,
      trace.stepId,
      trace.agentName,
      status,
      trace.summary,
      trace.detail ?? null,
      trace.inputCount ?? 0,
      trace.outputCount ?? 0,
      startedAt,
      completedAt ?? null,
      trace.errorMessage ?? null,
      now
    )
    .run();
}

export async function persistCriticFlags(db: D1Database, jobId: string, flags: CriticFlag[]): Promise<void> {
  if (!flags.length) return;
  const now = new Date().toISOString();
  await db.batch(flags.map((flag, index) => db
    .prepare("INSERT INTO critic_flags (id, job_id, paper_id, paper_rank, severity, flag_type, message, evidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(
      jobId + "-critic-" + String(index + 1).padStart(3, "0"),
      jobId,
      jobId + "-paper-" + flag.paperRank,
      flag.paperRank,
      flag.severity,
      flag.flagType,
      flag.message,
      flag.evidence,
      now
    )));
}

export async function persistJobOutputs(db: D1Database, jobId: string, outputs: JobOutputRecord[]): Promise<void> {
  const now = new Date().toISOString();
  await db.batch(outputs.map((output) => db
    .prepare("INSERT INTO job_outputs (id, job_id, output_type, status, storage, object_key, url_path, content_type, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(
      jobId + "-output-" + output.outputType,
      jobId,
      output.outputType,
      output.status,
      output.storage,
      output.key || null,
      output.urlPath || null,
      output.contentType,
      output.detail,
      now
    )));
}

export async function saveSearchResult(
  db: D1Database,
  job: SearchJob,
  papers: PaperRecord[],
  metrics: { sourceResultCount: number; allowedResultCount: number }
): Promise<void> {
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE search_jobs
         SET status = ?, current_step = ?, completed_at = ?, error_message = ?, source_result_count = ?, allowed_result_count = ?
         WHERE id = ?`
      )
      .bind(
        job.status,
        job.currentStep,
        job.completedAt ?? null,
        job.errorMessage ?? null,
        metrics.sourceResultCount,
        metrics.allowedResultCount,
        job.id
      )
  ];

  for (const paper of papers) {
    const paperId = `${job.id}-paper-${paper.rank}`;
    const evaluationScores = calculateEvaluationScores(paper);
    statements.push(
      db
        .prepare(
          `INSERT INTO papers (
            id, job_id, rank, title, authors, year, journal_name, doi, oa_status,
            openalex_id, abstract, cited_by_count, crossref_id, publisher, issn,
            publication_type, published_date, verification_status, verification_reason,
            oa_pdf_url, oa_landing_page_url, oa_license, oa_host_type, oa_repository,
            unpaywall_status, unpaywall_reason, drive_file_id, drive_web_url, drive_status, drive_reason, created_at
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          paperId,
          job.id,
          paper.rank,
          paper.title,
          paper.authors,
          paper.year,
          paper.journalName,
          paper.doi,
          paper.oaStatus,
          paper.openalexId,
          paper.abstract,
          paper.citedByCount,
          paper.crossrefId,
          paper.publisher,
          paper.issn,
          paper.publicationType,
          paper.publishedDate,
          paper.verificationStatus,
          paper.verificationReason,
          paper.oaPdfUrl,
          paper.oaLandingPageUrl,
          paper.oaLicense,
          paper.oaHostType,
          paper.oaRepository,
          paper.unpaywallStatus,
          paper.unpaywallReason,
          paper.driveFileId,
          paper.driveWebUrl,
          paper.driveStatus,
          paper.driveReason,
          now
        )
    );
    statements.push(
      db
        .prepare(
          `INSERT INTO evaluations (
            id, paper_id, abstract_score, relevance_score, journal_fit_score, verification_score,
            oa_score, citation_score, recency_score, final_score, include_status, relevance_reason, created_at
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          `${job.id}-evaluation-${paper.rank}`,
          paperId,
          paper.abstractScore,
          evaluationScores.relevanceScore,
          evaluationScores.journalFitScore,
          evaluationScores.verificationScore,
          evaluationScores.oaScore,
          evaluationScores.citationScore,
          evaluationScores.recencyScore,
          paper.finalScore,
          paper.includeStatus,
          paper.relevanceReason,
          now
        )
    );
  }

  await db.batch(statements);
}

export async function getSearchResult(db: D1Database, jobId: string): Promise<{ job: SearchJob; papers: PaperSummary[] } | null> {
  const jobRow = await db.prepare("SELECT * FROM search_jobs WHERE id = ?").bind(jobId).first<SearchJobRow>();
  if (!jobRow) return null;

  const paperRows = await db
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
        p.issn,
        p.publication_type,
        p.published_date,
        p.verification_status,
        p.verification_reason,
        p.oa_pdf_url,
        p.oa_landing_page_url,
        p.oa_license,
        p.oa_host_type,
        p.oa_repository,
        p.unpaywall_status,
        p.unpaywall_reason,
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
       ORDER BY p.rank ASC`
    )
    .bind(jobId)
    .all<PaperSummaryRow>();

  return {
    job: mapSearchJob(jobRow),
    papers: paperRows.results.map(mapPaperSummary)
  };
}

export async function getSearchResultWithCriticFlags(db: D1Database, jobId: string): Promise<SearchResult | null> {
  const result = await getSearchResult(db, jobId);
  if (!result) return null;
  return { ...result, criticFlags: await listCriticFlags(db, jobId) };
}

export async function listCriticFlags(db: D1Database, jobId: string): Promise<CriticFlag[]> {
  const rows = await db
    .prepare(
      "SELECT id, job_id, paper_id, paper_rank, severity, flag_type, message, evidence, created_at " +
        "FROM critic_flags WHERE job_id = ? " +
        "ORDER BY paper_rank ASC, severity DESC, flag_type ASC"
    )
    .bind(jobId)
    .all<{
      id: string;
      job_id: string;
      paper_id: string;
      paper_rank: number;
      severity: string;
      flag_type: string;
      message: string;
      evidence: string | null;
      created_at: string;
    }>();

  return rows.results.map((row) => ({
    id: row.id,
    jobId: row.job_id,
    paperId: row.paper_id,
    paperRank: row.paper_rank,
    severity: normalizeCriticSeverity(row.severity),
    flagType: row.flag_type,
    message: row.message,
    evidence: row.evidence ?? "",
    createdAt: row.created_at
  }));
}

function normalizeCriticSeverity(severity: string): CriticFlag["severity"] {
  if (severity === "high" || severity === "medium" || severity === "low") return severity;
  return "low";
}

export async function listJobOutputs(db: D1Database, jobId: string) {
  const rows = await db
    .prepare(
      "SELECT id, job_id, output_type, status, storage, object_key, url_path, content_type, detail, created_at " +
        "FROM job_outputs WHERE job_id = ? " +
        "ORDER BY CASE output_type WHEN 'csv' THEN 1 WHEN 'markdown' THEN 2 WHEN 'xlsx' THEN 3 WHEN 'pdf' THEN 4 ELSE 99 END"
    )
    .bind(jobId)
    .all<{
      id: string;
      job_id: string;
      output_type: string;
      status: string;
      storage: string;
      object_key: string | null;
      url_path: string | null;
      content_type: string | null;
      detail: string | null;
      created_at: string;
    }>();

  return rows.results.map((row) => ({
    id: row.id,
    jobId: row.job_id,
    outputType: row.output_type,
    status: row.status,
    storage: row.storage,
    objectKey: row.object_key ?? "",
    urlPath: row.url_path ?? "",
    contentType: row.content_type ?? "",
    detail: row.detail ?? "",
    createdAt: row.created_at
  }));
}

export async function listAgentTraces(db: D1Database, jobId: string): Promise<AgentTrace[]> {
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
  return rows.results.map(mapAgentTrace);
}

export async function listSearchJobs(db: D1Database, limit: number): Promise<SearchJob[]> {
  const rows = await db
    .prepare(
      `SELECT id, keyword, status, current_step, total_steps, created_at, completed_at, error_message, source_result_count, allowed_result_count
       FROM search_jobs
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<SearchJobRow>();
  return rows.results.map(mapSearchJob);
}

export function mapAgentTrace(row: AgentTraceRow): AgentTrace {
  return {
    id: row.id,
    jobId: row.job_id,
    stepOrder: row.step_order,
    stepId: row.step_id,
    agentName: row.agent_name,
    status: row.status,
    summary: row.summary,
    detail: row.detail ?? undefined,
    inputCount: row.input_count ?? undefined,
    outputCount: row.output_count ?? undefined,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    errorMessage: row.error_message ?? undefined
  };
}

export function mapSearchJob(row: SearchJobRow): SearchJob {
  return {
    id: row.id,
    keyword: row.keyword,
    status: row.status,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    errorMessage: row.error_message ?? undefined,
    sourceResultCount: row.source_result_count ?? undefined,
    allowedResultCount: row.allowed_result_count ?? undefined
  };
}

export function mapPaperSummary(row: PaperSummaryRow): PaperSummary {
  const journalMatch = getBusinessSchoolJournalMatch(row.journal_name);
  return {
    id: row.id,
    rank: row.rank,
    title: row.title,
    authors: row.authors,
    year: row.year,
    journalName: row.journal_name,
    journalField: journalMatch?.categoryLabel,
    journalRank: journalMatch?.rankLabel,
    doi: row.doi,
    oaStatus: row.oa_status,
    citedByCount: row.cited_by_count ?? 0,
    relevanceScore: row.relevance_score ?? undefined,
    journalFitScore: row.journal_fit_score ?? undefined,
    verificationScore: row.verification_score ?? undefined,
    oaScore: row.oa_score ?? undefined,
    citationScore: row.citation_score ?? undefined,
    recencyScore: row.recency_score ?? undefined,
    abstractScore: row.abstract_score ?? 0,
    finalScore: row.final_score ?? 0,
    includeStatus: row.include_status ?? "review",
    relevanceReason: row.relevance_reason ?? "No evaluation recorded.",
    publisher: row.publisher ?? "",
    issn: row.issn ?? "",
    publicationType: row.publication_type ?? "",
    publishedDate: row.published_date ?? "",
    verificationStatus: row.verification_status ?? "unverified",
    verificationReason: row.verification_reason ?? "No verification recorded.",
    oaPdfUrl: row.oa_pdf_url ?? "",
    oaLandingPageUrl: row.oa_landing_page_url ?? "",
    oaLicense: row.oa_license ?? "",
    oaHostType: row.oa_host_type ?? "",
    oaRepository: row.oa_repository ?? "",
    unpaywallStatus: row.unpaywall_status ?? "skipped",
    unpaywallReason: row.unpaywall_reason ?? "No Unpaywall lookup recorded.",
    driveFileId: row.drive_file_id ?? "",
    driveWebUrl: row.drive_web_url ?? "",
    driveStatus: row.drive_status ?? "skipped",
    driveReason: row.drive_reason ?? "No Google Drive upload recorded."
  };
}

export async function getMissingColumns(db: D1Database): Promise<{ table: string; column: string; ok: boolean }[]> {
  const requiredColumns: Array<{ table: string; columns: string[] }> = [
    {
      table: "search_jobs",
      columns: [
        "id",
        "keyword",
        "status",
        "current_step",
        "total_steps",
        "created_at",
        "completed_at",
        "error_message",
        "source_result_count",
        "allowed_result_count"
      ]
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
      table: "critic_flags",
      columns: [
        "id",
        "job_id",
        "paper_id",
        "paper_rank",
        "severity",
        "flag_type",
        "message",
        "evidence",
        "created_at"
      ]
    },
    {
      table: "job_outputs",
      columns: [
        "id",
        "job_id",
        "output_type",
        "status",
        "storage",
        "object_key",
        "url_path",
        "content_type",
        "detail",
        "created_at"
      ]
    },
    {
      table: "agent_traces",
      columns: [
        "id",
        "job_id",
        "step_order",
        "step_id",
        "agent_name",
        "status",
        "summary",
        "detail",
        "input_count",
        "output_count",
        "started_at",
        "completed_at",
        "error_message",
        "created_at"
      ]
    }
  ];
  const missing: { table: string; column: string; ok: boolean }[] = [];

  for (const table of requiredColumns) {
    const existing = await db.prepare(`PRAGMA table_info(${table.table})`).all<{ name: string }>();
    const names = new Set(existing.results.map((column) => column.name));
    for (const column of table.columns) {
      if (!names.has(column)) missing.push({ table: table.table, column, ok: false });
    }
  }

  return missing;
}
