import { describe, it, expect, beforeEach } from 'vitest';

describe('EventLogger', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return empty history by default', async () => {
    const { getHistory } = await import('../EventLogger');
    expect(getHistory()).toEqual([]);
  });

  it('should add and retrieve log entries', async () => {
    const { addLog, getHistory } = await import('../EventLogger');
    addLog('TEST_EVENT', 'test message');
    const history = getHistory();
    expect(history.length).toBe(1);
    expect(history[0].type).toBe('TEST_EVENT');
    expect(history[0].message).toBe('test message');
    expect(history[0].timestamp).toBeGreaterThan(0);
  });

  it('should return entries in insertion order', async () => {
    const { addLog, getHistory } = await import('../EventLogger');
    addLog('FIRST', 'a');
    addLog('SECOND', 'b');
    addLog('THIRD', 'c');
    const history = getHistory();
    expect(history[0].type).toBe('FIRST');
    expect(history[2].type).toBe('THIRD');
  });

  it('should cap at 200 entries', async () => {
    const { addLog, getHistory } = await import('../EventLogger');
    for (let i = 0; i < 210; i++) {
      addLog('BULK', `entry ${i}`);
    }
    const history = getHistory();
    expect(history.length).toBe(200);
    // Should keep the most recent 200
    expect(history[199].data).toBe('entry 209');
  });

  it('should return a copy, not the internal array', async () => {
    const { addLog, getHistory } = await import('../EventLogger');
    addLog('TEST', 'data');
    const h1 = getHistory();
    h1.push({ type: 'MUTATED', message: 'bad', data: null, timestamp: 0 });
    const h2 = getHistory();
    expect(h2.length).toBe(1);
  });
});
