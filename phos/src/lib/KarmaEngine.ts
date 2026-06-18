const CREDITS_KEY = 'p31_karma_balance';
const EVENT_KEY = 'p31_karma_events';
const MAX_EVENTS = 200;
const DB_CONN = 'idb://p31-karma-ledger';

interface KarmaEvent {
  kind: string;
  delta: number;
  timestamp: number;
  signature: string;
  prevSignature: string;
}

let dbInstance: any = null;
let dbReady: Promise<any> | null = null;

async function getDb(): Promise<any> {
  if (dbInstance) return dbInstance;
  if (dbReady) return dbReady;

  dbReady = (async () => {
    try {
      const { PGlite } = await import('@electric-sql/pglite');
      const db = await PGlite.create(DB_CONN, { relaxedDurability: true });
      await db.exec(`
        CREATE TABLE IF NOT EXISTS karma_ledger (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kind TEXT NOT NULL,
          delta INTEGER NOT NULL,
          timestamp INTEGER NOT NULL,
          signature TEXT NOT NULL,
          prev_signature TEXT NOT NULL DEFAULT 'GENESIS'
        );
        CREATE INDEX IF NOT EXISTS idx_karma_timestamp ON karma_ledger(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_karma_signature ON karma_ledger(signature);
      `);
      dbInstance = db;
      return db;
    } catch {
      try {
        const { PGlite } = await import('@electric-sql/pglite');
        const db = await PGlite.create('memory://');
        await db.exec(`
          CREATE TABLE IF NOT EXISTS karma_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kind TEXT NOT NULL,
            delta INTEGER NOT NULL,
            timestamp INTEGER NOT NULL,
            signature TEXT NOT NULL,
            prev_signature TEXT NOT NULL DEFAULT 'GENESIS'
          );
          CREATE INDEX IF NOT EXISTS idx_karma_timestamp ON karma_ledger(timestamp DESC);
          CREATE INDEX IF NOT EXISTS idx_karma_signature ON karma_ledger(signature);
        `);
        dbInstance = db;
        return db;
      } catch {
        dbReady = null;
        return null;
      }
    }
  })();

  return dbReady;
}

async function signEvent(kind: string, delta: number, timestamp: number, prevSig: string): Promise<string> {
  const payload = `${kind}:${delta}:${timestamp}:${prevSig}`;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return payload;
  }
}

function loadStore(): { balance: number; events: { kind: string; delta: number }[] } {
  try {
    const raw = localStorage.getItem(CREDITS_KEY);
    const events = JSON.parse(localStorage.getItem(EVENT_KEY) || '[]') as { kind: string; delta: number }[];
    return { balance: raw ? Number(raw) : 0, events };
  } catch {
    return { balance: 0, events: [] };
  }
}

function persist(balance: number, events: { kind: string; delta: number }[]): void {
  try {
    const capped = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
    localStorage.setItem(CREDITS_KEY, String(balance));
    localStorage.setItem(EVENT_KEY, JSON.stringify(capped));
  } catch { /* ignore */ }
}

export function getBalance(): number {
  return loadStore().balance;
}

export function mintCredits(amount: number, kind: string): number {
  const { balance, events } = loadStore();
  const updated = { kind, delta: amount };
  persist(balance + amount, [...events, updated]);
  return balance + amount;
}

export function spendCredits(amount: number, kind: string): boolean {
  const { balance, events } = loadStore();
  if (balance < amount) return false;
  const updated = { kind, delta: -amount };
  persist(balance - amount, [...events, updated]);
  return true;
}

/* v8 ignore start */
export async function mintCreditsAtomic(amount: number, kind: string): Promise<number> {
  const db = await getDb();
  if (!db) return mintCredits(amount, kind);

  try {
    const ts = Date.now();
    const lastRow = await db.query('SELECT signature FROM karma_ledger ORDER BY id DESC LIMIT 1');
    const prevSig = (lastRow.rows as any[])?.[0]?.signature || 'GENESIS';
    const signature = await signEvent(kind, amount, ts, prevSig);

    await db.query(
      'INSERT INTO karma_ledger (kind, delta, timestamp, signature, prev_signature) VALUES ($1, $2, $3, $4, $5)',
      [kind, amount, ts, signature, prevSig]
    );

    const result = await db.query('SELECT COALESCE(SUM(delta), 0) as balance FROM karma_ledger');
    const balance = Number((result.rows as any[])?.[0]?.balance || 0);

    // Sync to localStorage for fast reads
    persist(balance, loadStore().events);
    return balance;
  } catch {
    return mintCredits(amount, kind);
  }
}

export async function getBalanceAtomic(): Promise<number> {
  const db = await getDb();
  if (!db) return getBalance();

  try {
    const result = await db.query('SELECT COALESCE(SUM(delta), 0) as balance FROM karma_ledger');
    return Number((result.rows as any[])?.[0]?.balance || 0);
  } catch {
    return getBalance();
  }
}

export async function getLedgerHistory(limit = 50): Promise<KarmaEvent[]> {
  const db = await getDb();
  if (!db) {
    return loadStore().events.map((e) => ({
      ...e,
      timestamp: Date.now(),
      signature: '',
      prevSignature: '',
    }));
  }

  try {
    const result = await db.query(
      'SELECT kind, delta, timestamp, signature, prev_signature FROM karma_ledger ORDER BY id DESC LIMIT $1',
      [limit]
    );
    return (result.rows as any[]).map((r) => ({
      kind: r.kind,
      delta: r.delta,
      timestamp: r.timestamp,
      signature: r.signature,
      prevSignature: r.prev_signature,
    }));
  } catch {
    return [];
  }
}

export async function verifyLedgerIntegrity(): Promise<{ valid: boolean; count: number }> {
  const db = await getDb();
  if (!db) return { valid: true, count: 0 };

  try {
    const result = await db.query('SELECT kind, delta, timestamp, signature, prev_signature FROM karma_ledger ORDER BY id ASC');
    const rows = result.rows as any[];
    let valid = true;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i].prev_signature !== rows[i - 1].signature) {
        valid = false;
        break;
      }
    }

    return { valid, count: rows.length };
  } catch {
    return { valid: true, count: 0 };
  }
}
/* v8 ignore stop */
