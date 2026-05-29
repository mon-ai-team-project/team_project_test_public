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

type DiagnosticsResponse = {
  ok: boolean;
  searchProvider: string;
  db: { bound: boolean; missingColumns: Array<{ table: string; column: string; ok: boolean }> };
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
  readiness: { activeProviderReady: boolean };
};

type BenchmarkMethodKey = "proposed_agent" | "rule_based" | "single_llm";

type BenchmarkComparisonMethod = {
  taskCount: number;
  resultCount: number;
  goldCount: number;
  verifiedGoldCount: number;
  macroAverages: {
    precision_at_5: number;
    ndcg_at_5: number;
    gold_doi_hit_rate_at_5: number;
    doi_presence_rate_at_5: number;
    top_journal_precision_at_5: number;
    paper_validity_rate_at_5: number;
    accepted_exception_count: number;
  };
  matchedGoldIds: string[];
  acceptedExceptionLocations: string[];
};

type BenchmarkAutoReviewRow = {
  method: "rule_based" | "single_llm";
  taskId: string;
  rank: number;
  title: string;
  doi: string;
  decision: string;
  relevance: number;
  failureType: string;
  matchedGoldId: string;
};

type BenchmarkAutoReviewMethod = {
  rowCount: number;
  includeCount: number;
  reviewByRuleCount: number;
  rejectCount: number;
  averageAutoRelevance: number;
  failureTypes: Record<string, number>;
  matchedGoldIds: string[];
};

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
  comparison?: {
    k: number;
    methodOrder: BenchmarkMethodKey[];
    byMethod: Partial<Record<BenchmarkMethodKey, BenchmarkComparisonMethod>>;
  };
  autoReview?: {
    rowCount: number;
    policy: string;
    rows?: BenchmarkAutoReviewRow[];
    byMethod: Partial<Record<"rule_based" | "single_llm", BenchmarkAutoReviewMethod>>;
  };
};

export function resolveDashboardRoute(pathname = window.location.pathname): DashboardRoute {
  if (pathname.includes("/dashboard/ops")) return "ops";
  if (pathname.includes("/dashboard/evaluation")) return "evaluation";
  return "research";
}

export function DashboardNav({ activeRoute }: { activeRoute: DashboardRoute }) {
  const routes: Array<{ id: DashboardRoute; label: string; href: string }> = [
    { id: "research", label: "1. 연구 스튜디오", href: "/dashboard/research" },
    { id: "ops", label: "2. Agent 운영", href: "/dashboard/ops" },
    { id: "evaluation", label: "3. 평가", href: "/dashboard/evaluation" }
  ];

  return (
    <header className="uxTopbar">
      <div className="uxTopbarInner">
        <a className="uxBrand" href="/dashboard/research">
          <span className="uxBrandMark">PA</span>
          <span>
            <strong>Paper Agent</strong>
            <small>MON AI Team 대시보드</small>
          </span>
        </a>
        <nav className="uxNav" aria-label="대시보드 경로">
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

  const livePreview = useMemo(() => {
    if (!report) return literaturePreview;

    const sections = [
      { title: "요약", patterns: [/^##\s+Executive Summary/i, /^##\s+Summary/i], fallback: literaturePreview[0].body },
      { title: "공통점", patterns: [/^###\s+Common Themes/i, /^##\s+Commonality/i, /^###\s+Commonality/i], fallback: literaturePreview[1].body },
      { title: "차이점", patterns: [/^###\s+Methodological Differences/i, /^##\s+Difference/i, /^###\s+Difference/i], fallback: literaturePreview[2].body },
      { title: "Research Gap", patterns: [/^###\s+Identified Research Gaps/i, /^##\s+Research Gap/i, /^###\s+Research Gap/i], fallback: literaturePreview[3].body },
      { title: "Critic Note", patterns: [/^###\s+Screening Notes/i, /^##\s+Critic/i, /^###\s+Critic/i], fallback: literaturePreview[4].body },
      { title: "논문 활용", patterns: [/^###\s+Suggested Reading Order/i, /^##\s+Use in Paper/i, /^###\s+Use in Paper/i], fallback: literaturePreview[5].body }
    ];

    return sections.map((section) => {
      const body = extractMarkdownSection(report, section.patterns);
      return { title: section.title, body: body || section.fallback };
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
            <span className="uxEyebrow">인터랙티브 연구 스튜디오</span>
            <h1>Top Journal 기반 문헌검색, 검증, 보고서 생성을 한 화면에서 관리합니다.</h1>
            <p>검색 실행 후 12단계 workflow, DOI/Crossref 검증, OA PDF/R2 상태, ranked papers, paper detail, literature review preview를 함께 확인합니다.</p>
            <div className="uxHeroFlow">
              <MiniFlow title="연구 입력" body="키워드, 연구 질문, 분야, 기간 입력" />
              <MiniFlow title="Top Journal 필터" body="국제 S급 우선, 국제 A1급 후순위 검색" />
              <MiniFlow title="논문 검증" body="DOI, Crossref, OA, 저장 상태 검증" />
              <MiniFlow title="Review 산출물" body="요약, 차이점, Gap, Critic Note 생성" />
            </div>
          </div>
          <aside className="uxSearchSummary">
            <h2>Workflow 현황</h2>
            <p>{activeJob ? `Job ${activeJob.id} 실행 상태입니다.` : "최근 실행된 검색 작업이 없습니다. 아래에서 검색을 시작하세요."}</p>
            <div className="uxProgressTrack">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="uxSnapshotGrid">
              <MetricTile label="상태" value={activeJob?.status || "대기"} detail={activeJob?.currentStep || "준비됨"} tone="green" />
              <MetricTile label="단계" value={`${completedTraceCount}/12`} detail="완료/건너뜀" tone="blue" />
              <MetricTile label="Top Pool" value="부분 구현" detail="allowlist 적용" tone="purple" />
              <MetricTile label="Review" value={activeJob?.status === "completed" ? "준비됨" : "대기 중"} detail="critic 분석" tone={activeJob?.status === "completed" ? "green" : "amber"} />
            </div>
          </aside>
        </div>
      </section>

      <ImplementationStatusPanel
        title="Research Route 구현 상태"
        description="실제 API 기능과 미완성 Mock 패널을 분리 표시합니다. Mock 표시는 실제 결과가 아닙니다."
        items={researchImplementationStatus}
      />

      <section className="uxPanel uxWorkflowPanel">
        <div className="uxPanelHead">
          <div>
            <h2>12단계 Literature Review Workflow</h2>
            <p>{traces.length ? "실제 D1 agent_traces 기반의 실시간 실행 단계입니다." : "미완성 Mock: 실제 agent_traces 연결 전의 단계 구조 preview입니다."}</p>
          </div>
          <span className={`uxPill ${traces.length ? "green" : "amber"}`}>{traces.length ? "D1 trace 연결됨" : "미완성 Mock"}</span>
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
              <h2>Literature Review 미리보기</h2>
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
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState("");
  const [logs, setLogs] = useState(toolCallLogs);
  const completedTraceCount = traces.filter((trace) => trace.status === "completed" || trace.status === "skipped").length;
  const progress = traces.length ? Math.round((completedTraceCount / 12) * 100) : 0;
  const liveStages = traces.length ? mapTracesToWorkflowStages(traces) : literatureWorkflowStages;
  const liveAgentCards = traces.length ? mapTracesToAgentCards(traces) : agentStatuses;
  const enrichmentOverview = useMemo(() => summarizeEnrichmentTraces(traces), [traces]);
  const criticSummary = useMemo(() => summarizeCriticFlags(criticFlags), [criticFlags]);
  const diagnosticsItems = useMemo(() => getDiagnosticsItems(diagnostics), [diagnostics]);

  useEffect(() => {
    void loadLatestJob();
    void loadDiagnostics();
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
      if (!response.ok) throw new Error(await readDashboardError(response, "최근 job을 불러오지 못했습니다"));
      const data = (await response.json()) as JobsResponse;
      const latest = data.jobs[0];
      if (latest) await loadJobTraces(latest.id);
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : "최근 job을 불러오지 못했습니다");
    }
  }

  async function loadJobTraces(jobId: string) {
    setTraceError("");
    try {
      const response = await fetch(apiUrl(`/api/search-jobs/${jobId}/traces`));
      if (!response.ok) throw new Error(await readDashboardError(response, "agent trace를 불러오지 못했습니다"));
      const data = (await response.json()) as TraceResponse;
      setActiveJob(data.job);
      setTraces(data.traces);
      setLogs(data.traces.map((trace) => ({ level: getTraceLogLevel(trace.status), message: formatTraceConsoleMessage(trace) })));
      await loadJobArtifacts(data.job.id);
      if (data.job.status === "completed" || data.job.status === "failed") setRunning(false);
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : "agent trace를 불러오지 못했습니다");
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
      if (!flagsResponse.ok) throw new Error(await readDashboardError(flagsResponse, "critic flag를 불러오지 못했습니다"));
      if (!outputsResponse.ok) throw new Error(await readDashboardError(outputsResponse, "output artifact를 불러오지 못했습니다"));
      const flagsData = (await flagsResponse.json()) as CriticFlagsResponse;
      const outputsData = (await outputsResponse.json()) as JobOutputsResponse;
      setCriticFlags(flagsData.criticFlags);
      setOutputs(outputsData.outputs);
    } catch (error) {
      setArtifactError(error instanceof Error ? error.message : "job artifact를 불러오지 못했습니다");
      setCriticFlags([]);
      setOutputs([]);
    }
  }

  async function loadDiagnostics() {
    setDiagnosticsError("");
    try {
      const response = await fetch(apiUrl("/api/diagnostics"));
      if (!response.ok) throw new Error(await readDashboardError(response, "diagnostics를 불러오지 못했습니다"));
      const data = (await response.json()) as DiagnosticsResponse;
      setDiagnostics(data);
    } catch (error) {
      setDiagnosticsError(error instanceof Error ? error.message : "diagnostics를 불러오지 못했습니다");
      setDiagnostics(null);
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
      if (!response.ok) throw new Error(await readDashboardError(response, "agent job 실행에 실패했습니다"));
      const data = (await response.json()) as { job: SearchJob };
      setActiveJob(data.job);
      await loadJobTraces(data.job.id);
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : "agent job 실행에 실패했습니다");
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
            <span className="uxEyebrow cyan">인터랙티브 Agent 운영</span>
            <h1>Multi-Agent 실행 상태와 tool call 흐름을 운영 관점에서 추적합니다.</h1>
            <p>실제 Worker job과 D1 agent_traces를 기반으로 최신 실행 상태를 표시합니다.</p>
          </div>
          <aside className="uxSearchSummary">
            <h2>Agent Job 실행</h2>
            <label className="uxField">
              <span>검색어</span>
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </label>
            <div className="uxFieldGrid">
              <label className="uxField">
                <span>Provider</span>
                <select defaultValue="wos" disabled>
                  <option value="wos">Worker 설정 provider</option>
                </select>
              </label>
              <label className="uxField">
                <span>Pipeline</span>
                <select defaultValue="full" disabled>
                  <option value="full">전체 12단계 trace</option>
                </select>
              </label>
            </div>
            <button className="uxButton green" type="button" onClick={launchJob} disabled={running || !keyword.trim()}>
              {running ? <RefreshCw size={18} className="spin" /> : <Play size={18} />}
              Agent Job 실행
            </button>
            {activeJob ? <p className="uxTinyStatus">job_id: {activeJob.id}</p> : null}
            {traceError ? <p className="uxTinyError">{traceError}</p> : null}
          </aside>
        </div>
      </section>

      <section className="uxMetrics">
        <MetricTile label="Job" value={activeJob?.status ?? "Job 없음"} detail={activeJob?.currentStep ?? "불러오기 또는 실행"} tone={activeJob?.status === "failed" ? "amber" : "green"} />
        <MetricTile label="Trace 단계" value={String(traces.length)} detail={`${completedTraceCount} 완료/건너뜀`} tone="blue" />
        <MetricTile label="Agents" value={String(liveAgentCards.length)} detail="from D1 traces" tone="purple" />
        <MetricTile label="경고" value={String(traces.filter((trace) => trace.status === "skipped" || trace.status === "failed").length)} detail="건너뜀 또는 실패" tone="amber" />
        <MetricTile label="Enrichment" value={enrichmentOverview.limit} detail={`Crossref ${enrichmentOverview.crossrefProcessed}/skip ${enrichmentOverview.crossrefSkipped} · Unpaywall ${enrichmentOverview.unpaywallProcessed}/skip ${enrichmentOverview.unpaywallSkipped}`} tone="blue" />
        <MetricTile label="Storage" value={diagnostics?.env.r2Reports ? "R2 준비됨" : "대기 중"} detail={diagnostics?.env.googleDrive ? "Drive 준비됨" : "Drive 부분 연결"} tone={diagnostics?.env.r2Reports ? "green" : "amber"} />
        <MetricTile label="Critic Flags" value={String(criticFlags.length)} detail={`high ${criticSummary.high} · medium ${criticSummary.medium} · low ${criticSummary.low}`} tone={criticSummary.high ? "amber" : "green"} />
        <MetricTile label="산출물" value={String(outputs.length)} detail={outputs.length ? outputs.map((output) => output.outputType + ":" + output.status).join(" · ") : "metadata 없음"} tone="purple" />
        <MetricTile label="Runtime" value={diagnostics?.readiness.activeProviderReady ? "준비됨" : "확인 필요"} detail={diagnostics ? `${diagnostics.searchProvider} provider` : "diagnostics 로드 중"} tone={diagnostics?.readiness.activeProviderReady ? "green" : "amber"} />
      </section>

      <ImplementationStatusPanel
        title="Ops Route 구현 상태"
        description="운영 화면의 Agent board, pipeline, console은 최신 D1 agent_traces를 우선 사용하고 trace가 없을 때만 mock placeholder를 표시합니다."
        items={opsImplementationStatus}
      />

      <section className="uxGrid2">
        <div className="uxStack">
          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Multi-Agent 상태 보드</h2>
                <p>Agent card를 클릭하면 해당 agent의 trace summary가 console에 추가됩니다.</p>
              </div>
              <span className={`uxPill ${traces.length ? "green" : "amber"}`}>{traces.length ? "D1 trace 연결됨" : "Live trace 없음"}</span>
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
                <h2>Pipeline 실행</h2>
                <p>12단계 문헌검토 workflow의 운영 상태입니다.</p>
              </div>
              <span className={`uxPill ${traces.length ? "green" : "amber"}`}>{traces.length ? `${progress}%` : "Live trace 없음"}</span>
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
              <button className="uxSoftButton" type="button" onClick={() => setLogs([])}>지우기</button>
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
                <h2>Storage 및 Runtime</h2>
                <p>실제 /api/diagnostics 기준 D1, provider, Crossref, Unpaywall, R2, Drive 상태입니다.</p>
              </div>
              <button className="uxSoftButton" type="button" onClick={loadDiagnostics}><RefreshCw size={14} /></button>
            </div>
            {diagnosticsError ? <p className="uxTinyError">{diagnosticsError}</p> : null}
            <div className="uxSystemGrid">
              {diagnosticsItems.map((item) => (
                <button key={item.name} className="uxSystemItem" type="button" onClick={() => setLogs((current) => [...current, { level: item.tone === "amber" ? "warn" : "ok", message: `${item.name}.status checked: ${item.status} :: ${item.detail}` }])}>
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
              {output.urlPath ? <a href={apiUrl(output.urlPath)} target="_blank" rel="noreferrer">산출물 열기</a> : <small>Endpoint 예정</small>}
            </div>
            <span className={`uxPill ${output.status === "stored" || output.status === "generated" ? "green" : output.status === "failed" ? "amber" : "gray"}`}>{output.status}</span>
          </article>
        )) : <p className="uxEmptyNote">불러온 output metadata가 없습니다.</p>}
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
        )) : <p className="uxEmptyNote">이 job에 연결된 critic flag가 없습니다.</p>}
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
    limit: limit === "not set" ? "제한 없음" : `limit ${limit}`,
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

function extractMarkdownSection(markdown: string, headingPatterns: RegExp[]): string {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => headingPatterns.some((pattern) => pattern.test(line.trim())));
  if (start < 0) return "";
  const startLevel = (lines[start].match(/^#+/)?.[0].length ?? 2);
  const content: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = line.match(/^(#{1,6})\s+/);
    if (heading && heading[1].length <= startLevel) break;
    content.push(line);
  }
  return summarizeMarkdownText(content.join("\n"));
}

function summarizeMarkdownText(value: string): string {
  return value
    .replace(/\[[^\]]+\]\([^\)]+\)/g, (match) => match.replace(/\]\([^\)]+\)/, "" ).replace(/^\[/, ""))
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\|.*\|\s*$/gm, "")
    .replace(/^\s*[-:|]+\s*$/gm, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")
    .slice(0, 280);
}

function getDiagnosticsItems(diagnostics: DiagnosticsResponse | null) {
  if (!diagnostics) return systemStatuses;
  return [
    { name: "Cloudflare D1", status: diagnostics.db.bound ? "연결됨" : "누락", detail: diagnostics.db.missingColumns.length ? diagnostics.db.missingColumns.map((item) => item.table + "." + item.column).join(", ") : "schema 준비됨", tone: diagnostics.db.bound && diagnostics.db.missingColumns.length === 0 ? "green" as const : "amber" as const },
    { name: "Active Provider", status: diagnostics.searchProvider, detail: diagnostics.readiness.activeProviderReady ? "준비됨" : "준비 필요", tone: diagnostics.readiness.activeProviderReady ? "green" as const : "amber" as const },
    { name: "WoS API", status: diagnostics.env.wosApiKey ? "준비됨" : "누락", detail: diagnostics.env.wosApiKeySource ?? "WOS_API_KEY", tone: diagnostics.env.wosApiKey ? "green" as const : "amber" as const },
    { name: "Crossref", status: diagnostics.env.crossrefEmail ? "준비됨" : "누락", detail: "CROSSREF_EMAIL", tone: diagnostics.env.crossrefEmail ? "green" as const : "amber" as const },
    { name: "Unpaywall", status: diagnostics.env.unpaywallEmail ? "준비됨" : "누락", detail: "UNPAYWALL_EMAIL", tone: diagnostics.env.unpaywallEmail ? "green" as const : "amber" as const },
    { name: "Cloudflare R2", status: diagnostics.env.r2Reports ? "준비됨" : "누락", detail: "REPORTS binding", tone: diagnostics.env.r2Reports ? "green" as const : "amber" as const },
    { name: "Google Drive", status: diagnostics.env.googleDrive ? "준비됨" : "부분 연결", detail: "service-account 저장 경로", tone: diagnostics.env.googleDrive ? "green" as const : "amber" as const },
    { name: "OpenAlex Fallback", status: diagnostics.env.openAlexEmail ? "준비됨" : "부분 연결", detail: diagnostics.env.openAlexApiKey ? "email + api key" : "email만 있거나 누락", tone: diagnostics.env.openAlexEmail ? "blue" as const : "amber" as const }
  ];
}

function formatRate(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(4) : "-";
}

function formatPercent(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? (value * 100).toFixed(1) + "%" : "-";
}

function methodLabel(method: BenchmarkMethodKey): string {
  if (method === "rule_based") return "Rule-based";
  if (method === "single_llm") return "Single LLM";
  return "Proposed Multi-Agent";
}

function metricFinding(metric: string, values: Record<BenchmarkMethodKey, string>): string {
  if (metric === "Accepted Exceptions") return "자동 gold-audit 예외가 결과에 포함되는지 표시합니다.";
  if (values.single_llm !== "-" && values.proposed_agent !== "-" && values.single_llm > values.proposed_agent) return "Single-LLM baseline은 repository-grounded upper-bound 성격이므로 과대 해석을 피해야 합니다.";
  return "동일한 T001-T003 gold/control layer 기준 비교입니다.";
}

function buildComparisonRows(metrics: BenchmarkMetrics | null) {
  const byMethod = metrics?.comparison?.byMethod;
  if (!byMethod) return null;
  const methods: BenchmarkMethodKey[] = ["rule_based", "single_llm", "proposed_agent"];
  const rows = [
    { label: "Precision@5", key: "precision_at_5", format: formatRate },
    { label: "NDCG@5", key: "ndcg_at_5", format: formatRate },
    { label: "Gold DOI Hit@5", key: "gold_doi_hit_rate_at_5", format: formatRate },
    { label: "DOI Presence@5", key: "doi_presence_rate_at_5", format: formatPercent },
    { label: "Top Journal Precision", key: "top_journal_precision_at_5", format: formatPercent },
    { label: "Paper Validity", key: "paper_validity_rate_at_5", format: formatPercent },
    { label: "Accepted Exceptions", key: "accepted_exception_count", format: (value: number | undefined) => typeof value === "number" ? value.toFixed(0) : "-" }
  ].map((metric) => {
    const values = Object.fromEntries(methods.map((method) => {
      const methodMetric = byMethod[method]?.macroAverages[metric.key as keyof BenchmarkComparisonMethod["macroAverages"]];
      return [method, metric.format(methodMetric)];
    })) as Record<BenchmarkMethodKey, string>;
    return { metric: metric.label, ...values, finding: metricFinding(metric.label, values) };
  });
  return rows;
}

function buildAutoReviewRows(metrics: BenchmarkMetrics | null) {
  const byMethod = metrics?.autoReview?.byMethod;
  if (!byMethod) return [];
  return (["rule_based", "single_llm"] as const).map((method) => ({ method, label: methodLabel(method), data: byMethod[method] })).filter((item) => item.data);
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
  const benchmarkSourceLabel = benchmarkMetrics?.source === "static_snapshot" ? "정적 benchmark snapshot" : "Live benchmark metric";
  const benchmarkDescription = benchmarkMetrics?.source === "static_snapshot"
    ? "커밋된 T001-T003 benchmark snapshot입니다. Rule-based, Single-LLM, Proposed Agent 비교와 자동 baseline review를 포함합니다."
    : "실제 benchmark endpoint에서 반환된 metric 데이터입니다.";
  const comparisonRows = buildComparisonRows(benchmarkMetrics);
  const autoReviewRows = buildAutoReviewRows(benchmarkMetrics);

  useEffect(() => {
    void loadBenchmarkMetrics();
  }, []);

  async function loadBenchmarkMetrics() {
    setLoading(true);
    try {
      const response = await fetch(apiUrl("/api/benchmark-metrics"));
      if (!response.ok) throw new Error("benchmark metric을 불러오지 못했습니다");
      const data = (await response.json()) as BenchmarkMetrics;
      setBenchmarkMetrics(data);
      setMessage({
        title: data.source === "static_snapshot" ? "정적 벤치마크 스냅샷 확인됨" : "벤치마크 결과 확인됨",
        body: `${data.tasks}개 태스크, ${data.results}개 Proposed 결과물 기준입니다. ${data.note ?? "Endpoint에서 반환된 metric을 표시합니다."}`
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
        <span className="uxEyebrow">인터랙티브 평가 대시보드</span>
        <h1>Rule-based, Single-LLM, Proposed Multi-Agent의 성능과 자동 review 결과를 비교합니다.</h1>
        <p>Worker benchmark endpoint에서 최신 정적 스냅샷을 불러와 baseline comparison과 자동 review summary를 표시합니다.</p>
      </section>

      <section className="uxPanel uxScenarioPanel">
        <div className="uxPanelHead">
          <div>
            <h2>평가 시나리오</h2>
            <p>현재 연결된 benchmark snapshot은 T001-T003 기준입니다. broad/fast는 아직 planned 시나리오로 유지합니다.</p>
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
        <MetricTile label="DOI Accuracy" value={scenario.metrics.doiAccuracy} detail="Crossref 검증됨" tone="green" />
        <MetricTile label="Top Journal Precision" value={scenario.metrics.topJournalPrecision} detail="Q1 / pool 매칭" tone="blue" />
        <MetricTile label="Hallucination Rate" value={scenario.metrics.hallucinationRate} detail="critic 필터링" tone="amber" />
        <MetricTile label="Report Completeness" value={scenario.metrics.reportCompleteness} detail="rubric 점수" tone="purple" />
        <MetricTile label="Avg Latency" value={scenario.metrics.avgLatency} detail="전체 workflow" tone="blue" />
      </section>

      <ImplementationStatusPanel
        title="Evaluation Route 구현 상태"
        description={benchmarkMetrics ? benchmarkDescription : "평가 화면의 scenario 수치는 미완성 Mock입니다. 실제 데이터 연결 전입니다."}
        items={evaluationImplementationStatus}
      />

      <section className="uxGrid2">
        <div className="uxStack">
          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Baseline 평가 대시보드</h2>
                <p>{benchmarkMetrics ? `${benchmarkMetrics.tasks}개 태스크 기준 benchmark metric입니다.` : "미완성 Mock: baseline CSV와 proposed full-run 결과 연결 전입니다."}</p>
              </div>
              <span className={`uxPill ${benchmarkMetrics ? "blue" : "amber"}`}>{benchmarkMetrics ? benchmarkSourceLabel : "미완성 Mock"}</span>
            </div>
            <div className="uxTableWrap">
              <table className="uxTable">
                <thead>
                  <tr>
                    <th>지표</th>
                    <th>Rule-based</th>
                    <th>Single LLM</th>
                    <th>Proposed Multi-Agent</th>
                    <th>해석</th>
                  </tr>
                </thead>
                <tbody>
                  {(comparisonRows ?? scenario.rows.map((row) => ({
                    metric: row.metric,
                    rule_based: row.ruleBased,
                    single_llm: row.singleLlm,
                    proposed_agent: row.proposed,
                    finding: row.finding
                  }))).map((row) => (
                    <tr key={row.metric} onClick={() => setMessage({ title: row.metric, body: `${row.finding} ${benchmarkMetrics ? benchmarkDescription : "실제 비교는 benchmark endpoint 연결 후 확정됩니다."}` })}>
                      <td>{row.metric}</td>
                      <td><span className="uxPill amber">{row.rule_based}</span></td>
                      <td><span className="uxPill blue">{row.single_llm}</span></td>
                      <td><span className="uxPill green">{row.proposed_agent}</span></td>
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
                <h2>자동 Baseline Review</h2>
                <p>{benchmarkMetrics?.autoReview ? benchmarkMetrics.autoReview.policy : "자동 review summary를 기다리는 중입니다."}</p>
              </div>
              <span className={`uxPill ${autoReviewRows.length ? "green" : "amber"}`}>{autoReviewRows.length ? `${benchmarkMetrics?.autoReview?.rowCount ?? 0} rows` : "데이터 없음"}</span>
            </div>
            <div className="uxPreviewGrid">
              {autoReviewRows.map((item) => (
                <button key={item.method} className="uxMiniCard" type="button" onClick={() => setMessage({ title: item.label, body: `include ${item.data?.includeCount ?? 0}, review_by_rule ${item.data?.reviewByRuleCount ?? 0}, reject ${item.data?.rejectCount ?? 0}. Failure types: ${Object.entries(item.data?.failureTypes ?? {}).map(([key, value]) => key + " " + value).join(", ")}` })}>
                  <h3>{item.label}</h3>
                  <p>include {item.data?.includeCount ?? 0} · review_by_rule {item.data?.reviewByRuleCount ?? 0} · reject {item.data?.rejectCount ?? 0}</p>
                  <small>평균 relevance {item.data?.averageAutoRelevance.toFixed(4)} · matched gold {(item.data?.matchedGoldIds ?? []).join(", ") || "없음"}</small>
                </button>
              ))}
            </div>
          </section>
          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>Auto Review Rows</h2>
                <p>{benchmarkMetrics?.autoReview?.rows ? `${benchmarkMetrics.autoReview.rows.length}개 자동 판정 row입니다.` : "row-level 자동 review 데이터를 기다리는 중입니다."}</p>
              </div>
              <span className={`uxPill ${benchmarkMetrics?.autoReview?.rows?.length ? "green" : "amber"}`}>row-level</span>
            </div>
            <div className="uxTableWrap">
              <table className="uxTable">
                <thead>
                  <tr>
                    <th>방식</th>
                    <th>Task</th>
                    <th>순위</th>
                    <th>판정</th>
                    <th>Rel.</th>
                    <th>실패 유형</th>
                    <th>매칭 Gold</th>
                    <th>제목</th>
                  </tr>
                </thead>
                <tbody>
                  {(benchmarkMetrics?.autoReview?.rows ?? []).map((row) => (
                    <tr key={`${row.method}-${row.taskId}-${row.rank}`} onClick={() => setMessage({ title: row.title, body: `${methodLabel(row.method)} ${row.taskId} rank ${row.rank}: ${row.decision}, relevance ${row.relevance}, failure ${row.failureType || "없음"}, DOI ${row.doi}` })}>
                      <td>{methodLabel(row.method)}</td>
                      <td>{row.taskId}</td>
                      <td>{row.rank}</td>
                      <td><span className={`uxPill ${row.decision === "include" ? "green" : row.decision === "reject" ? "amber" : "blue"}`}>{row.decision}</span></td>
                      <td>{row.relevance}</td>
                      <td>{row.failureType || "없음"}</td>
                      <td>{row.matchedGoldId || "-"}</td>
                      <td>{row.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>평가 Rubric</h2>
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
                <span>전체 품질</span>
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

          <CriticReviewPanel title="오류 분석" description="클릭하면 presentation message에 개선 방향이 표시됩니다." onSelect={(item) => setMessage({ title: item.title, body: item.note })} />

          <section className="uxPanel">
            <div className="uxPanelHead">
              <div>
                <h2>발표 메시지</h2>
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
