/* v8 ignore start */
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

let pipelineInstance: FeatureExtractionPipeline | null = null;

async function getPipeline() {
  if (!pipelineInstance) {
    pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return pipelineInstance;
}

self.addEventListener('message', async (event) => {
  const { id, type, payload } = event.data;

  if (type === 'embed') {
    try {
      const pipe = await getPipeline();
      const output = await pipe(payload.text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);
      self.postMessage({ id, type: 'embed-result', embedding });
    } catch (error) {
      self.postMessage({
        id,
        type: 'embed-result',
        embedding: null,
        error: error instanceof Error ? error.message : 'UNKNOWN_EMBED_ERROR',
      });
    }
  }

  if (type === 'embed-batch') {
    try {
      const pipe = await getPipeline();
      const outputs = await pipe(payload.texts, { pooling: 'mean', normalize: true });
      const embeddings = outputs.dims[0] === undefined
        ? [Array.from(outputs.data)]
        : Array.from({ length: outputs.dims[0] }, (_, i) =>
            Array.from(outputs.data.slice(i * 384, (i + 1) * 384))
          );
      self.postMessage({ id, type: 'embed-batch-result', embeddings });
    } catch (error) {
      self.postMessage({
        id,
        type: 'embed-error',
        error: error instanceof Error ? error.message : 'UNKNOWN_EMBED_ERROR',
      });
    }
  }
});
/* v8 ignore stop */
