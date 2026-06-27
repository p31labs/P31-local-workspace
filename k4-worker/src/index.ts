// ═══════════════════════════════════════════════════════════════
// K₄ CAGE WORKER — Sovereign Co-Parenting Delta-Mesh Orchestrator
// Tetrahedron Protocol v2.0 | P31 Labs | Johnson v. Johnson
// ═══════════════════════════════════════════════════════════════

import { verifyDualSignature, generateKeyPair, generateNonce, hashPayload, uint8ArrayToBase64 } from './crypto/verify';
import { calculateImpedance } from './engine/impedance';
import { getEdge, updateEdgeImpedance, createEdge, getNodeByDid } from './engine/queries';
import { ContentFilter } from './guardian/content-filter';
import { PassportContext, getContext } from './cognitive/passport';
import { EdgeRecord } from './engine/queries';
import { createLogger } from './middleware/logger';
import { handleOpenAPI } from './endpoints/openapi';

export interface Env {
  K4_DB: D1Database;
  K4_KV_STORE: KVNamespace;
  AI: Ai;
  BUFFER_URL?: string;
  BUFFER_WORKER: Fetcher;
}

export interface K4Request {
  did: string;
  nonce: string;
  timestamp: string;
  payload: Record<string, unknown>;
  signatures: {
    ed25519: string;
    mldsa65: string;
  };
  target_vertex?: string;
}

// ── CORS ──

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-P31-Topology': 'K4-Delta-Mesh',
  'X-P31-Protocol': 'Tetrahedron-v2',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

// ── MAIN FETCH HANDLER ─

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const logger = createLogger(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // OpenAPI spec serving
    if ((url.pathname === '/openapi.json' || url.pathname === '/openapi.yaml') && request.method === 'GET') {
      return handleOpenAPI();
    }

    // Health check (public)
    if (url.pathname === '/health' && request.method === 'GET') {
      return jsonResponse({ status: 'ok', topology: 'K4-Delta-Mesh', timestamp: new Date().toISOString() });
    }

    // Public key generation (for operator onboarding)
    if (url.pathname === '/auth/keygen' && request.method === 'POST') {
      return handleKeygen();
    }

    // Public key registration (store in D1)
    if (url.pathname === '/auth/register' && request.method === 'POST') {
      return handleRegister(request, env);
    }

    // Public DID resolution
    if (url.pathname === '/did/resolve' && request.method === 'GET') {
      return handleDidResolve(env, url);
    }

    // Public engagement ingestion (from BONDING)
    if (url.pathname === '/engagement' && request.method === 'POST') {
      return handleEngagementIngest(request, env);
    }

    // Public structured packet routing (from The Buffer)
    if (url.pathname === '/packet' && request.method === 'POST') {
      try {
        return await handleStructuredPacket(request, env);
      } catch (err) {
        console.error('[K4] /packet error:', err);
        return jsonResponse({ error: 'Internal error', message: err instanceof Error ? err.message : String(err) }, 500);
      }
    }

    // Public Fawn Guard analysis
    if (url.pathname === '/guard/analyze' && request.method === 'POST') {
      return handleGuardAnalyze(request, env);
    }

    // Public edge status query
    if (url.pathname === '/edge/status' && request.method === 'GET') {
      return handleEdgeStatus(env, url);
    }

    // All other routes: authenticated
    return handleAuthenticatedRequest(request, env);
  },
};

// ── AUTHENTICATION GATE (body-based dual signatures) ──

async function handleAuthenticatedRequest(request: Request, env: Env): Promise<Response> {
  // API Key auth (simpler path for tenant access)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.slice(7);
    const node = await env.K4_DB.prepare(
      'SELECT node_id, did, node_type, status FROM system_nodes WHERE api_key = ?'
    ).bind(apiKey).first<{ node_id: string; did: string; node_type: string; status: string }>();
    if (!node || node.status !== 'active') {
      return jsonResponse({ error: 'Invalid API key' }, 403);
    }
    const context = getContext(node.node_type);
    const url = new URL(request.url);
    return routeAuthenticated(request, env, node, context, url);
  }

  // DID-based dual signature auth (strong path)
  let body: K4Request;
  try {
    body = await request.json() as K4Request;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { did, signatures, nonce, timestamp } = body;

  if (!did || !signatures?.ed25519 || !signatures?.mldsa65 || !nonce || !timestamp) {
    return jsonResponse({ error: 'Missing authentication fields in body (did, signatures.ed25519, signatures.mldsa65, nonce, timestamp)' }, 401);
  }

  // Verify nonce freshness (5 minute window)
  const nonceAge = Date.now() - parseInt(timestamp, 10);
  if (nonceAge > 5 * 60 * 1000) {
    return jsonResponse({ error: 'Timestamp window exceeded' }, 401);
  }

  // Check nonce hasn't been used (replay protection)
  const nonceRow = await env.K4_DB.prepare(
    'SELECT nonce FROM did_nonces WHERE nonce = ? AND expires_at > datetime("now")'
  ).bind(nonce).first();

  if (nonceRow) {
    return jsonResponse({ error: 'Nonce already used' }, 401);
  }

  // Verify dual signature
  const canonicalPayload = JSON.stringify({ did, nonce, timestamp, payload: body.payload ?? {} });
  const isValid = await verifyDualSignature(canonicalPayload, did, signatures.ed25519, signatures.mldsa65, env);

  if (!isValid) {
    return jsonResponse({ error: 'Invalid dual signature (Ed25519 + ML-DSA-65)' }, 403);
  }

  // Mark nonce as used
  await env.K4_DB.prepare(
    'INSERT INTO did_nonces (nonce, did, expires_at) VALUES (?, ?, datetime("now", "+10 minutes"))'
  ).bind(nonce, did).run();

  // Get node info
  const node = await env.K4_DB.prepare(
    'SELECT node_id, node_type, status FROM system_nodes WHERE did = ?'
  ).bind(did).first<{ node_id: string; node_type: string; status: string }>();

  if (!node || node.status !== 'active') {
    return jsonResponse({ error: 'Node not found or suspended' }, 403);
  }

  // Inject passport context
  const context = getContext(node.node_type);
  const url = new URL(request.url);
  return routeAuthenticated(request, env, node, context, url);
}

async function routeAuthenticated(request: Request, env: Env, node: { node_id: string; node_type: string }, context: PassportContext, url: URL): Promise<Response> {
  let body: Record<string, unknown> = {};
  if (request.method === 'POST') {
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }
  }

  // BONDING room creation with DID
  if (url.pathname === '/bonding/room' && request.method === 'POST') {
    return handleBondingRoomCreate(body, env, node, context);
  }

  // BONDING room join with DID
  if (url.pathname.startsWith('/bonding/room/') && request.method === 'POST') {
    const code = url.pathname.split('/')[3];
    return handleBondingRoomJoin(body, env, node, context, code);
  }

  return jsonResponse({
    error: 'Authenticated but no route matched',
    node: node.node_id,
    context
  }, 404);
}

// ── BONDING ROOM CREATION (DID-gated) ──

async function handleBondingRoomCreate(
  body: Record<string, unknown>,
  env: Env,
  node: { node_id: string; node_type: string },
  context: PassportContext
): Promise<Response> {
  const { childDid, mode } = body.payload as { childDid?: string; mode?: string };

  if (!['PARENT_A', 'PARENT_B'].includes(node.node_type)) {
    return jsonResponse({ error: 'Only parents can create rooms' }, 403);
  }

  if (!childDid) {
    return jsonResponse({ error: 'childDid required for room creation' }, 400);
  }

  const child = await env.K4_DB.prepare(
    'SELECT node_id, node_type FROM system_nodes WHERE did = ? AND status = "active"'
  ).bind(childDid).first<{ node_id: string; node_type: string }>();

  if (!child || child.node_type !== 'CHILD') {
    return jsonResponse({ error: 'Invalid child DID' }, 400);
  }

  const dayKey = new Date().toISOString().split('T')[0];
  const roomId = await hashPayload(`${body.did}:${childDid}:${dayKey}`, env);

    await env.K4_KV_STORE.put(`room:${roomId}`, JSON.stringify({
    roomId,
    parentDid: body.did,
    parentNodeId: node.node_id,
    childDid,
    childNodeId: child.node_id,
    mode: mode || 'seed',
    createdAt: new Date().toISOString(),
    context
  }), { expirationTtl: 7 * 24 * 60 * 60 });

  const edgeId = `edge-${node.node_id}-${child.node_id}`;
  await createEdge(env, node.node_id, child.node_id, 'comm');
  await updateEdgeImpedance(env, edgeId, 0.3);

  return jsonResponse({
    roomId,
    childDid,
    mode: mode || 'seed',
    context,
    message: 'BONDING room created. Child engagement will modulate parent-parent impedance.'
  });
}

// ── BONDING ROOM JOIN (DID-gated) ──

async function handleBondingRoomJoin(
  body: Record<string, unknown>,
  env: Env,
  node: { node_id: string; node_type: string },
  context: PassportContext,
  code: string
): Promise<Response> {
  const childDid = body.childDid as string;
  if (!childDid) {
    return jsonResponse({ error: 'childDid required' }, 400);
  }

  const roomData = await env.K4_KV_STORE.get(`room:${code}`);
  if (!roomData) {
    return jsonResponse({ error: 'Room not found' }, 404);
  }

  const room = JSON.parse(roomData);

  if (room.childDid !== childDid) {
    return jsonResponse({ error: 'Child DID does not match room' }, 403);
  }

  const edgeId = `edge-${room.parentNodeId}-${room.childNodeId}`;
  await updateEdgeImpedance(env, edgeId, 0.3);

  return jsonResponse({
    roomId: room.roomId,
    childDid,
    joined: true,
    edgeId,
    message: 'Joined BONDING room. Child engagement will modulate impedance.'
  });
}

// ── ENGAGEMENT INGESTION (BONDING → Buffer Bridge) ──

async function handleEngagementIngest(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    roomCode: string;
    childDid: string;
    eventType: 'ATOM_PLACED' | 'PING_SENT' | 'MOLECULE_COMPLETED' | 'SESSION_START' | 'SESSION_END';
    payload: Record<string, unknown>;
    serverHash: string;
    serverVerified: boolean;
    cfRay?: string;
    cfTlsVersion?: string;
    cfCountry?: string;
    userAgent?: string;
  };

  if (!body.roomCode || !body.childDid || !body.eventType) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const child = await env.K4_DB.prepare(
    'SELECT node_id FROM system_nodes WHERE did = ? AND status = "active"'
  ).bind(body.childDid).first<{ node_id: string }>();

  if (!child) {
    return jsonResponse({ error: 'Unknown child DID' }, 403);
  }

  const eventId = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await env.K4_DB.prepare(`
    INSERT INTO bonding_events (event_id, room_code, child_did, event_type, payload_json, server_hash, server_verified, cf_ray, cf_tls_version, cf_country, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    eventId,
    body.roomCode,
    body.childDid,
    body.eventType,
    JSON.stringify(body.payload),
    body.serverHash,
    body.serverVerified ? 1 : 0,
    body.cfRay || null,
    body.cfTlsVersion || null,
    body.cfCountry || null,
    body.userAgent || null
  ).run();

  const edgeId = `edge-node-will-001-${child.node_id}`;
  const edge = await getEdge(env, edgeId);

  if (!edge) {
    await createEdge(env, 'node-will-001', child.node_id, 'comm');
  }

  if (edge) {
    const engagementDelta = calculateEngagementDelta(body.eventType, body.payload);
    const currentImpedance = edge.impedance_score || 0.5;
    const newImpedance = Math.max(0.1, currentImpedance * 0.9 - engagementDelta * 0.1);
    await updateEdgeImpedance(env, edgeId, newImpedance);
  }

  await createStructuralPacket(env, {
    edgeId: `edge-node-will-001-${child.node_id}`,
    senderDid: body.childDid,
    category: 'ENGAGEMENT',
    action: 'REPORT',
    objectId: body.roomCode,
    payload: body.payload,
    eventType: body.eventType,
    nspMode: true,
    toneScore: 0.0,
    impedanceContribution: -0.05
  });

  return jsonResponse({
    eventId,
    status: 'ingested',
    timestamp: new Date().toISOString()
  });
}

// ── STRUCTURED PACKET ROUTING (The Buffer Interface) ──

async function handleStructuredPacket(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    edgeId: string;
    senderDid: string;
    category: string;
    action: string;
    objectId: string;
    payload: Record<string, unknown>;
    eventType?: string;
    nspMode: boolean;
    toneScore?: number;
    impedanceContribution?: number;
    structuralValid?: boolean;
    content?: string;
  };

  const content = body.content ?? JSON.stringify(body.payload);

  // Fetch edge details for latency calculation
  const edge = await getEdge(env, body.edgeId);
  const latencyHours = edge?.last_interaction_at
    ? (Date.now() - new Date(edge.last_interaction_at).getTime()) / (1000 * 60 * 60)
    : 24;

  // Get rejection history from past packets on this edge
  const history = await env.K4_DB.prepare(
    `SELECT status FROM structural_packets WHERE edge_id = ? ORDER BY created_at DESC LIMIT 20`
  ).bind(body.edgeId).all<{ status: string }>();
  const rejectionHistory = (history.results ?? []).map((r) => r.status);

  // Resolve sender node type for Buffer context
  const senderNode = await env.K4_DB.prepare(
    'SELECT node_type FROM system_nodes WHERE did = ?'
  ).bind(body.senderDid).first<{ node_type: string }>();
  const senderNodeType = senderNode?.node_type || 'PARENT_A';

  // Call Buffer Worker for moderation + impedance routing via service binding
  let moderationResult: {
    moderationId: string;
    scScore: number;
    ieScore: number;
    state: string;
    action: string;
    rationale: string;
    triggeredRules: string[];
    aiUsed: boolean;
  };
  let bufferOk = true;

  try {
    const resp = await env.BUFFER_WORKER.fetch('/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packetId: `pkt-${Date.now()}`,
        edgeId: body.edgeId,
        senderDid: body.senderDid,
        nodeType: senderNodeType,
        category: body.category,
        content,
        nspMode: body.nspMode,
        structuralValid: body.structuralValid ?? true,
        pushStrength: body.impedanceContribution ?? 0,
        latencyHours,
        rejectionHistory,
      }),
    });

    if (!resp.ok) throw new Error(`Buffer responded with ${resp.status}`);
    moderationResult = await resp.json();
  } catch (err) {
    bufferOk = false;
    console.warn('[K4] Buffer fallback:', err instanceof Error ? err.message : String(err));
    // Fallback: local deterministic scoring using ContentFilter
    const filter = new ContentFilter();
    const toneResult = await filter.analyze(content, body.senderDid, body.edgeId, 'message');
    const scScore = toneResult.coerciveScore * 0.5 + toneResult.fawnMaskingScore * 0.3 + toneResult.childSafetyScore * 0.2;
    const pushStrength = body.impedanceContribution ?? 0;
    const ieScore = Math.max(0.0, Math.min(1.0, (0.4 * scScore) + (0.3 * (latencyHours / 72)) + (0.3 * (rejectionHistory.length > 0 ? rejectionHistory.filter(r => r === 'buffered' || r === 'quarantined').length / rejectionHistory.length : 0.1)) - pushStrength * 0.15));
    const threshold = pushStrength > 0.1 ? Math.max(0.45, 0.65 - 0.1) : 0.65;
    let state = 'active';
    let action = 'deliver';
    if (ieScore >= threshold + 0.15 || scScore >= 0.7) { state = 'quarantined'; action = 'quarantine'; }
    else if (ieScore >= threshold || scScore >= 0.45) { state = 'buffered'; action = 'buffer'; }
    else if (scScore >= 0.2) { action = 'revise'; }

    moderationResult = {
      moderationId: `mod-fallback-${Date.now()}`,
      scScore,
      ieScore,
      state,
      action,
      rationale: 'Buffer unavailable — local fallback routing.',
      triggeredRules: toneResult.triggeredRules,
      aiUsed: false,
    };
  }

  // Persist packet with moderation result
  const packetId = `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payloadHash = await hashPayload(JSON.stringify(body.payload), env);

  // Ensure edge exists to satisfy FK constraint
  const existingEdge = await getEdge(env, body.edgeId);
  if (!existingEdge) {
    const inner = body.edgeId.replace('edge-', '');
    const lastNodeIdx = inner.lastIndexOf('node-');
    const source = inner.substring(0, lastNodeIdx - 1);
    const target = inner.substring(lastNodeIdx);
    await createEdge(env, source, target, 'comm');
  }

  const stateToStatus: Record<string, string> = { active: 'delivered', buffered: 'buffered', quarantined: 'quarantined' };
  const dbStatus = stateToStatus[moderationResult.state] || 'pending';

  await env.K4_DB.prepare(`
    INSERT INTO structural_packets (
      packet_id, edge_id, sender_did, category, action, object_id,
      payload_plaintext_hash, nsp_mode, tone_score, impedance_contribution, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    packetId,
    body.edgeId,
    body.senderDid,
    body.category,
    body.action,
    body.objectId,
    payloadHash,
    body.nspMode ? 1 : 0,
    moderationResult.scScore,
    body.impedanceContribution ?? 0,
    dbStatus
  ).run();

  // Update edge impedance based on Buffer's I_e
  await updateEdgeImpedance(env, body.edgeId, moderationResult.ieScore);

  // Route according to Buffer's action
  if (moderationResult.action === 'buffer') {
    await routeToParkingLot(env, packetId, body.edgeId, moderationResult.ieScore);
  } else if (moderationResult.action === 'quarantine') {
    await env.K4_DB.prepare(
      'UPDATE structural_packets SET status = "quarantined" WHERE packet_id = ?'
    ).bind(packetId).run();
  } else {
    await env.K4_DB.prepare(
      'UPDATE structural_packets SET status = "delivered" WHERE packet_id = ?'
    ).bind(packetId).run();
  }

  return jsonResponse({
    packetId,
    moderationId: moderationResult.moderationId,
    scScore: moderationResult.scScore,
    ieScore: moderationResult.ieScore,
    state: moderationResult.state,
    action: moderationResult.action,
    rationale: moderationResult.rationale,
    triggeredRules: moderationResult.triggeredRules,
    bufferUsed: bufferOk,
    aiUsed: moderationResult.aiUsed,
    timestamp: new Date().toISOString()
  });
}

// ── FAWN GUARD ANALYSIS ──

async function handleGuardAnalyze(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    content: string;
    authorDid: string;
    targetDid: string;
    contextType: 'message' | 'ping' | 'journal';
  };

  const filter = new ContentFilter();
  const analysis = await filter.analyze(body.content, body.authorDid, body.targetDid, body.contextType);

  return jsonResponse({
    analysis,
    timestamp: new Date().toISOString()
  });
}

// ── EDGE STATUS QUERY ──

async function handleEdgeStatus(env: Env, url: URL): Promise<Response> {
  const source = url.searchParams.get('source');
  const target = url.searchParams.get('target');

  if (!source || !target) {
    return jsonResponse({ error: 'source and target DIDs required' }, 400);
  }

  const sourceNode = await env.K4_DB.prepare(
    'SELECT node_id FROM system_nodes WHERE did = ?'
  ).bind(source).first<{ node_id: string }>();

  const targetNode = await env.K4_DB.prepare(
    'SELECT node_id FROM system_nodes WHERE did = ?'
  ).bind(target).first<{ node_id: string }>();

  if (!sourceNode || !targetNode) {
    return jsonResponse({ error: 'Node not found' }, 404);
  }

  const edgeId = `edge-${sourceNode.node_id}-${targetNode.node_id}`;
  const edge = await getEdge(env, edgeId);

  if (!edge) {
    return jsonResponse({ error: 'Edge not found' }, 404);
  }

  return jsonResponse({
    edgeId: edge.edge_id,
    source,
    target,
    impedance: edge.impedance_score,
    threshold: edge.threshold_current,
    status: edge.impedance_score >= (edge.threshold_current || 0.65) ? 'buffered' : 'active',
    interactionCount: edge.interaction_count,
    lastInteraction: edge.last_interaction_at
  });
}

// ── DID RESOLUTION (PUBLIC) ──

async function handleDidResolve(env: Env, url: URL): Promise<Response> {
  const did = url.searchParams.get('did');

  if (!did) {
    return jsonResponse({ error: 'did parameter required' }, 400);
  }

  const node = await env.K4_DB.prepare(
    'SELECT node_id, node_type, display_name, status, created_at FROM system_nodes WHERE did = ?'
  ).bind(did).first();

  if (!node) {
    return jsonResponse({ error: 'DID not found' }, 404);
  }

  return jsonResponse({
    did,
    ...node,
    verificationMethod: {
      id: did,
      type: 'Ed25519VerificationKey2021',
      controller: did
    }
  });
}

// ── KEY GENERATION (PUBLIC) ──

async function handleKeygen(): Promise<Response> {
  const keys = await generateKeyPair();

  return jsonResponse({
    did: keys.did,
    ed25519: {
      publicKey: uint8ArrayToBase64(keys.ed25519.publicKey),
      privateKey: uint8ArrayToBase64(keys.ed25519.privateKey)
    },
    mldsa65: {
      publicKey: uint8ArrayToBase64(keys.mldsa65.publicKey),
      secretKey: uint8ArrayToBase64(keys.mldsa65.secretKey)
    }
  });
}

// ── KEY REGISTRATION (PUBLIC) ──

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    did: string;
    nodeType: string;
    displayName?: string;
    ed25519PublicKey: string;
    mldsa65PublicKey: string;
  };

  if (!body.did || !body.nodeType || !body.ed25519PublicKey || !body.mldsa65PublicKey) {
    return jsonResponse({ error: 'Missing required fields: did, nodeType, ed25519PublicKey, mldsa65PublicKey' }, 400);
  }

  const validTypes = ['PARENT_A', 'PARENT_B', 'CHILD', 'SYSTEM_CORE'];
  if (!validTypes.includes(body.nodeType)) {
    return jsonResponse({ error: `Invalid nodeType. Must be one of: ${validTypes.join(', ')}` }, 400);
  }

  const nodeId = `node-${body.nodeType.toLowerCase()}-${Date.now()}`;
  const apiKey = `p31_${Array.from(new Uint8Array(32)).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('')}`;

  await env.K4_DB.prepare(`
    INSERT INTO system_nodes (node_id, did, node_type, display_name, quantum_pubkey_mldsa, classical_pubkey_ed25519, api_key, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    nodeId,
    body.did,
    body.nodeType,
    body.displayName || 'Unknown',
    body.mldsa65PublicKey,
    body.ed25519PublicKey,
    apiKey,
    'active'
  ).run();

  return jsonResponse({ nodeId, did: body.did, status: 'registered', apiKey });
}

// ── HELPERS ──

function calculateEngagementDelta(eventType: string, payload: Record<string, unknown>): number {
  switch (eventType) {
    case 'ATOM_PLACED': return 0.02;
    case 'PING_SENT': return 0.05;
    case 'MOLECULE_COMPLETED': return 0.15;
    case 'SESSION_START': return 0.1;
    case 'SESSION_END': return -0.05;
    default: return 0.0;
  }
}

async function createStructuralPacket(env: Env, packet: {
  edgeId: string;
  senderDid: string;
  category: string;
  action: string;
  objectId: string;
  payload: Record<string, unknown>;
  eventType?: string;
  nspMode: boolean;
  toneScore: number;
  impedanceContribution: number;
}): Promise<void> {
  const packetId = `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payloadHash = await hashPayload(JSON.stringify(packet.payload), env);

  await env.K4_DB.prepare(`
    INSERT INTO structural_packets (
      packet_id, edge_id, sender_did, category, action, object_id,
      payload_plaintext_hash, nsp_mode, tone_score, impedance_contribution, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    packetId,
    packet.edgeId,
    packet.senderDid,
    packet.category,
    packet.action,
    packet.objectId,
    payloadHash,
    packet.nspMode ? 1 : 0,
    packet.toneScore,
    packet.impedanceContribution,
    'pending'
  ).run();
}

async function routeToParkingLot(env: Env, packetId: string, edgeId: string, impedance: number): Promise<void> {
  await env.K4_DB.prepare(
    'UPDATE structural_packets SET status = "buffered" WHERE packet_id = ?'
  ).bind(packetId).run();

  await env.K4_KV_STORE.put(`parkinglot:${packetId}`, JSON.stringify({
    packetId,
    edgeId,
    impedance,
    queuedAt: new Date().toISOString()
  }), { expirationTtl: 7 * 24 * 60 * 60 });
}
