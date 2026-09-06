/**
 * p31.soulsafeRetention/0.1.0 — FIFO + optional age floor for soulsafe_runs audit rows.
 * See docs/SOULSAFE-TETRA-SPEC.md (home bonding-soup repo) §3.
 */

export const SOULSAFE_RETENTION_SCHEMA = "p31.soulsafeRetention/0.1.0";

const DEFAULT_MAX_ROWS = 800;
const MIN_ROWS = 50;
const MAX_ROWS_CAP = 20000;
const MIN_AGE_MS = 86400000;

function clampRows(n) {
  if (Number.isNaN(n)) return DEFAULT_MAX_ROWS;
  return Math.max(MIN_ROWS, Math.min(MAX_ROWS_CAP, n));
}

/**
 * @param {Record<string, string | undefined> | undefined} env
 */
export function parseSoulsafeRunsMaxRows(env) {
  const raw = env?.SOULSAFE_RUNS_MAX_ROWS;
  const n =
    raw === undefined || raw === null || raw === "" ? DEFAULT_MAX_ROWS : parseInt(String(raw), 10);
  return clampRows(n);
}

/**
 * @param {Record<string, string | undefined> | undefined} env
 * @returns {number | null} null disables age eviction; enabled values are ≥86400000
 */
export function parseSoulsafeRunsMaxAgeMs(env) {
  if (!env) return null;
  const raw = env.SOULSAFE_RUNS_MAX_AGE_MS;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = parseInt(String(raw), 10);
  if (Number.isNaN(n) || n === 0) return null;
  return Math.max(MIN_AGE_MS, n);
}

/**
 * @param {SqlStorage} sql DO SQLite handle
 */
export function countSoulsafeRuns(sql) {
  try {
    const rows = sql.exec("SELECT COUNT(*) AS n FROM soulsafe_runs").toArray();
    const row = rows[0];
    if (!row || row.n == null) return 0;
    return Number(row.n);
  } catch (_) {
    return 0;
  }
}

/**
 * Deletes rows older than the age floor (if enabled), then oldest-by-id excess over maxRows.
 * @param {SqlStorage} sql
 * @param {number} maxRows
 * @param {number | null} maxAgeMs
 */
export function trimSoulsafeRuns(sql, maxRows, maxAgeMs) {
  const cap = clampRows(typeof maxRows === "number" ? maxRows : DEFAULT_MAX_ROWS);
  try {
    const now = Date.now();
    if (maxAgeMs != null && maxAgeMs > 0) {
      const cutoff = now - maxAgeMs;
      sql.exec("DELETE FROM soulsafe_runs WHERE ts < ?", cutoff);
    }
    let countRows = sql.exec("SELECT COUNT(*) AS n FROM soulsafe_runs").toArray();
    let n = countRows[0] && countRows[0].n != null ? Number(countRows[0].n) : 0;
    if (n <= cap) return;
    const toDelete = n - cap;
    sql.exec(
      "DELETE FROM soulsafe_runs WHERE id IN (SELECT id FROM soulsafe_runs ORDER BY id ASC LIMIT ?)",
      toDelete
    );
  } catch (_) {
    /* best-effort retention */
  }
}
