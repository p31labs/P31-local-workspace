import { describe, it, expect } from 'vitest';
import { sanitizeInput, createErrorResponse } from '../../../src/errors';

describe('sanitizeInput', () => {
  it('trims strings to maxLength', () => {
    const input = 'a'.repeat(200);
    const result = sanitizeInput(input, 50);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('returns empty string for non-strings', () => {
    expect(sanitizeInput(12345)).toBe('');
  });

  it('strips control characters', () => {
    expect(sanitizeInput('hello\x00\x1fworld')).toBe('helloworld');
  });
});

describe('createErrorResponse', () => {
  it('returns JSON Response with error details', () => {
    const res = createErrorResponse('fail', 'detail', 400);
    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });
});
