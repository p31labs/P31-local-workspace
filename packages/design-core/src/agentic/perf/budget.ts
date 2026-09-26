import { gzipSync } from 'node:zlib';

export interface BudgetSpec {
  /** gzipped KB */
  bundle: number;
  /** ms per frame */
  renderTime: number;
}

export interface PerfReport {
  ok: boolean;
  lines: string[];
}

const DEFAULTS: BudgetSpec = { bundle: 3, renderTime: 16.67 };

/** DeepSeek contract: nothing ships over budget. */
export function checkBudgets(measured: { gzipBytes?: number; sourceBytes?: number; frameMs?: number }, budget: Partial<BudgetSpec> = {}): PerfReport {
  const b = { ...DEFAULTS, ...budget };
  const lines: string[] = [];
  let ok = true;

  const bytes = measured.gzipBytes ?? (measured.sourceBytes !== undefined ? gzipSync(Buffer.from('x'.repeat(measured.sourceBytes))).length : undefined);
  if (bytes !== undefined) {
    const kb = bytes / 1024;
    const pass = kb <= b.bundle;
    ok = ok && pass;
    lines.push(`bundle: ${kb.toFixed(2)}kb gzip (budget ≤${b.bundle}kb) ${pass ? '✅' : '❌'}`);
  }
  if (measured.frameMs !== undefined) {
    const pass = measured.frameMs <= b.renderTime;
    ok = ok && pass;
    lines.push(`frame: ${measured.frameMs.toFixed(2)}ms (budget ≤${b.renderTime}ms @60Hz) ${pass ? '✅' : '❌'}`);
  }
  if (!lines.length) lines.push('nothing measured');
  return { ok, lines };
}
