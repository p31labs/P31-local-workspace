import { getDb } from './pglite';

export interface SearchResult {
  id: string;
  content: string;
  sourceType: string;
  sourceId: string | null;
  metadata: any;
  similarity: number;
  created_at: string;
}

let worker: Worker | null = null;
let workerReady = false;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/embedding.worker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export class SemanticSearchEngine {
  async init(): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('PGlite not initialized');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        embedding JSONB NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.warmWorker();
  }

  async warmWorker(): Promise<void> {
    if (workerReady) return;
    try {
      const w = getWorker();
      await new Promise<void>((resolve) => {
        const handler = (event: MessageEvent) => {
          if (event.data.id === '__warmup__' && event.data.type === 'embed-result') {
            w.removeEventListener('message', handler);
            workerReady = true;
            resolve();
          }
        };
        w.addEventListener('message', handler);
        w.postMessage({ id: '__warmup__', type: 'embed', payload: { text: 'warmup' } });
        setTimeout(() => {
          w.removeEventListener('message', handler);
          workerReady = true;
          resolve();
        }, 5000);
      });
    } catch {
      workerReady = true;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const w = getWorker();
    const id = `emb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return new Promise<number[]>((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          w.removeEventListener('message', handler);
          if (event.data.embedding) {
            resolve(event.data.embedding);
          } else {
            reject(new Error(event.data.error || 'No embedding returned'));
          }
        }
      };
      w.addEventListener('message', handler);
      w.postMessage({ id, type: 'embed', payload: { text } });
      setTimeout(() => {
        w.removeEventListener('message', handler);
        reject(new Error('EMBED_TIMEOUT'));
      }, 60000);
    });
  }

  async insertEmbedding(
    id: string,
    content: string,
    embedding: number[],
    sourceType: string,
    sourceId?: string,
    metadata?: any
  ): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('PGlite not initialized');

    await db.query(
      `INSERT INTO embeddings (id, content, embedding, source_type, source_id, metadata)
       VALUES ($1, $2, $3::JSONB, $4, $5, $6)`,
      [id, content, JSON.stringify(embedding), sourceType, sourceId || null, JSON.stringify(metadata || {})]
    );
  }

  async search(queryText: string, limit = 10): Promise<SearchResult[]> {
    const db = getDb();
    if (!db) throw new Error('PGlite not initialized');

    const queryEmbedding = await this.generateEmbedding(queryText);

    const result = await db.query<{
      id: string;
      content: string;
      embedding: string;
      source_type: string;
      source_id: string;
      metadata: string;
      created_at: string;
    }>(
      `SELECT id, content, embedding, source_type, source_id, metadata, created_at FROM embeddings`
    );

    const scored = result.rows.map((r) => {
      const stored: number[] = r.embedding === null ? [] : JSON.parse(r.embedding);
      return {
        id: r.id,
        content: r.content,
        sourceType: r.source_type,
        sourceId: r.source_id,
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
        similarity: cosineSimilarity(queryEmbedding, stored),
        created_at: r.created_at,
      };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, limit);
  }

  async deleteEmbedding(id: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('PGlite not initialized');
    await db.query('DELETE FROM embeddings WHERE id = $1', [id]);
  }

  async clearAll(): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('PGlite not initialized');
    await db.exec('DELETE FROM embeddings');
  }

  async getCount(): Promise<number> {
    const db = getDb();
    if (!db) return 0;
    const result = await db.query<{ count: number }>('SELECT COUNT(*) as count FROM embeddings');
    return Number(result.rows[0]?.count || 0);
  }

  async indexContent(
    id: string,
    content: string,
    sourceType: string,
    sourceId?: string,
    metadata?: any
  ): Promise<void> {
    const embedding = await this.generateEmbedding(content);
    await this.insertEmbedding(id, content, embedding, sourceType, sourceId, metadata);
  }
}

export const semanticSearch = new SemanticSearchEngine();
