import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';

console.log('Initializing Pinecone client');
const pinecone = new Pinecone({
  apiKey: "pcsk_6XgYfG_Dq1zSKKxSSnnf3Av9DMAwNM7qVQXqCbxYN9XVjs7rSeD8gLKkpQA2JbLuZEXwPF",
});

console.log('Creating Pinecone index reference');
const index = pinecone.index('hackbrown-search');

export async function POST(request: Request) {
  try {
    console.log('Received POST request');
    const { genre } = await request.json();
    console.log('Extracted genre:', genre);
    
    console.log('Querying Pinecone index');
    const queryResponse = await index.query({
      topK: 10,
      includeMetadata: true,
      vector: [0],
      i
      filter: {
        genre: { $eq: genre }
      }
    });
    console.log('Received query response:', queryResponse);

    console.log('Processing matches to extract genres');
    const topGenres = queryResponse.matches.map(match => {
      if (Array.isArray(match.metadata?.genres)) {
        return match.metadata.genres[0];
      }
      return '';
    });
    console.log('Extracted top genres:', topGenres);

    console.log('Sending successful response');
    return NextResponse.json({ genres: topGenres });
  } catch (error) {
    console.error('Failed to query Pinecone:', error);
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
} 