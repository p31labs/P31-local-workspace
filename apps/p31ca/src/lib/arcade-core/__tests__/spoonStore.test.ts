import { describe, it, expect, beforeEach } from 'vitest';
import { createSpoonStore, getSpoonStore } from '../spoonStore';

function makeStore() {
  const instance = getSpoonStore();
  instance.reset();
  instance.setLevel(4, 'default');
  return instance;
}

describe('spoonStore', () => {
  beforeEach(() => {
    makeStore();
  });

  it('initializes with default values', () => {
    const store = getSpoonStore();
    expect(store.state.level).toBe(4);
    expect(store.state.maxLevel).toBe(12);
    expect(store.state.source).toBe('default');
  });

  it('sets level within bounds', () => {
    const store = getSpoonStore();
    store.setLevel(10);
    expect(store.state.level).toBe(10);
    expect(store.state.recoveryMinutes).toBe(8); // (12-10)*4
  });

  it('clamps level to 0..maxLevel', () => {
    const store = getSpoonStore();
    store.setLevel(-3);
    store.setLevel(99);
    expect(store.state.level).toBe(12);
  });

  it('computes jitterFactor correctly', () => {
    const store = getSpoonStore();
    store.setLevel(4);
    expect(store.state.jitterFactor).toBeCloseTo(0, 5);
    store.setLevel(12);
    expect(store.state.jitterFactor).toBeCloseTo(1, 5);
    store.setLevel(8);
    expect(store.state.jitterFactor).toBeCloseTo(0.5, 5);
  });

  it('computes recoveryMinutes correctly', () => {
    const store = getSpoonStore();
    store.setLevel(0);
    expect(store.state.recoveryMinutes).toBe(48); // (12-0)*4
    store.setLevel(6);
    expect(store.state.recoveryMinutes).toBe(24);
  });

  it('notifies subscribers on change', () => {
    const store = getSpoonStore();
    const values: { level: number; source: string }[] = [];
    const unsub = store.subscribe((state) => values.push({ level: state.level, source: state.source }));
    store.setLevel(7, 'phos');
    store.setLevel(11, 'manual');
    unsub();
    expect(values).toEqual([
      expect.objectContaining({ level: 7, source: 'phos' }),
      expect.objectContaining({ level: 11, source: 'manual' }),
    ]);
  });

  it('resets to medium spoons with default source', () => {
    const store = getSpoonStore();
    store.setLevel(0, 'phos');
    store.reset();
    expect(store.state.level).toBe(7);
    expect(store.state.source).toBe('default');
  });
});
