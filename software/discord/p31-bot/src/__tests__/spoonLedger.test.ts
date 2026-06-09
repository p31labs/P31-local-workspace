import { describe, it, expect, beforeEach, vi } from 'vitest';

const { store } = vi.hoisted(() => {
  const store: Record<string, string> = {};
  return { store };
});

vi.mock('fs', () => ({
  default: {
    existsSync: (p: string) => p in store,
    readFileSync: (p: string) => store[p] ?? '{}',
    writeFileSync: (p: string, data: string) => { store[p] = data; },
  },
}));

beforeEach(async () => {
  // Clear disk state and reload the module so the in-memory ledger resets
  Object.keys(store).forEach(k => delete store[k]);
  vi.resetModules();
});

describe('spoonLedger', () => {
  it('awards spoons and returns new balance', async () => {
    const ledger = await import('../services/spoonLedger');
    expect(ledger.award('user-1', 10)).toBe(10);
  });

  it('accumulates multiple awards', async () => {
    const ledger = await import('../services/spoonLedger');
    ledger.award('user-1', 5);
    ledger.award('user-1', 3);
    expect(ledger.getBalance('user-1')).toBe(8);
  });

  it('spend deducts balance', async () => {
    const ledger = await import('../services/spoonLedger');
    ledger.award('user-2', 20);
    expect(ledger.spend('user-2', 8)).toBe(12);
  });

  it('spend does not go below 0', async () => {
    const ledger = await import('../services/spoonLedger');
    ledger.award('user-3', 5);
    expect(ledger.spend('user-3', 100)).toBe(0);
  });

  it('spend on unknown user returns 0', async () => {
    const ledger = await import('../services/spoonLedger');
    expect(ledger.spend('nobody', 10)).toBe(0);
  });

  it('getBalance returns 0 for unknown user', async () => {
    const ledger = await import('../services/spoonLedger');
    expect(ledger.getBalance('nobody')).toBe(0);
  });

  it('getEntry returns null for unknown user', async () => {
    const ledger = await import('../services/spoonLedger');
    expect(ledger.getEntry('nobody')).toBeNull();
  });

  it('getLeaderboard sorts by totalEarned descending', async () => {
    const ledger = await import('../services/spoonLedger');
    ledger.award('a', 3);
    ledger.award('b', 10);
    ledger.award('c', 1);
    const board = ledger.getLeaderboard(3);
    expect(board[0].userId).toBe('b');
    expect(board[1].userId).toBe('a');
    expect(board[2].userId).toBe('c');
  });

  it('getLeaderboard respects limit', async () => {
    const ledger = await import('../services/spoonLedger');
    ledger.award('x1', 1);
    ledger.award('x2', 2);
    ledger.award('x3', 3);
    expect(ledger.getLeaderboard(2)).toHaveLength(2);
  });

  it('getGlobalTotal sums all earned', async () => {
    const ledger = await import('../services/spoonLedger');
    ledger.award('u1', 7);
    ledger.award('u2', 3);
    expect(ledger.getGlobalTotal()).toBe(10);
  });

  it('transferAll moves balance and removes source key', async () => {
    const ledger = await import('../services/spoonLedger');
    ledger.award('src', 15);
    const transferred = ledger.transferAll('src', 'dst');
    expect(transferred).toBe(15);
    expect(ledger.getBalance('src')).toBe(0);
    expect(ledger.getBalance('dst')).toBe(15);
  });

  it('transferAll returns 0 if source has no balance', async () => {
    const ledger = await import('../services/spoonLedger');
    expect(ledger.transferAll('empty', 'dst')).toBe(0);
  });
});
