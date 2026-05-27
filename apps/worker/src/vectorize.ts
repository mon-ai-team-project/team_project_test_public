import { type PaperRecord } from "./types";

export interface VectorizeMetadata {
  title: string;
  journalName: string;
  year: number;
  doi: string;
}

export async function createEmbedding(ai: any, text: string): Promise<number[]> {
  const response = await ai.run("@cf/baai/bge-small-en-v1.5", {
    text: [text]
  });
  return response.data[0];
}

export async function createEmbeddings(ai: any, texts: string[]): Promise<number[][]> {
  const response = await ai.run("@cf/baai/bge-small-en-v1.5", {
    text: texts
  });
  return response.data;
}

export async function upsertPaperVectors(
  vectorIndex: VectorizeIndex,
  ai: any,
  papers: PaperRecord[]
): Promise<void> {
  const papersToEmbed = papers.filter((p) => p.abstract || p.title);
  if (papersToEmbed.length === 0) return;

  const texts = papersToEmbed.map((p) => `${p.title}\n\n${p.abstract}`);
  const embeddings = await createEmbeddings(ai, texts);

  const vectors: VectorizeVector[] = papersToEmbed.map((paper, i) => ({
    id: paper.id,
    values: embeddings[i],
    metadata: {
      title: paper.title,
      journalName: paper.journalName,
      year: paper.year,
      doi: paper.doi
    }
  }));

  await vectorIndex.upsert(vectors);
}

export async function getSemanticRelevance(
  vectorIndex: VectorizeIndex,
  ai: any,
  query: string,
  paperIds: string[]
): Promise<Record<string, number>> {
  const queryVector = await createEmbedding(ai, query);
  
  // Vectorize doesn't support filtering by multiple IDs in a single query easily if they are many.
  // But we can query for the top results and match them, or if we have a small set, 
  // we can rely on the fact that we are searching within the current job's papers.
  
  const matches = await vectorIndex.query(queryVector, {
    topK: 50, // Match more to ensure we cover our candidates
    returnMetadata: false
  });

  const scores: Record<string, number> = {};
  for (const match of matches.matches) {
    if (paperIds.includes(match.id)) {
      scores[match.id] = match.score;
    }
  }

  return scores;
}
