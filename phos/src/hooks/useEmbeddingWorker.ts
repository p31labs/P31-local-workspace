import { useEffect, useRef, useCallback } from 'react';

type WorkerResult = { embedding: number[] | null; error?: string };

type PendingRequest = {
  resolve: (result: WorkerResult) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const REQUEST_TIMEOUT = 30_000;

/* v8 ignore start */
export function useEmbeddingWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
  const idCounter = useRef(0);

  useEffect(() => {
    const w = new Worker(new URL('./EmbeddingWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = w;

    w.onmessage = (e: MessageEvent<{ type: string; id: string; embedding: number[] | null; error?: string }>) => {
      if (e.data.type === 'embed-result') {
        const pending = pendingRef.current.get(e.data.id);
        if (pending) {
          clearTimeout(pending.timer);
          pendingRef.current.delete(e.data.id);
          if (e.data.error) {
            pending.resolve({ embedding: null, error: e.data.error });
          } else {
            pending.resolve({ embedding: e.data.embedding });
          }
        }
      }
    };

    w.onerror = (err) => {
      for (const [id, pending] of pendingRef.current.entries()) {
        clearTimeout(pending.timer);
        pending.reject(new Error('WORKER_FATAL'));
        pendingRef.current.delete(id);
      }
      err.preventDefault();
    };

    return () => {
      w.terminate();
      workerRef.current = null;
      for (const [, pending] of pendingRef.current.entries()) {
        clearTimeout(pending.timer);
        pending.reject(new Error('WORKER_TERMINATED'));
      }
      pendingRef.current.clear();
    };
  }, []);

  const embed = useCallback((text: string): Promise<WorkerResult> => {
    const w = workerRef.current;
    if (!w) return Promise.resolve({ embedding: null, error: 'WORKER_NOT_READY' });

    const id = `emb-${++idCounter.current}-${Date.now()}`;

    return new Promise<WorkerResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingRef.current.delete(id);
        resolve({ embedding: null, error: 'EMBED_TIMEOUT' });
      }, REQUEST_TIMEOUT);

      pendingRef.current.set(id, { resolve, reject, timer });
      w.postMessage({ type: 'embed', id, text });
    });
  }, []);

  return { embed };
}
/* v8 ignore stop */
