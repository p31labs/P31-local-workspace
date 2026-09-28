/**
 * govern:ratchet — shrink-only debt baselines. Two properties:
 *   1. Prevent growth: current <= baseline. New debt → fail.
 *   2. Lock the gain: if current < baseline, force the floor down in the same
 *      commit when the gap exceeds the lockThreshold. Otherwise the headroom
 *      silently permits reintroduction.
 */
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Constitution } from './constitution.js';

export interface RatchetResult {
  id: string;
  baseline: number;
  current: number;
  ok: boolean;
  detail: string;
}

export function runRatchets(con: Constitution, baseDir: string): RatchetResult[] {
  const results: RatchetResult[] = [];
  for (const r of con.ratchets) {
    let current = NaN;
    try {
      const cmd = r.countSource;
      const full = resolve(baseDir, cmd.startsWith('./') ? cmd.slice(2) : cmd);
      // The count source emits a JSON {count: N} or a bare number on stdout.
      const out = execSync(`node ${full}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }).trim();
      const match = out.match(/["']count["']\s*:\s*(\d+)|^(\d+)$/);
      current = match ? Number(match[1] ?? match[2]) : NaN;
    } catch (e: unknown) {
      const status = (e as { status?: number }).status ?? 1;
      results.push({ id: r.id, baseline: r.baseline, current: NaN, ok: false, detail: `count source failed (exit ${status})` });
      continue;
    }
    if (Number.isNaN(current)) {
      results.push({ id: r.id, baseline: r.baseline, current, ok: false, detail: 'count source did not emit a count' });
      continue;
    }
    if (current > r.baseline) {
      results.push({ id: r.id, baseline: r.baseline, current, ok: false, detail: `GROWTH: ${current} > baseline ${r.baseline}` });
    } else if (r.baseline - current > r.lockThreshold) {
      results.push({ id: r.id, baseline: r.baseline, current, ok: false, detail: `LOCK THE GAIN: headroom ${r.baseline - current} > ${r.lockThreshold}; lower the floor to ${current} in this commit` });
    } else if (current < r.baseline) {
      results.push({ id: r.id, baseline: r.baseline, current, ok: true, detail: `headroom ${r.baseline - current} ≤ ${r.lockThreshold}; floor may stay` });
    } else {
      results.push({ id: r.id, baseline: r.baseline, current, ok: true, detail: 'at baseline' });
    }
  }
  return results;
}