import type { IntentSpec } from '../intent/schema';

export type CheckStatus = 'pass' | 'warn' | 'reject';

export interface GateCheck {
  name: string;
  status: CheckStatus;
  detail: string;
}

export interface GateReport {
  approved: boolean;
  checks: GateCheck[];
}

/**
 * Opus (Architect) gate — the automated half of QA. Anything marked
 * `reject` blocks generation; `warn` ships with a note in the report.
 */
export function runQaGates(spec: IntentSpec): GateReport {
  const checks: GateCheck[] = [];
  const a = spec.constraints.accessibility;

  checks.push({
    name: 'contrast-target',
    status: a.contrast >= 7 ? 'pass' : a.contrast >= 4.5 ? 'warn' : 'reject',
    detail:
      a.contrast >= 7
        ? `${a.contrast}:1 meets AAA`
        : a.contrast >= 4.5
          ? `${a.contrast}:1 meets AA only — AAA requires 7:1`
          : `${a.contrast}:1 is below AA floor`,
  });

  const touchOk = a.touchTarget >= (a.wcag === 'AAA' ? 48 : 44);
  checks.push({
    name: 'touch-target',
    status: touchOk ? 'pass' : 'reject',
    detail: `${a.touchTarget}px vs required ${a.wcag === 'AAA' ? 48 : 44}px minimum`,
  });

  const spoons = spec.constraints.spoonAware;
  if (typeof spoons === 'boolean') {
    checks.push({
      name: 'spoon-coverage',
      status: spoons ? 'pass' : 'reject',
      detail: spoons ? 'full 0–5 ladder declared' : 'component claims spoon-blindness — only valid for system-internal tools',
    });
  } else {
    const invalid = spoons.filter((n) => n < 0 || n > 5);
    checks.push({
      name: 'spoon-coverage',
      status: invalid.length ? 'reject' : 'pass',
      detail: invalid.length ? `levels out of range: ${invalid.join(',')}` : `explicit levels ${spoons.join(',')}`,
    });
  }

  for (const love of spec.constraints.loveSemantics) {
    checks.push({
      name: `love-semantics:${love.trigger}`,
      status: 'pass',
      detail: `+${love.reward} → ${love.recipient.join('/')}${love.description ? ` (${love.description})` : ''}`,
    });
  }

  if (spec.constraints.performance.bundle > 5) {
    checks.push({ name: 'bundle-budget', status: 'warn', detail: `${spec.constraints.performance.bundle}kb is generous — justify or trim` });
  }

  return { approved: !checks.some((c) => c.status === 'reject'), checks };
}
