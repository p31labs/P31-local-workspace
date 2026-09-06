import { describe, it, expect } from 'vitest';
import { timingSafeEqualStr } from '../../src/security';

describe('timingSafeEqualStr (jitterbug-api security)', () => {
  it('returns true on a byte-for-byte match', () => {
    expect(timingSafeEqualStr('secret-token', 'secret-token')).toBe(true);
  });

  it('returns false on a same-length mismatch', () => {
    expect(timingSafeEqualStr('secret-token', 'secret-t0ken')).toBe(false);
  });

  it('returns false on a length mismatch', () => {
    expect(timingSafeEqualStr('secret-token', 'short')).toBe(false);
  });

  it('returns false when the input is null/undefined/empty', () => {
    expect(timingSafeEqualStr(null, 'secret-token')).toBe(false);
    expect(timingSafeEqualStr(undefined, 'secret-token')).toBe(false);
    expect(timingSafeEqualStr('', 'secret-token')).toBe(false);
  });

  it('is symmetric for equal values', () => {
    expect(timingSafeEqualStr('abc123', 'abc123')).toBe(true);
  });
});
