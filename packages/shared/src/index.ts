export {
  BUSINESS_SCHOOL_JOURNALS,
  BUSINESS_SCHOOL_JOURNAL_CATEGORIES,
  BUSINESS_SCHOOL_JOURNAL_CATEGORY_OPTIONS,
  getBusinessSchoolJournalCategory,
  getBusinessSchoolJournalMatch,
  getPriorityInternationalJournals,
  isBusinessSchoolJournal,
  normalizeJournalName,
  type BusinessSchoolJournalCategory,
  type BusinessSchoolJournalMatch,
  type BusinessSchoolJournalRank
} from "./businessSchoolJournals";

export type SearchJobStatus =
  | "queued"
  | "searching"
  | "enriching_metadata"
  | "checking_oa"
  | "scoring"
  | "ranking"
  | "generating_report"
  | "completed"
  | "failed";

export type SearchJob = {
  id: string;
  keyword: string;
  status: SearchJobStatus;
  currentStep: string;
  totalSteps: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  sourceResultCount?: number;
  allowedResultCount?: number;
};

export type AgentTraceStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export type AgentTrace = {
  id: string;
  jobId: string;
  stepOrder: number;
  stepId: string;
  agentName: string;
  status: AgentTraceStatus;
  summary: string;
  detail?: string;
  inputCount?: number;
  outputCount?: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
};

export type PaperSummary = {
  id: string;
  rank: number;
  title: string;
  authors: string;
  year: number;
  journalName: string;
  journalField?: string;
  journalRank?: string;
  doi: string;
  oaStatus: "oa" | "closed" | "unknown";
  citedByCount?: number;
  publisher?: string;
  issn?: string;
  publicationType?: string;
  publishedDate?: string;
  verificationStatus?: "verified" | "partial" | "unverified";
  verificationReason?: string;
  oaPdfUrl?: string;
  oaLandingPageUrl?: string;
  oaLicense?: string;
  oaHostType?: string;
  oaRepository?: string;
  unpaywallStatus?: "found" | "not_found" | "skipped" | "failed";
  unpaywallReason?: string;
  driveFileId?: string;
  driveWebUrl?: string;
  driveStatus?: "uploaded" | "skipped" | "failed";
  driveReason?: string;
  relevanceScore?: number;
  journalFitScore?: number;
  verificationScore?: number;
  oaScore?: number;
  citationScore?: number;
  recencyScore?: number;
  abstractScore: number;
  finalScore: number;
  includeStatus: "include" | "exclude" | "review";
  relevanceReason: string;
};

export type ScoreInput = {
  relevance: number;
  journalFit: number;
  verification: number;
  openAccess: number;
  citation: number;
  recency: number;
};

export const SCORE_WEIGHTS = {
  relevance: 0.35,
  journalFit: 0.2,
  verification: 0.15,
  openAccess: 0.1,
  citation: 0.1,
  recency: 0.1
} as const;

export function calculateFinalScore(input: ScoreInput): number {
  return (
    SCORE_WEIGHTS.relevance * input.relevance +
    SCORE_WEIGHTS.journalFit * input.journalFit +
    SCORE_WEIGHTS.verification * input.verification +
    SCORE_WEIGHTS.openAccess * input.openAccess +
    SCORE_WEIGHTS.citation * input.citation +
    SCORE_WEIGHTS.recency * input.recency
  );
}
