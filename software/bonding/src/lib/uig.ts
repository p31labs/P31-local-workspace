import { generateInterface } from '@p31/interface-generator';
import type { GeneratorInput, InterfaceDescription } from '@p31/interface-generator';
import { useBondingAtmosphere } from '../atmosphere/useBondingAtmosphere';

/** Map bonding atmosphere coherence (0–1) → UIG spoon level (0–5). */
export function bondingSpoonsToUig(coherence: number): number {
  const c = Math.max(0, Math.min(1, coherence));
  return Math.round(c * 5);
}

/** Build a bonding InterfaceDescription from current atmosphere coherence. */
export function generateBondingInterface(opts: {
  coherence: number;
  passport?: unknown;
  viewData?: unknown;
}): InterfaceDescription {
  const input: GeneratorInput = {
    role: 'participant',
    spoons: bondingSpoonsToUig(opts.coherence),
    passport: opts.passport ?? null,
    viewData: opts.viewData ?? null,
  };
  return generateInterface(input);
}

/** React hook: live UIG description driven by the bonding atmosphere. */
export function useBondingUIG(passport?: unknown, viewData?: unknown): {
  description: InterfaceDescription;
  spoons: number;
  coherence: number;
} {
  const { coherence } = useBondingAtmosphere();
  const description = generateBondingInterface({ coherence, passport, viewData });
  return { description, spoons: bondingSpoonsToUig(coherence), coherence };
}
