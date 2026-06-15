export const LARMOR_CONSTANTS = {
  GAMMA_31P: 17.235e6,
  MOTIONAL_NARROWING_FREQ: 1e11,
  EARTH_B_FIELD: 50e-6,
} as const;

export const COHERENCE_THRESHOLDS = {
  BUNCHED: 1.0,
  COHERENT: 1.0,
  ANTIBUNCHED: 1.0,
} as const;

export function calculateLarmorFrequency(bField: number): number {
  return (LARMOR_CONSTANTS.GAMMA_31P * bField) / (2 * Math.PI);
}

export function evaluateSecondOrderCoherence(g2Zero: number): 'BUNCHED' | 'COHERENT' | 'ANTIBUNCHED' {
  if (g2Zero > 1) return 'BUNCHED';
  if (Math.abs(g2Zero - 1) < 1e-6) return 'COHERENT';
  return 'ANTIBUNCHED';
}

export function trackSynapticScaling(caCurrent: number, tauCa: number): number {
  if (caCurrent <= tauCa) return 1.0;
  const excess = (caCurrent - tauCa) / tauCa;
  return Math.max(0.5, 1.0 / (1.0 + excess));
}
