import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';
import { embedder } from '@/lib/generate-embeddings';
import { z } from 'zod';

const pinecone = new Pinecone({
  apiKey: "pcsk_6XgYfG_Dq1zSKKxSSnnf3Av9DMAwNM7qVQXqCbxYN9XVjs7rSeD8gLKkpQA2JbLuZEXwPF",
});

const index = pinecone.index('hackbrown-search');

const genreSchema = z.object({
  genre: z.string(),
});

export async function POST(request: Request) {
  try {
    const req = await request.json();
    const parsed = genreSchema.parse(req);
    if (!parsed.genre) {
      throw new Error('Genre not provided');
    }
    
    const { genre } = parsed;

    // Generate the embedding for the genre
    const embedding = await embedder.embed(genre);

    if (embedding.values.length !== 384) {
      throw new Error('Embedding dimensionality mismatch.');
    }

    const queryResponse = await index.query({
      topK: 10,
      includeMetadata: true,
      vector: embedding,
      filter: {
        genre: { $eq: genre }
      }
    });

    const topGenres = queryResponse.matches.map(match => {
      if (Array.isArray(match.metadata?.genres)) {
        return match.metadata.genres[0];
      }
      return '';
    });

    return NextResponse.json({ genres: topGenres });
  } catch (error) {
    console.error('Failed to query Pinecone:', error);
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
