import { NextResponse } from 'next/server';
import { pipeline } from '@xenova/transformers';
import {z} from 'zod'

const schema = z.object({
  text: z.string(),
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const parsed = schema.parse({ text });
    if (!parsed.text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const result = await pipe(text, { pooling: 'mean', normalize: true });
    const embedding = Array.from(result.data);

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
  }
} 