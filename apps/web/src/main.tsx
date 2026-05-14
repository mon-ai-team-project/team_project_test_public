import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, FileText, Play, RefreshCw, Search } from "lucide-react";
import type { PaperSummary, SearchJob } from "@paper-agent/shared";
import "./styles.css";

type JobResponse = {
  job: SearchJob;
  papers: PaperSummary[];
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
  db: {
    bound: boolean;
    missingColumns: Array<{ table: string; column: string; ok: boolean }>;
  };
  env: {
    wosApiKey: boolean;
    crossrefEmail: boolean;
    unpaywallEmail: boolean;
    r2Reports: boolean;
  };
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "https://paper-agent-project.shch3653.workers.dev").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

const pipelineSteps: PipelineStep[] = [
  { id: "wos_search", label: "WoS" },
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
  const [keyword, setKeyword] = useState("AI interview employer branding");
  const [job, setJob] = useState<SearchJob | null>(null);
  const [papers, setPapers] = useState<PaperSummary[]>(demoPapers);
  const [selectedId, setSelectedId] = useState<string>(demoPapers[0].id);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState("");
  const selected = useMemo(() => papers.find((paper) => paper.id === selectedId) ?? papers[0], [papers, selectedId]);

  useEffect(() => {
    void refreshDiagnostics();
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
    }, 2500);
    return () => window.clearInterval(timer);
  }, [job]);

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
        body: JSON.stringify({ keyword, yearStart: 2020, maxResults: 20 })
      });
      if (!response.ok) throw new Error(await readApiError(response, "Failed to create search job"));
      const data = (await response.json()) as JobResponse;
      setJob(data.job);
      setPapers(data.papers);
      setSelectedId(data.papers[0]?.id ?? "");
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

  return (
    <main className="shell">
      <section className="toolbar">
        <div>
          <h1>Paper Agent Dashboard</h1>
          <p>Search jobs, ranked papers, relevance reasons, and report links.</p>
        </div>
        <div className="searchBox">
          <Search size={18} />
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} aria-label="Research keyword" />
          <button onClick={startSearch} disabled={loading}>
            {loading ? <RefreshCw size={18} className="spin" /> : <Play size={18} />}
            Run
          </button>
        </div>
      </section>

      <section className="statusBand">
        <Metric label="Status" value={job?.status ?? "demo"} />
        <Metric label="Step" value={job?.currentStep ?? "ranking preview"} />
        <Metric label="Papers" value={String(papers.length)} />
        <Metric label="Top Score" value={papers[0] ? papers[0].finalScore.toFixed(2) : "-"} />
      </section>
      <PipelineProgress job={job} loading={loading} />
      <DiagnosticsPanel diagnostics={diagnostics} errorMessage={diagnosticsError} onRefresh={refreshDiagnostics} />
      {errorMessage ? <p className="errorMessage">{errorMessage}</p> : null}

      <section className="contentGrid">
        <div className="tablePanel">
          <div className="panelTitle">
            <h2>Ranked Papers</h2>
            <div className="panelActions">
              <button className="iconButton" onClick={downloadReport} disabled={!job} aria-label="Download Markdown report">
                <FileText size={18} />
              </button>
              <button className="iconButton" onClick={downloadCsv} disabled={!job} aria-label="Download CSV">
                <Download size={18} />
              </button>
              <button className="iconButton" onClick={refreshJob} disabled={!job || refreshing} aria-label="Refresh job">
                <RefreshCw size={18} className={refreshing ? "spin" : undefined} />
              </button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Title</th>
                <th>Year</th>
                <th>OA</th>
                <th>PDF</th>
                <th>Abstract</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {papers.length ? (
                papers.map((paper) => (
                  <tr key={paper.id} className={paper.id === selected?.id ? "selected" : ""} onClick={() => setSelectedId(paper.id)}>
                    <td>{paper.rank}</td>
                    <td>{paper.title}</td>
                    <td>{paper.year}</td>
                    <td>{paper.oaStatus}</td>
                    <td>{paper.oaPdfUrl ? "yes" : paper.oaLandingPageUrl ? "page" : "-"}</td>
                    <td>{paper.abstractScore.toFixed(2)}</td>
                    <td>{paper.finalScore.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="emptyCell">
                    No allowed journal results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="detailPanel">
          <div className="panelTitle">
            <h2>Paper Detail</h2>
            <FileText size={18} />
          </div>
          {selected ? (
            <>
              <h3>{selected.title}</h3>
              <ScoreBreakdown paper={selected} />
              <dl>
                <dt>Authors</dt>
                <dd>{selected.authors}</dd>
                <dt>Journal</dt>
                <dd>{selected.journalName}</dd>
                <dt>DOI</dt>
                <dd>{selected.doi}</dd>
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
                <dt>License</dt>
                <dd>{[selected.oaLicense, selected.oaHostType, selected.oaRepository].filter(Boolean).join(" · ") || "Unknown"}</dd>
                <dt>Relevance</dt>
                <dd>{selected.relevanceReason}</dd>
              </dl>
            </>
          ) : (
            <p className="emptyState">No allowed journal result selected.</p>
          )}
        </aside>
      </section>
    </main>
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
        ["WoS API key", diagnostics.env.wosApiKey],
        ["Crossref email", diagnostics.env.crossrefEmail],
        ["Unpaywall email", diagnostics.env.unpaywallEmail],
        ["R2 reports", diagnostics.env.r2Reports]
      ]
    : [];

  return (
    <section className="diagnosticsPanel">
      <div className="diagnosticsHeader">
        <div>
          <h2>System Checks</h2>
          <p>{diagnostics ? (diagnostics.ok ? "Ready" : `${missingCount} schema issue${missingCount === 1 ? "" : "s"}`) : "Not checked"}</p>
        </div>
        <button className="iconButton" onClick={onRefresh} aria-label="Refresh diagnostics">
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
    { label: "Citation", value: citation, detail: `${paper.citedByCount ?? 0} citations from Web of Science.` },
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
  if (job.status === "failed") return Math.max(0, pipelineSteps.findIndex((step) => step.id === job.currentStep));
  const index = pipelineSteps.findIndex((step) => step.id === job.currentStep);
  return index >= 0 ? index : 0;
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

createRoot(document.getElementById("root")!).render(<App />);
