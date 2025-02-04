import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';

const pinecone = new Pinecone({
  apiKey: "pcsk_6XgYfG_Dq1zSKKxSSnnf3Av9DMAwNM7qVQXqCbxYN9XVjs7rSeD8gLKkpQA2JbLuZEXwPF",
});

const index = pinecone.index('hackbrown-search');

export async function POST(request: Request) {
  try {
    const { genre } = await request.json();
    
    const queryResponse = await index.query({
      topK: 10,
      includeMetadata: true,
      vector: [0], // Single dimension vector
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