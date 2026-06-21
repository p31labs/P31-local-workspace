import { describe, it, expect } from 'vitest';
import { generateId } from '../../tetrahedron/db';

describe('tetrahedron db', () => {
  it('generateId produces unique ids', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(10);
  });

  it('generateId always returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
