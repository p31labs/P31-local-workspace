import { addLog } from './EventLogger';

let dbInstance: any = null;

export async function getChaosVault(): Promise<any> {
  if (dbInstance) return dbInstance;

  try {
    const { PGlite } = await import('@electric-sql/pglite');
    dbInstance = new PGlite({ connectionString: 'idb://p31-chaos-vault' });
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS unified_knowledge_graph (
        id BigSerial PRIMARY KEY,
        source_door Text NOT NULL,
        raw_text Text NOT NULL,
        embedding_json Text NOT NULL,
        created_at Timestamp DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_source_door ON unified_knowledge_graph(source_door);
    `);
  } catch (error) {
    addLog('ChaosVault:init', { error, fallback: 'memory' });
    try {
      const { PGlite } = await import('@electric-sql/pglite');
      dbInstance = new PGlite({ connectionString: 'memory://' });
      await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS unified_knowledge_graph (
          id BigSerial PRIMARY KEY,
          source_door Text NOT NULL,
          raw_text Text NOT NULL,
          embedding_json Text NOT NULL,
          created_at Timestamp DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_source_door ON unified_knowledge_graph(source_door);
      `);
    } catch (criticalError) {
      addLog('ChaosVault:init:critical', { error: criticalError });
      return null;
    }
  }

  return dbInstance;
}

export async function ingestToChaosVault(
  door: string,
  text: string,
  embedding: number[],
): Promise<void> {
  try {
    const db = await getChaosVault();
    if (!db) return;
    const vectorStr = JSON.stringify(embedding);
    await db.query(
      'INSERT INTO unified_knowledge_graph (source_door, raw_text, embedding_json) VALUES ($1, $2, $3)',
      [door, text, vectorStr],
    );
  } catch (e) {
    addLog('ChaosVault:ingest', { error: e });
  }
}

export async function querySimilarity(
  embedding: number[],
  limit: number = 3,
): Promise<Array<{ source_door: string; raw_text: string; score: number }>> {
  try {
    const db = await getChaosVault();
    if (!db) return [];

    const res = await db.query('SELECT source_door, raw_text, embedding_json FROM unified_knowledge_graph');
    const entries = (res.rows || []) as Array<{ source_door: string; raw_text: string; embedding_json: string }>;

    const parsed = entries.map((e) => ({
      source_door: e.source_door,
      raw_text: e.raw_text,
      embedding: JSON.parse(e.embedding_json || '[]') as number[],
    }));

    const dotProduct = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitude = (a: number[]) => Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magA = magnitude(embedding);
    if (magA === 0) return [];

    return parsed
      .map((entry) => {
        const magB = magnitude(entry.embedding);
        if (magB === 0) return { source_door: entry.source_door, raw_text: entry.raw_text, score: 0 };
        return { source_door: entry.source_door, raw_text: entry.raw_text, score: dotProduct(embedding, entry.embedding) / (magA * magB) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (e) {
    addLog('ChaosVault:query', { error: e });
    return [];
  }
}
