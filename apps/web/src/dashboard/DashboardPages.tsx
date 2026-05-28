import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Cloud, FileText, Play, RefreshCw, ShieldCheck } from "lucide-react";
import {
  agentStatuses,
  criticReviews,
  evaluationRubrics,
  evaluationScenarios,
  evaluationImplementationStatus,
  implementationLegend,
  literaturePreview,
  literatureWorkflowStages,
  opsImplementationStatus,
  researchImplementationStatus,
  systemStatuses,
  toolCallLogs,
  topJournalPool,
  type EvaluationScenario,
  type EvaluationScenarioKey,
  type FeatureImplementationItem,
  type FeatureImplementationStatus
} from "./mockData";
import type { AgentTrace, SearchJob } from "@paper-agent/shared";
import "./dashboard.css";

export type DashboardRoute = "research" | "ops" | "evaluation";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "https://paper-agent-project.shch3653.workers.dev").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

type TraceResponse = { job: SearchJob; traces: AgentTrace[] };
type JobsResponse = { jobs: SearchJob[] };
type CriticFlag = { id: string; paperRank: number; severity: "low" | "medium" | "high" | string; flagType: string; message: string; evidence: string };
type JobOutput = { id: string; outputType: string; status: string; storage: string; urlPath: string; detail: string };
type CriticFlagsResponse = { job: SearchJob; criticFlags: CriticFlag[] };
type JobOutputsResponse = { job: SearchJob; outputs: JobOutput[] };
type TraceDetail = Record<string, string | number | boolean | null>;
type EnrichmentOverview = { limit: string; crossrefProcessed: string; crossrefSkipped: string; unpaywallProcessed: string; unpaywallSkipped: string };

type BenchmarkMetrics = {
  source?: "static_snapshot" | "live" | string;
  note?: string;
  tasks: number;
  results: number;
  gold: number;
  verifiedGold: number;
  goldMatches: number;
  doiMatches: number;
  macroAverages: {
    precision_at_k: number;
    ndcg_at_k: number;
    gold_doi_hit_rate_at_k: number;
    doi_accuracy_at_k: number;
    paper_validity_rate_at_k: number;
    top_journal_precision_at_k: number;
    hallucination_rate_at_k: number;
    oa_success_rate_at_k: number;
  };
};

export function resolveDashboardRoute(pathname = window.location.pathname): DashboardRoute {
  if (pathname.includes("/dashboard/ops")) return "ops";
  if (pathname.includes("/dashboard/evaluation")) return "evaluation";
  return "research";
}

export function DashboardNav({ activeRoute }: { activeRoute: DashboardRoute }) {
  const routes: Array<{ id: DashboardRoute; label: string; href: string }> = [
    { id: "research", label: "1. Research Studio", href: "/dashboard/research" },
    { id: "ops", label: "2. Agent Ops", href: "/dashboard/ops" },
    { id: "evaluation", label: "3. Evaluation", href: "/dashboard/evaluation" }
  ];

  return (
    <header className="uxTopbar">
      <div className="uxTopbarInner">
        <a className="uxBrand" href="/dashboard/research">
          <span className="uxBrandMark">PA</span>
          <span>
            <strong>Paper Agent</strong>
            <small>MON AI Team dashboard</small>
          </span>
        </a>
        <nav className="uxNav" aria-label="Dashboard routes">
          {routes.map((route) => (
            <a key={route.id} className={route.id === activeRoute ? "active" : undefined} href={route.href}>
              {route.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function ResearchExperiencePanels({ isRunning }: { isRunning: boolean }) {
  const [activeJob, setActiveJob] = useState<SearchJob | null>(null);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [report, setReport] = useState<string>("");
  const [error, setError] = useState("");
  const completedTraceCount = traces.filter((trace) => trace.status === "completed" || trace.status === "skipped").length;
  const progress = traces.length ? Math.round((completedTraceCount / 12) * 100) : 0;
  const liveStages = traces.length ? mapTracesToWorkflowStages(traces) : literatureWorkflowStages;

  // 리포트 마크다운에서 섹션 파싱
  const livePreview = useMemo(() => {
    if (!report) return literaturePreview;
    
    const sections = [
      { title: "Summary", marker: "## Executive Summary", fallback: literaturePreview[0].body },
      { title: "Commonality", marker: "### Common Themes", fallback: literaturePreview[1].body },
      { title: "Difference", marker: "### Methodological Differences", fallback: literaturePreview[2].body },
      { title: "Research Gap", marker: "### Identified Research Gaps", fallback: literaturePreview[3].body },
      { title: "Critic Note", marker: "### Screening Notes", fallback: literaturePreview[4].body },
      { title: "Use in Paper", marker: "### Suggested Reading Order", fallback: literaturePreview[5].body }
    ];

    return sections.map(sec => {
      const startIdx = report.indexOf(sec.marker);
      if (startIdx === -1) return { title: sec.title, body: sec.fallback };
      
      const contentStart = startIdx + sec.marker.length;
      let nextHeaderIdx = report.indexOf("##", contentStart);
      let subHeaderIdx = report.indexOf("###", contentStart);
      
      // 마커 자체가 포함된 경우 제외
      if (nextHeaderIdx === startIdx) nextHeaderIdx = report.indexOf("##", contentStart + 1);
      
      const endIdx = nextHeaderIdx === -1 ? (subHeaderIdx === -1 ? report.length : subHeaderIdx) : (subHeaderIdx === -1 ? nextHeaderIdx : Math.min(nextHeaderIdx, subHeaderIdx));
      
      let body = report.substring(contentStart, endIdx).trim();
      body = body.replace(/^\s*[\-\*]\s+/gm, "").split("\n")[0]; 
      return { title: sec.title, body: body || sec.fallback };
    });
  }, [report]);

  useEffect(() => {
    void loadLatestJob();
  }, []);

  useEffect(() => {
    if (!activeJob || activeJob.status === "completed" || activeJob.status === "failed") return;
    const timer = window.setInterval(() => {
      void loadJobTraces(activeJob.id);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [activeJob?.id, activeJob?.status]);

  async function loadLatestJob() {
    try {
      const response = await fetch(apiUrl("/api/search-jobs?limit=1"));
      if (!response.ok) return;
      const data = (await response.json()) as JobsResponse;
      const latest = data.jobs[0];
      if (latest) {
        await loadJobTraces(latest.id);
        if (latest.status === "completed") await loadReport(latest.id);
      }
    } catch {
      // Fail silently
    }
  }

  async function loadJobTraces(jobId: string) {
    try {
      const response = await fetch(apiUrl(`/api/search-jobs/${jobId}/traces`));
      if (!response.ok) return;
      const data = (await response.json()) as TraceResponse;
      setActiveJob(data.job);
      setTraces(data.traces);
      if (data.job.status === "completed" && !report) await loadReport(jobId);
    } catch {
      // Fail silently
    }
  }

  async function loadReport(jobId: string) {
    try {
      const response = await fetch(apiUrl(`/api/search-jobs/${jobId}/report.md`));
      if (!response.ok) return;
      setReport(await response.text());
    } catch {
      // Fail silently
    }
  }

  return (
    <>
      <section className="uxHero">
        <div className="uxHeroGrid">
          <div>
            <span className="uxEyebrow">Interactive Research Studio</span>
            <h1>Top Journal 기반 문헌검색, 검증, 보고서 생성을 한 화면에서 관리합니다.</h1>
            <p>검색 실행 후 12단계 workflow, DOI/Crossref 검증, OA PDF/R2 상태, ranked papers, paper detail, literature review preview를 함께 확인합니다.</p>
            <div className="uxHeroFlow">
              <MiniFlow title="Research Input" body="키워드, 연구 질문, 분야, 기간 입력" />
              <MiniFlow title="Top Journal Filter" body="국제 S급 우선, 국제 A1급 후순위 검색" />
              <MiniFlow title="Paper Verification" body="DOI, Crossref, OA, 저장 상태 검증" />
              <MiniFlow title="Review Output" body="Summary, Difference, Gap, Critic Note 생성" />
            </div>
          </div>
          <aside className="uxSearchSummary">
            <h2>Workflow Snapshot</h2>
            <p>{activeJob ? `Job ${activeJob.id} 실행 상태입니다.` : "최근 실행된 검색 작업이 없습니다. 아래에서 검색을 시작하세요."}</p>
            <div className="uxProgressTrack">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="uxSnapshotGrid">
              <MetricTile label="Status" value={activeJob?.status || "Idle"} detail={activeJob?.currentStep || "ready"} tone="green" />
              <MetricTile label="Steps" value={`${completedTraceCount}/12`} detail="completed" tone="blue" />
              <MetricTile label="Top Pool" value="부분 구현" detail="allowlist exists" tone="purple" />
              <MetricTile label="Review" value={activeJob?.status === "completed" ? "Ready" : "Pending"} detail="critic analysis" tone={activeJob?.status === "completed" ? "green" : "amber"} />
            </div>
          </aside>
        </div>
      </section>

      <ImplementationStatusPanel
        title="Research Route Implementation Status"
        description="실제 API 기능과 미완성 Mock 패널을 분리 표시합니다. Mock 표시는 실제 결과가 아닙니다."
        items={researchImplementationStatus}
      />

      <section className="uxPanel uxWorkflowPanel">
        <div className="uxPanelHead">
          <div>
            <h2>12-step Literature Review Workflow</h2>
            <p>{traces.length ? "실제 D1 agent_traces 기반의 실시간 실행 단계입니다." : "미완성 Mock: 실제 agent_traces 연결 전의 단계 구조 preview입니다."}</p>
          </div>
          <span className={`uxPill ${traces.length ? "green" : "amber"}`}>{traces.length ? "Live D1 traces" : "미완성 Mock"}</span>
        </div>
        <div className="uxProgressTrack">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="uxSteps12">
          {liveStages.map((stage) => (
            <article key={stage.id} className={`uxStep ${stage.status}`}>
              <span>{stage.order}</span>
              <strong>{stage.title}</strong>
              <small>{stage.detail}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="uxGrid2 uxRouteBlock">
        <section className="uxPanel">
          <div className="uxPanelHead">
            <div>
              <h2>Top Journal Pool</h2>
              <p>부분 구현: allowlist는 실제 데이터 기반이고, Q1/외부 지표 표시는 아직 미연결입니다.</p>
            </div>
            <span className="uxPill blue">S then A1</span>
          </div>
          <div className="uxSystemGrid">
            {topJournalPool.map((group) => (
              <button key={group.field} className="uxSystemItem" type="button">
                <strong>{group.field}</strong>
                <span>{group.rank} · {group.q1Status}</span>
                <small>{group.journals.join(", ")}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="uxPanel">
          <div className="uxPanelHead">
            <div>
              <h2>Literature Review Preview</h2>
              <p>{report ? "실제 Report Agent가 생성한 섹션별 핵심 요약입니다." : "미완성 Mock: 실제 Report Agent API 연결 전의 섹션 preview입니다."}</p>
            </div>
            <FileText size={18} />
          </div>
          <div className="uxPreviewGrid">
            {livePreview.map((item) => (
              <article key={item.title} className="uxMiniCard">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}

export function AgentOpsPage() {
  const [running, setRunning] = useState(false);
  const [keyword, setKeyword] = useState("AI interview employer branding");
  const [activeJob, setActiveJob] = useState<SearchJob | null>(null);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [traceError, setTraceError] = useState("");
  const [artifactError, setArtifactError] = useState("");
  const [criticFlags, setCriticFlags] = useState<CriticFlag[]>([]);
  const [outputs, setOutputs] = useState<JobOutput[]>([]);
  const [logs, setLogs] = useState(toolCallLogs);
  const completedTraceCount = traces.filter((trace) => trace.status === "completed" || trace.status === "skipped").length;
  const progress = traces.length ? Math.round((completedTraceCount / 12) * 100) : 0;
  const liveStages = traces.length ? mapTracesToWorkflowStages(traces) : literatureWorkflowStages;
  const liveAgentCards = traces.length ? mapTracesToAgentCards(traces) : agentStatuses;
  const enrichmentOverview = useMemo(() => summarizeEnrichmentTraces(traces), [traces]);
  const criticSummary = useMemo(() => summarizeCriticFlags(criticFlags), [criticFlags]);

  useEffect(() => {
    void loadLatestJob();
  }, []);

  useEffect(() => {
    if (!activeJob || activeJob.status === "completed" || activeJob.status === "failed") return;
    const timer = window.setInterval(() => {
      void loadJobTraces(activeJob.id);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [activeJob?.id, activeJob?.status]);

  async function loadLatestJob() {
    setTraceError("");
    try {
      const response = await fetch(apiUrl("/api/search-jobs?limit=1"));
      if (!response.ok) throw new Error(await readDashboardError(response, "Failed to load recent job"));
      const data = (await response.json()) as JobsResponse;
      const latest = data.jobs[0];
      if (latest) await loadJobTraces(latest.id);
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : "Failed to load recent job");
    }
  }

  async function loadJobTraces(jobId: string) {
    setTraceError("");
    try {
      const response = await fetch(apiUrl(`/api/search-jobs/${jobId}/traces`));
      if (!response.ok) throw new Error(await readDashboardError(response, "Failed to load agent traces"));
      const data = (await response.json()) as TraceResponse;
      setActiveJob(data.job);
      setTraces(data.traces);
      setLogs(data.traces.map((trace) => ({ level: getTraceLogLevel(trace.status), message: formatTraceConsoleMessage(trace) })));
      await loadJobArtifacts(data.job.id);
      if (data.job.status === "completed" || data.job.status === "failed") setRunning(false);
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : "Failed to load agent traces");
      setRunning(false);
    }
  }

  async function loadJobArtifacts(jobId: string) {
    setArtifactError("");
    try {
      const [flagsResponse, outputsResponse] = await Promise.all([
        fetch(apiUrl(`/api/search-jobs/${jobId}/critic-flags`)),
        fetch(apiUrl(`/api/search-jobs/${jobId}/outputs`))
      ]);
      if (!flagsResponse.ok) throw new Error(await readDashboardError(flagsResponse, "Failed to load critic flags"));
      if (!outputsResponse.ok) throw new Error(await readDashboardError(outputsResponse, "Failed to load output artifacts"));
      const flagsData = (await flagsResponse.json()) as CriticFlagsResponse;
      const outputsData = (await outputsResponse.json()) as JobOutputsResponse;
      setCriticFlags(flagsData.criticFlags);
      setOutputs(outputsData.outputs);
    } catch (error) {
      setArtifactError(error instanceof Error ? error.message : "Failed to load job artifacts");
      setCriticFlags([]);
      setOutputs([]);
    }
  }

  async function launchJob() {
    setRunning(true);
    setTraceError("");
    setLogs([{ level: "muted", message: `POST /api/search-jobs keyword="${keyword}"` }]);
    try {
      const response = await fetch(apiUrl("/api/search-jobs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, maxResults: 20, enrichmentLimit: 10, useSemanticRanking: false, useLlmCritic: false })
      });
      if (!response.ok) throw new Error(await readDashboardError(response, "Failed to launch agent job"));
      const data = (await response.json()) as { job: SearchJob };
      setActiveJob(data.job);
      await loadJobTraces(data.job.id);
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : "Failed to launch agent job");
      setRunning(false);
    }
  }

  function inspectAgent(name: string) {
    const trace = traces.find((item) => item.agentName === name);
    setLogs((current) => [...current, { level: trace ? getTraceLogLevel(trace.status) : "muted", message: trace ? `${trace.agentName}.inspect ${formatTraceConsoleMessage(trace)}` : `${name}.inspect no live trace loaded` }]);
  }

  return (
    <main className="uxShell">
      <section className="uxHero">
        <div className="uxHeroGrid">
          <div>
            <span className="uxEyebrow cyan">Interactive Agent Ops</span>
            <h1>Multi-Agent 실행 상태와 tool call 흐름을 운영 관점에서 추적합니다.</h1>
            <p>실제 Worker job과 D1 agent_traces를 기반으로 최신 실행 상태를 표시합니다.</p>
          </div>
          <aside className="uxSearchSummary">
            <h2>Launch Agent Job</h2>
            <label className="uxField">
              <span>Keyword</span>
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </label>
            <div className="uxFieldGrid">
              <label className="uxField">
                <span>Provider</span>
                <select defaultValue="wos" disabled>
                  <option value="wos">Worker configured provider</option>
                </select>
              </label>
              <label className="uxField">
                <span>Pipeline</span>
                <select defaultValue="full" disabled>
                  <option value="full">Full 12-step trace</option>
                </select>
              </label>
            </div>
            <button className="uxButton green" type="button" onClick={launchJob} disabled={running || !keyword.trim()}>
              {running ? <RefreshCw size={18} className="spin" /> : <Play size={18} />}
              Launch Agent Job
            </button>
            {activeJob ? <p className="uxTinyStatus">job_id: {activeJob.id}</p> : null}
            {traceError ? <p className="uxTinyError">{traceError}</p> : null}
          </aside>
        </div>
      </section>

      <section className="uxMetrics">
        <MetricTile label="Job" value={activeJob?.status ?? "No job"} detail={activeJob?.currentStep ?? "load or launch"} tone={activeJob?.status === "failed" ? "amber" : "green"} />
        <MetricTile label="Trace Steps" value={String(traces.length)} detail={`${completedTraceCount} completed/skipped`} tone="blue" />
        <MetricTile label="Agents" value={String(liveAgentCards.length)} detail="from D1 traces" tone="purple" />
        <MetricTile label="Warnings" value={String(traces.filter((trace) => trace.status === "skipped" || trace.status === "failed").length)} detail="skipped or failed" tone="amber" />
        <MetricTile label="Enrichment" value={enrichmentOverview.limit} detail={`Crossref ${enrichmentOverview.crossrefProcessed}/skip ${enrichmentOverview.crossrefSkipped} · Unpaywall ${enrichmentOverview.unpaywallProcessed}/skip ${enrichmentOverview.unpaywallSkipped}`} tone="blue" />
        <MetricTile label="Storage" value={traces.some((trace) => trace.stepId === "drive_r2_storage" && trace.status === "completed") ? "R2 Ready" : "Pending"} detail="Drive uploads OA PDFs when configured" tone="green" />
        <MetricTile label="Critic Flags" value={String(criticFlags.length)} detail={`high ${criticSummary.high} · medium ${criticSummary.medium} · low ${criticSummary.low}`} tone={criticSummary.high ? "amber" : "green"} />
        <MetricTile label="Outputs" value={String(outputs.length)} detail={outputs.length ? outputs.map((output) => output.outputType + ":" + output.status).join(" · ") : "no metadata"} tone="purple" />
        <MetricTile label="Vectorize" value={traces.some((trace) => trace.stepId === "vectorize_relevance" && trace.status === "completed") ? "Fallback" : "Pending"} detail="metadata fallback; embeddings planned" tone="blue" />
      </section>

      <ImplementationStatusPanel
        title="Ops Route Implementation Status"
        description="운영 화면의 Agent board, pipeline, console은 최신 D1 agent_traces를 우선 사용하고 trace가 없을 때만 mock placeholder를 표시합니다."
        items={opsImplementationStatus}
      />

      <section className="uxGrid2">
        <div className="uxStack">
          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Multi-Agent Status Board</h2>
                <p>Agent card를 클릭하면 해당 agent의 trace summary가 console에 추가됩니다.</p>
              </div>
              <span className={`uxPill ${traces.length ? "green" : "amber"}`}>{traces.length ? "Live D1 traces" : "No live trace"}</span>
            </div>
            <div className="uxAgentGrid">
              {liveAgentCards.map((agent) => (
                <button key={agent.name} className="uxMiniCard uxAgentCard" type="button" onClick={() => inspectAgent(agent.name)}>
                  <h3>{agent.name}</h3>
                  <p>{agent.role}</p>
                  <span className={`uxPill ${agent.state === "review" ? "amber" : agent.state === "running" ? "blue" : agent.state === "done" ? "green" : "gray"}`}>{agent.state}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Pipeline Execution</h2>
                <p>12단계 문헌검토 workflow의 운영 상태입니다.</p>
              </div>
              <span className={`uxPill ${traces.length ? "green" : "amber"}`}>{traces.length ? `${progress}%` : "No live trace"}</span>
            </div>
            <div className="uxProgressTrack">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="uxSteps12">
              {liveStages.map((stage) => (
                <article key={stage.id} className={`uxStep ${stage.status === "done" ? "done" : stage.status === "running" ? "running" : stage.status === "review" ? "review" : "idle"}`}>
                  <span>{stage.order}</span>
                  <strong>{stage.title}</strong>
                  <small>{stage.detail}</small>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="uxStack">
          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Tool Call Console</h2>
                <p>{traces.length ? "D1 agent_traces에서 생성한 실행 로그입니다." : "Live trace가 없으면 placeholder log를 표시합니다."}</p>
              </div>
              <button className="uxSoftButton" type="button" onClick={() => setLogs([])}>Clear</button>
            </div>
            <div className="uxTerminal">
              {logs.map((log, index) => (
                <div key={`${log.message}-${index}`} className={log.level}>
                  <span>$</span> {log.message}
                </div>
              ))}
            </div>
          </section>

          <OutputArtifactsPanel outputs={outputs} errorMessage={artifactError} />

          <LiveCriticFlagsPanel flags={criticFlags} errorMessage={artifactError} />

          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Storage and Runtime</h2>
                <p>D1, R2, Google Drive, Vectorize, MCP 상태입니다.</p>
              </div>
              <Cloud size={18} />
            </div>
            <div className="uxSystemGrid">
              {systemStatuses.map((item) => (
                <button key={item.name} className="uxSystemItem" type="button" onClick={() => setLogs((current) => [...current, { level: "ok", message: `${item.name}.status checked: ${item.status}` }])}>
                  <strong>{item.name}</strong>
                  <span>{item.status}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
          </section>

          <CriticReviewPanel />
        </aside>
      </section>
    </main>
  );
}

function OutputArtifactsPanel({ outputs, errorMessage }: { outputs: JobOutput[]; errorMessage: string }) {
  return (
    <section className="uxPanel">
      <div className="uxPanelHead">
        <div>
          <h2>Output Artifacts</h2>
          <p>CSV, Markdown, XLSX, PDF 산출물의 실제 저장 상태입니다.</p>
        </div>
        <FileText size={18} />
      </div>
      {errorMessage ? <p className="uxTinyError">{errorMessage}</p> : null}
      <div className="uxArtifactList">
        {outputs.length ? outputs.map((output) => (
          <article key={output.id} className="uxArtifactItem">
            <div>
              <strong>{output.outputType.toUpperCase()}</strong>
              <span>{output.storage} · {output.detail}</span>
              {output.urlPath ? <a href={apiUrl(output.urlPath)} target="_blank" rel="noreferrer">Open artifact</a> : <small>Endpoint planned</small>}
            </div>
            <span className={`uxPill ${output.status === "stored" || output.status === "generated" ? "green" : output.status === "failed" ? "amber" : "gray"}`}>{output.status}</span>
          </article>
        )) : <p className="uxEmptyNote">No output metadata loaded.</p>}
      </div>
    </section>
  );
}

function LiveCriticFlagsPanel({ flags, errorMessage }: { flags: CriticFlag[]; errorMessage: string }) {
  return (
    <section className="uxPanel">
      <div className="uxPanelHead">
        <div>
          <h2>Critic Review</h2>
          <p>실제 D1 critic_flags에서 읽은 paper-level risk flag입니다.</p>
        </div>
        <ShieldCheck size={18} />
      </div>
      {errorMessage ? <p className="uxTinyError">{errorMessage}</p> : null}
      <div className="uxArtifactList">
        {flags.length ? flags.slice(0, 8).map((flag) => (
          <article key={flag.id} className="uxArtifactItem">
            <div>
              <strong>#{flag.paperRank} · {flag.flagType}</strong>
              <span>{flag.message}</span>
              {flag.evidence ? <small>{flag.evidence}</small> : null}
            </div>
            <span className={`uxPill ${flag.severity === "high" ? "amber" : flag.severity === "medium" ? "blue" : "gray"}`}>{flag.severity}</span>
          </article>
        )) : <p className="uxEmptyNote">No critic flags loaded for this job.</p>}
      </div>
    </section>
  );
}

function summarizeCriticFlags(flags: CriticFlag[]) {
  return {
    high: flags.filter((flag) => flag.severity === "high").length,
    medium: flags.filter((flag) => flag.severity === "medium").length,
    low: flags.filter((flag) => flag.severity === "low").length
  };
}

function mapTracesToWorkflowStages(traces: AgentTrace[]) {
  return traces.map((trace) => ({
    id: trace.stepId,
    order: trace.stepOrder,
    title: titleFromTraceStep(trace.stepId),
    owner: trace.agentName,
    status: trace.status === "completed" ? "done" as const : trace.status === "running" ? "running" as const : trace.status === "failed" || trace.status === "skipped" ? "review" as const : "idle" as const,
    progress: trace.status === "completed" || trace.status === "skipped" ? 100 : trace.status === "running" ? 50 : 0,
    detail: summarizeTraceForCard(trace)
  }));
}

function mapTracesToAgentCards(traces: AgentTrace[]) {
  return traces.map((trace) => ({
    name: trace.agentName,
    role: summarizeTraceForCard(trace),
    state: trace.status === "completed" ? "done" as const : trace.status === "running" ? "running" as const : trace.status === "failed" || trace.status === "skipped" ? "review" as const : "idle" as const,
    tool: trace.stepId
  }));
}

function titleFromTraceStep(stepId: string): string {
  return stepId.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function summarizeEnrichmentTraces(traces: AgentTrace[]): EnrichmentOverview {
  const crossref = traces.find((trace) => trace.stepId === "crossref_enrichment");
  const unpaywall = traces.find((trace) => trace.stepId === "unpaywall_check");
  const crossrefDetail = parseTraceDetail(crossref?.detail);
  const unpaywallDetail = parseTraceDetail(unpaywall?.detail);
  const limit = formatTraceValue(crossrefDetail.enrichmentLimit) || formatTraceValue(unpaywallDetail.enrichmentLimit) || "not set";

  return {
    limit: limit === "not set" ? "No limit" : `limit ${limit}`,
    crossrefProcessed: crossref?.outputCount !== undefined ? String(crossref.outputCount) : "0",
    crossrefSkipped: formatTraceValue(crossrefDetail.skipped) || "0",
    unpaywallProcessed: unpaywall?.outputCount !== undefined ? String(unpaywall.outputCount) : "0",
    unpaywallSkipped: formatTraceValue(unpaywallDetail.skipped) || "0"
  };
}

function summarizeTraceForCard(trace: AgentTrace): string {
  const detail = parseTraceDetail(trace.detail);
  const meta = buildTraceMetaItems(trace, detail);
  return meta.length ? `${trace.summary} [${meta.join(" · ")}]` : trace.summary;
}

function formatTraceConsoleMessage(trace: AgentTrace): string {
  const detail = parseTraceDetail(trace.detail);
  const meta = buildTraceMetaItems(trace, detail);
  return meta.length ? `${trace.stepId}: ${trace.summary} :: ${meta.join(" | ")}` : `${trace.stepId}: ${trace.summary}`;
}

function parseTraceDetail(detail?: string): TraceDetail {
  if (!detail) return {};
  try {
    const parsed = JSON.parse(detail) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as TraceDetail : {};
  } catch {
    return {};
  }
}

function buildTraceMetaItems(trace: AgentTrace, detail: TraceDetail): string[] {
  const items: string[] = [];
  const enrichmentLimit = formatTraceValue(detail.enrichmentLimit);
  const skipped = formatTraceValue(detail.skipped);
  if (enrichmentLimit) items.push(`limit ${enrichmentLimit}`);
  if (trace.inputCount !== undefined) items.push(`input ${trace.inputCount}`);
  if (trace.outputCount !== undefined) items.push(`processed ${trace.outputCount}`);
  if (skipped) items.push(`skipped ${skipped}`);

  if (trace.stepId === "crossref_enrichment") {
    const verified = formatTraceValue(detail.verified);
    const partial = formatTraceValue(detail.partial);
    if (verified) items.push(`verified ${verified}`);
    if (partial) items.push(`partial ${partial}`);
  }

  if (trace.stepId === "unpaywall_check") {
    const pdfUrls = formatTraceValue(detail.pdfUrls);
    const landingPages = formatTraceValue(detail.landingPages);
    if (pdfUrls) items.push(`OA PDF ${pdfUrls}`);
    if (landingPages) items.push(`landing ${landingPages}`);
  }

  if (trace.stepId === "drive_r2_storage") {
    const uploaded = formatTraceValue(detail.driveUploaded);
    const failed = formatTraceValue(detail.driveFailed);
    const driveSkipped = formatTraceValue(detail.driveSkipped);
    if (uploaded) items.push(`Drive uploaded ${uploaded}`);
    if (failed) items.push(`Drive failed ${failed}`);
    if (driveSkipped) items.push(`Drive skipped ${driveSkipped}`);
  }

  return items;
}

function formatTraceValue(value: TraceDetail[string]): string {
  return typeof value === "number" || typeof value === "string" ? String(value) : "";
}

function getTraceLogLevel(status: AgentTrace["status"]): "ok" | "warn" | "muted" {
  if (status === "completed") return "ok";
  if (status === "failed" || status === "skipped") return "warn";
  return "muted";
}

async function readDashboardError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function EvaluationDashboardPage() {
  const [scenarioKey, setScenarioKey] = useState<EvaluationScenarioKey>("strict");
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<BenchmarkMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    title: "핵심 주장",
    body: "실제 벤치마크 데이터를 로드 중입니다..."
  });

  const scenario = useMemo<EvaluationScenario>(() => {
    const baseScenario = evaluationScenarios.find((item) => item.key === scenarioKey) ?? evaluationScenarios[0];
    if (!benchmarkMetrics) return baseScenario;

    return {
      ...baseScenario,
      metrics: {
        ...baseScenario.metrics,
        precisionAt5: benchmarkMetrics.macroAverages.precision_at_k.toFixed(4),
        doiAccuracy: (benchmarkMetrics.macroAverages.doi_accuracy_at_k * 100).toFixed(1) + "%",
        topJournalPrecision: (benchmarkMetrics.macroAverages.top_journal_precision_at_k * 100).toFixed(1) + "%",
        hallucinationRate: (benchmarkMetrics.macroAverages.hallucination_rate_at_k * 100).toFixed(1) + "%",
        reportCompleteness: baseScenario.metrics.reportCompleteness,
        avgLatency: baseScenario.metrics.avgLatency
      },
      rows: baseScenario.rows.map(row => {
        if (row.metric === "Precision@5") return { ...row, proposed: benchmarkMetrics.macroAverages.precision_at_k.toFixed(4) };
        if (row.metric === "DOI Accuracy") return { ...row, proposed: (benchmarkMetrics.macroAverages.doi_accuracy_at_k * 100).toFixed(1) + "%" };
        if (row.metric === "Top Journal %") return { ...row, proposed: (benchmarkMetrics.macroAverages.top_journal_precision_at_k * 100).toFixed(1) + "%" };
        if (row.metric === "Hallucination") return { ...row, proposed: (benchmarkMetrics.macroAverages.hallucination_rate_at_k * 100).toFixed(1) + "%" };
        return row;
      }),
      bars: baseScenario.bars.map(bar => {
        if (bar.label === "Precision") return { ...bar, value: Math.round(benchmarkMetrics.macroAverages.precision_at_k * 100) };
        if (bar.label === "NDCG") return { ...bar, value: Math.round(benchmarkMetrics.macroAverages.ndcg_at_k * 100) };
        if (bar.label === "DOI Hits") return { ...bar, value: Math.round(benchmarkMetrics.macroAverages.gold_doi_hit_rate_at_k * 100) };
        return bar;
      })
    };
  }, [scenarioKey, benchmarkMetrics]);

  const overall = Math.round(scenario.bars.reduce((sum, item) => sum + item.value, 0) / scenario.bars.length);
  const benchmarkSourceLabel = benchmarkMetrics?.source === "static_snapshot" ? "Static benchmark snapshot" : "Live benchmark metrics";
  const benchmarkDescription = benchmarkMetrics?.source === "static_snapshot"
    ? "커밋된 3-task proposed-agent benchmark 스냅샷입니다. 20-task live aggregation은 아직 구현 전입니다."
    : "실제 benchmark endpoint에서 반환된 metric 데이터입니다.";

  useEffect(() => {
    void loadBenchmarkMetrics();
  }, []);

  async function loadBenchmarkMetrics() {
    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/benchmark-metrics"));
      if (!response.ok) throw new Error("Failed to load benchmark metrics");
      const data = (await response.json()) as BenchmarkMetrics;
      setBenchmarkMetrics(data);
      setMessage({
        title: data.source === "static_snapshot" ? "정적 벤치마크 스냅샷 확인됨" : "벤치마크 결과 확인됨",
        body: `${data.tasks}개 태스크, ${data.results}개 결과물 기준입니다. ${data.note ?? "Endpoint에서 반환된 metric을 표시합니다."}`
      });
    } catch (error) {
      console.error(error);
      setMessage({
        title: "데이터 연결 실패",
        body: "백엔드에서 실제 벤치마크 데이터를 가져오지 못해 Mock 데이터를 표시합니다. 'npm run benchmark:evaluate-proposed' 실행 여부를 확인하세요."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="uxShell">
      <section className="uxHero compact">
        <span className="uxEyebrow">Interactive Evaluation Dashboard</span>
        <h1>Baseline 대비 Proposed Multi-Agent의 성능과 실패 유형을 비교합니다.</h1>
        <p>Scenario 버튼을 누르면 평가 수치, baseline 비교표, score breakdown, presentation message가 함께 변경됩니다.</p>
      </section>

      <section className="uxPanel uxScenarioPanel">
        <div className="uxPanelHead">
          <div>
            <h2>Evaluation Scenario</h2>
            <p>발표와 검수 상황에 맞춰 strict, broad, fast mode를 전환합니다.</p>
          </div>
          <div className="uxActions">
            {evaluationScenarios.map((item) => (
              <button key={item.key} className={item.key === scenarioKey ? "uxButton" : "uxSoftButton"} type="button" onClick={() => setScenarioKey(item.key)}>
                {item.label}
              </button>
            ))}
            <button className="uxSoftButton" type="button" onClick={loadBenchmarkMetrics} disabled={loading}>
              <RefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>
      </section>

      <section className="uxMetrics">
        <MetricTile label="Precision@5" value={scenario.metrics.precisionAt5} detail="Proposed Agent" tone="green" />
        <MetricTile label="DOI Accuracy" value={scenario.metrics.doiAccuracy} detail="Crossref verified" tone="green" />
        <MetricTile label="Top Journal Precision" value={scenario.metrics.topJournalPrecision} detail="Q1 / pool matched" tone="blue" />
        <MetricTile label="Hallucination Rate" value={scenario.metrics.hallucinationRate} detail="critic filtered" tone="amber" />
        <MetricTile label="Report Completeness" value={scenario.metrics.reportCompleteness} detail="rubric score" tone="purple" />
        <MetricTile label="Avg Latency" value={scenario.metrics.avgLatency} detail="full workflow" tone="blue" />
      </section>

      <ImplementationStatusPanel
        title="Evaluation Route Implementation Status"
        description={benchmarkMetrics ? benchmarkDescription : "평가 화면의 scenario 수치는 미완성 Mock입니다. 실제 데이터 연결 전입니다."}
        items={evaluationImplementationStatus}
      />

      <section className="uxGrid2">
        <div className="uxStack">
          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Baseline Evaluation Dashboard</h2>
                <p>{benchmarkMetrics ? `${benchmarkMetrics.tasks}개 태스크 기준 benchmark metric입니다.` : "미완성 Mock: baseline CSV와 proposed full-run 결과 연결 전입니다."}</p>
              </div>
              <span className={`uxPill ${benchmarkMetrics ? "blue" : "amber"}`}>{benchmarkMetrics ? benchmarkSourceLabel : "미완성 Mock"}</span>
            </div>
            <div className="uxTableWrap">
              <table className="uxTable">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Rule-based</th>
                    <th>Single LLM</th>
                    <th>Proposed Multi-Agent</th>
                    <th>Finding</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.rows.map((row) => (
                    <tr key={row.metric} onClick={() => setMessage({ title: row.metric, body: `${row.finding} ${benchmarkMetrics ? benchmarkDescription : "실제 비교는 baseline CSV와 proposed full-run metric 연결 후 확정됩니다."}` })}>
                      <td>{row.metric}</td>
                      <td><span className="uxPill amber">{row.ruleBased}</span></td>
                      <td><span className="uxPill blue">{row.singleLlm}</span></td>
                      <td><span className="uxPill green">{row.proposed}</span></td>
                      <td>{row.finding}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Evaluation Rubric</h2>
                <p>논문 추천 품질과 보고서 활용 가능성을 같이 평가합니다.</p>
              </div>
              <ShieldCheck size={18} />
            </div>
            <div className="uxPreviewGrid">
              {evaluationRubrics.map((rubric) => (
                <button key={rubric.title} className="uxMiniCard" type="button" onClick={() => setMessage({ title: rubric.title, body: `${rubric.body} 이 기준은 최종 문헌 추천의 품질을 검수하기 위한 핵심 지표입니다.` })}>
                  <h3>{rubric.title}</h3>
                  <p>{rubric.body}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="uxStack">
          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Score Breakdown</h2>
                <p>{benchmarkMetrics ? benchmarkDescription : "미완성 Mock: 실제 benchmark 결과 연결 전에는 0으로 표시합니다."}</p>
              </div>
              <span className={`uxPill ${benchmarkMetrics ? "blue" : "amber"}`}>{benchmarkMetrics ? benchmarkSourceLabel : "미완성 Mock"}</span>
            </div>
            <div className="uxScorePanel">
              <div className="uxScoreHead">
                <span>Overall Quality</span>
                <strong>{(overall / 100).toFixed(2)}</strong>
              </div>
              {scenario.bars.map((bar) => (
                <div key={bar.label} className="uxBarItem">
                  <div>
                    <span>{bar.label}</span>
                    <span>{bar.value}%</span>
                  </div>
                  <div className="uxBar"><span style={{ width: `${bar.value}%` }} /></div>
                </div>
              ))}
            </div>
          </section>

          <CriticReviewPanel title="Error Analysis" description="클릭하면 presentation message에 개선 방향이 표시됩니다." onSelect={(item) => setMessage({ title: item.title, body: item.note })} />

          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Presentation Message</h2>
                <p>선택한 평가 요소에 따라 발표 문구가 바뀝니다.</p>
              </div>
              <BarChart3 size={18} />
            </div>
            <article className="uxMiniCard">
              <h3>{message.title}</h3>
              <p>{message.body}</p>
            </article>
          </section>
        </aside>
      </section>
    </main>
  );
}

function CriticReviewPanel({
  title = "Critic Review",
  description = "오류, 과대평가, 환각 가능성을 재검토합니다.",
  onSelect
}: {
  title?: string;
  description?: string;
  onSelect?: (item: (typeof criticReviews)[number]) => void;
}) {
  return (
    <section className="uxPanel">
      <div className="uxPanelHead">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Activity size={18} />
      </div>
      <div className="uxSystemGrid">
        {criticReviews.map((item) => (
          <button key={item.title} className="uxSystemItem" type="button" onClick={() => onSelect?.(item)}>
            <strong>{item.title}</strong>
            <span>{item.severity}</span>
            <small>{item.note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function ImplementationStatusPanel({ title, description, items }: { title: string; description: string; items: FeatureImplementationItem[] }) {
  const counts = implementationLegend.map((legend) => ({
    ...legend,
    count: items.filter((item) => item.status === legend.status).length
  }));

  return (
    <section className="uxPanel uxImplementationPanel">
      <div className="uxPanelHead">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="uxImplementationLegend" aria-label="Implementation status legend">
          {counts.map((item) => (
            <span key={item.status} className={`uxStatusChip ${item.status}`} title={item.detail}>
              {item.label} {item.count}
            </span>
          ))}
        </div>
      </div>
      <div className="uxImplementationGrid">
        {items.map((item) => (
          <article key={item.feature} className={`uxImplementationItem ${item.status}`}>
            <div>
              <strong>{item.feature}</strong>
              <StatusChip status={item.status} />
            </div>
            <p>{item.evidence}</p>
            <small>{item.next}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatusChip({ status }: { status: FeatureImplementationStatus }) {
  const label = implementationLegend.find((item) => item.status === status)?.label ?? status;
  return <span className={`uxStatusChip ${status}`}>{label}</span>;
}

function MetricTile({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "green" | "blue" | "amber" | "purple" }) {
  return (
    <article className={`uxMetric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function MiniFlow({ title, body }: { title: string; body: string }) {
  return (
    <article className="uxFlowItem">
      <strong>{title}</strong>
      <span>{body}</span>
    </article>
  );
}
