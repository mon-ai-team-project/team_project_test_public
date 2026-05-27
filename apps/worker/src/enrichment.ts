import { type PaperRecord } from "./types";
import { sleep, normalizeDoi, getErrorMessage } from "./utils";

export type CrossrefResponse = {
  message?: CrossrefWork;
};

export type CrossrefWork = {
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

export type UnpaywallResponse = {
  is_oa?: boolean;
  oa_status?: string;
  best_oa_location?: UnpaywallLocation | null;
};

export type UnpaywallLocation = {
  url_for_pdf?: string | null;
  url_for_landing_page?: string | null;
  license?: string | null;
  host_type?: string | null;
  repository_institution?: string | null;
};

export type GoogleDriveConfig = {
  clientEmail?: string;
  privateKey?: string;
  folderId?: string;
};

export type GoogleDriveUploadResponse = {
  id?: string;
  webViewLink?: string;
};

export async function enrichPapersWithCrossref(papers: PaperRecord[], email: string | undefined, limit: number): Promise<PaperRecord[]> {
  const enriched: PaperRecord[] = [];
  for (const [index, paper] of papers.entries()) {
    if (index >= limit) {
      enriched.push({
        ...paper,
        verificationStatus: "partial",
        verificationReason: `Enrichment limit ${limit} reached; Crossref lookup skipped to stay within Worker subrequest limits.`
      });
      continue;
    }
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

export async function enrichPapersWithUnpaywall(papers: PaperRecord[], email: string | undefined, limit: number): Promise<PaperRecord[]> {
  const enriched: PaperRecord[] = [];
  for (const [index, paper] of papers.entries()) {
    if (index >= limit) {
      enriched.push({
        ...paper,
        unpaywallStatus: "skipped",
        unpaywallReason: `Enrichment limit ${limit} reached; Unpaywall lookup skipped to stay within Worker subrequest limits.`
      });
      continue;
    }
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
  const normalizedDoi = normalizeDoi(doi).trim();
  const normalizedEmail = email.trim();
  const url = new URL(`https://api.unpaywall.org/v2/${encodeURIComponent(normalizedDoi)}`);
  url.searchParams.set("email", normalizedEmail);
  const response = await fetchUnpaywallWithRetry(url, normalizedEmail);
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

export async function uploadOpenAccessPdfsToDrive(papers: PaperRecord[], config: GoogleDriveConfig): Promise<PaperRecord[]> {
  const configured = Boolean(config.clientEmail?.trim() && config.privateKey?.trim() && config.folderId?.trim());
  if (!configured) {
    return papers.map((paper) => ({
      ...paper,
      driveStatus: paper.oaPdfUrl ? "skipped" : paper.driveStatus,
      driveReason: paper.oaPdfUrl ? "Google Drive service account variables are not fully configured." : paper.driveReason
    }));
  }

  let accessToken = "";
  const enriched: PaperRecord[] = [];
  for (const paper of papers) {
    if (!paper.oaPdfUrl) {
      enriched.push({ ...paper, driveStatus: "skipped", driveReason: "No OA PDF URL available for Drive upload." });
      continue;
    }
    try {
      accessToken ||= await getGoogleDriveAccessToken(config.clientEmail ?? "", config.privateKey ?? "");
      const uploaded = await uploadPdfUrlToGoogleDrive(paper, accessToken, config.folderId ?? "");
      enriched.push({
        ...paper,
        driveFileId: uploaded.id ?? "",
        driveWebUrl: uploaded.webViewLink ?? (uploaded.id ? `https://drive.google.com/file/d/${uploaded.id}/view` : ""),
        driveStatus: "uploaded",
        driveReason: "Uploaded OA PDF to configured Google Drive folder."
      });
    } catch (error) {
      enriched.push({
        ...paper,
        driveStatus: "failed",
        driveReason: `Google Drive upload failed: ${getErrorMessage(error)}`
      });
    }
  }
  return enriched;
}

async function uploadPdfUrlToGoogleDrive(paper: PaperRecord, accessToken: string, folderId: string): Promise<GoogleDriveUploadResponse> {
  const pdfResponse = await fetch(paper.oaPdfUrl, { headers: { Accept: "application/pdf,*/*" } });
  if (!pdfResponse.ok) throw new Error(`PDF download failed with ${pdfResponse.status}`);
  const pdfBuffer = await pdfResponse.arrayBuffer();
  const boundary = `paper-agent-${crypto.randomUUID()}`;
  const metadata = {
    name: `${sanitizeFileName(paper.title || paper.doi || paper.id)}.pdf`,
    parents: [folderId],
    description: `Paper Agent OA PDF archive for DOI ${paper.doi || "unknown"}`
  };
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
    pdfBuffer,
    `\r\n--${boundary}--\r\n`
  ]);
  const uploadResponse = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body
  });
  if (!uploadResponse.ok) throw new Error(`Drive upload failed with ${uploadResponse.status}: ${await uploadResponse.text()}`);
  return (await uploadResponse.json()) as GoogleDriveUploadResponse;
}

async function getGoogleDriveAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail.trim(),
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };
  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claim))}`;
  const key = await importGooglePrivateKey(privateKey);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsignedJwt));
  const jwt = `${unsignedJwt}.${base64UrlEncode(signature)}`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt })
  });
  if (!tokenResponse.ok) throw new Error(`Google token request failed with ${tokenResponse.status}: ${await tokenResponse.text()}`);
  const data = (await tokenResponse.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google token response did not include access_token.");
  return data.access_token;
}

async function importGooglePrivateKey(privateKey: string): Promise<CryptoKey> {
  const normalized = privateKey.trim().replace(/\\n/g, "\n");
  const pem = normalized.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s+/g, "");
  const binary = Uint8Array.from(atob(pem), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function base64UrlEncode(input: string | ArrayBuffer): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
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
  const leftTokens = left.toLowerCase().match(/[a-z0-9가-힣]+/g) ?? [];
  const rightTokens = new Set(right.toLowerCase().match(/[a-z0-9가-힣]+/g) ?? []);
  if (!leftTokens.length || !rightTokens.size) return false;
  const overlap = leftTokens.filter((token) => rightTokens.has(token)).length / leftTokens.length;
  return overlap >= 0.6;
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-z0-9가-힣]+/gi, "_").substring(0, 100);
}
