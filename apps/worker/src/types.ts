import { type PaperSummary } from "@paper-agent/shared";

export type SearchProvider = "wos" | "openalex";

export type PaperRecord = PaperSummary & {
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
  driveFileId: string;
  driveWebUrl: string;
  driveStatus: "uploaded" | "skipped" | "failed";
  driveReason: string;
};

export type EvaluationScores = {
  relevanceScore: number;
  journalFitScore: number;
  verificationScore: number;
  oaScore: number;
  citationScore: number;
  recencyScore: number;
};
