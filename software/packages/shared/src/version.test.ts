import { describe, it, expect } from 'vitest';
import { VERSION, getVersion } from './version';

describe('version', () => {
  it('exports VERSION as a string', () => {
    expect(typeof VERSION).toBe('string');
    expect(VERSION.length).toBeGreaterThan(0);
  });

  it('getVersion returns VERSION', () => {
    expect(getVersion()).toBe(VERSION);
  });
});
