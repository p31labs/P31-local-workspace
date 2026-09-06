import { describe, it, expect, beforeAll } from 'vitest';

async function sha256(msg: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

class LoveChain {
  private entries: Array<{ type: string; hash: string; prev: string; payload: string; ts: number }> = [];
  private genesisHash = '';

  get genesis(): string { return this.genesisHash; }
  get length(): number { return this.entries.length; }
  get current(): string { return this.entries.length > 0 ? this.entries[this.entries.length - 1].hash : this.genesisHash; }

  constructor() {
    this.genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
  }

  async append(type: string, payload: string): Promise<string> {
    const prev = this.current;
    const msg = `${type}|${payload}|${prev}`;
    const hash = await sha256(msg);
    this.entries.push({ type, hash, prev, payload, ts: Date.now() });
    return hash;
  }

  async verify(): Promise<boolean> {
    let prev = this.genesisHash;
    for (const entry of this.entries) {
      const msg = `${entry.type}|${entry.payload}|${prev}`;
      const hash = await sha256(msg);
      if (hash !== entry.hash) return false;
      if (entry.prev !== prev) return false;
      prev = hash;
    }
    return true;
  }
}

describe('LOVE ledger hash chain', () => {
  let chain: LoveChain;

  beforeAll(() => {
    chain = new LoveChain();
  });

  it('starts with genesis hash', () => {
    expect(chain.genesis).toBe('0000000000000000000000000000000000000000000000000000000000000000');
    expect(chain.length).toBe(0);
  });

  it('appends entries and returns hashes', async () => {
    const h1 = await chain.append('CARE_RECEIVED', JSON.stringify({ amount: 3 }));
    expect(h1).toBeTruthy();
    expect(h1).toHaveLength(64);
    expect(chain.length).toBe(1);

    const h2 = await chain.append('CARE_GIVEN', JSON.stringify({ amount: 2 }));
    expect(h2).toHaveLength(64);
    expect(chain.length).toBe(2);
  });

  it('each entry has unique hash', async () => {
    const h1 = await chain.append('test', '1');
    const h2 = await chain.append('test', '2');
    expect(h1).not.toBe(h2);
  });

  it('verifies chain integrity', async () => {
    const local = new LoveChain();
    expect(await local.verify()).toBe(true);
    await local.append('CARE_RECEIVED', '{}');
    await local.append('CARE_GIVEN', '{}');
    expect(await local.verify()).toBe(true);
  });

  it('detects tampered entry', async () => {
    const local = new LoveChain();
    await local.append('type-a', 'payload-a');
    (local as any).entries[0].hash = 'ffff';
    expect(await local.verify()).toBe(false);
  });

  it('detects broken prev link', async () => {
    const local = new LoveChain();
    await local.append('type-a', 'payload-a');
    await local.append('type-b', 'payload-b');
    (local as any).entries[1].prev = '0000';
    expect(await local.verify()).toBe(false);
  });
});
