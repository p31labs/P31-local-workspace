import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('discord.js', () => ({
  EmbedBuilder: class EmbedBuilder {
    data: Record<string, unknown> = {};
    setColor(_c: number) { return this; }
    setTitle(_t: string) { return this; }
    setDescription(_d: string) { return this; }
    setFooter(_f: Record<string, string>) { return this; }
    addFields(..._f: Array<Record<string, unknown>>) { return this; }
  },
  Message: class Message {
    author = { id: 'user-1' };
    reply = vi.fn().mockResolvedValue({});
    mentions = { users: { first: vi.fn() } };
    channel = { id: 'channel-1' };
    guildId = 'guild-1';
    content = '';
  },
  Role: class Role {},
}));

const { store } = vi.hoisted(() => {
  const store: Record<string, string> = {};
  return { store };
});

vi.mock('fs', () => ({
  default: {
    existsSync: () => false,
    readFileSync: (p: string) => store[p] ?? (p.includes('founding') ? '[]' : '{}'),
    writeFileSync: (p: string, data: string) => { store[p] = data; },
  },
}));

describe('ClaimCommand (unit via eggTracker integration)', () => {
  beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k]);
    vi.resetModules();
  });

  it('eggTracker.recordDiscovery + spoonLedger integration works for egg claim', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    const spoonLedger = await import('../services/spoonLedger');

    const isNew = eggTracker.recordDiscovery('user-1', 'bashium');
    expect(isNew).toBe(true);

    spoonLedger.award('user-1', 39);
    expect(spoonLedger.getBalance('user-1')).toBe(39);
  });

  it('claiming same egg twice returns false', async () => {
    const { eggTracker } = await import('../services/eggTracker');

    eggTracker.recordDiscovery('user-2', 'tetrahedron');
    const isSecond = eggTracker.recordDiscovery('user-2', 'tetrahedron');
    expect(isSecond).toBe(false);
  });

  it('completing all 4 eggs enables founding node claim', async () => {
    const { eggTracker, ALL_EGGS } = await import('../services/eggTracker');

    for (const egg of ALL_EGGS) {
      eggTracker.recordDiscovery('user-3', egg);
    }

    expect(eggTracker.hasCompletedAll('user-3')).toBe(true);
    const slot = eggTracker.claimFoundingNode('user-3');
    expect(slot).toBe(1);
  });

  it('founding node claim returns null when all slots full', async () => {
    const { eggTracker, FOUNDING_SLOTS } = await import('../services/eggTracker');

    for (let i = 0; i < FOUNDING_SLOTS; i++) {
      eggTracker.claimFoundingNode(`slot-user-${i}`);
    }

    const slot = eggTracker.claimFoundingNode('latecomer');
    expect(slot).toBeNull();
  });

  it('spoon award stacks across multiple egg claims', async () => {
    const spoonLedger = await import('../services/spoonLedger');

    spoonLedger.award('user-5', 39);
    spoonLedger.award('user-5', 39);
    spoonLedger.award('user-5', 39);

    expect(spoonLedger.getBalance('user-5')).toBe(117);
    expect(spoonLedger.getEntry('user-5')?.totalEarned).toBe(117);
  });
});
