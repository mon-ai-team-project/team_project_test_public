import {
  calculateFinalScore,
  getBusinessSchoolJournalCategory,
  isBusinessSchoolJournal,
  normalizeJournalName,
  type PaperSummary
} from "@paper-agent/shared";
import { type PaperRecord, type EvaluationScores } from "./types";

export type SubtopicRule = {
  label: string;
  keywordTerms: string[];
  requiredGroups: string[][];
};

export const SUBTOPIC_RULES: SubtopicRule[] = [
  {
    label: "AI interview employer branding",
    keywordTerms: ["interview", "employer", "branding"],
    requiredGroups: [
      ["ai", "artificial intelligence", "algorithmic", "automated", "machine learning"],
      ["interview", "hiring", "selection", "recruitment"],
      ["employer branding", "employer brand", "organizational attractiveness", "applicant attraction", "attractiveness"],
      ["applicant", "candidate", "job seeker", "justice", "fairness", "reaction", "perception"]
    ]
  },
  {
    label: "AI recruitment applicant reaction",
    keywordTerms: ["recruitment", "applicant", "reaction"],
    requiredGroups: [
      ["ai", "artificial intelligence", "algorithmic", "automated", "machine learning"],
      ["recruitment", "hiring", "selection"],
      ["applicant", "candidate", "job seeker"],
      ["reaction", "fairness", "justice", "perception", "organizational attractiveness", "attractiveness"]
    ]
  },
  {
    label: "generative AI advertising effectiveness",
    keywordTerms: ["generative", "advertising"],
    requiredGroups: [
      ["generative", "generated", "generation", "llm", "large language model", "artificial intelligence", "ai"],
      ["advertising", "advertisement", "advertisements", "ad", "ads", "video advertisement"],
      ["effectiveness", "persuasion", "response", "trust", "brand", "consumer", "click", "conversion"]
    ]
  }
];

export function scorePaper(input: { keyword: string; title: string; abstract: string; citedByCount: number; year: number }) {
  const titleScore = keywordOverlap(input.keyword, input.title);
  const abstractScore = keywordOverlap(input.keyword, input.abstract);
  const baseRelevanceScore = scoreRelevance(titleScore, abstractScore);
  const subtopicFit = scoreSubtopicFit(input.keyword, input.title, input.abstract);
  const relevanceScore = baseRelevanceScore * (0.45 + 0.55 * subtopicFit.score);
  const citationScore = Math.min(input.citedByCount / 100, 1);
  const recencyScore = scoreRecency(input.year);
  const finalScore = calculateFinalScore({
    relevance: relevanceScore,
    journalFit: 0.5,
    verification: 0,
    openAccess: 0,
    citation: citationScore,
    recency: recencyScore
  });
  const reason = [
    `title keyword overlap ${titleScore.toFixed(2)}`,
    `abstract keyword overlap ${abstractScore.toFixed(2)}`,
    `subtopic fit ${subtopicFit.score.toFixed(2)}${subtopicFit.rule ? ` (${subtopicFit.rule})` : ""}`,
    `combined relevance ${relevanceScore.toFixed(2)}`,
    `citations ${input.citedByCount}`,
    `year ${input.year || "unknown"}`
  ].join("; ");
  return {
    abstractScore: roundScore(abstractScore),
    relevanceScore: roundScore(relevanceScore),
    finalScore: roundScore(finalScore),
    reason
  };
}

export function scoreRelevance(titleScore: number, abstractScore: number): number {
  return Math.max(titleScore, 0.7 * abstractScore + 0.3 * titleScore);
}

export function scoreSubtopicFit(keyword: string, title: string, abstract: string): { score: number; rule: string | null } {
  const keywordText = normalizeSearchText(keyword);
  const rule = SUBTOPIC_RULES.find((candidate) => candidate.keywordTerms.every((term) => keywordText.includes(term)));
  if (!rule) return { score: 1, rule: null };

  const titleText = normalizeSearchText(title);
  const fullText = normalizeSearchText([title, abstract].join(" "));
  const matchedGroups = rule.requiredGroups.filter((group) => group.some((term) => containsSearchTerm(fullText, term))).length;
  const titleMatchedGroups = rule.requiredGroups.filter((group) => group.some((term) => containsSearchTerm(titleText, term))).length;
  const coverageScore = matchedGroups / rule.requiredGroups.length;
  const titleCoverageScore = titleMatchedGroups / rule.requiredGroups.length;
  return {
    score: Math.max(0.15, 0.75 * coverageScore + 0.25 * titleCoverageScore),
    rule: rule.label
  };
}

export function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").replace(/\s+/g, " ").trim();
}

export function containsSearchTerm(text: string, term: string): boolean {
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedTerm) return false;
  if (normalizedTerm.length <= 3 && !normalizedTerm.includes(" ")) {
    return new RegExp("(^| )" + escapeRegExp(normalizedTerm) + "( |$)").test(text);
  }
  return text.includes(normalizedTerm);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function keywordOverlap(keyword: string, text: string): number {
  const keywordTerms = tokenize(keyword).filter((term) => !isWeakSearchToken(term));
  if (!keywordTerms.length) return 0;
  const textTerms = new Set(expandTokenSet(tokenize(text)));
  const matches = expandTokenSet(keywordTerms).filter((term) => textTerms.has(term)).length;
  return matches / expandTokenSet(keywordTerms).length;
}

export function expandTokenSet(terms: string[]): string[] {
  const expanded = new Set(terms);
  if (terms.includes("ai")) {
    expanded.add("artificial");
    expanded.add("intelligence");
  }
  if (terms.includes("artificial") && terms.includes("intelligence")) expanded.add("ai");
  return Array.from(expanded);
}

export function tokenize(value: string): string[] {
  return Array.from(new Set(value.toLowerCase().match(/[a-z0-9가-힣]+/g) ?? [])).filter((term) => term.length > 1);
}

export function isWeakSearchToken(token: string): boolean {
  return new Set(["and", "or", "the", "for", "with", "from", "into", "using", "study", "effect", "effects"]).has(token);
}

export function scoreRecency(year: number): number {
  if (!year) return 0;
  const currentYear = new Date().getUTCFullYear();
  return Math.max(0, Math.min(1, 1 - (currentYear - year) / 10));
}

export function calculateEvaluationScores(paper: PaperSummary): EvaluationScores {
  return {
    relevanceScore: roundScore(paper.relevanceScore ?? paper.abstractScore),
    journalFitScore: 1,
    verificationScore: roundScore(paper.verificationStatus === "verified" ? 1 : paper.verificationStatus === "partial" ? 0.5 : 0),
    oaScore: roundScore(paper.oaPdfUrl ? 1 : paper.oaLandingPageUrl || paper.oaStatus === "oa" ? 0.75 : paper.unpaywallStatus === "not_found" ? 0 : 0.25),
    citationScore: roundScore(Math.min((paper.citedByCount ?? 0) / 100, 1)),
    recencyScore: roundScore(scoreRecency(paper.year))
  };
}

export function rankPapers(papers: PaperRecord[], semanticScores?: Record<string, number>): PaperRecord[] {
  return papers
    .map((paper) => {
      const scores = calculateEvaluationScores(paper);
      const semanticScore = semanticScores?.[paper.id] ?? 0;
      
      // If we have a semantic score, it should heavily influence the relevance component
      const finalRelevance = semanticScore > 0 
        ? roundScore(0.4 * scores.relevanceScore + 0.6 * semanticScore)
        : scores.relevanceScore;

      const finalScore = roundScore(
        calculateFinalScore({
          relevance: finalRelevance,
          journalFit: scores.journalFitScore,
          verification: scores.verificationScore,
          openAccess: scores.oaScore,
          citation: scores.citationScore,
          recency: scores.recencyScore
        })
      );
      return {
        ...paper,
        finalScore,
        relevanceScore: finalRelevance,
        includeStatus: getIncludeStatus(finalScore, scores.verificationScore)
      };
    })
    .sort((left, right) => right.finalScore - left.finalScore || right.year - left.year || (right.citedByCount ?? 0) - (left.citedByCount ?? 0))
    .map((paper, index) => ({ ...paper, rank: index + 1 }));
}

export function getIncludeStatus(finalScore: number, verificationScore: number): PaperSummary["includeStatus"] {
  if (finalScore >= 0.72 && verificationScore >= 0.5) return "include";
  if (finalScore < 0.35) return "exclude";
  return "review";
}

export function filterAllowedBusinessSchoolJournals(papers: PaperRecord[], journalCategoryId?: string): PaperRecord[] {
  return papers
    .filter((paper) => isAllowedBusinessSchoolJournal(paper, journalCategoryId))
    .map((paper, index) => ({ ...paper, rank: index + 1 }));
}

export function isAllowedBusinessSchoolJournal(paper: PaperRecord, journalCategoryId?: string): boolean {
  const sourceNames = [paper.journalName, paper.crossrefJournalName].filter(Boolean);
  const category = getBusinessSchoolJournalCategory(journalCategoryId);
  if (category) {
    const categoryJournalSet = new Set([...category.internationalS, ...category.internationalA1, ...category.domesticA].map(normalizeJournalName));
    return sourceNames.some((sourceName) => isCategoryJournalMatch(sourceName, categoryJournalSet));
  }
  return sourceNames.some((sourceName) => isBusinessSchoolJournal(sourceName) || isCloseJournalNameMatch(sourceName));
}

function isCategoryJournalMatch(sourceName: string, categoryJournalSet: Set<string>): boolean {
  const normalized = normalizeJournalName(sourceName);
  return categoryJournalSet.has(normalized) || (normalized.endsWith("s") && categoryJournalSet.has(normalized.slice(0, -1)));
}

function isCloseJournalNameMatch(sourceName: string): boolean {
  const normalized = normalizeJournalName(sourceName);
  return normalized.endsWith("s") && isBusinessSchoolJournal(normalized.slice(0, -1));
}

export function roundScore(score: number): number {
  return Math.round(score * 1000) / 1000;
}
