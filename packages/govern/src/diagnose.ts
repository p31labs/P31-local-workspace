/**
 * diagnose — the floating-neutral check.
 *
 * Paper XXV: a Wye (star) topology has a single reference point that, if
 * severed, floats — heavily loaded nodes collapse, lightly loaded ones spike.
 * A Delta (mesh) topology has no single point of failure.
 *
 * Translated to governance: a domain with a single gate, a single review
 * owner, a single canonical source with no mirrors, or a lesson whose
 * prevention points at one gate, is a Wye topology. This diagnostic flags
 * those and emits the Wye-to-Delta remediation.
 */
import { Constitution, isFourPartyReview } from './constitution.js';

export interface FloatingNeutral {
  primitive: string;
  detail: string;
  remediation: string;
}

export function diagnose(con: Constitution): FloatingNeutral[] {
  const risks: FloatingNeutral[] = [];

  if (!con.mirrors || con.mirrors.length === 0) {
    risks.push({
      primitive: 'canonicalSource',
      detail: 'the canonical source has no mirrors — nothing depends on it, so nothing checks it',
      remediation: 'add at least one generated mirror with a parityGate (Wye → Delta)',
    });
  }

  if (con.gates.length === 1) {
    risks.push({
      primitive: 'gates',
      detail: 'a single gate carries all enforcement — sever it and the domain is ungoverned',
      remediation: 'distribute enforcement across at least two gates (Wye → Delta)',
    });
  }

  if (!isFourPartyReview(con.review.who)) {
    risks.push({
      primitive: 'review.who',
      detail: 'a single review owner is a Wye topology — one severance and the domain floats',
      remediation: 'declare the four-party K4 review (user, issuer, ledger, court) for co-equality (Wye → Delta)',
    });
  }

  const gateIds = new Set(con.gates.map((g) => `gate:${g.id}`));
  for (const l of con.lessons) {
    const targets = l.prevention.match(/RUNBOOK-[a-z0-9-]+|gate:[a-z0-9-]+/g) ?? [];
    if (targets.length === 1 && gateIds.has(targets[0])) {
      risks.push({
        primitive: `lesson ${l.id}`,
        detail: `the prevention points at a single gate (${targets[0]}) — if that gate is removed, the lesson is unguarded`,
        remediation: 'pair the gate with a runbook (gate + runbook is the minimum resilient pair)',
      });
    }
  }

  return risks;
}