import { Pinecone } from '@pinecone-database/pinecone';
import { embedder } from './generate-embeddings';

interface PineconeMatch {
  id: string;
  score: number;
  metadata: {
    genres?: string[];
  };
}

interface PineconeResponse {
  matches: PineconeMatch[];
}

const pinecone = new Pinecone({
  apiKey: "pcsk_6XgYfG_Dq1zSKKxSSnnf3Av9DMAwNM7qVQXqCbxYN9XVjs7rSeD8gLKkpQA2JbLuZEXwPF",
});

const index = pinecone.index('hackbrown-search');

export async function getTopGenres(genre: string, topK: number = 10): Promise<string[]> {
  try {

    await embedder.init();

    const queryEmbeddings = await embedder.embed(genre);
    const queryResponse = await index.query({
      topK: topK,
      includeMetadata: true,
      vector: queryEmbeddings.values,
      filter: {
        genre: { $eq: genre }
      }
    });

    const topGenres = queryResponse.matches.map(match => {
      if (Array.isArray(match.metadata?.genres)) {
        return match.metadata.genres[0] as string;
      }
      return '';
    });
    return topGenres;
  } catch (error) {
    console.error('Failed to query Pinecone:', error);
    throw error;
  }
}