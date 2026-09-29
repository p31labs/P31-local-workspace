/**
 * abdicate — the review cadence's terminal state.
 *
 * Paper XXV: "if it requires the creator to maintain it, it has failed."
 * After N clean review cycles, a domain may transition to ABDICATED — the
 * runtime records the transition on the genesis chain, and the human hands off.
 *
 * Per the Centaur model (and NIST's human-oversight guidance), the transition
 * requires explicit human sign-off. The runtime does the work; the human
 * retains final authority over the abdication decision.
 */
import { Constitution } from './constitution.js';

export interface AbdicationState {
  domain: string;
  cleanCycles: number;
  required: number;
  eligible: boolean;
  note: string;
}

export function abdicationState(con: Constitution, cleanCycles: number): AbdicationState {
  const required = con.review.abdication.afterCleanCycles;
  const eligible = cleanCycles >= required;
  return {
    domain: con.domain,
    cleanCycles,
    required,
    eligible,
    note: eligible
      ? `Domain "${con.domain}" has completed ${cleanCycles} clean cycles. It is eligible to abdicate. Abdication requires explicit human sign-off (requiresHumanSignoff: true).`
      : `Domain "${con.domain}" has completed ${cleanCycles}/${required} clean cycles.`,
  };
}

export function abdicate(con: Constitution, cleanCycles: number, humanSignoff: string): { ok: boolean; note: string } {
  const state = abdicationState(con, cleanCycles);
  if (!state.eligible) return { ok: false, note: state.note };
  if (!humanSignoff || humanSignoff.length < 1) {
    return { ok: false, note: 'Abdication requires explicit human sign-off. The runtime does the work; the human retains final authority.' };
  }
  return {
    ok: true,
    note: `Domain "${con.domain}" abdicated by ${humanSignoff}. Governance is now self-sustaining.`,
  };
}