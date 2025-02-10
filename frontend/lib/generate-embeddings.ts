import { FeatureExtractionPipeline } from '@xenova/transformers';
import axios from 'axios';

class Embedder {
  async embed(text: string): Promise<number[]> {
    try {
      const response = await axios.post('/api/embed', {
        text,
      });

      if (response.status !== 200) {
        throw new Error('Failed to generate embedding');
      }

      const data = response.data;
      return data.embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }
}

const embedder = new Embedder();
console.log('Embedder instance created');
export { embedder };
