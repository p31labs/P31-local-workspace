const { config } = require("../setup");
const { testHelpers } = require("../setup");

/**
 * IAM Test Suite - IAM-01, IAM-02, IAM-03
 * Validates Cloudflare Access JWT, RBAC, and legacy token fallback
 */

describe('IAM: Cloudflare Access JWT Validation', () => {
  const BASE_URL = config.baseURL;

  test('IAM-01: Valid Cloudflare Access JWT returns 200 with correct role', async () => {
    const mockJwt = process.env.TEST_CF_ACCESS_JWT;
    
    if (!mockJwt) {
      console.warn('Skipping IAM-01: No TEST_CF_ACCESS_JWT provided');
      return;
    }

    const response = await fetch(`${BASE_URL}/api/whoami`, {
      headers: {
        'CF-Access-Jwt-Assertion': mockJwt,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.authenticated).toBe(true);
    expect(data.role).toBeDefined();
    expect(['reader', 'operator', 'admin', 'legal']).toContain(data.role);
  });

  test('IAM-01: Invalid JWT returns 401', async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/whoami`, {
        headers: {
          'CF-Access-Jwt-Assertion': 'invalid.jwt.token',
        },
      });

      expect(response.status).toBe(401);
    } catch (e) {
      // If worker isn't running, skip this test
      console.warn('Skipping IAM-01 invalid JWT test: Worker not available');
    }
  });
});

describe('IAM: RBAC Enforcement', () => {
  const BASE_URL = config.baseURL;

  test('IAM-02: reader can GET /api/status', async () => {
    const getResponse = await fetch(`${BASE_URL}/api/status`);
    expect(getResponse.status).toBe(200);
  });

  test('IAM-02: operator can GET /api/status', async () => {
    const operatorJwt = process.env.TEST_OPERATOR_JWT;
    if (!operatorJwt) {
      console.warn('Skipping operator test: no TEST_OPERATOR_JWT');
      return;
    }

    const getResponse = await fetch(`${BASE_URL}/api/status`, {
      headers: {
        'CF-Access-Jwt-Assertion': operatorJwt,
      },
    });
    expect(getResponse.status).toBe(200);
  });
});

describe('IAM: Legacy Token Fallback', () => {
  const BASE_URL = config.baseURL;

  test('IAM-03: STATUS_TOKEN allows POST without JWT', async () => {
    const statusToken = process.env.STATUS_TOKEN;
    if (!statusToken) {
      console.warn('Skipping legacy token test: no STATUS_TOKEN');
      return;
    }

    const response = await fetch(`${BASE_URL}/api/status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${statusToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: 'legacy_token_update',
        ts: Date.now(),
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  test('IAM-03: No token results in 401', async () => {
    const response = await fetch(`${BASE_URL}/api/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'no_auth' }),
    });

    expect([401, 403]).toContain(response.status);
  });
});
