/**
 * @p31ca/govern — the P31 universal governance runtime.
 * The seam every domain constitution conforms to. Governs any system
 * (design, monetization, justice) via the same primitives.
 */
import { resolve } from 'node:path';
import {
  validateConstitution, loadConstitution, constitutionRoot, validateConstitutionAt,
  type Constitution,
} from './constitution.js';
import { runSelfTest, summarizeSelfTest, type SelfTestResult } from './self-test.js';
import { runRatchets, type RatchetResult } from './ratchet.js';
import { diagnose, type FloatingNeutral } from './diagnose.js';
import { abdicationState, abdicate } from './abdicate.js';
import {
  JsonlHashChainSink, StdoutSink, CompositeSink,
  type AuditEvent, type AuditSink, type Block,
} from './sink.js';
import { generate, specToConstitution, type GenerateOptions, type GenerateResult } from './generate.js';
import { compose, type ComposeResult } from './compose.js';
import { reconcile, checkReconciliation, resolveDomainChains, readChain, type ReconcileResult, type DomainStatus, type DomainChainRef } from './reconcile.js';
import { loadSpecFromYaml, loadEnterpriseFromYaml } from './spec-yaml.js';
import type { DomainSpec, EnterpriseSpec, InterDomainContract } from './spec.js';

export {
  validateConstitution, loadConstitution, constitutionRoot, validateConstitutionAt,
  runSelfTest, summarizeSelfTest, runRatchets,
  diagnose, abdicationState, abdicate,
  JsonlHashChainSink, StdoutSink, CompositeSink,
  generate, specToConstitution, compose,
  reconcile, checkReconciliation, resolveDomainChains, readChain,
  loadSpecFromYaml, loadEnterpriseFromYaml,
  type Constitution, type SelfTestResult, type RatchetResult,
  type AuditEvent, type AuditSink, type Block, type FloatingNeutral,
  type GenerateOptions, type GenerateResult, type ComposeResult,
  type ReconcileResult, type DomainStatus, type DomainChainRef,
  type DomainSpec, type EnterpriseSpec, type InterDomainContract,
};

const CRITICAL_VIOLATION = /furniture|GROWTH|LOCK THE GAIN|is required|must be/;

/** Run the full governance pass on a constitution: validate → self-test → ratchets → diagnose → audit. */
export function govern(
  conPath: string,
  capacity: number | null = null,
  sinkOverride?: AuditSink,
): { audit: AuditEvent; block: Block; selfTestResults: SelfTestResult[]; floatingNeutrals: FloatingNeutral[] } {
  const con = loadConstitution(conPath);
  const root = constitutionRoot(conPath);
  const validation = validateConstitutionAt(conPath);
  const selfTestResults = runSelfTest(con, root);
  const selfTestSummary = summarizeSelfTest(selfTestResults);
  const ratchets = runRatchets(con, root);
  const floatingNeutrals = diagnose(con);

  const allViolations = [
    ...validation.violations,
    ...selfTestSummary.furniture.map((g) => `furniture gate: ${g}`),
    ...ratchets.filter((r) => !r.ok).map((r) => `ratchet ${r.id}: ${r.detail}`),
  ];
  const emittedViolations =
    capacity !== null && capacity <= 1
      ? allViolations.filter((v) => CRITICAL_VIOLATION.test(v))
      : allViolations;

  const audit: AuditEvent = {
    domain: con.domain,
    schemaVersion: con.version,
    timestamp: new Date().toISOString(),
    valid:
      validation.valid &&
      selfTestSummary.furniture.length === 0 &&
      ratchets.every((r) => r.ok),
    violations: emittedViolations,
    selfTest: {
      gates: selfTestResults.length,
      canFail: selfTestResults.filter((r) => r.canFail).length,
      furniture: selfTestSummary.furniture,
    },
    ratchets: ratchets.map((r) => ({
      id: r.id, baseline: r.baseline, current: r.current, ok: r.ok, detail: r.detail,
    })),
    floatingNeutrals,
    capacity,
  };

  const sink: AuditSink =
    sinkOverride ??
    (con.auditLog.sink === 'jsonl-hash-chain'
      ? new JsonlHashChainSink(resolve(root, '.govern-audit.jsonl'), con.auditLog.chainName)
      : new StdoutSink());

  const block = sink.append(audit);
  return { audit, block, selfTestResults, floatingNeutrals };
}