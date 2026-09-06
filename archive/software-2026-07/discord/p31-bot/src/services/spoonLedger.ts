/**
 * Spoon Ledger — file-backed per-user spoon economy.
 *
 * Persists to spoon-ledger.json next to the running process.
 * In-memory Map is the source of truth; flushed to disk on every write.
 * All operations are synchronous-safe (no concurrent write races in Node.js
 * single-threaded event loop).
 */

import fs from 'fs';
import path from 'path';

const LEDGER_PATH = path.join(process.cwd(), 'spoon-ledger.json');

const REGEN_AMOUNT = 25;
const REGEN_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_BALANCE_CAP = 200; // Prevent inflation
let regenInterval: ReturnType<typeof setInterval> | null = null;

interface LedgerEntry {
  balance: number;
  totalEarned: number;
  lastUpdated: string;
}

type Ledger = Record<string, LedgerEntry>;

function load(): Ledger {
  try {
    if (fs.existsSync(LEDGER_PATH)) {
      return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8')) as Ledger;
    }
  } catch {
    console.warn('[SpoonLedger] Could not read ledger file — starting fresh');
  }
  return {};
}

function flush(ledger: Ledger): void {
  try {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SpoonLedger] Failed to write ledger:', err);
  }
}

// Load once at module init
const ledger: Ledger = load();

/**
 * Award spoons to a user. Returns new balance.
 */
export function award(userId: string, amount: number): number {
  const now = new Date().toISOString();
  const entry = ledger[userId] ?? { balance: 0, totalEarned: 0, lastUpdated: now };
  entry.balance += amount;
  entry.totalEarned += amount;
  entry.lastUpdated = now;
  ledger[userId] = entry;
  flush(ledger);
  return entry.balance;
}

/**
 * Deduct spoons from a user (won't go below 0). Returns new balance.
 */
export function spend(userId: string, amount: number): number {
  const entry = ledger[userId];
  if (!entry) return 0;
  entry.balance = Math.max(0, entry.balance - amount);
  entry.lastUpdated = new Date().toISOString();
  flush(ledger);
  return entry.balance;
}

/**
 * Get a user's current balance (0 if never earned any).
 */
export function getBalance(userId: string): number {
  return ledger[userId]?.balance ?? 0;
}

/**
 * Get full entry for a user, or null if not in ledger.
 */
export function getEntry(userId: string): LedgerEntry | null {
  return ledger[userId] ?? null;
}

/**
 * Get all entries sorted by totalEarned descending (leaderboard).
 */
export function getLeaderboard(limit = 10): Array<{ userId: string } & LedgerEntry> {
  return Object.entries(ledger)
    .map(([userId, entry]) => ({ userId, ...entry }))
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .slice(0, limit);
}

/**
 * Total spoons awarded across all users.
 */
export function getGlobalTotal(): number {
  return Object.values(ledger).reduce((sum, e) => sum + e.totalEarned, 0);
}

/**
 * Merge all spoons from fromKey into toKey, then delete fromKey.
 * Returns the amount transferred, or 0 if fromKey doesn't exist.
 */
export function transferAll(fromKey: string, toKey: string): number {
  const source = ledger[fromKey];
  if (!source || source.balance === 0) return 0;
  const transferred = source.balance;
  award(toKey, transferred);
  delete ledger[fromKey];
  flush(ledger);
  return transferred;
}

/**
 * Regenerate spoons for all users.
 * Adds REGEN_AMOUNT to each user's balance, capped at MAX_BALANCE_CAP.
 * Returns the total amount regenerated.
 */
export function regenerateAll(): number {
  let totalRegenned = 0;
  const now = new Date().toISOString();
  
  for (const [userId, entry] of Object.entries(ledger)) {
    // Skip external keys (kofi:, stripe:)
    if (userId.includes(':')) continue;
    
    const headroom = MAX_BALANCE_CAP - entry.balance;
    if (headroom <= 0) continue;
    
    const amount = Math.min(REGEN_AMOUNT, headroom);
    entry.balance += amount;
    entry.lastUpdated = now;
    totalRegenned += amount;
  }
  
  if (totalRegenned > 0) {
    flush(ledger);
  }
  
  return totalRegenned;
}

/**
 * Start the spoon regeneration cron.
 * Call this once on bot ready.
 */
export function startSpoonRegeneration(): void {
  if (regenInterval !== null) {
    console.log('[SpoonLedger] Regeneration already running');
    return;
  }
  
  // Run immediately on start
  console.log('[SpoonLedger] Running initial spoon regeneration...');
  const initialRegen = regenerateAll();
  console.log(`[Economy] Initial spoon regeneration: +${initialRegen} spoons`);
  
  // Schedule every 6 hours
  regenInterval = setInterval(() => {
    const regenned = regenerateAll();
    console.log(`[Economy] Executed 6-hour spoon regeneration: +${regenned} spoons`);
  }, REGEN_INTERVAL_MS);
  
  console.log(`[SpoonLedger] Spoon regeneration started (every ${REGEN_INTERVAL_MS / 3600000} hours)`);
}

/**
 * Stop the regeneration cron (for graceful shutdown).
 */
export function stopSpoonRegeneration(): void {
  if (regenInterval) {
    clearInterval(regenInterval);
    regenInterval = null;
    console.log('[SpoonLedger] Spoon regeneration stopped');
  }
}
