import type { PaperSummary, SearchJob } from "@paper-agent/shared";

export type CriticFlag = {
  paperRank: number;
  severity: "low" | "medium" | "high";
  flagType: string;
  message: string;
  evidence: string;
};

export type JobOutputRecord = {
  outputType: "csv" | "markdown" | "xlsx" | "pdf";
  status: "generated" | "stored" | "planned" | "failed";
  storage: "dynamic" | "r2" | "planned";
  key: string;
  urlPath: string;
  contentType: string;
  detail: string;
};

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected Worker error";
}

function getCriticFlagsForPaper(result: SearchResult, paper: PaperSummary): CriticFlag[] {
  return result.criticFlags?.filter((flag) => flag.paperRank === paper.rank) ?? [];
}

function getCriticRiskLevel(flags: CriticFlag[]): CriticFlag["severity"] | "clear" {
  if (flags.some((flag) => flag.severity === "high")) return "high";
  if (flags.some((flag) => flag.severity === "medium")) return "medium";
  if (flags.some((flag) => flag.severity === "low")) return "low";
  return "clear";
}

function buildCriticReviewSummary(paper: PaperSummary, flags: CriticFlag[]) {
  const riskLevel = getCriticRiskLevel(flags);
  const flagTypes = Array.from(new Set(flags.map((flag) => flag.flagType))).filter(Boolean);
  const decision = riskLevel === "high"
    ? "Manual review required before citation"
    : riskLevel === "medium"
      ? "Use after targeted verification"
      : riskLevel === "low"
        ? "Usable with access caveat"
        : "No critic issues detected";
  const primaryIssue = flags[0]?.message ?? "No rule-based critic flags were generated for this paper.";
  const evidence = flags[0]?.evidence ?? paper.relevanceReason;
  const actions = flags.length
    ? flags.slice(0, 3).map((flag) => getCriticAction(flag))
    : ["Proceed to full-text reading and citation screening."];
  return {
    riskLevel,
    decision,
    primaryIssue,
    evidence,
    flagTypes: flagTypes.length ? flagTypes.join(", ") : "none",
    note: decision + ". " + primaryIssue,
    actions
  };
}

function getCriticAction(flag: CriticFlag): string {
  if (flag.flagType === "missing_doi") return "Locate DOI or confirm bibliographic metadata from publisher page before citing.";
  if (flag.flagType === "hallucination_risk") return "Verify title, DOI, journal, year, and authors against Crossref and publisher metadata before citing.";
  if (flag.flagType === "journal_quality") return "Confirm whether this venue belongs to the approved S/A1 journal pool before using it as core evidence.";
  if (flag.flagType === "crossref_verification") return "Compare title, year, journal, authors, and DOI against Crossref or publisher metadata.";
  if (flag.flagType === "low_relevance") return "Read abstract/introduction to confirm conceptual fit with the research question.";
  if (flag.flagType === "screening_status") return "Treat ranking status as provisional and manually decide include, review, or exclude.";
  if (flag.flagType === "low_impact_risk") return "Treat citation impact as weak and check whether the paper is recent, theoretical, or otherwise justified.";
  if (flag.flagType === "access_path") return "Use DOI, library access, or institutional subscriptions because no direct OA path is recorded.";
  return "Review this flag before using the paper in final synthesis.";
}

export function summarizeCriticFlags(flags: CriticFlag[]) {
  return {
    total: flags.length,
    high: flags.filter((flag) => flag.severity === "high").length,
    medium: flags.filter((flag) => flag.severity === "medium").length,
    low: flags.filter((flag) => flag.severity === "low").length,
    byType: flags.reduce<Record<string, number>>((counts, flag) => {
      counts[flag.flagType] = (counts[flag.flagType] ?? 0) + 1;
      return counts;
    }, {})
  };
}

export type SearchResult = { job: SearchJob; papers: PaperSummary[]; criticFlags?: CriticFlag[] };

export async function persistSearchOutputs(reports: R2Bucket | undefined, result: SearchResult): Promise<JobOutputRecord[]> {
  const csvOutput: JobOutputRecord = {
    outputType: "csv",
    status: reports ? "stored" : "generated",
    storage: reports ? "r2" : "dynamic",
    key: getCsvOutputKey(result.job.id),
    urlPath: "/api/search-jobs/" + result.job.id + "/papers.csv",
    contentType: "text/csv; charset=utf-8",
    detail: reports ? "CSV persisted to R2." : "CSV is generated dynamically from D1 when requested."
  };
  const markdownOutput: JobOutputRecord = {
    outputType: "markdown",
    status: reports ? "stored" : "generated",
    storage: reports ? "r2" : "dynamic",
    key: getMarkdownReportOutputKey(result.job.id),
    urlPath: "/api/search-jobs/" + result.job.id + "/report.md",
    contentType: "text/markdown; charset=utf-8",
    detail: reports ? "Markdown report persisted to R2." : "Markdown report is generated dynamically from D1 when requested."
  };
  const xlsxOutput: JobOutputRecord = {
    outputType: "xlsx",
    status: reports ? "stored" : "generated",
    storage: reports ? "r2" : "dynamic",
    key: getXlsxOutputKey(result.job.id),
    urlPath: "/api/search-jobs/" + result.job.id + "/papers.xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    detail: reports ? "XLSX workbook persisted to R2." : "XLSX workbook is generated dynamically from D1 when requested."
  };
  const pdfOutput: JobOutputRecord = {
    outputType: "pdf",
    status: reports ? "stored" : "generated",
    storage: reports ? "r2" : "dynamic",
    key: getPdfOutputKey(result.job.id),
    urlPath: "/api/search-jobs/" + result.job.id + "/report.pdf",
    contentType: "application/pdf",
    detail: reports ? "PDF report persisted to R2." : "PDF report is generated dynamically from D1 when requested."
  };

  if (!reports) return [csvOutput, markdownOutput, xlsxOutput, pdfOutput];

  try {
    await Promise.all([
      reports.put(csvOutput.key, getCsvBody(result), {
        httpMetadata: {
          contentType: csvOutput.contentType,
          contentDisposition: `attachment; filename="${getCsvFileName(result)}"`
        }
      }),
      reports.put(markdownOutput.key, getMarkdownReportBody(result), {
        httpMetadata: {
          contentType: markdownOutput.contentType,
          contentDisposition: `attachment; filename="${getMarkdownReportFileName(result)}"`
        }
      }),
      reports.put(xlsxOutput.key, getXlsxBody(result), {
        httpMetadata: {
          contentType: xlsxOutput.contentType,
          contentDisposition: `attachment; filename="${getXlsxFileName(result)}"`
        }
      }),
      reports.put(pdfOutput.key, getPdfBody(result), {
        httpMetadata: {
          contentType: pdfOutput.contentType,
          contentDisposition: `attachment; filename="${getPdfFileName(result)}"`
        }
      })
    ]);
    return [csvOutput, markdownOutput, xlsxOutput, pdfOutput];
  } catch (error) {
    const detail = "R2 output persistence failed: " + getErrorMessage(error);
    console.warn("R2 output persistence failed for " + result.job.id + ": " + getErrorMessage(error));
    return [
      { ...csvOutput, status: "failed", detail },
      { ...markdownOutput, status: "failed", detail },
      { ...xlsxOutput, status: "failed", detail },
      { ...pdfOutput, status: "failed", detail }
    ];
  }
}

export async function getStoredOutput(reports: R2Bucket | undefined, key: string, fileName: string): Promise<Response | null> {
  if (!reports) return null;
  const object = await reports.get(key);
  if (!object) return null;
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  if (!headers.has("Content-Disposition")) headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
  for (const [name, value] of Object.entries(corsHeaders())) headers.set(name, value);
  return new Response(object.body, { headers });
}

export function getCsvOutputKey(jobId: string): string {
  return `reports/${jobId}/papers.csv`;
}

export function getMarkdownReportOutputKey(jobId: string): string {
  return `reports/${jobId}/report.md`;
}

export function getXlsxOutputKey(jobId: string): string {
  return `reports/${jobId}/papers.xlsx`;
}

export function getPdfOutputKey(jobId: string): string {
  return `reports/${jobId}/report.pdf`;
}

export function getCsvFileName(result: SearchResult): string {
  return `${sanitizeFileName(result.job.keyword)}-${result.job.id}.csv`;
}

export function getMarkdownReportFileName(result: SearchResult): string {
  return `${sanitizeFileName(result.job.keyword)}-${result.job.id}-report.md`;
}

export function getXlsxFileName(result: SearchResult): string {
  return `${sanitizeFileName(result.job.keyword)}-${result.job.id}.xlsx`;
}

export function getPdfFileName(result: SearchResult): string {
  return `${sanitizeFileName(result.job.keyword)}-${result.job.id}-report.pdf`;
}

export function csv(result: SearchResult): Response {
  const body = getCsvBody(result);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getCsvFileName(result)}"`,
      ...corsHeaders()
    }
  });
}

function getCsvBody(result: SearchResult): string {
  return [getCsvHeaders(), ...getCsvRows(result)].map((row) => row.map(formatCsvCell).join(",")).join("\n");
}

function getCsvHeaders(): string[] {
  return [
    "job_id",
    "keyword",
    "rank",
    "title",
    "authors",
    "year",
    "journal_name",
    "journal_field",
    "journal_rank",
    "doi",
    "oa_status",
    "publisher",
    "issn",
    "publication_type",
    "published_date",
    "verification_status",
    "verification_reason",
    "oa_pdf_url",
    "oa_landing_page_url",
    "oa_license",
    "oa_host_type",
    "oa_repository",
    "unpaywall_status",
    "unpaywall_reason",
    "drive_file_id",
    "drive_web_url",
    "drive_status",
    "drive_reason",
    "abstract_score",
    "relevance_score",
    "journal_fit_score",
    "verification_score",
    "oa_score",
    "citation_score",
    "recency_score",
    "final_score",
    "include_status",
    "relevance_reason"
  ];
}

function getCsvRows(result: SearchResult): Array<Array<string | number>> {
  return result.papers.map((paper) => [
    result.job.id,
    result.job.keyword,
    paper.rank,
    paper.title,
    paper.authors,
    paper.year,
    paper.journalName,
    paper.journalField ?? "",
    paper.journalRank ?? "",
    paper.doi,
    paper.oaStatus,
    paper.publisher ?? "",
    paper.issn ?? "",
    paper.publicationType ?? "",
    paper.publishedDate ?? "",
    paper.verificationStatus ?? "",
    paper.verificationReason ?? "",
    paper.oaPdfUrl ?? "",
    paper.oaLandingPageUrl ?? "",
    paper.oaLicense ?? "",
    paper.oaHostType ?? "",
    paper.oaRepository ?? "",
    paper.unpaywallStatus ?? "",
    paper.unpaywallReason ?? "",
    paper.driveFileId ?? "",
    paper.driveWebUrl ?? "",
    paper.driveStatus ?? "",
    paper.driveReason ?? "",
    paper.abstractScore,
    paper.relevanceScore ?? "",
    paper.journalFitScore ?? "",
    paper.verificationScore ?? "",
    paper.oaScore ?? "",
    paper.citationScore ?? "",
    paper.recencyScore ?? "",
    paper.finalScore,
    paper.includeStatus,
    paper.relevanceReason
  ]);
}

export function pdf(result: SearchResult): Response {
  return new Response(getPdfBody(result), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${getPdfFileName(result)}"`,
      ...corsHeaders()
    }
  });
}

function getPdfBody(result: SearchResult): Uint8Array {
  const lines = getPdfReportLines(result);
  const pages = paginatePdfLines(lines);
  const objects: string[] = ["", "<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const pageObjectIds: number[] = [];

  for (const pageLines of pages) {
    const stream = getPdfPageStream(pageLines);
    const contentObjectId = objects.length;
    objects.push("<< /Length " + stream.length + " >>\nstream\n" + stream + "endstream");
    const pageObjectId = objects.length;
    objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents " + contentObjectId + " 0 R >>");
    pageObjectIds.push(pageObjectId);
  }

  objects[2] = "<< /Type /Pages /Kids [" + pageObjectIds.map((id) => id + " 0 R").join(" ") + "] /Count " + pageObjectIds.length + " >>";
  return encodePdfObjects(objects);
}

function getPdfReportLines(result: SearchResult): string[] {
  const summary = summarizeReport(result.papers);
  const reportInsights = buildReportInsights(result.papers);
  const criticSummary = summarizeCriticFlags(result.criticFlags ?? []);
  const lines = [
    "Paper Agent Report",
    "==================",
    "Job ID: " + result.job.id,
    "Keyword: " + result.job.keyword,
    "Generated at: " + new Date().toISOString(),
    "Paper count: " + result.papers.length,
    "Include / Review / Exclude: " + summary.includeCount + " / " + summary.reviewCount + " / " + summary.excludeCount,
    "Average final score: " + formatReportScore(summary.averageFinalScore),
    "Critic flags: " + criticSummary.total + " total (high " + criticSummary.high + ", medium " + criticSummary.medium + ", low " + criticSummary.low + ")",
    "",
    "Executive Summary",
    "-----------------",
    `This report contains ${result.papers.length} allowlisted journal results for "${result.job.keyword}".`,
    `The corpus spans ${summary.yearRange} and includes ${summary.journalCount} distinct journals.`,
    `Crossref verification found ${summary.verifiedCount} verified results, and Unpaywall found ${summary.oaPdfCount} PDFs.`,
    "",
    "Key Findings",
    "------------",
    ...reportInsights.keyFindings,
    "",
    "Common Themes",
    "-------------",
    ...reportInsights.commonThemes,
    "",
    "Research Gaps",
    "-------------",
    ...reportInsights.researchGaps,
    "",
    "Top Ranked Papers",
    "-----------------"
  ];

  for (const paper of result.papers.slice(0, 20)) {
    const critic = buildCriticReviewSummary(paper, getCriticFlagsForPaper(result, paper));
    lines.push(
      "",
      String(paper.rank) + ". " + paper.title,
      "   Authors: " + paper.authors,
      "   Year / Journal: " + (paper.year || "Unknown") + " / " + paper.journalName,
      "   Field / Rank: " + ([paper.journalField, paper.journalRank].filter(Boolean).join(" / ") || "Unmatched"),
      "   Final score: " + formatReportScore(paper.finalScore) + " / Status: " + paper.includeStatus,
      "   DOI: " + (paper.doi || "Not available"),
      "   Critic: " + critic.note,
      "   Action: " + critic.actions[0],
      "   Reason: " + paper.relevanceReason
    );
  }

  lines.push("", "Limitations", "-----------", ...reportInsights.limitations);

  return lines.flatMap((line) => wrapPdfLine(normalizePdfText(line), 92));
}

function paginatePdfLines(lines: string[]): string[][] {
  const pageSize = 48;
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += pageSize) pages.push(lines.slice(index, index + pageSize));
  return pages.length ? pages : [["Paper Agent Report", "No content available."]];
}

function getPdfPageStream(lines: string[]): string {
  const escapedLines = lines.map((line) => "(" + escapePdfString(line) + ") Tj T*").join("\n");
  return "BT\n/F1 10 Tf\n14 TL\n54 738 Td\n" + escapedLines + "\nET\n";
}

function encodePdfObjects(objects: string[]): Uint8Array {
  const encoder = new TextEncoder();
  const parts: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [0];
  let length = encoder.encode(parts[0]).length;

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = length;
    const objectBody = index + " 0 obj\n" + objects[index] + "\nendobj\n";
    parts.push(objectBody);
    length += encoder.encode(objectBody).length;
  }

  const xrefOffset = length;
  const xrefRows = offsets.slice(1).map((offset) => String(offset).padStart(10, "0") + " 00000 n ");
  const trailer = "xref\n0 " + objects.length + "\n0000000000 65535 f \n" + xrefRows.join("\n") + "\ntrailer\n<< /Size " + objects.length + " /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF\n";
  parts.push(trailer);
  return encoder.encode(parts.join(""));
}

function wrapPdfLine(line: string, width: number): string[] {
  if (line.length <= width) return [line];
  const words = line.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? current + " " + word : word;
    if (candidate.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function normalizePdfText(value: string): string {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?");
}

function escapePdfString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function xlsx(result: SearchResult): Response {
  return new Response(getXlsxBody(result), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${getXlsxFileName(result)}"`,
      ...corsHeaders()
    }
  });
}

function getXlsxBody(result: SearchResult): Uint8Array {
  const files: Array<{ name: string; body: string }> = [
    { name: "[Content_Types].xml", body: getXlsxContentTypesXml() },
    { name: "_rels/.rels", body: getXlsxRootRelsXml() },
    { name: "xl/workbook.xml", body: getXlsxWorkbookXml() },
    { name: "xl/_rels/workbook.xml.rels", body: getXlsxWorkbookRelsXml() },
    { name: "xl/worksheets/sheet1.xml", body: getXlsxWorksheetXml(result) }
  ];
  return createZip(files);
}

function getXlsxContentTypesXml(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '</Types>';
}

function getXlsxRootRelsXml(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';
}

function getXlsxWorkbookXml(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets><sheet name="Ranked Papers" sheetId="1" r:id="rId1"/></sheets></workbook>';
}

function getXlsxWorkbookRelsXml(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '</Relationships>';
}

function getXlsxWorksheetXml(result: SearchResult): string {
  const rows = [getCsvHeaders(), ...getCsvRows(result)];
  const xmlRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const cellRef = columnName(columnIndex + 1) + String(rowIndex + 1);
      return '<c r="' + cellRef + '" t="inlineStr"><is><t>' + escapeXml(String(value ?? '')) + '</t></is></c>';
    }).join('');
    return '<row r="' + String(rowIndex + 1) + '">' + cells + '</row>';
  }).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetData>' + xmlRows + '</sheetData></worksheet>';
}

function columnName(index: number): string {
  let name = "";
  let current = index;
  while (current > 0) {
    current -= 1;
    name = String.fromCharCode(65 + (current % 26)) + name;
    current = Math.floor(current / 26);
  }
  return name;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function createZip(files: Array<{ name: string; body: string }>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const bodyBytes = encoder.encode(file.body);
    const crc = crc32(bodyBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, bodyBytes.length, true);
    localView.setUint32(22, bodyBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, bodyBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, bodyBytes.length, true);
    centralView.setUint32(24, bodyBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);
    offset += localHeader.length + bodyBytes.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return concatUint8Arrays([...localParts, ...centralParts, endRecord]);
}

function concatUint8Arrays(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function markdownReport(result: SearchResult): Response {
  const body = getMarkdownReportBody(result);
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getMarkdownReportFileName(result)}"`,
      ...corsHeaders()
    }
  });
}

function getMarkdownReportBody(result: SearchResult): string {
  const summary = summarizeReport(result.papers);
  const reportInsights = buildReportInsights(result.papers);
  const criticSummary = summarizeCriticFlags(result.criticFlags ?? []);
  const topCriticFlags = (result.criticFlags ?? []).filter((flag) => flag.severity === "high" || flag.severity === "medium").slice(0, 8);
  const lines = [
    `# Paper Agent Report`,
    "",
    `- Job ID: ${result.job.id}`,
    `- Keyword: ${result.job.keyword}`,
    `- Status: ${result.job.status}`,
    `- Current step: ${result.job.currentStep}`,
    `- Created at: ${result.job.createdAt}`,
    `- Completed at: ${result.job.completedAt ?? "Not completed"}`,
    `- Generated at: ${new Date().toISOString()}`,
    `- Paper count: ${result.papers.length}`,
    `- Include: ${summary.includeCount}`,
    `- Review: ${summary.reviewCount}`,
    `- Exclude: ${summary.excludeCount}`,
    `- Open access with PDF: ${summary.oaPdfCount}`,
    `- Average final score: ${formatReportScore(summary.averageFinalScore)}`,
    "",
    "## Executive Summary",
    "",
    `This report contains ${result.papers.length} allowlisted journal result${result.papers.length === 1 ? "" : "s"} for the search keyword "${result.job.keyword}".`,
    `The highest ranked result is ${summary.topPaper ? `"${summary.topPaper.title}" with a final score of ${formatReportScore(summary.topPaper.finalScore)}.` : "not available because no papers were saved."}`,
    `Crossref verification found ${summary.verifiedCount} verified result${summary.verifiedCount === 1 ? "" : "s"}, and Unpaywall found ${summary.oaPdfCount} result${summary.oaPdfCount === 1 ? "" : "s"} with a direct PDF URL.`,
    `The Critic Agent generated ${criticSummary.total} review flag${criticSummary.total === 1 ? "" : "s"}: high ${criticSummary.high}, medium ${criticSummary.medium}, low ${criticSummary.low}.`,
    `The corpus spans ${summary.yearRange} and includes ${summary.journalCount} distinct journal${summary.journalCount === 1 ? "" : "s"}.`,
    "",
    "## Key Findings",
    "",
    ...formatBulletList(reportInsights.keyFindings),
    "",
    "## Common Themes",
    "",
    ...formatBulletList(reportInsights.commonThemes),
    "",
    "## Method / Context Differences",
    "",
    ...formatBulletList(reportInsights.differences),
    "",
    "## Research Gaps",
    "",
    ...formatBulletList(reportInsights.researchGaps),
    "",
    "## Suggested Reading Order",
    "",
    ...formatNumberedList(reportInsights.readingOrder),
    "",
    "## Critic Review Summary",
    "",
    `- Total flags: ${criticSummary.total}`,
    `- Severity mix: high ${criticSummary.high}, medium ${criticSummary.medium}, low ${criticSummary.low}`,
    ...formatBulletList(topCriticFlags.length ? topCriticFlags.map((flag) => `Rank ${flag.paperRank}: ${flag.severity} ${flag.flagType} - ${flag.message}`) : ["No high or medium critic flags were generated for this job."]),
    "",
    "## Screening Notes",
    "",
    ...formatBulletList(reportInsights.screeningNotes),
    "",
    "## Limitations",
    "",
    ...formatBulletList(reportInsights.limitations),
    "",
    "## Top Ranked Table",
    "",
    "| Rank | Title | Year | Journal | Field | Rank Class | Final | Include | Critic | DOI | OA PDF |",
    "| --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |",
    ...result.papers.map((paper) =>
      [
        paper.rank,
        escapeMarkdownTableCell(paper.title),
        paper.year || "Unknown",
        escapeMarkdownTableCell(paper.journalName),
        escapeMarkdownTableCell(paper.journalField ?? "Unmatched"),
        escapeMarkdownTableCell(paper.journalRank ?? "Unmatched"),
        formatReportScore(paper.finalScore),
        paper.includeStatus,
        buildCriticReviewSummary(paper, getCriticFlagsForPaper(result, paper)).riskLevel,
        paper.doi ? escapeMarkdownTableCell(paper.doi) : "Not available",
        paper.oaPdfUrl ? "Yes" : "No"
      ].join(" | ")
    ).map((row) => `| ${row} |`),
    "",
    "## Ranked Papers",
    ""
  ];

  if (!result.papers.length) {
    lines.push("No allowed journal results were saved for this job.", "");
  }

  for (const paper of result.papers) {
    lines.push(
      `### ${paper.rank}. ${paper.title}`,
      "",
      `- Authors: ${paper.authors}`,
      `- Year: ${paper.year || "Unknown"}`,
      `- Journal: ${paper.journalName}`,
      `- Field / rank: ${[paper.journalField, paper.journalRank].filter(Boolean).join(" / ") || "Unmatched"}`,
      `- DOI: ${paper.doi || "Not available"}`,
      `- Open access: ${paper.oaStatus}`,
      `- Final score: ${paper.finalScore.toFixed(3)}`,
      `- Include status: ${paper.includeStatus}`,
      `- Citation count: ${paper.citedByCount ?? 0}`,
      `- Publisher: ${paper.publisher || "Not available"}`,
      `- Verification: ${paper.verificationStatus ?? "unverified"} - ${paper.verificationReason ?? "No verification recorded."}`,
      `- Unpaywall: ${paper.unpaywallStatus ?? "skipped"} - ${paper.unpaywallReason ?? "No Unpaywall lookup recorded."}`,
      `- OA PDF: ${paper.oaPdfUrl || "Not available"}`,
      `- OA landing page: ${paper.oaLandingPageUrl || "Not available"}`,
      `- Google Drive: ${paper.driveStatus ?? "skipped"} - ${paper.driveWebUrl || paper.driveReason || "No Google Drive upload recorded."}`,
      `- License: ${[paper.oaLicense, paper.oaHostType, paper.oaRepository].filter(Boolean).join(" / ") || "Not available"}`,
      `- Critic review: ${buildCriticReviewSummary(paper, getCriticFlagsForPaper(result, paper)).note}`,
      `- Critic risk: ${buildCriticReviewSummary(paper, getCriticFlagsForPaper(result, paper)).riskLevel}`,
      `- Critic flag types: ${buildCriticReviewSummary(paper, getCriticFlagsForPaper(result, paper)).flagTypes}`,
      "",
      "Critic recommended actions:",
      "",
      ...formatBulletList(buildCriticReviewSummary(paper, getCriticFlagsForPaper(result, paper)).actions),
      "",
      "Score breakdown:",
      "",
      `- Relevance: ${formatReportScore(paper.relevanceScore ?? paper.abstractScore)}`,
      `- Journal fit: ${formatReportScore(paper.journalFitScore ?? 1)}`,
      `- Crossref verification: ${formatReportScore(paper.verificationScore ?? 0)}`,
      `- Open access: ${formatReportScore(paper.oaScore ?? 0)}`,
      `- Citation: ${formatReportScore(paper.citationScore ?? 0)}`,
      `- Recency: ${formatReportScore(paper.recencyScore ?? 0)}`,
      "",
      `Relevance reason: ${paper.relevanceReason}`,
      ""
    );
  }

  return `${lines.join("\n")}\n`;
}

function summarizeReport(papers: PaperSummary[]) {
  const includeCount = papers.filter((paper) => paper.includeStatus === "include").length;
  const reviewCount = papers.filter((paper) => paper.includeStatus === "review").length;
  const excludeCount = papers.filter((paper) => paper.includeStatus === "exclude").length;
  const verifiedCount = papers.filter((paper) => paper.verificationStatus === "verified").length;
  const oaPdfCount = papers.filter((paper) => Boolean(paper.oaPdfUrl)).length;
  const averageFinalScore = papers.length ? papers.reduce((total, paper) => total + paper.finalScore, 0) / papers.length : 0;
  const years = papers.map((paper) => paper.year).filter((year) => year > 0);
  const yearRange = years.length ? `${Math.min(...years)}-${Math.max(...years)}` : "unknown years";
  const journalCount = new Set(papers.map((paper) => paper.journalName).filter(Boolean)).size;
  return {
    includeCount,
    reviewCount,
    excludeCount,
    verifiedCount,
    oaPdfCount,
    averageFinalScore,
    yearRange,
    journalCount,
    topPaper: papers[0]
  };
}

function buildReportInsights(papers: PaperSummary[]) {
  if (!papers.length) {
    return {
      keyFindings: ["No allowlisted journal results were saved, so substantive synthesis is not available."],
      commonThemes: ["No recurring themes can be inferred from an empty result set."],
      differences: ["No method or context differences can be compared from an empty result set."],
      researchGaps: ["Repeat the search with broader terms, adjusted years, or a different source provider."],
      readingOrder: ["Run a search that returns allowlisted journal results before using the reading order."],
      screeningNotes: ["All downstream interpretation is blocked because no papers passed the journal allowlist."],
      limitations: ["This report is generated from metadata and simple scoring rules, not a full-text qualitative review."]
    };
  }

  const topPapers = papers.slice(0, 5);
  const includePapers = papers.filter((paper) => paper.includeStatus === "include");
  const reviewPapers = papers.filter((paper) => paper.includeStatus === "review");
  const verifiedShare = papers.filter((paper) => paper.verificationStatus === "verified").length / papers.length;
  const oaPdfPapers = papers.filter((paper) => Boolean(paper.oaPdfUrl));
  const journals = getTopCounts(papers.map((paper) => paper.journalName).filter(Boolean), 5);
  const years = papers.map((paper) => paper.year).filter((year) => year > 0);
  const newestYear = years.length ? Math.max(...years) : null;
  const oldestYear = years.length ? Math.min(...years) : null;
  const topicTerms = getTopTopicTerms(papers, 8);

  return {
    keyFindings: [
      `${papers.length} allowlisted result${papers.length === 1 ? "" : "s"} were retained after source search, journal filtering, metadata enrichment, and ranking.`,
      `${includePapers.length} paper${includePapers.length === 1 ? "" : "s"} met the automatic include threshold; ${reviewPapers.length} require manual review before final use.`,
      `${Math.round(verifiedShare * 100)}% of retained results were verified by Crossref at the metadata level.`,
      oaPdfPapers.length
        ? `${oaPdfPapers.length} result${oaPdfPapers.length === 1 ? "" : "s"} include a direct open-access PDF URL for immediate reading.`
        : "No retained result currently has a direct open-access PDF URL; use DOI or landing pages for access checks."
    ],
    commonThemes: [
      topicTerms.length
        ? `Recurring title terms include ${formatInlineList(topicTerms)}, suggesting the dominant topical clusters in the retained set.`
        : "The retained titles do not provide enough repeated terms for a reliable theme signal.",
      journals.length
        ? `The most frequent journal source${journals.length === 1 ? " is" : "s are"} ${journals.map((item) => `${item.label} (${item.count})`).join(", ")}.`
        : "Journal concentration could not be assessed.",
      "The ranked set is restricted to the approved business school journal list, so the themes should be interpreted as top-journal signals rather than a complete field map."
    ],
    differences: [
      newestYear && oldestYear
        ? `Publication years range from ${oldestYear} to ${newestYear}, so older high-citation papers and newer emerging papers should be interpreted separately.`
        : "Publication year coverage is incomplete.",
      "Citation score and recency score may favor different papers; prioritize papers that are strong on both when selecting core readings.",
      "Open-access availability differs across papers, so download readiness should not be treated as evidence quality."
    ],
    researchGaps: [
      reviewPapers.length
        ? `${reviewPapers.length} result${reviewPapers.length === 1 ? "" : "s"} remain in review status; manual screening should check conceptual fit, empirical context, and method relevance.`
        : "No papers remain in review status, but manual screening is still required before final inclusion.",
      "The current relevance score is metadata-based. Full abstract or full-text embedding review should be added before final literature synthesis.",
      "Provider differences remain a known gap: OpenAlex is currently used for testing, and final quality checks must be repeated after switching to Web of Science."
    ],
    readingOrder: topPapers.map((paper) => `${paper.title} (${paper.year || "unknown year"}) - final score ${formatReportScore(paper.finalScore)}, ${paper.includeStatus}.`),
    screeningNotes: [
      "Use include status as a triage signal, not as a final acceptance decision.",
      "Check Crossref verification reason for title, year, and journal mismatches before citing a paper.",
      "Prioritize papers with direct OA PDF links for fast first-pass reading, then use DOI landing pages for closed-access papers."
    ],
    limitations: [
      "This report is generated from bibliographic metadata, ranking features, and OA checks; it is not a substitute for full-text expert review.",
      "Current OpenAlex-based test runs are for workflow validation while WoS API approval is pending.",
      "Journal allowlist filtering intentionally excludes non-allowlisted venues, which improves scope control but may omit relevant interdisciplinary work.",
      "The report does not yet generate narrative claims from abstracts or full texts; those should be added with a future summarization or embedding stage."
    ]
  };
}

function getTopCounts(values: string[], limit: number): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, limit);
}

function getTopTopicTerms(papers: PaperSummary[], limit: number): string[] {
  const stopWords = new Set([
    "about",
    "after",
    "analysis",
    "based",
    "between",
    "business",
    "case",
    "effect",
    "effects",
    "from",
    "into",
    "journal",
    "management",
    "market",
    "marketing",
    "paper",
    "review",
    "study",
    "systematic",
    "theory",
    "through",
    "using",
    "with"
  ]);
  const terms = papers.flatMap((paper) => tokenize(paper.title)).filter((term) => term.length > 3 && !stopWords.has(term));
  return getTopCounts(terms, limit).map((item) => item.label);
}

function formatInlineList(values: string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function formatBulletList(items: string[]): string[] {
  return items.map((item) => `- ${item}`);
}

function formatNumberedList(items: string[]): string[] {
  return items.map((item, index) => `${index + 1}. ${item}`);
}

function formatReportScore(value: number): string {
  return value.toFixed(3);
}

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function formatCsvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function tokenize(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function sanitizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "papers";
}
