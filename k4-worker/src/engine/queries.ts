// ═══════════════════════════════════════════════════════════════
// K₄ CAGE — D1 Query Utilities
// ═══════════════════════════════════════════════════════════════

import { ImpedanceResult } from './impedance';

export interface EdgeRecord {
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  impedance_score: number;
  last_interaction_at: string;
  interaction_count: number;
  threshold_current: number;
  threshold_base: number;
  metadata_json: string;
}

export async function getEdge(env: { K4_DB: D1Database }, edgeId: string): Promise<EdgeRecord | null> {
  return await env.K4_DB.prepare(
    'SELECT * FROM relational_edges WHERE edge_id = ?'
  ).bind(edgeId).first<EdgeRecord>() ?? null;
}

export async function updateEdgeImpedance(env: { K4_DB: D1Database }, edgeId: string, score: number): Promise<void> {
  await env.K4_DB.prepare(
    'UPDATE relational_edges SET impedance_score = ?, last_interaction_at = datetime("now"), interaction_count = interaction_count + 1 WHERE edge_id = ?'
  ).bind(score, edgeId).run();
}

export async function getEdgeMetrics(env: { K4_DB: D1Database }, edgeId: string): Promise<{
  avgToneScore: number;
  avgLatencyHours: number;
  rejectionRate: number;
}> {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const packets = await env.K4_DB.prepare(`
    SELECT tone_score, created_at, status
    FROM structural_packets
    WHERE edge_id = ? AND created_at >= ?
    ORDER BY created_at DESC
    LIMIT 100
  `).bind(edgeId, last30Days).all<{ tone_score: number; created_at: string; status: string }>();

  if (!packets.results || packets.results.length === 0) {
    return { avgToneScore: 0.3, avgLatencyHours: 24, rejectionRate: 0.1 };
  }

  const results = packets.results;
  const avgToneScore = results.reduce((sum, p) => sum + (p.tone_score || 0), 0) / results.length;
  
  // Calculate avg latency between messages
  let totalLatencyMs = 0;
  let latencyCount = 0;
  for (let i = 0; i < results.length - 1; i++) {
    const t1 = new Date(results[i].created_at).getTime();
    const t2 = new Date(results[i + 1].created_at).getTime();
    totalLatencyMs += Math.abs(t2 - t1);
    latencyCount++;
  }
  const avgLatencyHours = latencyCount > 0 ? (totalLatencyMs / latencyCount) / (1000 * 60 * 60) : 24;

  // Rejection rate = packets marked as 'buffered' or 'quarantined'
  const rejectedCount = results.filter(p => p.status === 'buffered' || p.status === 'quarantined').length;
  const rejectionRate = rejectedCount / results.length;

  return {
    avgToneScore,
    avgLatencyHours,
    rejectionRate
  };
}

export async function createEdge(env: { K4_DB: D1Database }, source: string, target: string, type: string): Promise<string> {
  const edgeId = `edge-${source}-${target}`;
  await env.K4_DB.prepare(`
    INSERT OR IGNORE INTO relational_edges (edge_id, source_node_id, target_node_id, edge_type, impedance_score, threshold_current)
    VALUES (?, ?, ?, ?, 0.5, 0.65)
  `).bind(edgeId, source, target, type).run();
  return edgeId;
}

export async function getNodeByDid(env: { K4_DB: D1Database }, did: string) {
  return await env.K4_DB.prepare(
    'SELECT * FROM system_nodes WHERE did = ?'
  ).bind(did).first();
}

export async function listActiveNodes(env: { K4_DB: D1Database }) {
  return await env.K4_DB.prepare(
    'SELECT * FROM system_nodes WHERE status = "active" ORDER BY created_at'
  ).all();
}

export async function recordPacket(
  env: { K4_DB: D1Database },
  packet: {
    packetId: string;
    edgeId: string;
    senderDid: string;
    category: string;
    action: string;
    objectId: string;
    payloadHash: string;
    nspMode: boolean;
    toneScore: number;
    impedanceContribution: number;
    status: string;
  }
): Promise<void> {
  await env.K4_DB.prepare(`
    INSERT INTO structural_packets (
      packet_id, edge_id, sender_did, category, action, object_id,
      payload_plaintext_hash, nsp_mode, tone_score, impedance_contribution, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    packet.packetId,
    packet.edgeId,
    packet.senderDid,
    packet.category,
    packet.action,
    packet.objectId,
    packet.payloadHash,
    packet.nspMode ? 1 : 0,
    packet.toneScore,
    packet.impedanceContribution,
    packet.status
  ).run();
}
