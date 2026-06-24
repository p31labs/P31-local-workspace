import { describe, it, expect } from 'vitest';
import { VERSION, getVersion } from '../version';

describe('version', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('getVersion returns VERSION', () => {
    expect(getVersion()).toBe(VERSION);
  });
});
