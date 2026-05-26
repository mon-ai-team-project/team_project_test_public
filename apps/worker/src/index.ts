import {
  BUSINESS_SCHOOL_JOURNALS,
  getBusinessSchoolJournalCategory,
  getBusinessSchoolJournalMatch,
  normalizeJournalName,
  type AgentTrace,
  type AgentTraceStatus,
  type PaperSummary,
  type SearchJob
} from "@paper-agent/shared";

import {
  csv,
  getCsvFileName,
  getCsvOutputKey,
  getMarkdownReportFileName,
  getMarkdownReportOutputKey,
  getPdfFileName,
  getPdfOutputKey,
  getStoredOutput,
  getXlsxFileName,
  getXlsxOutputKey,
  markdownReport,
  pdf,
  persistSearchOutputs,
  xlsx,
  type CriticFlag,
  type JobOutputRecord,
  type SearchResult
} from "./reports";

import {
  type PaperRecord,
  type SearchProvider
} from "./types";

import {
  getErrorMessage,
  sleep
} from "./utils";

import {
  filterAllowedBusinessSchoolJournals,
  rankPapers
} from "./scoring";

import {
  buildCriticFlags,
  runLlmCritic
} from "./critic";

import {
  searchOpenAlex,
  searchWebOfScience
} from "./providers";

import {
  enrichPapersWithCrossref,
  enrichPapersWithUnpaywall,
  uploadOpenAccessPdfsToDrive
} from "./enrichment";

import {
  getSemanticRelevance,
  upsertPaperVectors
} from "./vectorize";

import {
  ensureSchema,
  getMissingColumns,
  getSearchResult,
  getSearchResultWithCriticFlags,
  listAgentTraces,
  listCriticFlags,
  listJobOutputs,
  listSearchJobs,
  persistCriticFlags,
  persistJobOutputs,
  recordAgentTrace,
  saveSearchFailure,
  saveSearchJob,
  saveSearchResult,
  updateSearchJobProgress
} from "./persistence";

export interface Env {
  DB?: D1Database;
  REPORTS?: R2Bucket;
  AI?: any;
  VECTOR_INDEX?: VectorizeIndex;
  SEARCH_PROVIDER?: string;
  WOS_API_KEY?: string;
  WOS_APIKEY?: string;
  WOS_STARTER_API_KEY?: string;
  CLARIVATE_API_KEY?: string;
  WEB_OF_SCIENCE_API_KEY?: string;
  OPENALEX_EMAIL?: string;
  OPENALEX_API_KEY?: string;
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
  enrichmentLimit?: number;
  journalCategoryId?: string;
};

type DiagnosticsColumnCheck = {
  table: string;
  column: string;
  ok: boolean;
};

type DiagnosticsResponse = {
  ok: boolean;
  searchProvider: SearchProvider;
  db: {
    bound: boolean;
    missingColumns: DiagnosticsColumnCheck[];
  };
  env: {
    wosApiKey: boolean;
    wosApiKeySource: string | null;
    openAlexEmail: boolean;
    openAlexApiKey: boolean;
    crossrefEmail: boolean;
    unpaywallEmail: boolean;
    r2Reports: boolean;
    googleDrive: boolean;
  };
  readiness: {
    activeProviderReady: boolean;
  };
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

    if (url.pathname === "/api/search-jobs" && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const limit = normalizeListLimit(url.searchParams.get("limit"));
        return json({ jobs: await listSearchJobs(env.DB, limit) });
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
        const enrichmentLimit = normalizeEnrichmentLimit(body.enrichmentLimit, maxResults);
        const searchProvider = normalizeSearchProvider(env.SEARCH_PROVIDER);
        const job = createSearchJob(keyword, "searching", searchProvider);
        await saveSearchJob(env.DB, job);
        ctx.waitUntil(
          processSearchJob(env.DB, job, keyword, {
            searchProvider,
            wosApiKey: getWosApiKey(env).value,
            openAlexEmail: env.OPENALEX_EMAIL,
            openAlexApiKey: env.OPENALEX_API_KEY,
            crossrefEmail: env.CROSSREF_EMAIL ?? env.UNPAYWALL_EMAIL,
            unpaywallEmail: env.UNPAYWALL_EMAIL,
            reports: env.REPORTS,
            ai: env.AI,
            vectorIndex: env.VECTOR_INDEX,
            googleClientEmail: env.GOOGLE_CLIENT_EMAIL,
            googlePrivateKey: env.GOOGLE_PRIVATE_KEY,
            googleDriveFolderId: env.GOOGLE_DRIVE_FOLDER_ID,
            maxResults,
            enrichmentLimit,
            yearStart: body.yearStart,
            yearEnd: body.yearEnd,
            journalCategoryId: normalizeJournalCategoryId(body.journalCategoryId)
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

    const tracesMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)\/traces$/);
    if (tracesMatch && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const result = await getSearchResult(env.DB, tracesMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        return json({ job: result.job, traces: await listAgentTraces(env.DB, tracesMatch[1]) });
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    const criticFlagsMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)\/critic-flags$/);
    if (criticFlagsMatch && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const result = await getSearchResult(env.DB, criticFlagsMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        return json({ job: result.job, criticFlags: await listCriticFlags(env.DB, criticFlagsMatch[1]) });
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    const outputsMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)\/outputs$/);
    if (outputsMatch && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const result = await getSearchResult(env.DB, outputsMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        return json({ job: result.job, outputs: await listJobOutputs(env.DB, outputsMatch[1]) });
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
        const stored = await getStoredOutput(env.REPORTS, getCsvOutputKey(result.job.id), getCsvFileName(result));
        if (stored) return stored;
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
        const result = await getSearchResultWithCriticFlags(env.DB, reportMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        return markdownReport(result);
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    const xlsxMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)\/papers\.xlsx$/);
    if (xlsxMatch && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const result = await getSearchResult(env.DB, xlsxMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        const stored = await getStoredOutput(env.REPORTS, getXlsxOutputKey(result.job.id), getXlsxFileName(result));
        if (stored) return stored;
        return xlsx(result);
      } catch (error) {
        return json({ error: getErrorMessage(error) }, 500);
      }
    }

    const pdfMatch = url.pathname.match(/^\/api\/search-jobs\/([^/]+)\/report\.pdf$/);
    if (pdfMatch && request.method === "GET") {
      try {
        if (!env.DB) return json({ error: "D1 database binding is not configured" }, 503);
        await ensureSchema(env.DB);
        const result = await getSearchResultWithCriticFlags(env.DB, pdfMatch[1]);
        if (!result) return json({ error: "Search job not found" }, 404);
        return pdf(result);
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

function normalizeEnrichmentLimit(enrichmentLimit: number | undefined, maxResults: number): number {
  if (typeof enrichmentLimit !== "number" || !Number.isFinite(enrichmentLimit)) return Math.min(10, maxResults);
  return Math.max(1, Math.min(maxResults, 20, Math.trunc(enrichmentLimit)));
}

function normalizeJournalCategoryId(categoryId: string | undefined): string | undefined {
  const normalized = categoryId?.trim();
  return getBusinessSchoolJournalCategory(normalized) ? normalized : undefined;
}

function normalizeListLimit(limit: string | null): number {
  const parsed = Number.parseInt(limit ?? "", 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(25, parsed));
}

function normalizeSearchProvider(value: string | undefined): SearchProvider {
  return value?.toLowerCase() === "openalex" ? "openalex" : "wos";
}

function getWosApiKey(env: Env): { value: string | undefined; source: string | null } {
  const candidates: Array<[string, string | undefined]> = [
    ["WOS_API_KEY", env.WOS_API_KEY],
    ["WOS_APIKEY", env.WOS_APIKEY],
    ["WOS_STARTER_API_KEY", env.WOS_STARTER_API_KEY],
    ["CLARIVATE_API_KEY", env.CLARIVATE_API_KEY],
    ["WEB_OF_SCIENCE_API_KEY", env.WEB_OF_SCIENCE_API_KEY]
  ];
  const match = candidates.find(([, value]) => Boolean(value?.trim()));
  return {
    value: match?.[1],
    source: match?.[0] ?? null
  };
}

function getSearchStepId(searchProvider: SearchProvider): string {
  return searchProvider === "openalex" ? "openalex_search" : "wos_search";
}

function createSearchJob(keyword: string, status: SearchJob["status"], searchProvider: SearchProvider, id = `job-${crypto.randomUUID()}`): SearchJob {
  const now = new Date().toISOString();
  return {
    id,
    keyword,
    status,
    currentStep: status === "searching" ? getSearchStepId(searchProvider) : "ranking",
    totalSteps: 12,
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
async function getDiagnostics(env: Env): Promise<DiagnosticsResponse> {
  if (env.DB) await ensureSchema(env.DB);
  const missingColumns = env.DB ? await getMissingColumns(env.DB) : [];
  const searchProvider = normalizeSearchProvider(env.SEARCH_PROVIDER);
  const wosApiKey = getWosApiKey(env);
  const activeProviderReady = searchProvider === "openalex" ? Boolean(env.OPENALEX_EMAIL) : Boolean(wosApiKey.value);
  return {
    ok: Boolean(env.DB) && missingColumns.length === 0 && activeProviderReady,
    searchProvider,
    db: {
      bound: Boolean(env.DB),
      missingColumns
    },
    env: {
      wosApiKey: Boolean(wosApiKey.value),
      wosApiKeySource: wosApiKey.source,
      openAlexEmail: Boolean(env.OPENALEX_EMAIL),
      openAlexApiKey: Boolean(env.OPENALEX_API_KEY),
      crossrefEmail: Boolean(env.CROSSREF_EMAIL),
      unpaywallEmail: Boolean(env.UNPAYWALL_EMAIL),
      r2Reports: Boolean(env.REPORTS),
      googleDrive: Boolean(env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY && env.GOOGLE_DRIVE_FOLDER_ID)
    },
    readiness: {
      activeProviderReady
    }
  };
}

async function processSearchJob(
  db: D1Database,
  initialJob: SearchJob,
  keyword: string,
  options: {
    searchProvider: SearchProvider;
    wosApiKey?: string;
    openAlexEmail?: string;
    openAlexApiKey?: string;
    crossrefEmail?: string;
    unpaywallEmail?: string;
    reports?: R2Bucket;
    ai?: any;
    vectorIndex?: VectorizeIndex;
    googleClientEmail?: string;
    googlePrivateKey?: string;
    googleDriveFolderId?: string;
    maxResults: number;
    enrichmentLimit: number;
    yearStart?: number;
    yearEnd?: number;
    journalCategoryId?: string;
  }
): Promise<void> {
  let job = initialJob;
  try {
    await recordAgentTrace(db, job, {
      stepOrder: 1,
      stepId: "planner",
      agentName: "Planner Agent",
      summary: "Normalized research question and runtime constraints.",
      detail: JSON.stringify({ keyword, maxResults: options.maxResults, enrichmentLimit: options.enrichmentLimit, yearStart: options.yearStart ?? null, yearEnd: options.yearEnd ?? null, journalCategoryId: options.journalCategoryId ?? null }),
      outputCount: 1
    });

    job = await updateSearchJobProgress(db, job, "searching", getSearchStepId(options.searchProvider));
    const candidates =
      options.searchProvider === "openalex"
        ? await searchOpenAlex(keyword, options)
        : await searchWebOfScience(keyword, options);
    await recordAgentTrace(db, job, { stepOrder: 3, stepId: getSearchStepId(options.searchProvider), agentName: "Search/Retriever Agent", summary: "Retrieved " + candidates.length + " candidate papers from " + options.searchProvider + ".", inputCount: 1, outputCount: candidates.length });

    job = await updateSearchJobProgress(db, job, "scoring", "journal_filter");
    const allowedPapers = filterAllowedBusinessSchoolJournals(candidates, options.journalCategoryId).slice(0, options.maxResults);
    await recordAgentTrace(db, job, { stepOrder: 2, stepId: "journal_selector", agentName: "Journal Selector Agent", summary: "Filtered candidates to " + allowedPapers.length + " approved business-school journal papers.", detail: JSON.stringify({ sourceCount: candidates.length, categoryId: options.journalCategoryId ?? "all" }), inputCount: candidates.length, outputCount: allowedPapers.length });

    job = await updateSearchJobProgress(db, job, "enriching_metadata", "crossref_enrichment");
    const crossrefEnriched = await enrichPapersWithCrossref(allowedPapers, options.crossrefEmail, options.enrichmentLimit);
    await recordAgentTrace(db, job, { stepOrder: 4, stepId: "crossref_enrichment", agentName: "Verifier Agent", summary: "Crossref verification completed for " + crossrefEnriched.length + " allowed papers.", detail: JSON.stringify({ enrichmentLimit: options.enrichmentLimit, verified: crossrefEnriched.filter((paper) => paper.verificationStatus === "verified").length, partial: crossrefEnriched.filter((paper) => paper.verificationStatus === "partial").length, skipped: crossrefEnriched.filter((paper) => paper.verificationReason.includes("Enrichment limit")).length }), inputCount: allowedPapers.length, outputCount: Math.min(allowedPapers.length, options.enrichmentLimit) });

    job = await updateSearchJobProgress(db, job, "checking_oa", "unpaywall_check");
    const unpaywallEnriched = await enrichPapersWithUnpaywall(crossrefEnriched, options.unpaywallEmail, options.enrichmentLimit);
    await recordAgentTrace(db, job, { stepOrder: 5, stepId: "unpaywall_check", agentName: "Open Access Agent", summary: "Unpaywall lookup completed; " + unpaywallEnriched.filter((paper) => paper.oaPdfUrl).length + " OA PDF URLs found.", detail: JSON.stringify({ enrichmentLimit: options.enrichmentLimit, pdfUrls: unpaywallEnriched.filter((paper) => paper.oaPdfUrl).length, landingPages: unpaywallEnriched.filter((paper) => paper.oaLandingPageUrl).length, skipped: unpaywallEnriched.filter((paper) => paper.unpaywallReason.includes("Enrichment limit")).length }), inputCount: crossrefEnriched.length, outputCount: Math.min(crossrefEnriched.length, options.enrichmentLimit) });

    const driveEnriched = await uploadOpenAccessPdfsToDrive(unpaywallEnriched, {
      clientEmail: options.googleClientEmail,
      privateKey: options.googlePrivateKey,
      folderId: options.googleDriveFolderId
    });
    await recordAgentTrace(db, job, {
      stepOrder: 6,
      stepId: "drive_r2_storage",
      agentName: "Storage Worker",
      status: options.reports || driveEnriched.some((paper) => paper.driveStatus === "uploaded") ? "completed" : "skipped",
      summary: "R2 " + (options.reports ? "available" : "not bound") + "; Google Drive uploaded " + driveEnriched.filter((paper) => paper.driveStatus === "uploaded").length + " OA PDFs.",
      detail: JSON.stringify({ driveUploaded: driveEnriched.filter((paper) => paper.driveStatus === "uploaded").length, driveFailed: driveEnriched.filter((paper) => paper.driveStatus === "failed").length, driveSkipped: driveEnriched.filter((paper) => paper.driveStatus === "skipped").length }),
      inputCount: unpaywallEnriched.length,
      outputCount: driveEnriched.filter((paper) => paper.driveStatus === "uploaded").length
    });

    job = await updateSearchJobProgress(db, job, "ranking", "ranking");
    
    let semanticScores: Record<string, number> | undefined = undefined;
    if (options.ai && options.vectorIndex) {
      try {
        await upsertPaperVectors(options.vectorIndex, options.ai, driveEnriched);
        semanticScores = await getSemanticRelevance(options.vectorIndex, options.ai, keyword, driveEnriched.map(p => p.id));
        await recordAgentTrace(db, job, { 
          stepOrder: 8, 
          stepId: "vectorize_relevance", 
          agentName: "Relevance Agent", 
          summary: "Computed semantic relevance using Cloudflare Vectorize and Workers AI.", 
          detail: JSON.stringify({ mode: "vector_semantic", vectorizeConnected: true, scoredCount: Object.keys(semanticScores).length }), 
          inputCount: driveEnriched.length, 
          outputCount: Object.keys(semanticScores).length 
        });
      } catch (error) {
        console.error("Vectorize error:", error);
        await recordAgentTrace(db, job, { stepOrder: 8, stepId: "vectorize_relevance", agentName: "Relevance Agent", status: "failed", summary: "Vectorize semantic relevance failed; falling back to metadata.", errorMessage: getErrorMessage(error) });
      }
    } else {
      await recordAgentTrace(db, job, { stepOrder: 8, stepId: "vectorize_relevance", agentName: "Relevance Agent", summary: "Computed fallback relevance from keyword, title, abstract, journal, and metadata scores; Vectorize embeddings remain planned.", detail: JSON.stringify({ mode: "metadata_fallback", vectorizeConnected: false }), inputCount: driveEnriched.length, outputCount: driveEnriched.length });
    }

    const rankedPapers = rankPapers(driveEnriched, semanticScores);
    await recordAgentTrace(db, job, { stepOrder: 7, stepId: "journal_evaluation", agentName: "Evaluation Agent", summary: "Calculated journal fit, verification, OA, citation, recency, and relevance scores.", inputCount: driveEnriched.length, outputCount: rankedPapers.length });
    await recordAgentTrace(db, job, { stepOrder: 9, stepId: "ranking", agentName: "Ranking Agent", summary: "Ranked " + rankedPapers.length + " papers by final score.", inputCount: driveEnriched.length, outputCount: rankedPapers.length });
    
    let criticFlags = buildCriticFlags(rankedPapers);
    if (options.ai) {
      try {
        criticFlags = await runLlmCritic(options.ai, keyword, rankedPapers, criticFlags);
        await recordAgentTrace(db, job, { 
          stepOrder: 10, 
          stepId: "critic_review", 
          agentName: "Critic Agent", 
          summary: "Generated " + criticFlags.length + " critic flags (including LLM qualitative analysis).", 
          detail: JSON.stringify({ ruleBasedCount: buildCriticFlags(rankedPapers).length, llmCount: criticFlags.filter(f => f.flagType === 'llm_critique').length }), 
          inputCount: rankedPapers.length, 
          outputCount: criticFlags.length 
        });
      } catch (error) {
        console.error("LLM Critic Agent error:", error);
        await recordAgentTrace(db, job, { stepOrder: 10, stepId: "critic_review", agentName: "Critic Agent", summary: "Generated " + criticFlags.length + " rule-based critic flags; LLM analysis failed.", detail: JSON.stringify({ error: getErrorMessage(error) }), inputCount: rankedPapers.length, outputCount: criticFlags.length });
      }
    } else {
      await recordAgentTrace(db, job, { stepOrder: 10, stepId: "critic_review", agentName: "Critic Agent", summary: "Generated " + criticFlags.length + " rule-based critic flags; LLM analysis skipped (AI not bound).", detail: JSON.stringify({}), inputCount: rankedPapers.length, outputCount: criticFlags.length });
    }

    const completedJob = completeSearchJob(job);
    await saveSearchResult(db, completedJob, rankedPapers, { sourceResultCount: candidates.length, allowedResultCount: allowedPapers.length });
    await persistCriticFlags(db, completedJob.id, criticFlags);
    const outputRecords = await persistSearchOutputs(options.reports, { job: completedJob, papers: rankedPapers, criticFlags });
    await persistJobOutputs(db, completedJob.id, outputRecords);
    await recordAgentTrace(db, completedJob, { stepOrder: 11, stepId: "report_generation", agentName: "Report Agent", summary: "Generated CSV, Markdown, XLSX, and PDF report outputs.", detail: JSON.stringify({ outputs: outputRecords.map((output) => ({ type: output.outputType, status: output.status, storage: output.storage })) }), inputCount: rankedPapers.length, outputCount: outputRecords.filter((output) => output.status === "generated" || output.status === "stored").length });
    await recordAgentTrace(db, completedJob, { stepOrder: 12, stepId: "delivery", agentName: "Dashboard", summary: "Search job completed and is available through dashboard, CSV, Markdown, trace, critic flag, and output metadata APIs.", outputCount: rankedPapers.length });
  } catch (error) {
    await saveSearchFailure(db, job, error);
    await recordAgentTrace(db, job, { stepOrder: 12, stepId: "failure", agentName: "Worker Error Handler", status: "failed", summary: "Search job failed before completion.", errorMessage: getErrorMessage(error) });
  }
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

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}
