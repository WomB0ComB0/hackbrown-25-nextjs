import { pipeline } from '@xenova/transformers';

let embedderInstance: any = null;

export async function getEmbedder() {
  if (!embedderInstance) {
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    embedderInstance = {
      embed: async (text: string) => {
        const result = await pipe(text, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
      }
    };
  }
  return embedderInstance;
} 