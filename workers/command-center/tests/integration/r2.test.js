const { config } = require("../setup");

/**
 * R2 Test Suite - R2-01, R2-02, R2-03
 * Validates R2 bucket operations and lifecycle
 */

describe('R2: Hot Bucket Write', () => {
  test('R2-01: Hot bucket accepts writes', async () => {
    if (typeof globalThis.__R2_HOT === 'undefined') {
      console.warn('Skipping R2-01: No R2 test bindings');
      return;
    }

    const testKey = `test-${Date.now()}.json`;
    const testData = JSON.stringify({
      test: 'r2-write',
      timestamp: new Date().toISOString(),
      data: 'forensic payload',
    });

    await globalThis.__R2_HOT.put(testKey, testData, {
      httpMetadata: { contentType: 'application/json' },
    });

    const object = await globalThis.__R2_HOT.head(testKey);
    expect(object).toBeDefined();
    expect(object.httpMetadata.contentType).toBe('application/json');

    await globalThis.__R2_HOT.delete(testKey);
  });

  test('R2-01: Hot bucket stores forensic diff payloads', async () => {
    if (typeof globalThis.__R2_HOT === 'undefined') {
      console.warn('Skipping R2-01 diff test: No R2 binding');
      return;
    }

    const diffPayload = {
      event: 'status_update',
      timestamp: new Date().toISOString(),
      diff: {
        workers: {
          before: { status: 'offline' },
          after: { status: 'online' },
        },
      },
      actor: 'test@example.com',
    };

    const key = `diff-${Date.now()}.json`;
    await globalThis.__R2_HOT.put(key, JSON.stringify(diffPayload), {
      httpMetadata: { contentType: 'application/json' },
    });

    const exists = await globalThis.__R2_HOT.head(key);
    expect(exists).toBeDefined();
    expect(exists.httpMetadata.contentType).toBe('application/json');

    await globalThis.__R2_HOT.delete(key);
  });
});

describe('R2: Cold Bucket Lifecycle', () => {
  test('R2-02: Cold bucket exists and is accessible', async () => {
    if (typeof globalThis.__R2_COLD === 'undefined') {
      console.warn('Skipping R2-02: No R2 cold binding');
      return;
    }

    const testKey = `lifecycle-test-${Date.now()}.txt`;
    
    await globalThis.__R2_COLD.put(testKey, 'test-data', {
      httpMetadata: { contentType: 'text/plain' },
    });

    const head = await globalThis.__R2_COLD.head(testKey);
    expect(head).toBeDefined();
    expect(head.httpMetadata.contentType).toBe('text/plain');

    await globalThis.__R2_COLD.delete(testKey);
  });

  test('R2-02: Cold bucket accepts archived objects', async () => {
    if (typeof globalThis.__R2_COLD === 'undefined') {
      console.warn('Skipping R2-02 archive test: No R2 cold binding');
      return;
    }

    const archiveData = {
      event_id: 'archived-event',
      archived_at: new Date().toISOString(),
      retention_class: 'cold',
      data: 'archived forensic data',
    };

    const key = `archive/${Date.now()}/evidence.json`;
    await globalThis.__R2_COLD.put(key, JSON.stringify(archiveData), {
      httpMetadata: { contentType: 'application/json' },
    });

    const retrieved = await globalThis.__R2_COLD.get(key);
    expect(retrieved).toBeDefined();
    const body = await retrieved.text();
    const parsed = JSON.parse(body);
    expect(parsed.retention_class).toBe('cold');

    await globalThis.__R2_COLD.delete(key);
  });
});

describe('R2: Artifact Management', () => {
  test('R2-03: Artifacts bucket stores rollback bundles', async () => {
    if (typeof globalThis.__R2_ARTIFACTS === 'undefined') {
      console.warn('Skipping R2-03: No R2 artifacts binding');
      return;
    }

    const rollbackBundle = {
      version: '1.0.0',
      worker: 'test-worker',
      timestamp: new Date().toISOString(),
      checksum: 'abc123',
      type: 'rollback-bundle',
    };

    const key = `artifacts/test-worker/rollback-v1.0.0.json`;
    await globalThis.__R2_ARTIFACTS.put(key, JSON.stringify(rollbackBundle), {
      httpMetadata: { contentType: 'application/json' },
    });

    const exists = await globalThis.__R2_ARTIFACTS.head(key);
    expect(exists).toBeDefined();
    expect(exists.httpMetadata.contentType).toBe('application/json');

    await globalThis.__R2_ARTIFACTS.delete(key);
  });

  test('R2-03: Artifacts are retrievable for rollback', async () => {
    if (typeof globalThis.__R2_ARTIFACTS === 'undefined') {
      console.warn('Skipping R2-03 retrieval test: No R2 artifacts binding');
      return;
    }

    const key = `artifacts/panic-test/rollback-${Date.now()}.json`;
    const bundle = {
      worker: 'panic-test',
      state: 'pre-panic',
      created: new Date().toISOString(),
    };

    await globalThis.__R2_ARTIFACTS.put(key, JSON.stringify(bundle), {
      httpMetadata: { contentType: 'application/json' },
    });

    const object = await globalThis.__R2_ARTIFACTS.get(key);
    expect(object).toBeDefined();
    const body = await object.text();
    const parsed = JSON.parse(body);
    expect(parsed.worker).toBe('panic-test');

    await globalThis.__R2_ARTIFACTS.delete(key);
  });
});

describe('R2: Audit Exports', () => {
  test('AUDIT_EXPORTS bucket exists', async () => {
    if (typeof globalThis.__R2_AUDIT_EXPORTS === 'undefined') {
      console.warn('Skipping audit exports test: No R2 audit_exports binding');
      return;
    }

    const testKey = `export/test-${Date.now()}.jsonl`;
    const auditLines = [
      JSON.stringify({ event: 'export_test_1', ts: new Date().toISOString() }),
      JSON.stringify({ event: 'export_test_2', ts: new Date().toISOString() }),
    ].join('\n');

    await globalThis.__R2_AUDIT_EXPORTS.put(testKey, auditLines, {
      httpMetadata: { contentType: 'application/jsonl' },
    });

    const exists = await globalThis.__R2_AUDIT_EXPORTS.head(testKey);
    expect(exists).toBeDefined();
    expect(exists.httpMetadata.contentType).toBe('application/jsonl');

    await globalThis.__R2_AUDIT_EXPORTS.delete(testKey);
  });
});
