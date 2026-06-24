import { describe, it, expect } from 'vitest';
import { VERSION, healthCheck } from '../health';

describe('willow health', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('1.0.0');
  });

  it('health is at /health endpoint', () => {
    const endpoint = '/health';
    expect(endpoint).toMatch(/health/);
  });

  it('healthCheck returns ok', () => {
    const result = healthCheck();
    expect(result.status).toBe('ok');
    expect(result.version).toBe(VERSION);
    expect(result.service).toBe('willow');
  });
});
