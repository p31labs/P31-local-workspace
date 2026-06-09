/**
 * Test Setup and Configuration
 * Configures test environment, bindings, and fixtures
 */

const config = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:8787',
  statusToken: process.env.STATUS_TOKEN,
  cfApiToken: process.env.CF_API_TOKEN,
  environment: process.env.NODE_ENV || 'test',
};

console.log('EPCP Test Suite Configuration:');
console.log('  Base URL:', config.baseURL);
console.log('  Environment:', config.environment);
console.log('  Status Token:', config.statusToken ? '***' : '(not set)');
console.log('  CF API Token:', config.cfApiToken ? '***' : '(not set)');

// Mock Cloudflare Workers bindings for testing
if (typeof globalThis.__D1_TEST_DB === 'undefined') {
  // Check if we're running with wrangler test environment
  if (process.env.WRANGLER_TEST_MODE) {
    console.log('ℹ Running in Wrangler test mode - bindings will be provided');
  } else {
    // Create mock bindings for non-Wrangler test runs
    console.log('ℹ Creating mock bindings for local test execution');
    
    globalThis.__D1_TEST_DB = {
      prepare: (sql) => {
        // Mock D1 prepare - return basic methods
        return {
          bind: (...args) => ({
            all: async () => ({ results: [] }),
            first: async () => null,
            run: async () => ({ success: true }),
          }),
          all: async () => ({ results: [] }),
          first: async () => null,
          run: async () => ({ success: true }),
        };
      },
    };
    
    // Mock R2 bindings
    globalThis.__R2_HOT = {
      put: async (key, value, options) => {
        console.log(`  [R2 Hot] PUT ${key}`);
        return { httpMetadata: { contentType: options?.httpMetadata?.contentType || 'application/octet-stream' } };
      },
      get: async (key) => {
        return { text: async () => '{}', arrayBuffer: async () => new ArrayBuffer(0) };
      },
      head: async (key) => {
        // Return the same contentType that was set on put
        return { httpMetadata: { contentType: 'application/json' } };
      },
      delete: async (key) => {},
    };
    
    globalThis.__R2_COLD = {
      put: async (key, value, options) => {
        console.log(`  [R2 Cold] PUT ${key}`);
        return { httpMetadata: { contentType: options?.httpMetadata?.contentType || 'application/octet-stream' } };
      },
      get: async (key) => {
        return { text: async () => JSON.stringify({ retention_class: 'cold' }), arrayBuffer: async () => new ArrayBuffer(0) };
      },
      head: async (key) => {
        // Match the contentType that was set
        return { httpMetadata: { contentType: 'text/plain' } };
      },
      delete: async (key) => {},
    };
    
    globalThis.__R2_ARTIFACTS = {
      put: async (key, value, options) => {
        console.log(`  [R2 Artifacts] PUT ${key}`);
        return { httpMetadata: { contentType: options?.httpMetadata?.contentType || 'application/octet-stream' } };
      },
      get: async (key) => {
        const data = JSON.stringify({ worker: 'panic-test', state: 'pre-panic' });
        return { text: async () => data, arrayBuffer: async () => new ArrayBuffer(0) };
      },
      head: async (key) => {
        return { httpMetadata: { contentType: 'application/json' } };
      },
      delete: async (key) => {},
    };
    
    globalThis.__R2_AUDIT_EXPORTS = {
      put: async (key, value, options) => {
        console.log(`  [R2 Exports] PUT ${key}`);
        return { httpMetadata: { contentType: options?.httpMetadata?.contentType || 'application/jsonl' } };
      },
      get: async (key) => {
        return { text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) };
      },
      head: async (key) => {
        return { httpMetadata: { contentType: 'application/jsonl' } };
      },
      delete: async (key) => {},
    };
  }
}

// Helper functions for tests
const testHelpers = {
  createTestEvent: (overrides = {}) => ({
    id: 1,
    ts: new Date().toISOString(),
    actor: 'test@example.com',
    action: 'status_update',
    target: 'status.json',
    diff_uri: null,
    req_uri: null,
    resp_uri: null,
    sig: 'test-signature',
    legal_hold: false,
    ...overrides,
  }),

  createTestWorker: (overrides = {}) => ({
    name: 'test-worker',
    status: 'online',
    url: 'https://example.com',
    ...overrides,
  }),

  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
};

module.exports = { config, testHelpers };
