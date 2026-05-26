import { type PaperRecord } from "./types";
import { type CriticFlag } from "./reports";

/**
 * Runs a qualitative analysis using Workers AI (LLM) to evaluate paper abstracts
 * against the research keyword and generate qualitative critic flags.
 */
export async function runLlmCritic(
  ai: any,
  keyword: string,
  papers: PaperRecord[],
  existingFlags: CriticFlag[]
): Promise<CriticFlag[]> {
  const flags = [...existingFlags];
  const model = "@cf/meta/llama-3-8b-instruct";

  // Evaluate all papers in small concurrent chunks to balance speed and rate limits
  const chunkSize = 3;
  for (let i = 0; i < papers.length; i += chunkSize) {
    const chunk = papers.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (paper) => {
        if (!paper.abstract || paper.abstract.length < 50) return;

        try {
          // Construct a robust prompt for business research evaluation
          const response = await ai.run(model, {
            messages: [
              {
                role: "system",
                content: `You are an expert academic reviewer for top-tier business journals (S/A1 rank). 
Your task is to evaluate a paper's abstract based on a research keyword.
Evaluate:
1. Relevance: Direct fit with the keyword.
2. Methodology: Robustness for business research.
3. Impact: Theoretical or practical contribution.

If the paper has significant qualitative weaknesses or misalignments, flag them.
Return ONLY a JSON object with the following structure:
{
  "severity": "low" | "medium" | "high",
  "message": "A concise summary of the critique",
  "evidence": "Evidence from the abstract"
}`
              },
              {
                role: "user",
                content: `Keyword: "${keyword}"\nTitle: ${paper.title}\nAbstract: ${paper.abstract}`
              }
            ],
            response_format: { type: "json_object" }
          });

          // Handle response variations (some AI bindings return string, some object)
          const resultStr = typeof response === "string" ? response : (response.response || JSON.stringify(response));
          const critique = JSON.parse(resultStr);

          if (critique.severity && critique.message) {
            flags.push({
              paperRank: paper.rank,
              severity: critique.severity as any,
              flagType: "llm_critique",
              message: critique.message,
              evidence: critique.evidence || "LLM qualitative analysis."
            });
          }
        } catch (error) {
          console.error(`LLM Critic error for paper rank ${paper.rank}:`, error);
          // Non-blocking: fail gracefully if AI fails for one paper
        }
      })
    );
  }

  return flags;
}

/**
 * Builds rule-based critic flags based on metadata heuristics.
 */
export function buildCriticFlags(papers: PaperRecord[]): CriticFlag[] {
  const flags: CriticFlag[] = [];
  for (const paper of papers) {
    if (!paper.doi) {
      flags.push({
        paperRank: paper.rank,
        severity: "high",
        flagType: "missing_doi",
        message: "DOI is missing, so bibliographic verification is incomplete.",
        evidence: paper.title
      });
    }
    if (paper.verificationStatus !== "verified") {
      flags.push({
        paperRank: paper.rank,
        severity: paper.verificationStatus === "partial" ? "medium" : "high",
        flagType: "crossref_verification",
        message: "Crossref did not fully verify this paper.",
        evidence: paper.verificationReason || "No Crossref verification reason recorded."
      });
    }
    const score = paper.relevanceScore ?? paper.abstractScore ?? 0;
    if (score < 0.45) {
      flags.push({
        paperRank: paper.rank,
        severity: "medium",
        flagType: "low_relevance",
        message: "The relevance score is low for the requested research question.",
        evidence: paper.relevanceReason || `Score: ${score}`
      });
    }
    if (paper.includeStatus !== "include") {
      flags.push({
        paperRank: paper.rank,
        severity: paper.includeStatus === "exclude" ? "high" : "medium",
        flagType: "screening_status",
        message: "The ranking stage did not mark this paper as a clean include.",
        evidence: paper.includeStatus + ": " + (paper.relevanceReason || "Low overall score")
      });
    }
    if (!paper.oaPdfUrl && !paper.oaLandingPageUrl && !paper.driveWebUrl) {
      flags.push({
        paperRank: paper.rank,
        severity: "low",
        flagType: "access_path",
        message: "No direct OA PDF, OA landing page, or Drive archive is available.",
        evidence: paper.unpaywallReason || "No access path recorded."
      });
    }
  }
  return flags;
}
