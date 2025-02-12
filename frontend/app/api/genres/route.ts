import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';
import { getEmbedder } from '@/lib/server/embedder';
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
    const embedder = await getEmbedder();
    const embedding = await embedder.embed(genre);

    const queryResponse = await index.query({
      // vector: embedding,
      topK: 10,
      includeMetadata: true,
      id: `genre_${genre}`
    });

    const topGenres = queryResponse.matches.map(match => {
      if (Array.isArray(match.metadata?.genres)) {
        return match.metadata.genres[1];
      }
      return '';
    }).filter(Boolean);

    return NextResponse.json({ genres: topGenres });
  } catch (error) {
    console.error('Failed to query Pinecone:', error);
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
