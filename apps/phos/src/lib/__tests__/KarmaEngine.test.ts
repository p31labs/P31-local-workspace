import { describe, it, expect, beforeEach, vi } from 'vitest';

const CREDITS_KEY = 'p31_karma_balance';
const EVENT_KEY = 'p31_karma_events';

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('KarmaEngine', () => {
  it('should return 0 balance by default', async () => {
    const { getBalance } = await import('../KarmaEngine');
    expect(getBalance()).toBe(0);
  });

  it('should mint credits and return new balance', async () => {
    const { mintCredits, getBalance } = await import('../KarmaEngine');
    const newBal = mintCredits(5, 'Test mint');
    expect(newBal).toBe(5);
    expect(getBalance()).toBe(5);
  });

  it('should accumulate multiple mints', async () => {
    const { mintCredits, getBalance } = await import('../KarmaEngine');
    mintCredits(5, 'First');
    mintCredits(3, 'Second');
    expect(getBalance()).toBe(8);
  });

  it('should spend credits when balance is sufficient', async () => {
    const { mintCredits, spendCredits, getBalance } = await import('../KarmaEngine');
    mintCredits(10, 'Initial');
    const result = spendCredits(3, 'Test spend');
    expect(result).toBe(true);
    expect(getBalance()).toBe(7);
  });

  it('should reject spend when balance is insufficient', async () => {
    const { spendCredits, getBalance } = await import('../KarmaEngine');
    const result = spendCredits(5, 'Overdraft');
    expect(result).toBe(false);
    expect(getBalance()).toBe(0);
  });

  it('should record events in localStorage', async () => {
    const { mintCredits } = await import('../KarmaEngine');
    mintCredits(5, 'Journal entry');
    const events = JSON.parse(localStorage.getItem(EVENT_KEY) || '[]');
    expect(events.length).toBe(1);
    expect(events[0].kind).toBe('Journal entry');
    expect(events[0].delta).toBe(5);
  });

  it('should persist balance in localStorage', async () => {
    const { mintCredits } = await import('../KarmaEngine');
    mintCredits(42, 'Test');
    expect(localStorage.getItem(CREDITS_KEY)).toBe('42');
  });

  it('should cap events at 200', async () => {
    const { mintCredits } = await import('../KarmaEngine');
    for (let i = 0; i < 210; i++) {
      mintCredits(1, `Event ${i}`);
    }
    const events = JSON.parse(localStorage.getItem(EVENT_KEY) || '[]');
    expect(events.length).toBe(200);
    // Should keep the most recent 200
    expect(events[199].kind).toBe('Event 209');
  });
});
