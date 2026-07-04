/* v8 ignore start */
import { endpoints } from '../config/endpoints';

const VECTOR_PROXY = endpoints.vectorProxy;
const MODEL = 'nomic-embed-text:latest';
const DIMENSIONS = 768;

interface WorkerRequest {
  type: 'embed';
  id: string;
  text: string;
}

interface WorkerResponse {
  type: 'embed-result';
  id: string;
  embedding: number[] | null;
  error?: string;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(VECTOR_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text, model: MODEL }),
  });
  if (!response.ok) throw new Error(`HTTP_VECTOR_ERR_${response.status}`);
  const json = await response.json();
  return json.data?.[0]?.embedding || new Array(DIMENSIONS).fill(0);
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  if (e.data.type === 'embed') {
    try {
      const embedding = await generateEmbedding(e.data.text);
      const resp: WorkerResponse = { type: 'embed-result', id: e.data.id, embedding };
      self.postMessage(resp);
    } catch (err) {
      const resp: WorkerResponse = {
        type: 'embed-result',
        id: e.data.id,
        embedding: null,
        error: err instanceof Error ? err.message : 'UNKNOWN_EMBED_ERROR',
      };
      self.postMessage(resp);
    }
  }
};

export type { WorkerRequest, WorkerResponse };
/* v8 ignore stop */
