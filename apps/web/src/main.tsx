import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, Eye, FileText, History, Play, RefreshCw, Search } from "lucide-react";
import { BUSINESS_SCHOOL_JOURNAL_CATEGORY_OPTIONS, type AgentTrace, type PaperSummary, type SearchJob } from "@paper-agent/shared";
import { AgentOpsPage, DashboardNav, EvaluationDashboardPage, ResearchExperiencePanels, resolveDashboardRoute } from "./dashboard/DashboardPages";
import "./styles.css";

type JobResponse = {
  job: SearchJob;
  papers: PaperSummary[];
};

type JobsResponse = {
  jobs: SearchJob[];
};

type TracesResponse = {
  job: SearchJob;
  traces: AgentTrace[];
};

type PipelineStep = {
  id: string;
  label: string;
};

type ScoreBreakdownItem = {
  label: string;
  value: number;
  detail: string;
};

type DiagnosticsResponse = {
  ok: boolean;
  searchProvider: "wos" | "openalex";
  db: {
    bound: boolean;
    missingColumns: Array<{ table: string; column: string; ok: boolean }>;
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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "https://paper-agent-project.shch3653.workers.dev").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

const pipelineSteps: PipelineStep[] = [
  { id: "source_search", label: "Source Search" },
  { id: "journal_filter", label: "Journal Filter" },
  { id: "crossref_enrichment", label: "Crossref" },
  { id: "unpaywall_check", label: "Unpaywall" },
  { id: "ranking", label: "Ranking" },
  { id: "completed", label: "Complete" }
];

const demoPapers: PaperSummary[] = [
  {
    id: "demo-1",
    rank: 1,
    title: "Automated Scholarly Paper Discovery with Agentic Workflows",
    authors: "Kim, Lee, Park",
    year: 2025,
    journalName: "Information Systems Research",
    journalField: "6. 경영정보",
    journalRank: "국제 S급",
    doi: "10.0000/demo.1",
    oaStatus: "unknown",
    citedByCount: 42,
    abstractScore: 0.91,
    finalScore: 0.88,
    includeStatus: "include",
    relevanceReason: "Keyword, abstract, and method terms are directly aligned."
  },
  {
    id: "demo-2",
    rank: 2,
    title: "Large Language Models for Literature Review Automation",
    authors: "Choi, Han",
    year: 2024,
    journalName: "Information Systems Review",
    journalField: "6. 경영정보",
    journalRank: "국내 A급",
    doi: "10.0000/demo.2",
    oaStatus: "oa",
    citedByCount: 128,
    abstractScore: 0.86,
    finalScore: 0.82,
    includeStatus: "include",
    relevanceReason: "The paper covers literature review automation and evaluation.",
    oaPdfUrl: "https://example.com/demo-paper.pdf",
    oaLicense: "cc-by",
    oaHostType: "repository",
    unpaywallStatus: "found",
    unpaywallReason: "Demo OA location includes PDF URL"
  }
];

function App() {
  const activeRoute = resolveDashboardRoute();

  return (
    <>
      <DashboardNav activeRoute={activeRoute} />
      {activeRoute === "ops" ? <AgentOpsPage /> : activeRoute === "evaluation" ? <EvaluationDashboardPage /> : <ResearchDashboard />}
    </>
  );
}

function ResearchDashboard() {
  const [keyword, setKeyword] = useState("AI interview employer branding");
  const [maxResults, setMaxResults] = useState("20");
  const [enrichmentLimit, setEnrichmentLimit] = useState("10");
  const [yearStart, setYearStart] = useState("2020");
  const [yearEnd, setYearEnd] = useState("");
  const [journalCategoryId, setJournalCategoryId] = useState("");
  const [job, setJob] = useState<SearchJob | null>(null);
  const [papers, setPapers] = useState<PaperSummary[]>(demoPapers);
  const [selectedId, setSelectedId] = useState<string>(demoPapers[0].id);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState("");
  const [recentJobs, setRecentJobs] = useState<SearchJob[]>([]);
  const [recentJobsError, setRecentJobsError] = useState("");
  const [loadingJobId, setLoadingJobId] = useState("");
  const [reportPreview, setReportPreview] = useState("");
  const [reportPreviewError, setReportPreviewError] = useState("");
  const [reportPreviewLoading, setReportPreviewLoading] = useState(false);
  const [agentTraces, setAgentTraces] = useState<AgentTrace[]>([]);
  const [agentTracesError, setAgentTracesError] = useState("");
  const [agentTracesLoading, setAgentTracesLoading] = useState(false);
  const selected = useMemo(() => papers.find((paper) => paper.id === selectedId) ?? papers[0], [papers, selectedId]);
  const includedCount = useMemo(() => papers.filter((paper) => paper.includeStatus === "include").length, [papers]);
  const reviewCount = useMemo(() => papers.filter((paper) => paper.includeStatus === "review").length, [papers]);

  useEffect(() => {
    void refreshDiagnostics();
    void refreshRecentJobs();
  }, []);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(apiUrl(`/api/search-jobs/${job.id}`));
      if (!response.ok) return;
      const data = (await response.json()) as JobResponse;
      setJob(data.job);
      setPapers(data.papers);
      setSelectedId((current) => (data.papers.some((paper) => paper.id === current) ? current : data.papers[0]?.id ?? ""));
      if (data.job.status === "completed" || data.job.status === "failed") void refreshRecentJobs();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [job]);

  useEffect(() => {
    setReportPreview("");
    setReportPreviewError("");
    if (job?.status === "completed") void refreshReportPreview(job.id);
  }, [job?.id, job?.status]);

  useEffect(() => {
    setAgentTraces([]);
    setAgentTracesError("");
    if (job?.id) void refreshAgentTraces(job.id);
  }, [job?.id, job?.status, job?.currentStep]);

  async function refreshJob() {
    if (!job) return;
    setRefreshing(true);
    setErrorMessage("");
    try {
      const response = await fetch(apiUrl(`/api/search-jobs/${job.id}`));
      if (!response.ok) throw new Error(await readApiError(response, "Failed to refresh search job"));
      const data = (await response.json()) as JobResponse;
      setJob(data.job);
      setPapers(data.papers);
      setSelectedId((current) => (data.papers.some((paper) => paper.id === current) ? current : data.papers[0]?.id ?? ""));
      await refreshRecentJobs();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to refresh search job");
    } finally {
      setRefreshing(false);
    }
  }

  async function startSearch() {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch(apiUrl("/api/search-jobs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSearchPayload(keyword, maxResults, enrichmentLimit, yearStart, yearEnd, journalCategoryId))
      });
      if (!response.ok) throw new Error(await readApiError(response, "Failed to create search job"));
      const data = (await response.json()) as JobResponse;
      setJob(data.job);
      setPapers(data.papers);
      setSelectedId(data.papers[0]?.id ?? "");
      await refreshRecentJobs();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create search job");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!job) return;
    window.location.href = apiUrl(`/api/search-jobs/${job.id}/papers.csv`);
  }

  function downloadReport() {
    if (!job) return;
    window.location.href = apiUrl(`/api/search-jobs/${job.id}/report.md`);
  }

  async function refreshAgentTraces(jobId = job?.id) {
    if (!jobId) return;
    setAgentTracesLoading(true);
    setAgentTracesError("");
    try {
      const response = await fetch(apiUrl(`/api/search-jobs/${jobId}/traces`));
      if (!response.ok) throw new Error(await readApiError(response, "Failed to load agent traces"));
      const data = (await response.json()) as TracesResponse;
      setAgentTraces(data.traces);
    } catch (error) {
      setAgentTracesError(error instanceof Error ? error.message : "Failed to load agent traces");
    } finally {
      setAgentTracesLoading(false);
    }
  }

  async function refreshReportPreview(jobId = job?.id) {
    if (!jobId) return;
    setReportPreviewLoading(true);
    setReportPreviewError("");
    try {
      const response = await fetch(apiUrl(`/api/search-jobs/${jobId}/report.md`));
      if (!response.ok) throw new Error(await readTextError(response, "Failed to load Markdown report"));
      setReportPreview(await response.text());
    } catch (error) {
      setReportPreviewError(error instanceof Error ? error.message : "Failed to load Markdown report");
    } finally {
      setReportPreviewLoading(false);
    }
  }

  async function refreshDiagnostics() {
    setDiagnosticsError("");
    try {
      const response = await fetch(apiUrl("/api/diagnostics"));
      if (!response.ok) throw new Error(await readApiError(response, "Failed to load diagnostics"));
      setDiagnostics((await response.json()) as DiagnosticsResponse);
    } catch (error) {
      setDiagnosticsError(error instanceof Error ? error.message : "Failed to load diagnostics");
    }
  }

  async function refreshRecentJobs() {
    setRecentJobsError("");
    try {
      const response = await fetch(apiUrl("/api/search-jobs?limit=10"));
      if (!response.ok) throw new Error(await readApiError(response, "Failed to load recent jobs"));
      const data = (await response.json()) as JobsResponse;
      setRecentJobs(data.jobs);
    } catch (error) {
      setRecentJobsError(error instanceof Error ? error.message : "Failed to load recent jobs");
    }
  }

  async function loadSearchJob(jobId: string) {
    setLoadingJobId(jobId);
    setErrorMessage("");
    try {
      const response = await fetch(apiUrl(`/api/search-jobs/${jobId}`));
      if (!response.ok) throw new Error(await readApiError(response, "Failed to load search job"));
      const data = (await response.json()) as JobResponse;
      setJob(data.job);
      setKeyword(data.job.keyword);
      setPapers(data.papers);
      setSelectedId(data.papers[0]?.id ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load search job");
    } finally {
      setLoadingJobId("");
    }
  }

  return (
    <main className="shell">
      <section className="toolbar">
        <div className="titleBlock">
          <span className="eyebrow">MON AI Team</span>
          <h1>Paper Agent Dashboard</h1>
          <p>WoS-backed literature screening workspace</p>
        </div>
        <div className="commandPanel">
          <div className="searchBox">
            <Search size={18} />
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} aria-label="Research keyword" />
            <button onClick={startSearch} disabled={loading || !keyword.trim()}>
              {loading ? <RefreshCw size={18} className="spin" /> : <Play size={18} />}
              Run
            </button>
          </div>
          <div className="searchOptions" aria-label="Search options">
            <label>
              <span>Max 1-50</span>
              <input
                type="number"
                min={1}
                max={50}
                step={1}
                inputMode="numeric"
                value={maxResults}
                onChange={(event) => setMaxResults(event.target.value)}
                onBlur={() => setMaxResults(String(parseLimitedMaxResults(maxResults)))}
                placeholder="20"
                aria-label="Maximum results"
              />
            </label>
            <label>
              <span>Enrich 1-20</span>
              <input
                type="number"
                min={1}
                max={20}
                step={1}
                inputMode="numeric"
                value={enrichmentLimit}
                onChange={(event) => setEnrichmentLimit(event.target.value)}
                onBlur={() => setEnrichmentLimit(String(parseLimitedEnrichmentLimit(enrichmentLimit, parseLimitedMaxResults(maxResults))))}
                placeholder="10"
                aria-label="Metadata enrichment limit"
              />
            </label>
            <label className="categoryOption">
              <span>Field</span>
              <select value={journalCategoryId} onChange={(event) => setJournalCategoryId(event.target.value)} aria-label="Journal category">
                <option value="">All fields</option>
                {BUSINESS_SCHOOL_JOURNAL_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>From</span>
              <input
                type="number"
                min={1900}
                max={new Date().getUTCFullYear()}
                step={1}
                value={yearStart}
                onChange={(event) => setYearStart(event.target.value)}
                placeholder="Any"
                aria-label="Start year"
              />
            </label>
            <label>
              <span>To</span>
              <input
                type="number"
                min={1900}
                max={new Date().getUTCFullYear()}
                step={1}
                value={yearEnd}
                onChange={(event) => setYearEnd(event.target.value)}
                placeholder="Now"
                aria-label="End year"
              />
            </label>
          </div>
          <div className="runMeta">
            <StatusBadge value={diagnostics?.searchProvider ?? "wos"} tone="neutral" />
            <StatusBadge value={diagnostics?.readiness.activeProviderReady ? "ready" : "check"} tone={diagnostics?.readiness.activeProviderReady ? "ok" : "warn"} />
          </div>
        </div>
      </section>

      <ResearchExperiencePanels isRunning={loading || (Boolean(job) && job?.status !== "completed" && job?.status !== "failed")} />

      <section className="statusBand">
        <Metric label="Status" value={job?.status ?? "demo"} tone={getStatusTone(job?.status)} />
        <Metric label="Step" value={job?.currentStep ?? "ranking preview"} />
        <Metric label="Source / Allowed" value={job ? `${job.sourceResultCount ?? "-"} / ${job.allowedResultCount ?? "-"}` : "-"} />
        <Metric label="Papers" value={String(papers.length)} detail={`${includedCount} include · ${reviewCount} review`} />
        <Metric label="Top Score" value={papers[0] ? papers[0].finalScore.toFixed(2) : "-"} />
      </section>

      <section className="operationsGrid">
        <PipelineProgress job={job} loading={loading} />
        <DiagnosticsPanel diagnostics={diagnostics} errorMessage={diagnosticsError} onRefresh={refreshDiagnostics} />
        <AgentTracePanel traces={agentTraces} loading={agentTracesLoading} errorMessage={agentTracesError} onRefresh={() => refreshAgentTraces()} />
      </section>

      {errorMessage ? <p className="errorMessage">{errorMessage}</p> : null}

      <section className="contentGrid">
        <section className="mainColumn">
          <div className="tablePanel">
            <div className="panelTitle">
              <div>
                <h2>Ranked Papers</h2>
                <p>{papers.length ? `${papers.length} allowlisted results` : "No saved results"}</p>
              </div>
              <div className="panelActions">
                <button className="iconButton" onClick={downloadReport} disabled={!job} aria-label="Download Markdown report" title="Download Markdown report">
                  <FileText size={18} />
                </button>
                <button className="iconButton" onClick={downloadCsv} disabled={!job} aria-label="Download CSV" title="Download CSV">
                  <Download size={18} />
                </button>
                <button className="iconButton" onClick={refreshJob} disabled={!job || refreshing} aria-label="Refresh job" title="Refresh job">
                  <RefreshCw size={18} className={refreshing ? "spin" : undefined} />
                </button>
              </div>
            </div>
            <div className="tableScroll">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Title</th>
                    <th>Journal</th>
                    <th>Field / Rank</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>OA</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.length ? (
                    papers.map((paper) => (
                      <tr key={paper.id} className={paper.id === selected?.id ? "selected" : ""} onClick={() => setSelectedId(paper.id)}>
                        <td>
                          <span className="rankPill">{paper.rank}</span>
                        </td>
                        <td className="paperTitleCell">
                          <strong>{paper.title}</strong>
                          <small>{paper.authors}</small>
                        </td>
                        <td>{paper.journalName}</td>
                        <td>
                          <JournalRankBadge paper={paper} />
                        </td>
                        <td>{paper.year || "-"}</td>
                        <td>
                          <StatusBadge value={paper.includeStatus} tone={getIncludeTone(paper.includeStatus)} />
                        </td>
                        <td>{paper.oaPdfUrl ? "PDF" : paper.oaLandingPageUrl ? "Page" : paper.oaStatus}</td>
                        <td>
                          <span className="scorePill">{paper.finalScore.toFixed(2)}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="emptyCell">
                        No allowed journal results.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <ReportPreviewPanel
            job={job}
            report={reportPreview}
            loading={reportPreviewLoading}
            errorMessage={reportPreviewError}
            onRefresh={() => refreshReportPreview()}
            onDownload={downloadReport}
          />
        </section>

        <aside className="sideColumn">
          <PaperDetailPanel selected={selected} />
          <RecentJobsPanel jobs={recentJobs} activeJobId={job?.id} loadingJobId={loadingJobId} errorMessage={recentJobsError} onLoad={loadSearchJob} onRefresh={refreshRecentJobs} />
        </aside>
      </section>
    </main>
  );
}

function PaperDetailPanel({ selected }: { selected?: PaperSummary }) {
  return (
    <section className="detailPanel">
      <div className="panelTitle">
        <div>
          <h2>Paper Detail</h2>
          <p>{selected ? `${selected.year || "Unknown year"} · ${selected.journalName}` : "No selection"}</p>
        </div>
        <FileText size={18} />
      </div>
      {selected ? (
        <>
          <div className="detailHeader">
            <StatusBadge value={selected.includeStatus} tone={getIncludeTone(selected.includeStatus)} />
            <span className="scorePill">{selected.finalScore.toFixed(2)}</span>
          </div>
          <h3>{selected.title}</h3>
          <ScoreBreakdown paper={selected} />
          <dl>
            <dt>Authors</dt>
            <dd>{selected.authors}</dd>
            <dt>DOI</dt>
            <dd>{selected.doi || "Not available"}</dd>
            <dt>Field / Rank</dt>
            <dd>
              <JournalRankBadge paper={selected} />
            </dd>
            <dt>Verification</dt>
            <dd>{selected.verificationStatus ?? "unverified"} · {selected.verificationReason ?? "No verification recorded."}</dd>
            <dt>Open Access</dt>
            <dd>{selected.unpaywallStatus ?? "skipped"} · {selected.unpaywallReason ?? "No Unpaywall lookup recorded."}</dd>
            <dt>PDF</dt>
            <dd>
              {selected.oaPdfUrl ? (
                <a href={selected.oaPdfUrl} target="_blank" rel="noreferrer">
                  Open PDF
                </a>
              ) : selected.oaLandingPageUrl ? (
                <a href={selected.oaLandingPageUrl} target="_blank" rel="noreferrer">
                  Open OA page
                </a>
              ) : (
                "No OA URL found"
              )}
            </dd>
            <dt>Google Drive</dt>
            <dd>
              {selected.driveWebUrl ? (
                <a href={selected.driveWebUrl} target="_blank" rel="noreferrer">
                  Open Drive file
                </a>
              ) : (
                `${selected.driveStatus ?? "skipped"} · ${selected.driveReason ?? "No Google Drive upload recorded."}`
              )}
            </dd>
            <dt>License</dt>
            <dd>{[selected.oaLicense, selected.oaHostType, selected.oaRepository].filter(Boolean).join(" · ") || "Unknown"}</dd>
          </dl>
        </>
      ) : (
        <p className="emptyState">No allowed journal result selected.</p>
      )}
    </section>
  );
}

function JournalRankBadge({ paper }: { paper: PaperSummary }) {
  return (
    <span className="journalRankBadge">
      <strong>{paper.journalField ?? "Unmatched"}</strong>
      <small>{paper.journalRank ?? "No rank"}</small>
    </span>
  );
}

function AgentTracePanel({
  traces, loading, errorMessage, onRefresh
}: { traces: AgentTrace[]; loading: boolean; errorMessage: string; onRefresh: () => void }) {
  return (
    <section className="diagnosticsPanel agentTracePanel">
      <div className="diagnosticsHeader">
        <div>
          <h2>Agent Traces</h2>
          <p>{traces.length ? String(traces.length) + " recorded workflow steps" : "No live traces for the selected job"}</p>
        </div>
        <button className="iconButton" onClick={onRefresh} disabled={loading} aria-label="Refresh agent traces" title="Refresh agent traces">
          <RefreshCw size={18} className={loading ? "spin" : undefined} />
        </button>
      </div>
      {errorMessage ? <p className="errorMessage compact">{errorMessage}</p> : null}
      <div className="traceList">
        {traces.length ? traces.map((trace) => (
          <article className="traceItem" key={trace.id}>
            <div>
              <strong>{trace.stepOrder}. {trace.agentName}</strong>
              <span>{trace.summary}</span>
            </div>
            <StatusBadge value={trace.status} tone={getTraceTone(trace.status)} />
          </article>
        )) : <p className="emptyState">Run or load a job to inspect persisted D1 traces.</p>}
      </div>
    </section>
  );
}
function DiagnosticsPanel({
  diagnostics,
  errorMessage,
  onRefresh
}: {
  diagnostics: DiagnosticsResponse | null;
  errorMessage: string;
  onRefresh: () => void;
}) {
  const missingCount = diagnostics?.db.missingColumns.length ?? 0;
  const envItems = diagnostics
    ? [
        ["Active provider", diagnostics.readiness.activeProviderReady],
        [`WoS API key${diagnostics.env.wosApiKeySource ? ` (${diagnostics.env.wosApiKeySource})` : ""}`, diagnostics.env.wosApiKey],
        ["OpenAlex email", diagnostics.env.openAlexEmail],
        ["OpenAlex API key", diagnostics.env.openAlexApiKey],
        ["Crossref email", diagnostics.env.crossrefEmail],
        ["Unpaywall email", diagnostics.env.unpaywallEmail],
        ["R2 reports", diagnostics.env.r2Reports],
        ["Google Drive", diagnostics.env.googleDrive]
      ]
    : [];

  return (
    <section className="diagnosticsPanel">
      <div className="diagnosticsHeader">
        <div>
          <h2>System Checks</h2>
          <p>
            {diagnostics
              ? diagnostics.ok
                ? `Ready · ${diagnostics.searchProvider}`
                : `${missingCount} schema issue${missingCount === 1 ? "" : "s"} · ${diagnostics.searchProvider}`
              : "Not checked"}
          </p>
        </div>
        <button className="iconButton" onClick={onRefresh} aria-label="Refresh diagnostics" title="Refresh diagnostics">
          <RefreshCw size={18} />
        </button>
      </div>
      {errorMessage ? <p className="diagnosticsError">{errorMessage}</p> : null}
      {diagnostics ? (
        <div className="diagnosticsGrid">
          <div>
            <span className={diagnostics.db.bound ? "checkOk" : "checkFail"}>{diagnostics.db.bound ? "DB bound" : "DB missing"}</span>
            <span className={missingCount === 0 ? "checkOk" : "checkFail"}>{missingCount === 0 ? "Schema ready" : `${missingCount} missing columns`}</span>
          </div>
          <div>
            {envItems.map(([label, ok]) => (
              <span key={label as string} className={ok ? "checkOk" : "checkWarn"}>
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {diagnostics?.db.missingColumns.length ? (
        <p className="missingColumns">
          {diagnostics.db.missingColumns.map((item) => `${item.table}.${item.column}`).join(", ")}
        </p>
      ) : null}
    </section>
  );
}

function RecentJobsPanel({
  jobs,
  activeJobId,
  loadingJobId,
  errorMessage,
  onLoad,
  onRefresh
}: {
  jobs: SearchJob[];
  activeJobId?: string;
  loadingJobId: string;
  errorMessage: string;
  onLoad: (jobId: string) => void;
  onRefresh: () => void;
}) {
  return (
    <section className="recentJobsPanel">
      <div className="recentJobsHeader">
        <div>
          <h2>Recent Jobs</h2>
          <p>{jobs.length ? `${jobs.length} latest` : "No saved jobs"}</p>
        </div>
        <button className="iconButton" onClick={onRefresh} aria-label="Refresh recent jobs" title="Refresh recent jobs">
          <RefreshCw size={18} />
        </button>
      </div>
      {errorMessage ? <p className="diagnosticsError">{errorMessage}</p> : null}
      {jobs.length ? (
        <div className="recentJobsList">
          {jobs.map((item) => (
            <button key={item.id} className={item.id === activeJobId ? "activeJob" : ""} onClick={() => onLoad(item.id)} disabled={loadingJobId === item.id}>
              {loadingJobId === item.id ? <RefreshCw size={16} className="spin" /> : <History size={16} />}
              <span>
                <strong>{item.keyword}</strong>
                <small>
                  {item.status} · {formatDateTime(item.createdAt)}
                </small>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ReportPreviewPanel({
  job,
  report,
  loading,
  errorMessage,
  onRefresh,
  onDownload
}: {
  job: SearchJob | null;
  report: string;
  loading: boolean;
  errorMessage: string;
  onRefresh: () => void;
  onDownload: () => void;
}) {
  const sections = useMemo(() => extractReportSections(report), [report]);
  const canLoad = Boolean(job);
  const isCompleted = job?.status === "completed";

  return (
    <section className="reportPreviewPanel">
      <div className="reportPreviewHeader">
        <div>
          <h2>Report Preview</h2>
          <p>{job ? (isCompleted ? `${sections.length || 0} sections` : `Waiting for ${job.status}`) : "No active job"}</p>
        </div>
        <div className="panelActions">
          <button className="iconButton" onClick={onRefresh} disabled={!canLoad || loading} aria-label="Refresh report preview">
            <RefreshCw size={18} className={loading ? "spin" : undefined} />
          </button>
          <button className="iconButton" onClick={onDownload} disabled={!canLoad} aria-label="Download Markdown report">
            <Download size={18} />
          </button>
        </div>
      </div>
      {errorMessage ? <p className="diagnosticsError">{errorMessage}</p> : null}
      {sections.length ? (
        <div className="reportSectionChips">
          {sections.map((section) => (
            <span key={section}>{section}</span>
          ))}
        </div>
      ) : null}
      <div className="reportPreviewBody">
        {loading ? (
          <div className="reportPreviewEmpty">
            <RefreshCw size={18} className="spin" />
            <span>Loading report</span>
          </div>
        ) : report ? (
          <pre>{report}</pre>
        ) : (
          <div className="reportPreviewEmpty">
            <Eye size={18} />
            <span>{job ? "Report preview appears after the job completes." : "Select or run a job to preview its report."}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function ScoreBreakdown({ paper }: { paper: PaperSummary }) {
  const items = getScoreBreakdown(paper);
  return (
    <div className="scoreBreakdown">
      <div className="scoreSummary">
        <span>Score Breakdown</span>
        <strong>{paper.finalScore.toFixed(2)}</strong>
      </div>
      <div className="scoreBars">
        {items.map((item) => (
          <div className="scoreItem" key={item.label}>
            <div className="scoreLabel">
              <span>{item.label}</span>
              <strong>{item.value.toFixed(2)}</strong>
            </div>
            <div className="scoreTrack">
              <span style={{ width: `${Math.round(item.value * 100)}%` }} />
            </div>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getScoreBreakdown(paper: PaperSummary): ScoreBreakdownItem[] {
  const relevance = paper.relevanceScore ?? paper.abstractScore;
  const journalFit = paper.journalFitScore ?? 1;
  const verification = paper.verificationScore ?? (paper.verificationStatus === "verified" ? 1 : paper.verificationStatus === "partial" ? 0.5 : 0);
  const openAccess = paper.oaScore ?? (paper.oaPdfUrl ? 1 : paper.oaLandingPageUrl || paper.oaStatus === "oa" ? 0.75 : paper.unpaywallStatus === "not_found" ? 0 : 0.25);
  const citation = paper.citationScore ?? Math.min((paper.citedByCount ?? 0) / 100, 1);
  const recency = paper.recencyScore ?? getRecencyScore(paper.year);

  return [
    { label: "Relevance", value: relevance, detail: paper.relevanceReason },
    { label: "Journal Fit", value: journalFit, detail: "Included in the business school journal allowlist." },
    { label: "Crossref", value: verification, detail: paper.verificationReason ?? "No verification recorded." },
    { label: "Open Access", value: openAccess, detail: paper.unpaywallReason ?? "No Unpaywall lookup recorded." },
    { label: "Citation", value: citation, detail: `${paper.citedByCount ?? 0} citations from the active search provider.` },
    { label: "Recency", value: recency, detail: `${paper.year || "Unknown"} publication year.` }
  ];
}

function getRecencyScore(year: number): number {
  if (!year) return 0;
  const currentYear = new Date().getUTCFullYear();
  return Math.max(0, Math.min(1, 1 - (currentYear - year) / 10));
}

function PipelineProgress({ job, loading }: { job: SearchJob | null; loading: boolean }) {
  const activeIndex = getActiveStepIndex(job, loading);
  const completedCount = getCompletedStepCount(job, loading, activeIndex);
  const progress = Math.round((completedCount / pipelineSteps.length) * 100);

  return (
    <section className="pipelinePanel" aria-label="Search pipeline progress">
      <div className="pipelineHeader">
        <div>
          <h2>Pipeline Progress</h2>
          <p>{loading ? "Running" : job ? `${progress}% complete` : "Ready"}</p>
        </div>
        <strong>{completedCount}/{pipelineSteps.length}</strong>
      </div>
      <div className="progressTrack">
        <span style={{ width: `${progress}%` }} />
      </div>
      <ol className="pipelineSteps">
        {pipelineSteps.map((step, index) => {
          const state = getStepState(index, activeIndex, completedCount, job, loading);
          return (
            <li key={step.id} className={state}>
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function getActiveStepIndex(job: SearchJob | null, loading: boolean): number {
  if (loading) return 0;
  if (!job) return -1;
  if (job.status === "completed") return pipelineSteps.length - 1;
  const normalizedStep = normalizePipelineStep(job.currentStep);
  if (job.status === "failed") return Math.max(0, pipelineSteps.findIndex((step) => step.id === normalizedStep));
  const index = pipelineSteps.findIndex((step) => step.id === normalizedStep);
  return index >= 0 ? index : 0;
}

function normalizePipelineStep(currentStep: string): string {
  if (currentStep === "wos_search" || currentStep === "openalex_search") return "source_search";
  return currentStep;
}

function getCompletedStepCount(job: SearchJob | null, loading: boolean, activeIndex: number): number {
  if (!job && !loading) return 0;
  if (job?.status === "completed") return pipelineSteps.length;
  if (job?.status === "failed") return Math.max(0, activeIndex);
  if (loading) return 0;
  return Math.max(0, activeIndex);
}

function getStepState(index: number, activeIndex: number, completedCount: number, job: SearchJob | null, loading: boolean): string {
  if (job?.status === "failed" && index === activeIndex) return "failed";
  if (index < completedCount) return "done";
  if ((loading && index === 0) || index === activeIndex) return "active";
  return "pending";
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function buildSearchPayload(keyword: string, maxResults: string, enrichmentLimit: string, yearStart: string, yearEnd: string, journalCategoryId: string) {
  const parsedMaxResults = parseLimitedMaxResults(maxResults);
  const payload: { keyword: string; maxResults: number; enrichmentLimit: number; yearStart?: number; yearEnd?: number; journalCategoryId?: string } = {
    keyword: keyword.trim(),
    maxResults: parsedMaxResults,
    enrichmentLimit: parseLimitedEnrichmentLimit(enrichmentLimit, parsedMaxResults)
  };
  const start = parseOptionalYear(yearStart);
  const end = parseOptionalYear(yearEnd);
  if (start) payload.yearStart = start;
  if (end) payload.yearEnd = end;
  if (journalCategoryId) payload.journalCategoryId = journalCategoryId;
  return payload;
}

function parseLimitedMaxResults(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return clampNumber(parsed, 1, 50, 20);
}

function parseLimitedEnrichmentLimit(value: string, maxResults: number): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return clampNumber(parsed, 1, Math.min(20, maxResults), Math.min(10, maxResults));
}

function parseOptionalYear(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) return undefined;
  return clampNumber(parsed, 1900, new Date().getUTCFullYear(), parsed);
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function Metric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail?: string; tone?: BadgeTone }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={`metricValue ${tone}`}>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

type BadgeTone = "ok" | "warn" | "danger" | "neutral";

function StatusBadge({ value, tone }: { value: string; tone: BadgeTone }) {
  return <span className={`statusBadge ${tone}`}>{value}</span>;
}

function getStatusTone(status?: SearchJob["status"]): BadgeTone {
  if (status === "completed") return "ok";
  if (status === "failed") return "danger";
  if (status) return "warn";
  return "neutral";
}

function getTraceTone(status: AgentTrace["status"]): BadgeTone {
  if (status === "completed") return "ok";
  if (status === "failed") return "danger";
  if (status === "skipped") return "warn";
  return "neutral";
}
function getIncludeTone(status: PaperSummary["includeStatus"]): BadgeTone {
  if (status === "include") return "ok";
  if (status === "exclude") return "danger";
  return "warn";
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

async function readTextError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

function extractReportSections(report: string): string[] {
  return report
    .split(/\r?\n/)
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace(/^##\s+/, "").trim())
    .slice(0, 10);
}

createRoot(document.getElementById("root")!).render(<App />);
