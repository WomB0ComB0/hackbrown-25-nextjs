import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Validate environment variables
const { PINECONE_API_KEY, PINECONE_INDEX_NAME } = process.env;
if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
  logger.error('Pinecone API key or index name is not set in environment variables.');
  process.exit(1);
}

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

// Create Pinecone index reference
const index = pinecone.index(PINECONE_INDEX_NAME);

export async function POST(request: Request) {
  try {
    logger.info('Received POST request');

    const { genre } = await request.json();
    if (typeof genre !== 'string' || genre.trim() === '') {
      logger.warn('Invalid genre provided in request');
      return NextResponse.json({ error: 'Invalid genre provided' }, { status: 400 });
    }
    logger.info(`Extracted genre: ${genre}`);

    // Retrieve the query vector for the specified genre
    const queryVector = await getQueryVectorForGenre(genre);
    if (!queryVector) {
      logger.warn(`No vector found for genre: ${genre}`);
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    // Query Pinecone index
    const queryResponse = await index.query({
      topK: 10,
      includeMetadata: true,
      vector: queryVector,
      filter: {
        genre: { $eq: genre },
      },
    });
    logger.info('Received query response');

    // Process matches to extract genres
    const topGenres = queryResponse.matches
      .map((match) => {
        const genres = match.metadata?.genres;
        return Array.isArray(genres) && genres.length > 0 ? genres[0] : null;
      })
      .filter((g) => g !== null);
    logger.info(`Extracted top genres: ${topGenres}`);

    return NextResponse.json({ genres: topGenres });
  } catch (error) {
    logger.error('Failed to query Pinecone', { error: error.stack });
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}

// Mock function to retrieve the query vector for a given genre
async function getQueryVectorForGenre(genre) {
  // Implement this function to fetch the actual vector for the genre
  // For example, you might retrieve it from a database or compute it using an embedding model
  // This is a placeholder implementation
  return [0]; // Replace with the actual vector
}
