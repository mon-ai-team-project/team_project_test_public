import {
  BUSINESS_SCHOOL_JOURNALS,
  getBusinessSchoolJournalCategory,
  normalizeJournalName
} from "@paper-agent/shared";
import { type PaperRecord } from "./types";
import { scorePaper, isWeakSearchToken, tokenize } from "./scoring";
import { sleep, normalizeDoi } from "./utils";

export type WosStarterResponse = {
  documents?: WosDocument[];
  hits?: WosDocument[];
};

export type WosDocument = {
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

export type OpenAlexResponse = {
  results?: OpenAlexWork[];
};

export type OpenAlexWork = {
  id?: string;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  publication_date?: string | null;
  authorships?: Array<{
    author?: {
      display_name?: string | null;
    };
  }>;
  primary_location?: {
    source?: {
      display_name?: string | null;
    } | null;
  } | null;
  host_venue?: {
    display_name?: string | null;
  } | null;
  open_access?: {
    is_oa?: boolean;
    oa_status?: string | null;
  } | null;
  cited_by_count?: number | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  type?: string | null;
};

const WOS_REQUEST_DELAY_MS = 1100;
const WOS_PRIORITY_SOURCE_TITLES = [
  "Journal of Business Research",
  "Journal of Business Ethics",
  "Journal of Marketing",
  "Journal of Marketing Research",
  "Journal of the Academy of Marketing Science",
  "Information Systems Research",
  "MIS Quarterly",
  "Journal of Management",
  "Academy of Management Journal",
  "Strategic Management Journal",
  "Human Resource Management",
  "Journal of Applied Psychology",
  "Personnel Psychology",
  "Organization Science",
  "Management Science"
] as const;

export async function searchWebOfScience(
  keyword: string,
  options: {
    wosApiKey?: string;
    maxResults: number;
    yearStart?: number;
    yearEnd?: number;
    journalCategoryId?: string;
  }
): Promise<PaperRecord[]> {
  if (!options.wosApiKey) {
    throw new Error("Web of Science API key is not configured. Add WOS_API_KEY in Cloudflare Worker variables/secrets, then redeploy.");
  }

  const candidateLimit = Math.min(50, Math.max(options.maxResults, options.maxResults * 5));
  const queries = buildWosSearchQueries(keyword, options.yearStart, options.yearEnd, options.journalCategoryId);
  const documents: WosDocument[] = [];
  const seen = new Set<string>();
  let lastError: unknown = null;

  for (const [index, query] of queries.entries()) {
    if (index > 0) await sleep(WOS_REQUEST_DELAY_MS);
    try {
      const page = await fetchWosDocuments(query, candidateLimit, options.wosApiKey);
      for (const document of page) {
        const key = getWosDocumentKey(document);
        if (seen.has(key)) continue;
        seen.add(key);
        documents.push(document);
      }
    } catch (error) {
      lastError = error;
      if (index === 0) throw error;
    }
    if (documents.length >= candidateLimit) break;
  }

  if (!documents.length && lastError) throw lastError;
  return documents.slice(0, candidateLimit).map((document, index) => mapWosDocument(document, keyword, index + 1));
}

async function fetchWosDocuments(query: string, limit: number, apiKey: string): Promise<WosDocument[]> {
  const url = new URL("https://api.clarivate.com/apis/wos-starter/v1/documents");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", "1");
  url.searchParams.set("db", "WOS");
  url.searchParams.set("sortField", "TC+D");

  const response = await fetchWosWithRetry(url, apiKey);
  const data = (await response.json()) as WosStarterResponse;
  return data.hits ?? data.documents ?? [];
}

export async function searchOpenAlex(
  keyword: string,
  options: {
    openAlexEmail?: string;
    openAlexApiKey?: string;
    maxResults: number;
    yearStart?: number;
    yearEnd?: number;
  }
): Promise<PaperRecord[]> {
  if (!options.openAlexEmail) {
    throw new Error("OpenAlex email is not configured. Add OPENALEX_EMAIL in Cloudflare Worker variables/secrets for temporary OpenAlex testing.");
  }

  const url = new URL("https://api.openalex.org/works");
  const candidateLimit = Math.min(100, Math.max(options.maxResults, options.maxResults * 5));
  url.searchParams.set("search", keyword);
  url.searchParams.set("per-page", String(candidateLimit));
  url.searchParams.set("page", "1");
  url.searchParams.set("sort", "cited_by_count:desc");
  url.searchParams.set("mailto", options.openAlexEmail);
  url.searchParams.set(
    "select",
    [
      "id",
      "doi",
      "title",
      "display_name",
      "publication_year",
      "publication_date",
      "authorships",
      "primary_location",
      "open_access",
      "cited_by_count",
      "abstract_inverted_index",
      "type"
    ].join(",")
  );
  const filters = buildOpenAlexFilters(options.yearStart, options.yearEnd);
  if (filters) url.searchParams.set("filter", filters);
  if (options.openAlexApiKey) url.searchParams.set("api_key", options.openAlexApiKey);

  const response = await fetchOpenAlexWithRetry(url, options.openAlexEmail);
  const data = (await response.json()) as OpenAlexResponse;
  return (data.results ?? []).slice(0, candidateLimit).map((work, index) => mapOpenAlexWork(work, keyword, index + 1));
}

function buildOpenAlexFilters(yearStart: number | undefined, yearEnd: number | undefined): string {
  const filters: string[] = [];
  if (yearStart) filters.push(`from_publication_date:${Math.trunc(yearStart)}-01-01`);
  if (yearEnd) filters.push(`to_publication_date:${Math.trunc(yearEnd)}-12-31`);
  return filters.join(",");
}

async function fetchOpenAlexWithRetry(url: URL, email: string): Promise<Response> {
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

  if (lastResponse?.status === 429) {
    throw new Error("OpenAlex rate limit reached (429). Wait for the quota window to reset or reduce search frequency.");
  }
  throw new Error(`OpenAlex request failed with ${lastResponse?.status ?? "unknown status"}`);
}

function buildWosQuery(keyword: string, yearStart: number | undefined, yearEnd: number | undefined): string {
  const terms = [`TS=(${escapeWosQuery(keyword)})`];
  const start = yearStart ? Math.trunc(yearStart) : null;
  const end = yearEnd ? Math.trunc(yearEnd) : null;
  if (start && end) terms.push(buildWosYearQuery(start, end));
  else if (start) terms.push(buildWosYearQuery(start, new Date().getUTCFullYear()));
  else if (end) terms.push(`PY=(1900-${end})`);
  return terms.join(" AND ");
}

function buildWosSearchQueries(keyword: string, yearStart: number | undefined, yearEnd: number | undefined, journalCategoryId?: string): string[] {
  const variants = buildKeywordVariants(keyword);
  const queries = new Set<string>();

  const category = getBusinessSchoolJournalCategory(journalCategoryId);
  if (category) {
    const sSourceQuery = buildWosSourceTitleQuery(category.internationalS);
    const a1SourceQuery = buildWosSourceTitleQuery(category.internationalA1);
    for (const sourceQuery of [sSourceQuery, a1SourceQuery]) {
      if (!sourceQuery) continue;
      for (const variant of variants.slice(0, 2)) {
        queries.add([buildWosQuery(variant, yearStart, yearEnd), sourceQuery].join(" AND "));
      }
    }
    queries.add(buildWosQuery(variants[0] ?? keyword, yearStart, yearEnd));
    return Array.from(queries).slice(0, 5);
  }

  const sourceQuery = buildWosSourceTitleQuery(WOS_PRIORITY_SOURCE_TITLES);
  for (const variant of variants.slice(0, 2)) {
    if (sourceQuery) queries.add([buildWosQuery(variant, yearStart, yearEnd), sourceQuery].join(" AND "));
  }
  for (const variant of variants) {
    queries.add(buildWosQuery(variant, yearStart, yearEnd));
  }
  return Array.from(queries).slice(0, 4);
}

function buildKeywordVariants(keyword: string): string[] {
  const normalized = escapeWosQuery(keyword);
  const tokens = tokenize(normalized).filter((token) => !isWeakSearchToken(token));
  const variants = new Set<string>();
  if (normalized) variants.add(normalized);

  const phrasePairs = extractKeywordPhrases(tokens);
  for (const phrase of phrasePairs) variants.add(phrase);

  if (tokens.includes("ai")) variants.add(tokens.map((token) => (token === "ai" ? "artificial intelligence" : token)).join(" "));
  if (tokens.includes("interview")) variants.add("algorithmic hiring OR digital interview OR AI interview");
  if (tokens.includes("branding")) variants.add("employer branding OR organizational attractiveness OR recruitment branding");
  if (tokens.includes("employer")) variants.add("employer branding OR recruitment");

  return Array.from(variants).filter(Boolean).slice(0, 6);
}

function extractKeywordPhrases(tokens: string[]): string[] {
  const phrases: string[] = [];
  for (let index = 0; index < tokens.length - 1; index++) {
    phrases.push(`${tokens[index]} ${tokens[index + 1]}`);
  }
  if (tokens.length >= 3) phrases.push(tokens.slice(0, 3).join(" "));
  return phrases;
}

function buildWosSourceTitleQuery(sourceTitles: readonly string[]): string {
  const allowlistedTitles: readonly string[] = BUSINESS_SCHOOL_JOURNALS;
  const allowedSources = sourceTitles.filter((title) => allowlistedTitles.includes(title));
  if (!allowedSources.length) return "";
  return `SO=(${allowedSources.map((title) => `"${escapeWosPhrase(title)}"`).join(" OR ")})`;
}

function buildWosYearQuery(start: number, end: number): string {
  const normalizedStart = Math.min(start, end);
  const normalizedEnd = Math.max(start, end);
  const years = Array.from({ length: normalizedEnd - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  if (years.length <= 25) return `PY=(${years.join(" OR ")})`;
  return `PY=(${normalizedStart}-${normalizedEnd})`;
}

function escapeWosQuery(value: string): string {
  return value.replace(/[()"']/g, " ").replace(/\s+/g, " ").trim();
}

function escapeWosPhrase(value: string): string {
  return value.replace(/["']/g, " ").replace(/\s+/g, " ").trim();
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

  if (lastResponse?.status === 400) {
    throw new Error("Web of Science request failed with 400. Check query syntax and ensure request limit is within the WoS Starter API 1-50 range.");
  }

  throw new Error(`Web of Science request failed with ${lastResponse?.status ?? "unknown status"}`);
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
    relevanceScore: scores.relevanceScore,
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
    unpaywallReason: doi ? "Unpaywall lookup pending." : "No DOI available for Unpaywall lookup.",
    driveFileId: "",
    driveWebUrl: "",
    driveStatus: "skipped",
    driveReason: "Google Drive upload pending."
  };
}

function mapOpenAlexWork(work: OpenAlexWork, keyword: string, rank: number): PaperRecord {
  const abstract = getOpenAlexAbstract(work);
  const title = work.title ?? work.display_name ?? "Untitled work";
  const authors = getOpenAlexAuthors(work);
  const year = work.publication_year ?? 0;
  const citedByCount = work.cited_by_count ?? 0;
  const scores = scorePaper({ keyword, title, abstract, citedByCount, year });
  const doi = normalizeDoi(work.doi);
  const isOpenAccess = Boolean(work.open_access?.is_oa);
  return {
    id: work.id ?? `openalex-${rank}`,
    rank,
    title,
    authors,
    year,
    journalName: getOpenAlexJournalName(work),
    doi,
    oaStatus: isOpenAccess ? "oa" : "unknown",
    abstractScore: scores.abstractScore,
    relevanceScore: scores.relevanceScore,
    finalScore: scores.finalScore,
    includeStatus: scores.finalScore >= 0.35 ? "include" : "review",
    relevanceReason: scores.reason,
    openalexId: work.id ?? "",
    abstract,
    citedByCount,
    crossrefId: "",
    publisher: "",
    issn: "",
    publicationType: work.type ?? "",
    publishedDate: work.publication_date ?? "",
    verificationStatus: doi ? "unverified" : "partial",
    verificationReason: doi ? "Crossref verification pending." : "No DOI available for Crossref verification.",
    crossrefJournalName: "",
    oaPdfUrl: "",
    oaLandingPageUrl: "",
    oaLicense: "",
    oaHostType: "",
    oaRepository: "",
    unpaywallStatus: doi ? "skipped" : "not_found",
    unpaywallReason: doi ? "Unpaywall lookup pending." : "No DOI available for Unpaywall lookup.",
    driveFileId: "",
    driveWebUrl: "",
    driveStatus: "skipped",
    driveReason: "Google Drive upload pending."
  };
}

function getOpenAlexAuthors(work: OpenAlexWork): string {
  const authors = (work.authorships ?? [])
    .map((authorship) => authorship.author?.display_name)
    .filter((name): name is string => Boolean(name));
  return authors.slice(0, 5).join(", ") || "Unknown authors";
}

function getOpenAlexJournalName(work: OpenAlexWork): string {
  return work.primary_location?.source?.display_name ?? "Unknown source";
}

function getOpenAlexAbstract(work: OpenAlexWork): string {
  const index = work.abstract_inverted_index;
  if (!index) return "";
  const terms = Object.entries(index).flatMap(([term, positions]) => positions.map((position) => ({ term, position })));
  return terms
    .sort((left, right) => left.position - right.position)
    .map((item) => item.term)
    .join(" ");
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

function getWosDocumentKey(document: WosDocument): string {
  const doi = getWosDoi(document);
  if (doi) return `doi:${doi.toLowerCase()}`;
  if (document.uid) return `uid:${document.uid}`;
  return `title:${normalizeJournalName(getWosTitle(document))}:${getWosYear(document)}`;
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
