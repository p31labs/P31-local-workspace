import { describe, expect, it } from 'vitest';
import { parsePathFromHashInput } from '../src/router';

describe('parsePathFromHashInput', () => {
  it('home for empty, slash, and hash only', () => {
    expect(parsePathFromHashInput('')).toEqual({ name: 'home' });
    expect(parsePathFromHashInput('#/')).toEqual({ name: 'home' });
    expect(parsePathFromHashInput('/')).toEqual({ name: 'home' });
  });
  it('roles and role id', () => {
    expect(parsePathFromHashInput('#/roles')).toEqual({ name: 'roles' });
    expect(parsePathFromHashInput('/roles/r1')).toEqual({ name: 'roles', id: 'r1' });
  });
  it('WCD list and id', () => {
    expect(parsePathFromHashInput('#/wcd')).toEqual({ name: 'wcd-list' });
    expect(parsePathFromHashInput('#/wcd/WCD-BE-001')).toEqual({ name: 'wcd', id: 'WCD-BE-001' });
  });
  it('help and proof', () => {
    expect(parsePathFromHashInput('#/help/topic-1')).toEqual({ name: 'help', id: 'topic-1' });
    expect(parsePathFromHashInput('#/proof/new/role-1')).toEqual({ name: 'proof-new', id: 'role-1' });
    expect(parsePathFromHashInput('#/proof/abc-uuid')).toEqual({ name: 'proof', id: 'abc-uuid' });
  });
  it('search query', () => {
    expect(parsePathFromHashInput('#/search?q=grant')).toEqual({ name: 'search', query: 'grant' });
  });
});
