import type { PineconeRecord } from "@pinecone-database/pinecone";
import type { GenreMatch } from "@/types";
import { FeatureExtractionPipeline } from "@xenova/transformers";
import { v4 as uuidv4 } from "uuid";
import { sliceIntoChunks } from "@/utils";

class Embedder {
  private pipe: FeatureExtractionPipeline | null = null;

  // Initialize the pipeline
  async init() {
    const { pipeline } = await import("@xenova/transformers");
    this.pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  // Embed a single string
  async embed(text: string, genres?: GenreMatch[]): Promise<PineconeRecord> {
    if (!this.pipe) {
      throw new Error("Pipeline not initialized. Call init() first.");
    }
    
    const result = await this.pipe(text);
    
    return {
      id: uuidv4(),
      metadata: {
        text,
        genres: genres?.map((genre) => JSON.stringify(genre)) ?? [], // Convert objects to strings
      },
      values: Array.from(result.data),
    };
  }

  // Batch an array of strings and embed each batch
  async embedBatch(
    texts: string[],
    batchSize: number,
    onDoneBatch: (embeddings: PineconeRecord[]) => Promise<void>
  ): Promise<void> {
    const batches = sliceIntoChunks(texts, batchSize);

    for (const batch of batches) {
      const embeddings = await Promise.all(batch.map((text) => this.embed(text)));
      await onDoneBatch(embeddings);
    }
  }
}

const embedder = new Embedder();
export { embedder };

/**
 * Helper function to retry failed API calls
 */
async function retry<T>(
  fn: () => Promise<T>, 
  retries: number, 
  delay: number
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay);
    }
    throw error;
  }
}
