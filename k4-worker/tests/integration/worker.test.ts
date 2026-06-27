import { describe, it, expect, vi } from 'vitest';
import worker from '../../src/index';

function createMockEnv(overrides: {
  childNodeId?: string;
  bufferResponse?: any;
  edgeResult?: any;
} = {}) {
  const mockPrepare = vi.fn().mockImplementation((sql: string) => {
    const bind = vi.fn().mockImplementation((...args: any[]) => {
      const lower = sql.toLowerCase();

      // Child lookup for engagement
      if (lower.includes('select node_id from system_nodes where did = ?') && args[0]?.startsWith?.('did:child')) {
        return {
          first: vi.fn().mockResolvedValue({ node_id: overrides.childNodeId || 'node-child-001' }),
          run: vi.fn().mockResolvedValue(undefined),
        };
      }

      // Node lookup for getEdge/MQ
      if (lower.includes('select node_id from system_nodes where did = ?')) {
        return {
          first: vi.fn().mockResolvedValue({ node_id: 'node-parent-001' }),
          run: vi.fn().mockResolvedValue(undefined),
        };
      }

      // Edge lookup
      if (lower.includes('select * from relational_edges where edge_id = ?')) {
        return {
          first: vi.fn().mockResolvedValue(overrides.edgeResult || {
            edge_id: 'edge-test-001',
            source_node_id: 'node-parent-001',
            target_node_id: 'node-child-001',
            edge_type: 'parent_child',
            impedance_score: 0.3,
            last_interaction_at: new Date(Date.now() - 3600000).toISOString(),
            interaction_count: 5,
            threshold_current: 0.65,
            threshold_base: 0.65,
            metadata_json: '{}',
          }),
          run: vi.fn().mockResolvedValue(undefined),
        };
      }

      // Packet history query
      if (lower.includes('select status from structural_packets where edge_id = ?')) {
        return {
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue(undefined),
        };
      }

      // Sender node type lookup
      if (lower.includes('select node_type from system_nodes where did = ?')) {
        return {
          first: vi.fn().mockResolvedValue({ node_type: 'PARENT_A' }),
          run: vi.fn().mockResolvedValue(undefined),
        };
      }

      // INSERT statements (register, engagement, packet, guard, etc.)
      return {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue(undefined),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
      };
    });

    return { bind };
  });

  const mockKvGet = vi.fn().mockResolvedValue(null);
  const mockKvPut = vi.fn().mockResolvedValue(undefined);

  const bufferBody = overrides.bufferResponse || {
    moderationId: 'mod-buffer-001',
    scScore: 0.1,
    ieScore: 0.2,
    state: 'active',
    action: 'deliver',
    rationale: 'Content passes safety filters.',
    triggeredRules: [],
    aiUsed: false,
  };

  const mockBufferFetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(bufferBody), {
      headers: { 'Content-Type': 'application/json' },
    })
  );

  return {
    env: {
      K4_DB: { prepare: mockPrepare } as any,
      K4_KV_STORE: { get: mockKvGet, put: mockKvPut } as any,
      BUFFER_WORKER: { fetch: mockBufferFetch } as any,
      AI: {} as any,
    },
  };
}

function makeRequest(path: string, opts: RequestInit = {}): Request {
  return new Request(`https://k4-cage.trimtab-signal.workers.dev${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}

describe('K4 Worker — Public Endpoints', () => {
  it('returns health status', async () => {
    const { env } = createMockEnv();
    const res = await worker.fetch(makeRequest('/health'), env);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('topology', 'K4-Delta-Mesh');
  });

  it('generates a real Ed25519 + ML-DSA-65 keypair', async () => {
    const { env } = createMockEnv();
    const res = await worker.fetch(makeRequest('/auth/keygen', { method: 'POST' }), env);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('did');
    expect(data.did).toMatch(/^did:key:z/);
    expect(data.ed25519.publicKey).toHaveLength(44);
    expect(data.mldsa65.publicKey).toHaveLength(2604);
  });

  it('registers a node and returns an API key', async () => {
    const { env } = createMockEnv();
    const res = await worker.fetch(
      makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          did: 'did:key:zRegisterTest',
          nodeType: 'PARENT_A',
          displayName: 'Unit Test Parent',
          ed25519PublicKey: 'test-ed25519-pub',
          mldsa65PublicKey: 'test-mldsa65-pub',
        }),
      }),
      env
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('nodeId');
    expect(data).toHaveProperty('apiKey');
    expect(data.apiKey).toMatch(/^p31_[A-Za-z0-9]+$/);
  });

  it('returns 400 for incomplete registration', async () => {
    const { env } = createMockEnv();
    const res = await worker.fetch(
      makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ did: 'did:key:zIncomplete' }),
      }),
      env
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for unresolved DID', async () => {
    const { env } = createMockEnv();
    const res = await worker.fetch(makeRequest('/did/resolve?did=did:key:zUnknown'), env);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data).toHaveProperty('error', 'DID not found');
  });

  it('ingests a BONDING engagement event from a registered child', async () => {
    const { env } = createMockEnv({ childNodeId: 'node-child-001' });
    const res = await worker.fetch(
      makeRequest('/engagement', {
        method: 'POST',
        body: JSON.stringify({
          roomCode: 'e2e-room-001',
          childDid: 'did:key:zChildEngagement',
          eventType: 'MOLECULE_COMPLETED',
          payload: { formula: 'H2O', atoms: 3 },
          serverHash: 'abc123',
          serverVerified: true,
        }),
      }),
      env
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('eventId');
    expect(data.status).toBe('ingested');
  });

  it('rejects engagement for an unknown child DID', async () => {
    // Override child lookup to return null
    const mockPrepare = vi.fn().mockImplementation((sql: string) => {
      const bind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue(undefined),
        all: vi.fn().mockResolvedValue({ results: [] }),
      });
      return { bind };
    });

    const env = {
      K4_DB: { prepare: mockPrepare } as any,
      K4_KV_STORE: { get: vi.fn().mockResolvedValue(null), put: vi.fn() } as any,
      BUFFER_WORKER: { fetch: vi.fn() } as any,
      AI: {} as any,
    };

    const res = await worker.fetch(
      makeRequest('/engagement', {
        method: 'POST',
        body: JSON.stringify({
          roomCode: 'room-unknown',
          childDid: 'did:key:zUnknownChild',
          eventType: 'PING_SENT',
          payload: {},
          serverHash: 'def456',
          serverVerified: true,
        }),
      }),
      env
    );
    expect(res.status).toBe(403);
  });

  it('routes a structured packet through Buffer Worker', async () => {
    const { env } = createMockEnv();
    const res = await worker.fetch(
      makeRequest('/packet', {
        method: 'POST',
        body: JSON.stringify({
          edgeId: 'edge-test-001',
          senderDid: 'did:key:zPacketSender',
          category: 'LOGISTICS',
          action: 'PROPOSE',
          objectId: 'event-001',
          payload: { text: 'Pickup at 3pm.' },
          nspMode: true,
          impedanceContribution: 0,
        }),
      }),
      env
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('packetId');
    expect(data).toHaveProperty('moderationId');
    expect(data).toHaveProperty('scScore');
    expect(data).toHaveProperty('ieScore');
    expect(data).toHaveProperty('state');
    expect(data.bufferUsed).toBe(true);
  });

  it('falls back to local scoring when Buffer Worker is down', async () => {
    const { env } = createMockEnv({});

    // Override BUFFER_WORKER fetch to throw
    (env.BUFFER_WORKER as any).fetch = vi.fn().mockRejectedValue(new Error('Buffer down'));

    const res = await worker.fetch(
      makeRequest('/packet', {
        method: 'POST',
        body: JSON.stringify({
          edgeId: 'edge-test-001',
          senderDid: 'did:key:zFallbackSender',
          category: 'MEDICAL',
          action: 'NOTIFY',
          objectId: 'appt-001',
          payload: { text: 'Doctor appointment confirmed.' },
          nspMode: false,
          impedanceContribution: 0,
        }),
      }),
      env
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.bufferUsed).toBe(false);
    expect(data.moderationId).toContain('mod-fallback');
  });

  it('analyzes content via Fawn Guard', async () => {
    const { env } = createMockEnv();
    const res = await worker.fetch(
      makeRequest('/guard/analyze', {
        method: 'POST',
        body: JSON.stringify({
          content: 'Agree or never see the kids again.',
          authorDid: 'did:key:zAuthor',
          targetDid: 'did:key:zTarget',
          contextType: 'message',
        }),
      }),
      env
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('analysis');
    expect(data.analysis).toHaveProperty('action');
  });

  it('returns 400 for edge status without source/target', async () => {
    const { env } = createMockEnv();
    const res = await worker.fetch(makeRequest('/edge/status'), env);
    expect(res.status).toBe(400);
  });

  it('returns 404 for edge status with unknown nodes', async () => {
    // Override node lookups to return null
    const mockPrepare = vi.fn().mockImplementation((sql: string) => {
      const lower = sql.toLowerCase();
      if (lower.includes('select node_id from system_nodes where did = ?')) {
        return {
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
            run: vi.fn().mockResolvedValue(undefined),
          }),
        };
      }
      return {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue(undefined),
        }),
      };
    });

    const env = {
      K4_DB: { prepare: mockPrepare } as any,
      K4_KV_STORE: { get: vi.fn().mockResolvedValue(null), put: vi.fn() } as any,
      BUFFER_WORKER: { fetch: vi.fn() } as any,
      AI: {} as any,
    };

    const res = await worker.fetch(
      makeRequest('/edge/status?source=did:key:zSrc&target=did:key:zTgt'),
      env
    );
    expect(res.status).toBe(404);
  });
});

describe('K4 Worker — Authenticated BONDING Routes', () => {
  it('creates a BONDING room with valid API key', async () => {
    const { env } = createMockEnv();

    // Override node lookup for API key auth to return PARENT_A
    const originalPrepare = (env.K4_DB as any).prepare;
    let callCount = 0;
    (env.K4_DB as any).prepare = vi.fn().mockImplementation((sql: string) => {
      const bind = vi.fn().mockImplementation((...args: any[]) => {
        const result = {
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue(undefined),
          all: vi.fn().mockResolvedValue({ results: [] }),
        };

        const lower = sql.toLowerCase();
        if (lower.includes('api_key = ?') && callCount === 0) {
          result.first.mockResolvedValue({
            node_id: 'node-parent-001',
            did: 'did:key:zParent',
            node_type: 'PARENT_A',
            status: 'active',
          });
          callCount++;
        } else if (lower.includes('select node_id, node_type from system_nodes where did = ? and status = "active"')) {
          result.first.mockResolvedValue({ node_id: 'node-child-001', node_type: 'CHILD' });
        }

        return result;
      });
      return { bind };
    });

    const res = await worker.fetch(
      makeRequest('/bonding/room', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer p31_testapikey1234567890123456789012',
        },
        body: JSON.stringify({
          payload: {
            childDid: 'did:key:zChildBonding',
            mode: 'seed',
          },
        }),
      }),
      env
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('roomId');
    expect(data.childDid).toBe('did:key:zChildBonding');
    expect(data.joined || data.message).toBeDefined();
  });

  it('joins a BONDING room with valid API key and child DID', async () => {
    const { env } = createMockEnv();

    // Pre-seed room in KV
    const fakeRoom = JSON.stringify({
      roomId: 'room-join-001',
      parentDid: 'did:key:zParent',
      childDid: 'did:key:zChildJoin',
      mode: 'seed',
      createdAt: new Date().toISOString(),
      context: { nodeType: 'PARENT_A' },
    });
    (env.K4_KV_STORE.get as any).mockResolvedValue(fakeRoom);

    let authCallCount = 0;
    (env.K4_DB as any).prepare = vi.fn().mockImplementation((sql: string) => {
      const bind = vi.fn().mockImplementation((...args: any[]) => {
        const result = {
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue(undefined),
          all: vi.fn().mockResolvedValue({ results: [] }),
        };

        const lower = sql.toLowerCase();
        if (lower.includes('api_key = ?') && authCallCount === 0) {
          result.first.mockResolvedValue({
            node_id: 'node-parent-001',
            did: 'did:key:zParent',
            node_type: 'PARENT_A',
            status: 'active',
          });
          authCallCount++;
        } else if (lower.includes('select node_id from system_nodes where did = ? and status = "active"')) {
          result.first.mockResolvedValue({ node_id: 'node-child-001' });
        }

        return result;
      });
      return { bind };
    });

    const res = await worker.fetch(
      makeRequest('/bonding/room/room-join-001/join', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer p31_testapikey1234567890123456789012',
        },
        body: JSON.stringify({
          childDid: 'did:key:zChildJoin',
        }),
      }),
      env
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.joined).toBe(true);
    expect(data).toHaveProperty('edgeId');
  });

  it('rejects room join for non-parent node type', async () => {
    const { env } = createMockEnv();

    (env.K4_DB as any).prepare = vi.fn().mockImplementation((sql: string) => {
      const bind = vi.fn().mockImplementation((...args: any[]) => {
        const lower = sql.toLowerCase();
        if (lower.includes('api_key = ?')) {
          return {
            bind: vi.fn().mockReturnThis(),
            first: vi.fn().mockResolvedValue({
              node_id: 'node-child-001',
              did: 'did:key:zChild',
              node_type: 'CHILD',
              status: 'active',
            }),
          };
        }
        return {
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue(undefined),
          all: vi.fn().mockResolvedValue({ results: [] }),
        };
      });
      return { bind };
    });

    const res = await worker.fetch(
      makeRequest('/bonding/room', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer p31_testapikey1234567890123456789012',
        },
        body: JSON.stringify({
          payload: { childDid: 'did:key:zChild', mode: 'seed' },
        }),
      }),
      env
    );
    expect(res.status).toBe(403);
  });
});
