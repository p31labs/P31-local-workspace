/**
 * @p31ca/govern — the P31 universal governance runtime.
 * The seam every domain constitution conforms to. Governs any system
 * (design, monetization, justice) via the same primitives.
 */
import { validateConstitution, loadConstitution, type Constitution } from './constitution.js';
import { runSelfTest, summarizeSelfTest, type SelfTestResult } from './self-test.js';
import { buildAuditEvent, type AuditEvent } from './audit.js';
import { runRatchets, type RatchetResult } from './ratchet.js';

export {
  validateConstitution,
  loadConstitution,
  runSelfTest,
  summarizeSelfTest,
  buildAuditEvent,
  runRatchets,
  type Constitution,
  type SelfTestResult,
  type AuditEvent,
  type RatchetResult,
};

/** Run the full governance pass on a constitution: validate → self-test → ratchets → audit. */
export function govern(conPath: string, baseDir: string) {
  const con = loadConstitution(conPath);
  const validation = validateConstitution(con);
  const selfTestResults = runSelfTest(con, baseDir);
  const selfTestSummary = summarizeSelfTest(selfTestResults);
  const ratchets = runRatchets(con, baseDir);
  const audit = buildAuditEvent(con, validation, {
    gates: selfTestResults.length,
    canFail: selfTestResults.filter((r) => r.canFail).length,
    furniture: selfTestSummary.furniture,
  }, ratchets);
  return { audit, selfTestResults, ratchets };
}