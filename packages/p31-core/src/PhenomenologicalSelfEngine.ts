export const FINE_STRUCTURE_ALPHA = Math.log(3) / Math.log(6);

export const WORKING_MEMORY_CAPACITY = 4;

export function projectSO6ToSO3(geodesicCoordinates: number[]): {
  targetSpacetimeCoordinates: [number, number, number];
  metabolicTax: number;
} {
  if (geodesicCoordinates.length !== 15) {
    throw new Error(`SO(6) requires 15 coordinates, received ${geodesicCoordinates.length}`);
  }

  const target: [number, number, number] = [geodesicCoordinates[0], geodesicCoordinates[1], geodesicCoordinates[2]];

  const vAxis = geodesicCoordinates.slice(6, 10).reduce((a, b) => a + b * b, 0);
  const wAxis = geodesicCoordinates.slice(10, 15).reduce((a, b) => a + b * b, 0);
  const denominator = Math.sqrt(vAxis + wAxis);
  const pitch = denominator === 0 ? 0 : Math.sqrt(vAxis) / denominator;

  const metabolicTax = FINE_STRUCTURE_ALPHA * (1 + pitch);

  return { targetSpacetimeCoordinates: target, metabolicTax };
}

export function evaluateTyrannyInstability(vDominanceRatio: number): boolean {
  if (vDominanceRatio < 0 || vDominanceRatio > 1) {
    throw new Error('vDominanceRatio must be between 0 and 1');
  }
  return vDominanceRatio > 0.5;
}

export function getWorkingMemoryChannels(): number {
  return WORKING_MEMORY_CAPACITY;
}
