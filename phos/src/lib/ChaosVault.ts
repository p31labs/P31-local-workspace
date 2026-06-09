let dbInstance: any = null;

export async function getChaosVault(): Promise<any> {
  if (!dbInstance) {
    const { PGlite } = await import('@electric-sql/pglite');
    dbInstance = new PGlite({
      connectionString: 'idb://p31-chaos-vault',
    });
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS unified_knowledge_graph (
        id BigSerial PRIMARY KEY,
        source_door Text NOT NULL,
        raw_text Text NOT NULL,
        embedding Float4[] NOT NULL,
        created_at Timestamp DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_source_door ON unified_knowledge_graph(source_door);
    `);
  }
  return dbInstance;
}

export async function ingestToChaosVault(
  door: string,
  text: string,
  embedding: number[],
): Promise<void> {
  const db = await getChaosVault();
  const vectorStr = `[${embedding.join(',')}]`;
  await db.query(
    'INSERT INTO unified_knowledge_graph (source_door, raw_text, embedding) VALUES ($1, $2, $3::float4[]);',
    [door, text, vectorStr],
  );
}

export async function querySimilarity(
  embedding: number[],
  limit: number = 3,
): Promise<Array<{ source_door: string; raw_text: string; score: number }>> {
  const db = await getChaosVault();
  const res = await db.query('SELECT source_door, raw_text, embedding FROM unified_knowledge_graph');
  const entries = res.rows as Array<{ source_door: string; raw_text: string; embedding: number[] }>;

  const dotProduct = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitude = (a: number[]) => Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magA = magnitude(embedding);
  if (magA === 0) return [];

  return entries
    .map((entry) => {
      const magB = magnitude(entry.embedding);
      if (magB === 0) return { ...entry, score: 0 };
      return { ...entry, score: dotProduct(embedding, entry.embedding) / (magA * magB) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
