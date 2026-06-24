import type { Axis, RecursiveConfig } from '../types/index.js';

export function classifyAxis(
  axis: Axis,
  config: RecursiveConfig,
  currentDepth: number
): 'atomic' | 'composite' {
  if (currentDepth >= config.maxDepth) {
    return 'atomic';
  }

  if (axis.complexity === 'high') {
    return 'composite';
  }

  if (axis.convergenceGate.checks.length > config.atomicThreshold) {
    return 'composite';
  }

  if (axis.deliverable.length > 2) {
    return 'composite';
  }

  return 'atomic';
}
