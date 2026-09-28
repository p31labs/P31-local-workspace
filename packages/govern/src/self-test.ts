/**
 * govern:self-test — the meta-gate. "Who checks the thing that checks."
 *
 * For every gate in a domain's constitution, runs the gate's negative control
 * and asserts the gate exits non-zero (proves it can fail). A gate that passes
 * its own negative control is furniture.
 *
 * Anti-gaming: this must run from a base-branch copy, not the working tree, so
 * an agent cannot satisfy it by weakening a gate's failure path.
 */
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Constitution, loadConstitution } from './constitution.js';

export interface SelfTestResult {
  gate: string;
  canFail: boolean;
  ms: number;
  detail?: string;
}

export function runSelfTest(con: Constitution, baseDir: string): SelfTestResult[] {
  const results: SelfTestResult[] = [];
  for (const gate of con.gates) {
    const start = Date.now();
    let canFail = false;
    let detail = '';
    try {
      // Run the negative control command (relative to the constitution's dir).
      const cmd = gate.negativeControl.command;
      const full = resolve(baseDir, cmd.startsWith('./') ? cmd.slice(2) : cmd);
      execSync(`node ${full}`, { stdio: 'pipe', timeout: 30000 });
      canFail = true; // negative control exited 0 = the gate correctly FAILED
      detail = 'negative control proved the gate can fail';
    } catch (e: unknown) {
      canFail = false;
      detail = `GATE IS FURNITURE or broken negative control (exit ${(e as { status?: number }).status ?? 1})`;
    }
    results.push({ gate: gate.id, canFail, ms: Date.now() - start, detail });
  }
  return results;
}

export function summarizeSelfTest(results: SelfTestResult[]): { ok: boolean; furniture: string[] } {
  const furniture = results.filter((r) => !r.canFail).map((r) => r.gate);
  return { ok: furniture.length === 0, furniture };
}