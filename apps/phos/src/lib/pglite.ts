import { PGlite } from '@electric-sql/pglite';
import { live } from '@electric-sql/pglite/live';

export type ChatMessage = {
  id: string;
  role: string;
  content: string;
  created_at?: string;
};

let dbInstance: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

export async function initDb(): Promise<PGlite> {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = PGlite.create({
      dataDir: 'idb://phos-chat-db',
      extensions: { live },
    }).then(async (db) => {
      await db.exec(`CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
        ON chat_messages(created_at)`);
      await db.exec(`CREATE TABLE IF NOT EXISTS ai_routing_log (
        id TEXT PRIMARY KEY,
        prompt_hash TEXT,
        route TEXT NOT NULL,
        confidence REAL NOT NULL,
        entropy REAL NOT NULL,
        variance REAL NOT NULL,
        semantic REAL NOT NULL,
        abstention REAL NOT NULL,
        tier TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )`);
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_routing_timestamp ON ai_routing_log(timestamp DESC)`);
      await db.exec(`CREATE TABLE IF NOT EXISTS embeddings (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        embedding JSONB NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      await db.exec(`CREATE INDEX IF NOT EXISTS idx_embeddings_source_type ON embeddings(source_type)`);
      dbInstance = db;
      return db;
    });
  }
  return initPromise;
}

export function getDb(): PGlite | null {
  return dbInstance;
}
