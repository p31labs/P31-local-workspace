/**
 * Live E2E Tests — Real deployed workers
 * Run with: LIVE_TEST=1 npx vitest run tests/live/
 *
 * Flow:
 * 1. Register test nodes → get API keys
 * 2. Create BONDING room → verify KV state
 * 3. Join room as child → verify impedance update
 * 4. Ingest engagement → verify D1 record
 * 5. Send packet → verify moderation result
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const LIVE_URL = process.env.LIVE_URL || 'https://k4-cage.trimtab-signal.workers.dev';
const BUFFER_URL = process.env.BUFFER_URL || 'https://buffer-worker.trimtab-signal.workers.dev';

const TEST_SUFFIX = Date.now().toString(36);
const TEST_PARENT_DID = `did:key:z${TEST_SUFFIX}parent`;
const TEST_CHILD_DID = `did:key:z${TEST_SUFFIX}child`;

let parentApiKey: string;
let childApiKey: string;
let roomId: string;
let edgeId: string;

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${LIVE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

describe('Live E2E: BONDING → K₄ → Buffer', () => {
  beforeAll(async () => {
    const parent = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        did: TEST_PARENT_DID,
        nodeType: 'PARENT_A',
        displayName: `E2E-Parent-${TEST_SUFFIX}`,
        ed25519PublicKey: `test-ed25519-${TEST_SUFFIX}`,
        mldsa65PublicKey: `test-mldsa65-${TEST_SUFFIX}`,
      }),
    });
    expect(parent.status).toBe(200);
    parentApiKey = parent.data.apiKey;

    const child = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        did: TEST_CHILD_DID,
        nodeType: 'CHILD',
        displayName: `E2E-Child-${TEST_SUFFIX}`,
        ed25519PublicKey: `test-ed25519-child-${TEST_SUFFIX}`,
        mldsa65PublicKey: `test-mldsa65-child-${TEST_SUFFIX}`,
      }),
    });
    expect(child.status).toBe(200);
    childApiKey = child.data.apiKey;
  });

  it('creates a BONDING room', async () => {
    const resp = await api('/bonding/room', {
      method: 'POST',
      headers: { Authorization: `Bearer ${parentApiKey}` },
      body: JSON.stringify({
        payload: { childDid: TEST_CHILD_DID, mode: 'seed' },
      }),
    });
    expect(resp.status).toBe(200);
    expect(resp.data).toHaveProperty('roomId');
    roomId = resp.data.roomId;
  });

  it('joins the room as child', async () => {
    const resp = await api(`/bonding/room/${roomId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${childApiKey}` },
      body: JSON.stringify({ childDid: TEST_CHILD_DID }),
    });
    console.log(`Join resp status: ${resp.status}`, JSON.stringify(resp.data));
    expect(resp.status).toBe(200);
    expect(resp.data.joined).toBe(true);
    edgeId = resp.data.edgeId;
  });

  it('ingests engagement event', async () => {
    const resp = await api('/engagement', {
      method: 'POST',
      body: JSON.stringify({
        roomCode: roomId,
        childDid: TEST_CHILD_DID,
        eventType: 'MOLECULE_COMPLETED',
        payload: { formula: 'H2O', atoms: 3 },
        serverHash: `test-hash-${TEST_SUFFIX}`,
        serverVerified: true,
        userAgent: 'e2e-live-test',
      }),
    });
    console.log(`Engagement resp status: ${resp.status}`, JSON.stringify(resp.data));
    expect(resp.status).toBe(200);
    expect(resp.data.status).toBe('ingested');
  });

  it('routes a packet through Buffer Worker', async () => {
    const resp = await api('/packet', {
      method: 'POST',
      headers: { Authorization: `Bearer ${parentApiKey}` },
      body: JSON.stringify({
        edgeId,
        senderDid: TEST_PARENT_DID,
        category: 'LOGISTICS',
        action: 'PROPOSE',
        objectId: `schedule-${TEST_SUFFIX}`,
        payload: { text: 'School pickup schedule for next week.' },
        nspMode: true,
        impedanceContribution: -0.05,
      }),
    });
    console.log(`Packet resp status: ${resp.status}`, JSON.stringify(resp.data));
    expect(resp.status).toBe(200);
    expect(resp.data).toHaveProperty('packetId');
    expect(resp.data).toHaveProperty('moderationId');
    expect(['true', 'false']).toContain(String(resp.data.bufferUsed));
    expect(resp.data.scScore).toBeDefined();
  });

  afterAll(async () => {
    console.log(`\n⚠️  Test data (manual cleanup if needed):`);
    console.log(`   Parent DID: ${TEST_PARENT_DID}`);
    console.log(`   Child DID: ${TEST_CHILD_DID}`);
    console.log(`   Room ID: ${roomId}`);
  });
});
