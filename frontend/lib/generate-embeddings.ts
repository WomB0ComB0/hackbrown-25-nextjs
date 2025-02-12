import { pipeline } from '@xenova/transformers';

class Embedder {
  async embed(text: string): Promise<number[]> {
    try {
      const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      const result = await pipe(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(result.data);
      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }
}

const embedder = new Embedder();
console.log('Embedder instance created');
export { embedder };
