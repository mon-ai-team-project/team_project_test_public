import { calculateFinalScore, isBusinessSchoolJournal, normalizeJournalName, type PaperSummary, type SearchJob } from "@paper-agent/shared";

export interface Env {
  DB?: D1Database;
  REPORTS?: R2Bucket;
  WOS_API_KEY?: string;
  CROSSREF_EMAIL?: string;
  UNPAYWALL_EMAIL?: string;
  GOOGLE_CLIENT_EMAIL?: string;
  GOOGLE_PRIVATE_KEY?: string;
  GOOGLE_DRIVE_FOLDER_ID?: string;
}

type CreateSearchJobRequest = {
  keyword?: string;
  yearStart?: number;
  yearEnd?: number;
  maxResults?: number;
};

type DiagnosticsColumnCheck = {
  table: string;
  column: string;
  ok: boolean;
};

type DiagnosticsResponse = {
  ok: boolean;
  db: {
    bound: boolean;
    missingColumns: DiagnosticsColumnCheck[];
  };
  env: {
    wosApiKey: boolean;
    crossrefEmail: boolean;
    unpaywallEmail: boolean;
    r2Reports: boolean;
  };
};

type PaperRecord = PaperSummary & {
  openalexId: string;
  abstract: string;
  citedByCount: number;
  crossrefId: string;
  publisher: string;
  issn: string;
  publicationType: string;
  publishedDate: string;
  verificationStatus: "verified" | "partial" | "unverified";
  verificationReason: string;
  crossrefJournalName: string;
  oaPdfUrl: string;
  oaLandingPageUrl: string;
  oaLicense: string;
  oaHostType: string;
  oaRepository: string;
  unpaywallStatus: "found" | "not_found" | "skipped" | "failed";
  unpaywallReason: string;
};

type EvaluationScores = {
  relevanceScore: number;
  journalFitScore: number;
  verificationScore: number;
  oaScore: number;
  citationScore: number;
  recencyScore: number;
};

type WosStarterResponse = {
  documents?: WosDocument[];
};

type WosDocument = {
  uid?: string;
  title?: string | string[] | { value?: string };
  names?: {
    authors?: Array<{
      displayName?: string;
      fullName?: string;
      name?: string;
    }>;
  };
  source?: {
    sourceTitle?: string;
    publishYear?: number | string;
    publicationYear?: number | string;
    year?: number | string;
  };
  identifiers?: {
    doi?: string;
    DOI?: string;
  };
  citations?: Array<{
    count?: number;
    db?: string;
  }>;
  abstract?: string | { value?: string };
  keywords?: string[] | {
    authorKeywords?: string[];
    keywordsPlus?: string[];
  };
};

type CrossrefResponse = {
  message?: CrossrefWork;
};

type CrossrefWork = {
  DOI?: string;
  title?: string[];
  publisher?: string;
  ISSN?: string[];
  type?: string;
  "container-title"?: string[];
  published?: { "date-parts"?: number[][] };
  "published-print"?: { "date-parts"?: number[][] };
  "published-online"?: { "date-parts"?: number[][] };
};

type UnpaywallResponse = {
  is_oa?: boolean;
  oa_status?: string;
  best_oa_location?: UnpaywallLocation | null;
};

type UnpaywallLocation = {
  url_for_pdf?: string | null;
  url_for_landing_page?: string | null;
  license?: string | null;
  host_type?: string | null;
  repository_institution?: string | null;
};

type SearchJobRow = {
  id: string;
  keyword: string;
  status: SearchJob["status"];
  current_step: string;
  total_steps: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
};

type PaperSummaryRow = {
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
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "paper-agent-worker" });
    }

    if (url.pathname === "/api/diagnostics" && request.method === "GET") {
      try {
        return json(await getDiagnostics(env));
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    if (url.pathname === "/api/search-jobs" && request.method === "POST") {
      try {
        const body = await readJson<CreateSearchJobRequest>(request);
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const keyword = normalizeKeyword(body.keyword);
        const maxResults = normalizeMaxResults(body.maxResults);
        const job = createSearchJob(keyword, "searching");
        await saveSearchJob(env.DB, job);
        ctx.waitUntil(
          processSearchJob(env.DB, job, keyword, {
            wosApiKey: env.WOS_API_KEY,
            crossrefEmail: env.CROSSREF_EMAIL ?? env.UNPAYWALL_EMAIL,
            unpaywallEmail: env.UNPAYWALL_EMAIL,
            maxResults,
            yearStart: body.yearStart,
            yearEnd: body.yearEnd
          })
        );
        return json({ job, papers: [] });
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    const jobMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)$/);
    if (jobMatch && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const result = await getSearchResult(env.DB, jobMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        return json(result);
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    const csvMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)\/papers\.csv$/);
    if (csvMatch && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const result = await getSearchResult(env.DB, csvMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        return csv(result);
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    const reportMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)\/report\.md$/);
    if (reportMatch && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const result = await getSearchResult(env.DB, reportMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        return markdownReport(result);
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    return json({ error: "Not found" }, 404);
  }
};

async function readJson<T extends object>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>;
  } catch {
    return {};
  }
}

function normalizeKeyword(keyword: string | undefined): string {
  const normalized = keyword?.trim();
  return normalized || "AI interview employer branding";
}

function normalizeMaxResults(maxResults: number | undefined): number {
  if (typeof maxResults !== "number" || !Number.isFinite(maxResults)) return 20;
  return Math.max(1, Math.min(50, Math.trunc(maxResults)));
}

function createSearchJob(keyword: string, status: SearchJob["status"], id = `job-${crypto.randomUUID()}`): SearchJob {
  const now = new Date().toISOString();
  return {
    id,
    keyword,
    status,
    currentStep: status === "searching" ? "wos_search" : "ranking",
    totalSteps: 6,
    createdAt: now
  };
}

function completeSearchJob(job: SearchJob): SearchJob {
  return {
    ...job,
    status: "completed",
    currentStep: "completed",
    completedAt: new Date().toISOString()
  };
}

async function ensureSchema(db: D1Database): Promise<void> {
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
        error_message TEXT
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

  await ensureColumn(db, "search_jobs", "id", "TEXT");
  await ensureColumn(db, "search_jobs", "keyword", "TEXT DEFAULT ''");
  await ensureColumn(db, "search_jobs", "status", "TEXT DEFAULT 'completed'");
  await ensureColumn(db, "search_jobs", "current_step", "TEXT DEFAULT 'ranking'");
  await ensureColumn(db, "search_jobs", "total_steps", "INTEGER DEFAULT 12");
  await ensureColumn(db, "search_jobs", "created_at", "TEXT");
  await ensureColumn(db, "search_jobs", "completed_at", "TEXT");
  await ensureColumn(db, "search_jobs", "error_message", "TEXT");

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

  await db.batch([
    db.prepare("CREATE INDEX IF NOT EXISTS idx_papers_job_id ON papers(job_id)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_evaluations_paper_id ON evaluations(paper_id)")
  ]);
}

async function ensureColumn(db: D1Database, tableName: string, columnName: string, definition: string): Promise<void> {
  const columns = await db.prepare(`PRAGMA table_info(${tableName})`).all<{ name: string }>();
  if (columns.results.some((column) => column.name === columnName)) return;
  await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
}

async function getDiagnostics(env: Env): Promise<DiagnosticsResponse> {
  const missingColumns = env.DB ? await getMissingColumns(env.DB) : [];
  return {
    ok: Boolean(env.DB) && missingColumns.length === 0,
    db: {
      bound: Boolean(env.DB),
      missingColumns
    },
    env: {
      wosApiKey: Boolean(env.WOS_API_KEY),
      crossrefEmail: Boolean(env.CROSSREF_EMAIL),
      unpaywallEmail: Boolean(env.UNPAYWALL_EMAIL),
      r2Reports: Boolean(env.REPORTS)
    }
  };
}

async function getMissingColumns(db: D1Database): Promise<DiagnosticsColumnCheck[]> {
  const requiredColumns: Array<{ table: string; columns: string[] }> = [
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
    }
  ];
  const missing: DiagnosticsColumnCheck[] = [];

  for (const table of requiredColumns) {
    const existing = await db.prepare(`PRAGMA table_info(${table.table})`).all<{ name: string }>();
    const names = new Set(existing.results.map((column) => column.name));
    for (const column of table.columns) {
      if (!names.has(column)) missing.push({ table: table.table, column, ok: false });
    }
  }

  return missing;
}

async function saveSearchJob(db: D1Database, job: SearchJob): Promise<void> {
  await db
    .prepare(
      `INSERT INTO search_jobs (id, keyword, status, current_step, total_steps, created_at, completed_at, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(job.id, job.keyword, job.status, job.currentStep, job.totalSteps, job.createdAt, job.completedAt ?? null, job.errorMessage ?? null)
    .run();
}

async function updateSearchJobProgress(db: D1Database, job: SearchJob, status: SearchJob["status"], currentStep: string): Promise<SearchJob> {
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

async function saveSearchFailure(db: D1Database, job: SearchJob, error: unknown): Promise<void> {
  await db
    .prepare(
      `UPDATE search_jobs
       SET status = ?, current_step = ?, completed_at = ?, error_message = ?
       WHERE id = ?`
    )
    .bind("failed", job.currentStep, new Date().toISOString(), getErrorMessage(error), job.id)
    .run();
}

async function saveSearchResult(db: D1Database, job: SearchJob, papers: PaperRecord[]): Promise<void> {
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE search_jobs
         SET status = ?, current_step = ?, completed_at = ?, error_message = ?
         WHERE id = ?`
      )
      .bind(job.status, job.currentStep, job.completedAt ?? null, job.errorMessage ?? null, job.id)
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
            unpaywall_status, unpaywall_reason, created_at
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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

async function processSearchJob(
  db: D1Database,
  initialJob: SearchJob,
  keyword: string,
  options: {
    wosApiKey?: string;
    crossrefEmail?: string;
    unpaywallEmail?: string;
    maxResults: number;
    yearStart?: number;
    yearEnd?: number;
  }
): Promise<void> {
  let job = initialJob;
  try {
    job = await updateSearchJobProgress(db, job, "searching", "wos_search");
    const candidates = await searchWebOfScience(keyword, options);

    job = await updateSearchJobProgress(db, job, "scoring", "journal_filter");
    const allowedPapers = filterAllowedBusinessSchoolJournals(candidates).slice(0, options.maxResults);

    job = await updateSearchJobProgress(db, job, "enriching_metadata", "crossref_enrichment");
    const crossrefEnriched = await enrichPapersWithCrossref(allowedPapers, options.crossrefEmail);

    job = await updateSearchJobProgress(db, job, "checking_oa", "unpaywall_check");
    const unpaywallEnriched = await enrichPapersWithUnpaywall(crossrefEnriched, options.unpaywallEmail);

    job = await updateSearchJobProgress(db, job, "ranking", "ranking");
    await saveSearchResult(db, completeSearchJob(job), unpaywallEnriched);
  } catch (error) {
    await saveSearchFailure(db, job, error);
  }
}

async function searchWebOfScience(
  keyword: string,
  options: {
    wosApiKey?: string;
    maxResults: number;
    yearStart?: number;
    yearEnd?: number;
  }
): Promise<PaperRecord[]> {
  if (!options.wosApiKey) {
    throw new Error("Web of Science API key is not configured. Add WOS_API_KEY in Cloudflare Worker variables/secrets, then redeploy.");
  }

  const url = new URL("https://api.clarivate.com/apis/wos-starter/v1/documents");
  const candidateLimit = Math.min(100, Math.max(options.maxResults, options.maxResults * 5));
  url.searchParams.set("q", buildWosQuery(keyword, options.yearStart, options.yearEnd));
  url.searchParams.set("limit", String(candidateLimit));
  url.searchParams.set("page", "1");
  url.searchParams.set("db", "WOS");
  url.searchParams.set("sortField", "TC+D");

  const response = await fetchWosWithRetry(url, options.wosApiKey);

  const data = (await response.json()) as WosStarterResponse;
  return (data.documents ?? []).slice(0, candidateLimit).map((document, index) => mapWosDocument(document, keyword, index + 1));
}

function buildWosQuery(keyword: string, yearStart: number | undefined, yearEnd: number | undefined): string {
  const terms = [`TS=(${escapeWosQuery(keyword)})`];
  const start = yearStart ? Math.trunc(yearStart) : null;
  const end = yearEnd ? Math.trunc(yearEnd) : null;
  if (start && end) terms.push(`PY=(${start}-${end})`);
  else if (start) terms.push(`PY=(${start}-${new Date().getUTCFullYear()})`);
  else if (end) terms.push(`PY=(1900-${end})`);
  return terms.join(" AND ");
}

function escapeWosQuery(value: string): string {
  return value.replace(/[()"']/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchWosWithRetry(url: URL, apiKey: string): Promise<Response> {
  const maxAttempts = 3;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-ApiKey": apiKey
      }
    });

    if (response.ok) return response;
    lastResponse = response;

    if (response.status !== 429 && response.status < 500) break;
    await sleep(2 ** attempt * 1000);
  }

  if (lastResponse?.status === 401 || lastResponse?.status === 403) {
    throw new Error("Web of Science request was not authorized. Check WOS_API_KEY in Cloudflare Worker variables/secrets.");
  }
  if (lastResponse?.status === 429) {
    throw new Error("Web of Science rate limit reached (429). Wait for the Clarivate quota window to reset or reduce search frequency.");
  }

  throw new Error(`Web of Science request failed with ${lastResponse?.status ?? "unknown status"}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapWosDocument(document: WosDocument, keyword: string, rank: number): PaperRecord {
  const abstract = getWosAbstract(document);
  const title = getWosTitle(document);
  const authors = getWosAuthors(document);
  const year = getWosYear(document);
  const citedByCount = getWosCitationCount(document);
  const scores = scorePaper({ keyword, title, abstract, citedByCount, year });
  const doi = getWosDoi(document);
  return {
    id: document.uid || `wos-${rank}`,
    rank,
    title,
    authors,
    year,
    journalName: getWosJournalName(document),
    doi,
    oaStatus: "unknown",
    abstractScore: scores.abstractScore,
    finalScore: scores.finalScore,
    includeStatus: scores.finalScore >= 0.35 ? "include" : "review",
    relevanceReason: scores.reason,
    openalexId: document.uid ?? "",
    abstract,
    citedByCount,
    crossrefId: "",
    publisher: "",
    issn: "",
    publicationType: "",
    publishedDate: "",
    verificationStatus: doi ? "unverified" : "partial",
    verificationReason: doi ? "Crossref verification pending." : "No DOI available for Crossref verification.",
    crossrefJournalName: "",
    oaPdfUrl: "",
    oaLandingPageUrl: "",
    oaLicense: "",
    oaHostType: "",
    oaRepository: "",
    unpaywallStatus: doi ? "skipped" : "not_found",
    unpaywallReason: doi ? "Unpaywall lookup pending." : "No DOI available for Unpaywall lookup."
  };
}

async function enrichPapersWithCrossref(papers: PaperRecord[], email: string | undefined): Promise<PaperRecord[]> {
  const enriched: PaperRecord[] = [];
  for (const paper of papers) {
    if (!paper.doi) {
      enriched.push(paper);
      continue;
    }

    try {
      const crossref = await fetchCrossrefWork(paper.doi, email);
      enriched.push(applyCrossrefMetadata(paper, crossref));
    } catch (error) {
      enriched.push({
        ...paper,
        verificationStatus: "partial",
        verificationReason: `Crossref lookup failed: ${getErrorMessage(error)}`
      });
    }
  }
  return enriched;
}

async function fetchCrossrefWork(doi: string, email: string | undefined): Promise<CrossrefWork> {
  const url = new URL(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  if (email) url.searchParams.set("mailto", email);
  const response = await fetchCrossrefWithRetry(url, email);
  const data = (await response.json()) as CrossrefResponse;
  if (!data.message) throw new Error("Crossref response did not include message metadata");
  return data.message;
}

async function fetchCrossrefWithRetry(url: URL, email: string | undefined): Promise<Response> {
  const maxAttempts = 3;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": email ? `paper-agent-project (${email})` : "paper-agent-project"
      }
    });
    if (response.ok) return response;
    lastResponse = response;
    if (response.status !== 429 && response.status < 500) break;
    await sleep(2 ** attempt * 1000);
  }

  throw new Error(`Crossref request failed with ${lastResponse?.status ?? "unknown status"}`);
}

function applyCrossrefMetadata(paper: PaperRecord, crossref: CrossrefWork): PaperRecord {
  const crossrefTitle = crossref.title?.[0] ?? "";
  const crossrefJournal = crossref["container-title"]?.[0] ?? "";
  const crossrefYear = getCrossrefYear(crossref);
  const titleMatches = crossrefTitle ? isSimilarText(paper.title, crossrefTitle) : null;
  const yearMatches = crossrefYear ? paper.year === crossrefYear : null;
  const journalMatches = crossrefJournal ? isSimilarText(paper.journalName, crossrefJournal) : null;
  const checks = [
    titleMatches === null ? "title missing" : `title ${titleMatches ? "match" : "mismatch"}`,
    yearMatches === null ? "year missing" : `year ${yearMatches ? "match" : "mismatch"}`,
    journalMatches === null ? "journal missing" : `journal ${journalMatches ? "match" : "mismatch"}`
  ];
  const matchCount = [titleMatches, yearMatches, journalMatches].filter(Boolean).length;
  return {
    ...paper,
    crossrefId: normalizeDoi(crossref.DOI),
    publisher: crossref.publisher ?? "",
    issn: (crossref.ISSN ?? []).join("; "),
    publicationType: crossref.type ?? "",
    publishedDate: getCrossrefDate(crossref),
    verificationStatus: matchCount >= 2 ? "verified" : matchCount >= 1 ? "partial" : "unverified",
    verificationReason: checks.join("; "),
    crossrefJournalName: crossrefJournal
  };
}

function filterAllowedBusinessSchoolJournals(papers: PaperRecord[]): PaperRecord[] {
  return papers
    .filter((paper) => isAllowedBusinessSchoolJournal(paper))
    .map((paper, index) => ({ ...paper, rank: index + 1 }));
}

function isAllowedBusinessSchoolJournal(paper: PaperRecord): boolean {
  const sourceNames = [paper.journalName, paper.crossrefJournalName].filter(Boolean);
  return sourceNames.some((sourceName) => isBusinessSchoolJournal(sourceName) || isCloseJournalNameMatch(sourceName));
}

function isCloseJournalNameMatch(sourceName: string): boolean {
  const normalized = normalizeJournalName(sourceName);
  return normalized.endsWith("s") && isBusinessSchoolJournal(normalized.slice(0, -1));
}

async function enrichPapersWithUnpaywall(papers: PaperRecord[], email: string | undefined): Promise<PaperRecord[]> {
  const enriched: PaperRecord[] = [];
  for (const paper of papers) {
    if (!paper.doi) {
      enriched.push(paper);
      continue;
    }

    if (!email) {
      enriched.push({
        ...paper,
        unpaywallStatus: "skipped",
        unpaywallReason: "UNPAYWALL_EMAIL is not configured."
      });
      continue;
    }

    try {
      const unpaywall = await fetchUnpaywallWork(paper.doi, email);
      enriched.push(applyUnpaywallMetadata(paper, unpaywall));
    } catch (error) {
      enriched.push({
        ...paper,
        unpaywallStatus: "failed",
        unpaywallReason: `Unpaywall lookup failed: ${getErrorMessage(error)}`
      });
    }
  }
  return enriched;
}

async function fetchUnpaywallWork(doi: string, email: string): Promise<UnpaywallResponse> {
  const url = new URL(`https://api.unpaywall.org/v2/${encodeURIComponent(doi)}`);
  url.searchParams.set("email", email);
  const response = await fetchUnpaywallWithRetry(url, email);
  return (await response.json()) as UnpaywallResponse;
}

async function fetchUnpaywallWithRetry(url: URL, email: string): Promise<Response> {
  const maxAttempts = 3;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": `paper-agent-project (${email})`
      }
    });
    if (response.ok) return response;
    lastResponse = response;
    if (response.status !== 429 && response.status < 500) break;
    await sleep(2 ** attempt * 1000);
  }

  throw new Error(`Unpaywall request failed with ${lastResponse?.status ?? "unknown status"}`);
}

function applyUnpaywallMetadata(paper: PaperRecord, unpaywall: UnpaywallResponse): PaperRecord {
  const location = unpaywall.best_oa_location;
  const pdfUrl = location?.url_for_pdf ?? "";
  const landingPageUrl = location?.url_for_landing_page ?? "";
  const status: PaperRecord["unpaywallStatus"] = unpaywall.is_oa ? "found" : "not_found";
  return {
    ...paper,
    oaStatus: unpaywall.is_oa ? "oa" : paper.oaStatus === "oa" ? "oa" : "closed",
    oaPdfUrl: pdfUrl,
    oaLandingPageUrl: landingPageUrl,
    oaLicense: location?.license ?? "",
    oaHostType: location?.host_type ?? "",
    oaRepository: location?.repository_institution ?? "",
    unpaywallStatus: status,
    unpaywallReason: unpaywall.is_oa
      ? `OA location ${pdfUrl ? "includes PDF URL" : landingPageUrl ? "includes landing page only" : "has no URL"}`
      : `Unpaywall OA status: ${unpaywall.oa_status ?? "closed"}`
  };
}

function getCrossrefYear(work: CrossrefWork): number | null {
  return work.published?.["date-parts"]?.[0]?.[0] ?? work["published-online"]?.["date-parts"]?.[0]?.[0] ?? work["published-print"]?.["date-parts"]?.[0]?.[0] ?? null;
}

function getCrossrefDate(work: CrossrefWork): string {
  const parts = work.published?.["date-parts"]?.[0] ?? work["published-online"]?.["date-parts"]?.[0] ?? work["published-print"]?.["date-parts"]?.[0];
  if (!parts?.length) return "";
  const [year, month = 1, day = 1] = parts;
  return [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
}

function isSimilarText(left: string, right: string): boolean {
  const leftTokens = tokenize(left);
  const rightTokens = new Set(tokenize(right));
  if (!leftTokens.length || !rightTokens.size) return false;
  const overlap = leftTokens.filter((token) => rightTokens.has(token)).length / leftTokens.length;
  return overlap >= 0.6;
}

function normalizeDoi(doi: string | null | undefined): string {
  return doi?.replace(/^https?:\/\/doi\.org\//i, "") ?? "";
}

function getWosTitle(document: WosDocument): string {
  const title = document.title;
  if (Array.isArray(title)) return title[0] ?? "Untitled work";
  if (typeof title === "object") return title.value ?? "Untitled work";
  return title || "Untitled work";
}

function getWosAuthors(document: WosDocument): string {
  const authors = (document.names?.authors ?? [])
    .map((author) => author.displayName ?? author.fullName ?? author.name)
    .filter((name): name is string => Boolean(name));
  return authors.slice(0, 5).join(", ") || "Unknown authors";
}

function getWosJournalName(document: WosDocument): string {
  return document.source?.sourceTitle ?? "Unknown source";
}

function getWosYear(document: WosDocument): number {
  const value = document.source?.publishYear ?? document.source?.publicationYear ?? document.source?.year;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseInt(value, 10) || 0;
  return 0;
}

function getWosDoi(document: WosDocument): string {
  return normalizeDoi(document.identifiers?.doi ?? document.identifiers?.DOI);
}

function getWosCitationCount(document: WosDocument): number {
  const citations = document.citations ?? [];
  const wosCitation = citations.find((citation) => citation.db?.toUpperCase() === "WOS");
  return wosCitation?.count ?? citations[0]?.count ?? 0;
}

function getWosAbstract(document: WosDocument): string {
  const abstract = document.abstract;
  if (typeof abstract === "string") return abstract;
  if (typeof abstract === "object") return abstract.value ?? "";
  if (Array.isArray(document.keywords)) return document.keywords.join(" ");
  const keywordGroups = document.keywords;
  if (keywordGroups && typeof keywordGroups === "object") {
    return [...(keywordGroups.authorKeywords ?? []), ...(keywordGroups.keywordsPlus ?? [])].join(" ");
  }
  return "";
}

function scorePaper(input: { keyword: string; title: string; abstract: string; citedByCount: number; year: number }) {
  const titleScore = keywordOverlap(input.keyword, input.title);
  const abstractScore = keywordOverlap(input.keyword, input.abstract);
  const citationScore = Math.min(input.citedByCount / 100, 1);
  const recencyScore = scoreRecency(input.year);
  const finalScore = calculateFinalScore({
    abstractRelevance: abstractScore,
    titleRelevance: titleScore,
    journalQuality: 0.5,
    citationInfluence: citationScore,
    recency: recencyScore
  });
  const reason = [
    `title keyword overlap ${titleScore.toFixed(2)}`,
    `abstract keyword overlap ${abstractScore.toFixed(2)}`,
    `citations ${input.citedByCount}`,
    `year ${input.year || "unknown"}`
  ].join("; ");
  return {
    abstractScore: roundScore(abstractScore),
    finalScore: roundScore(finalScore),
    reason
  };
}

function keywordOverlap(keyword: string, text: string): number {
  const keywordTerms = tokenize(keyword);
  if (!keywordTerms.length) return 0;
  const textTerms = new Set(tokenize(text));
  const matches = keywordTerms.filter((term) => textTerms.has(term)).length;
  return matches / keywordTerms.length;
}

function tokenize(value: string): string[] {
  return Array.from(new Set(value.toLowerCase().match(/[a-z0-9가-힣]+/g) ?? [])).filter((term) => term.length > 1);
}

function scoreRecency(year: number): number {
  if (!year) return 0;
  const currentYear = new Date().getUTCFullYear();
  return Math.max(0, Math.min(1, 1 - (currentYear - year) / 10));
}

function calculateEvaluationScores(paper: PaperSummary): EvaluationScores {
  return {
    relevanceScore: roundScore(paper.abstractScore),
    journalFitScore: 1,
    verificationScore: roundScore(paper.verificationStatus === "verified" ? 1 : paper.verificationStatus === "partial" ? 0.5 : 0),
    oaScore: roundScore(paper.oaPdfUrl ? 1 : paper.oaLandingPageUrl || paper.oaStatus === "oa" ? 0.75 : paper.unpaywallStatus === "not_found" ? 0 : 0.25),
    citationScore: roundScore(Math.min((paper.citedByCount ?? 0) / 100, 1)),
    recencyScore: roundScore(scoreRecency(paper.year))
  };
}

function roundScore(score: number): number {
  return Math.round(score * 1000) / 1000;
}

async function getSearchResult(db: D1Database, jobId: string): Promise<{ job: SearchJob; papers: PaperSummary[] } | null> {
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

function mapSearchJob(row: SearchJobRow): SearchJob {
  return {
    id: row.id,
    keyword: row.keyword,
    status: row.status,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    errorMessage: row.error_message ?? undefined
  };
}

function mapPaperSummary(row: PaperSummaryRow): PaperSummary {
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
    unpaywallReason: row.unpaywall_reason ?? "No Unpaywall lookup recorded."
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

function csv(result: { job: SearchJob; papers: PaperSummary[] }): Response {
  const headers = [
    "job_id",
    "keyword",
    "rank",
    "title",
    "authors",
    "year",
    "journal_name",
    "doi",
    "oa_status",
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
    "abstract_score",
    "relevance_score",
    "journal_fit_score",
    "verification_score",
    "oa_score",
    "citation_score",
    "recency_score",
    "final_score",
    "include_status",
    "relevance_reason"
  ];
  const rows = result.papers.map((paper) => [
    result.job.id,
    result.job.keyword,
    paper.rank,
    paper.title,
    paper.authors,
    paper.year,
    paper.journalName,
    paper.doi,
    paper.oaStatus,
    paper.publisher ?? "",
    paper.issn ?? "",
    paper.publicationType ?? "",
    paper.publishedDate ?? "",
    paper.verificationStatus ?? "",
    paper.verificationReason ?? "",
    paper.oaPdfUrl ?? "",
    paper.oaLandingPageUrl ?? "",
    paper.oaLicense ?? "",
    paper.oaHostType ?? "",
    paper.oaRepository ?? "",
    paper.unpaywallStatus ?? "",
    paper.unpaywallReason ?? "",
    paper.abstractScore,
    paper.relevanceScore ?? "",
    paper.journalFitScore ?? "",
    paper.verificationScore ?? "",
    paper.oaScore ?? "",
    paper.citationScore ?? "",
    paper.recencyScore ?? "",
    paper.finalScore,
    paper.includeStatus,
    paper.relevanceReason
  ]);
  const body = [headers, ...rows].map((row) => row.map(formatCsvCell).join(",")).join("\n");
  const fileName = `${sanitizeFileName(result.job.keyword)}-${result.job.id}.csv`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      ...corsHeaders()
    }
  });
}

function markdownReport(result: { job: SearchJob; papers: PaperSummary[] }): Response {
  const lines = [
    `# Paper Agent Report`,
    "",
    `- Job ID: ${result.job.id}`,
    `- Keyword: ${result.job.keyword}`,
    `- Status: ${result.job.status}`,
    `- Current step: ${result.job.currentStep}`,
    `- Created at: ${result.job.createdAt}`,
    `- Completed at: ${result.job.completedAt ?? "Not completed"}`,
    `- Paper count: ${result.papers.length}`,
    "",
    "## Ranked Papers",
    ""
  ];

  if (!result.papers.length) {
    lines.push("No allowed journal results were saved for this job.", "");
  }

  for (const paper of result.papers) {
    lines.push(
      `### ${paper.rank}. ${paper.title}`,
      "",
      `- Authors: ${paper.authors}`,
      `- Year: ${paper.year || "Unknown"}`,
      `- Journal: ${paper.journalName}`,
      `- DOI: ${paper.doi || "Not available"}`,
      `- Open access: ${paper.oaStatus}`,
      `- Final score: ${paper.finalScore.toFixed(3)}`,
      `- Include status: ${paper.includeStatus}`,
      `- Citation count: ${paper.citedByCount ?? 0}`,
      `- Publisher: ${paper.publisher || "Not available"}`,
      `- Verification: ${paper.verificationStatus ?? "unverified"} - ${paper.verificationReason ?? "No verification recorded."}`,
      `- Unpaywall: ${paper.unpaywallStatus ?? "skipped"} - ${paper.unpaywallReason ?? "No Unpaywall lookup recorded."}`,
      `- OA PDF: ${paper.oaPdfUrl || "Not available"}`,
      "",
      "Score breakdown:",
      "",
      `- Relevance: ${formatReportScore(paper.relevanceScore ?? paper.abstractScore)}`,
      `- Journal fit: ${formatReportScore(paper.journalFitScore ?? 1)}`,
      `- Crossref verification: ${formatReportScore(paper.verificationScore ?? 0)}`,
      `- Open access: ${formatReportScore(paper.oaScore ?? 0)}`,
      `- Citation: ${formatReportScore(paper.citationScore ?? 0)}`,
      `- Recency: ${formatReportScore(paper.recencyScore ?? 0)}`,
      "",
      `Relevance reason: ${paper.relevanceReason}`,
      ""
    );
  }

  const body = `${lines.join("\n")}\n`;
  const fileName = `${sanitizeFileName(result.job.keyword)}-${result.job.id}-report.md`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      ...corsHeaders()
    }
  });
}

function formatReportScore(value: number): string {
  return value.toFixed(3);
}

function formatCsvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function sanitizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "papers";
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected Worker error";
}
