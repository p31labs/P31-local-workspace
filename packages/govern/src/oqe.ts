/**
 * oqe — Objective Quality Evidence.
 *
 * Paper XIX (SOULSAFE): "Claims that cannot be traced to OQE are classified as
 * aspirational and must be clearly labeled as future work."
 *
 * The 7 evidence classes are the SOULSAFE taxonomy. A claim (a gate, a lesson's
 * root cause, a canonical source) carries exactly one OQE reference. The
 * runtime refuses `valid: true` if any required OQE is missing.
 */

export const OQE_CLASSES = [
  'test-suite',
  'compiler',
  'deploy-log',
  'primary-source',
  'doi',
  'api-response',
  'legal-record',
] as const;

export type OqeClass = (typeof OQE_CLASSES)[number];

export interface Oqe {
  evidenceClass: OqeClass;
  reference: string;
}

export function validateOqe(oqe: unknown, context: string): string[] {
  const violations: string[] = [];
  if (!oqe || typeof oqe !== 'object') {
    return [`${context}: oqe is required (a claim without traceable evidence is aspirational, not true)`];
  }
  const o = oqe as Partial<Oqe>;
  if (!o.evidenceClass || !OQE_CLASSES.includes(o.evidenceClass)) {
    violations.push(
      `${context}: oqe.evidenceClass must be one of ${OQE_CLASSES.join(' | ')}`,
    );
  }
  if (!o.reference || o.reference.length < 1) {
    violations.push(`${context}: oqe.reference is required (where the evidence lives)`);
  }
  return violations;
}