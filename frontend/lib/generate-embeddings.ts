import type { PineconeRecord } from "@pinecone-database/pinecone";
import type { GenreMatch } from "@/types";
import { Pipeline } from "@xenova/transformers";
import { v4 as uuidv4 } from "uuid";
import { sliceIntoChunks } from "@/utils";

interface TextMetadata {
  text: string;
  genres?: string[];
}

class Embedder {
  private pipe: Pipeline | null = null;

  // Initialize the pipeline
  async init() {
    const { pipeline } = await import("@xenova/transformers");
    this.pipe = await pipeline("embeddings", "Xenova/all-MiniLM-L6-v2");
  }

  // Embed a single string
  async embed(text: string, genres?: string[]): Promise<PineconeRecord<TextMetadata>> {
    const result = this.pipe && (await this.pipe(text));
    return {
      id: uuidv4(),
      metadata: {
        text,
        genres
      },
      values: Array.from(result.data),
    };
  }

  // Batch an array of string and embed each batch
  // Call onDoneBatch with the embeddings of each batch
  async embedBatch(
    texts: string[],
    batchSize: number,
    onDoneBatch: (embeddings: PineconeRecord<TextMetadata>[]) => void
  ) {
    const batches = sliceIntoChunks<string>(texts, batchSize);
    for (const batch of batches) {
      const embeddings = await Promise.all(
        batch.map((text) => this.embed(text))
      );
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
