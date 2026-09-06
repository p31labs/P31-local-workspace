import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { json, err, CORS_HEADERS } from '../http.js';

describe('http', () => {
  describe('json', () => {
    it('returns 200 with JSON body and CORS headers', () => {
      const res = json({ ok: true });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('Content-Type'), 'application/json');
      assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
    });

    it('accepts custom status code', () => {
      const res = json({ error: 'not found' }, 404);
      assert.equal(res.status, 404);
    });

    it('merges extra headers', async () => {
      const res = json({}, 200, { 'X-Request-ID': 'abc-123' });
      assert.equal(res.headers.get('X-Request-ID'), 'abc-123');
    });
  });

  describe('err', () => {
    it('returns 400 with error message by default', async () => {
      const res = err('bad input');
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.error, 'bad input');
      assert.ok(body.timestamp);
    });

    it('returns 500 with structured error when code is provided', async () => {
      const res = err('server fault', 500, { code: 'INTERNAL' });
      const body = await res.json();
      assert.equal(body.error.code, 'INTERNAL');
      assert.equal(body.error.message, 'server fault');
      assert.equal(body.code, undefined);
    });

    it('includes requestId in response and header when provided', async () => {
      const res = err('not found', 404, { code: 'NOT_FOUND', requestId: 'req-1' });
      assert.equal(res.headers.get('X-Request-ID'), 'req-1');
      const body = await res.json();
      assert.equal(body.requestId, 'req-1');
    });

    it('returns 400 with string error when no code/requestId', async () => {
      const res = err('simple error');
      const body = await res.json();
      assert.equal(typeof body.error, 'string');
      assert.equal(body.error, 'simple error');
    });
  });
});
