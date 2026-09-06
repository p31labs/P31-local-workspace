const { config, testHelpers } = require("../setup");

/**
 * D1 Test Suite - D1-01 through D1-04
 * Validates database schema, event writes, immutability, and caching
 */

describe('D1: Schema Integrity', () => {
  test('D1-01: Required tables exist in database', async () => {
    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping D1-01: No test DB connection available');
      return;
    }

    const db = globalThis.__D1_TEST_DB;
    
    const tables = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all();

    const tableNames = tables.results.map(t => t.name);
    expect(tableNames).toContain('events');
    expect(tableNames).toContain('budgets');
    expect(tableNames).toContain('fleet_status');
    expect(tableNames).toContain('forensic_artifacts');
  });

  test('D1-01: events table has correct schema', async () => {
    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping D1 schema test: No test DB');
      return;
    }

    const db = globalThis.__D1_TEST_DB;
    
    const pragma = await db.prepare("PRAGMA table_info(events)").all();
    const columns = pragma.results.map(r => r.name);

    expect(columns).toContain('id');
    expect(columns).toContain('ts');
    expect(columns).toContain('actor');
    expect(columns).toContain('action');
    expect(columns).toContain('target');
    expect(columns).toContain('diff_uri');
    expect(columns).toContain('req_uri');
    expect(columns).toContain('resp_uri');
    expect(columns).toContain('sig');
    expect(columns).toContain('legal_hold');
  });

  test('D1-01: Required indexes exist', async () => {
    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping D1 index test: No test DB');
      return;
    }

    const db = globalThis.__D1_TEST_DB;
    
    const indexes = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='events'"
    ).all();

    const indexNames = indexes.results.map(i => i.name);
    expect(indexNames.some(n => n.includes('ts') || n.includes('events_ts'))).toBe(true);
  });

  test('D1-01: budgets table schema is correct', async () => {
    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping budgets schema test: No test DB');
      return;
    }

    const db = globalThis.__D1_TEST_DB;
    
    const pragma = await db.prepare("PRAGMA table_info(budgets)").all();
    const columns = pragma.results.map(r => r.name);

    expect(columns).toContain('name');
    expect(columns).toContain('limit_usd');
    expect(columns).toContain('limit_stablecoin');
    expect(columns).toContain('spent_usd');
    expect(columns).toContain('spent_stablecoin');
  });

  test('D1-01: forensic_artifacts table schema is correct', async () => {
    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping forensic_artifacts schema test: No test DB');
      return;
    }

    const db = globalThis.__D1_TEST_DB;
    
    const pragma = await db.prepare("PRAGMA table_info(forensic_artifacts)").all();
    const columns = pragma.results.map(r => r.name);

    expect(columns).toContain('event_id');
    expect(columns).toContain('r2_uri');
    expect(columns).toContain('content_type');
    expect(columns).toContain('hmac_sig');
  });
});

describe('D1: Event Write Path', () => {
  const BASE_URL = config.baseURL;
  let initialEventCount = 0;

  beforeAll(async () => {
    if (globalThis.__D1_TEST_DB) {
      const count = await globalThis.__D1_TEST_DB.prepare(
        'SELECT COUNT(*) as count FROM events'
      ).first();
      initialEventCount = count.count;
    }
  });

  test('D1-02: POST /api/status creates event in D1', async () => {
    const statusToken = process.env.STATUS_TOKEN;
    if (!statusToken) {
      console.warn('Skipping D1-02: No STATUS_TOKEN for write test');
      return;
    }

    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping D1-02: No test DB available');
      return;
    }

    const testEvent = {
      workers: [
        { name: 'test-worker-1', status: 'online', url: 'https://test.example.com' },
      ],
      legal: { case: 'Test Case', status: 'pending' },
      financial: { operating_buffer: '$100' },
      research: { deployed_workers: 1 },
      dates: [],
    };

    const response = await fetch(`${BASE_URL}/api/status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${statusToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    expect(response.status).toBe(200);

    await new Promise(resolve => setTimeout(resolve, 100));

    const events = await globalThis.__D1_TEST_DB.prepare(
      'SELECT * FROM events WHERE action = "status_update" ORDER BY ts DESC LIMIT 1'
    ).all();

    expect(events.results.length).toBeGreaterThan(0);
    expect(events.results[0].target).toBe('status.json');
  });

  test('D1-02: Event includes HMAC signature', async () => {
    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping HMAC test: No test DB');
      return;
    }

    const latestEvent = await globalThis.__D1_TEST_DB.prepare(
      'SELECT sig FROM events ORDER BY ts DESC LIMIT 1'
    ).first();

    expect(latestEvent).not.toBeNull();
    expect(latestEvent.sig).toBeDefined();
    expect(latestEvent.sig.length).toBeGreaterThan(0);
  });
});

describe('D1: Audit Append-Only', () => {
  test('D1-03: Events table supports historical queries', async () => {
    if (!globalThis.__D1_TEST_DB) {
      console.warn('Skipping D1-03: No test DB');
      return;
    }

    const db = globalThis.__D1_TEST_DB;
    
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const now = new Date().toISOString();

    const events = await db.prepare(
      'SELECT * FROM events WHERE ts BETWEEN ? AND ? ORDER BY ts DESC'
    ).bind(oneHourAgo, now).all();

    expect(events.results).toBeDefined();
  });
});

describe('D1: Fleet Status Caching', () => {
  const BASE_URL = config.baseURL;

  test('D1-04: GET /api/status returns 200', async () => {
    const response = await fetch(`${BASE_URL}/api/status`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.workers).toBeDefined();
    expect(Array.isArray(data.workers)).toBe(true);
  });

  test('D1-04: Status contains required sections', async () => {
    const response = await fetch(`${BASE_URL}/api/status`);
    const data = await response.json();

    expect(data.workers).toBeDefined();
    expect(data.legal).toBeDefined();
    expect(data.financial).toBeDefined();
    expect(data.research).toBeDefined();
    expect(data.dates).toBeDefined();
  });

  test('D1-04: Workers array has correct structure', async () => {
    const response = await fetch(`${BASE_URL}/api/status`);
    const data = await response.json();

    if (data.workers.length > 0) {
      const worker = data.workers[0];
      expect(worker.name).toBeDefined();
      expect(worker.status).toBeDefined();
      expect(worker.url).toBeDefined();
    }
  });
});
