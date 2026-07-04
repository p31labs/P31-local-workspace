import { describe, it, expect } from 'vitest';
import { VERSION, getVersion } from '../version';

describe('version', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('2.0.0');
  });

  it('getVersion returns VERSION', () => {
    expect(getVersion()).toBe(VERSION);
  });

  it('VERSION is a non-empty string', () => {
    expect(typeof VERSION).toBe('string');
    expect(VERSION.length).toBeGreaterThan(0);
  });
});
