import { getDb } from './pglite';

export interface RoutingLogEntry {
  id: string;
  promptHash: string;
  route: string;
  confidence: number;
  entropy: number;
  variance: number;
  semantic: number;
  abstention: number;
  tier: string;
  timestamp: number;
}

export async function getRoutingLogs(limit = 50): Promise<RoutingLogEntry[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const result = await db.query(
      'SELECT id, prompt_hash, route, confidence, entropy, variance, semantic, abstention, tier, timestamp FROM ai_routing_log ORDER BY timestamp DESC LIMIT $1',
      [limit],
    );
    return (result.rows as any[]).map(r => ({
      id: r.id,
      promptHash: r.prompt_hash,
      route: r.route,
      confidence: Number(r.confidence),
      entropy: Number(r.entropy),
      variance: Number(r.variance),
      semantic: Number(r.semantic),
      abstention: Number(r.abstention),
      tier: r.tier,
      timestamp: Number(r.timestamp),
    }));
  } catch {
    return [];
  }
}

export async function getRoutingStats(): Promise<{ total: number; localRate: number; avgConfidence: number }> {
  const db = getDb();
  if (!db) return { total: 0, localRate: 0, avgConfidence: 0 };
  try {
    const total = await db.query('SELECT COUNT(*) as count FROM ai_routing_log');
    const local = await db.query("SELECT COUNT(*) as count FROM ai_routing_log WHERE route = 'local'");
    const avg = await db.query('SELECT AVG(confidence) as avg FROM ai_routing_log');
    const rows = total.rows as any[];
    const localRows = local.rows as any[];
    const avgRows = avg.rows as any[];
    const count = Number(rows[0]?.count || 0);
    const localCount = Number(localRows[0]?.count || 0);
    const avgConf = Number(avgRows[0]?.avg || 0);
    return {
      total: count,
      localRate: count > 0 ? localCount / count : 0,
      avgConfidence: avgConf,
    };
  } catch {
    return { total: 0, localRate: 0, avgConfidence: 0 };
  }
}
