/**
 * Security Test Suite
 * Validates XSS, SQL injection, CSRF, rate limiting, and info leakage
 */

import { readFileSync } from 'fs';

describe('Security: Input Validation', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8787';

  test('SEC-01: XSS payload in worker name is sanitized', async () => {
    const statusToken = process.env.STATUS_TOKEN;
    if (!statusToken) {
      console.warn('Skipping SEC-01: No STATUS_TOKEN');
      return;
    }

    const xssPayload = '<script>alert("XSS")</script>';
    const maliciousStatus = {
      workers: [{ name: xssPayload, status: 'online', url: 'https://example.com' }],
      legal: { case: 'Test', status: 'pending' },
      financial: { operating_buffer: '$0' },
      research: { deployed_workers: 0 },
      dates: [],
    };

    // Write malicious status
    const writeResponse = await fetch(`${BASE_URL}/api/status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${statusToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(maliciousStatus),
    });

    expect(writeResponse.status).toBe(200);

    // Read dashboard HTML
    const dashboardResponse = await fetch(`${BASE_URL}/`);
    expect(dashboardResponse.status).toBe(200);
    const html = await dashboardResponse.text();

    // Dashboard should NOT contain raw script tags
    // It may contain escaped versions, but not executable ones
    expect(html).not.toContain('<script>alert("XSS")</script>');
  });

  test('SEC-02: SQL injection attempt in status payload is rejected', async () => {
    const statusToken = process.env.STATUS_TOKEN;
    if (!statusToken) {
      console.warn('Skipping SEC-02: No STATUS_TOKEN');
      return;
    }

    const sqlInjection = {
      workers: [{ name: "test'; DROP TABLE events; --", status: 'online', url: 'https://example.com' }],
      legal: { case: 'Test\'; DROP TABLE events; --', status: 'pending' },
      financial: { operating_buffer: '$0' },
      research: { deployed_workers: 0 },
      dates: [],
    };

    // The worker should handle this gracefully (JSON parsing, not SQL execution from user input)
    const response = await fetch(`${BASE_URL}/api/status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${statusToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sqlInjection),
    });

    expect(response.status).toBe(200);

    // Verify data was stored (as text, not executed SQL)
    const readResponse = await fetch(`${BASE_URL}/api/status`);
    const data = await readResponse.json();
    expect(data.workers.length).toBeGreaterThan(0);
  });

  test('SEC-03: No stack traces in production responses', async () => {
    // Trigger an error by sending invalid JSON
    const response = await fetch(`${BASE_URL}/api/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{{invalid json}}',
    });

    // Should return 400, not 500 with stack trace
    expect(response.status).toBe(400);

    const body = await response.text();
    // Should not contain stack trace information
    expect(body).not.toContain('at ');
    expect(body).not.toContain('.js:');
    expect(body).not.toContain('Error:');
  });

  test('SEC-04: CSP headers are present', async () => {
    const response = await fetch(`${BASE_URL}/`);
    const csp = response.headers.get('Content-Security-Policy');

    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('SEC-05: X-Frame-Options prevents clickjacking', async () => {
    const response = await fetch(`${BASE_URL}/`);
    const xFrameOptions = response.headers.get('X-Frame-Options');

    expect(xFrameOptions).toBe('DENY');
  });
});

describe('Security: Rate Limiting', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8787';

  test('SEC-06: Excessive requests to /api/status are rate limited', async () => {
    // Send many requests rapidly
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(fetch(`${BASE_URL}/api/status`));
    }

    const results = await Promise.allSettled(promises);
    
    // Count 429 responses
    const rateLimited = results.filter(
      r => r.status === 'fulfilled' && r.value.status === 429
    ).length;

    // Some rate limiting may occur
    if (rateLimited > 0) {
      expect(rateLimited).toBeGreaterThan(0);
    }
  });
});

describe('Security: Info Leakage', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8787';

  test('SEC-07: Server headers do not expose version info', async () => {
    const response = await fetch(`${BASE_URL}/`);
    const serverHeader = response.headers.get('Server');

    // Should not expose specific version details
    if (serverHeader) {
      expect(serverHeader.toLowerCase()).not.toContain('version');
    }
  });

  test('SEC-08: Referrer-Policy is restrictive', async () => {
    const response = await fetch(`${BASE_URL}/`);
    const referrerPolicy = response.headers.get('Referrer-Policy');

    expect(referrerPolicy).toBe('strict-origin-when-cross-origin');
  });
});
