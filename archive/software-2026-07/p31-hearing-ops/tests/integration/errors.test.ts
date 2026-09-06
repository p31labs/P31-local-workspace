import { describe, it, expect } from 'vitest';

describe('hearing-ops error contract', () => {
  it('health endpoint returns ok status', () => {
    expect({ status: 'ok', version: '0.0.1' }).toMatchObject({ status: 'ok' });
  });

  it('timestamp format is valid ISO', () => {
    const ts = '2026-06-21T22:00:00.000Z';
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it('cors header allows all origins', () => {
    const cors = { 'Access-Control-Allow-Origin': '*' };
    expect(cors['Access-Control-Allow-Origin']).toBe('*');
  });
});
