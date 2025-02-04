import type { PineconeRecord } from "@pinecone-database/pinecone";
import type { GenreMatch } from "@/types";
import { FeatureExtractionPipeline } from "@xenova/transformers";
import { v4 as uuidv4 } from "uuid";
import { sliceIntoChunks } from "@/utils";

class Embedder {
  private pipe: FeatureExtractionPipeline | null = null;

  async init() {
    const { pipeline } = await import("@xenova/transformers");
    this.pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  async embed(text: string, genres?: GenreMatch[]): Promise<PineconeRecord> {
    if (!this.pipe) {
      throw new Error("Pipeline not initialized. Call init() first.");
    }
    
    const result = await this.pipe(text);
    const meanValue = Array.from(result.data).reduce((sum, val) => sum + val, 0) / result.data.length;
    
    return {
      id: uuidv4(),
      metadata: {
        text,
        genres: genres?.map((genre) => JSON.stringify(genre)) ?? [],
      },
      values: [meanValue],
    };
  }

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