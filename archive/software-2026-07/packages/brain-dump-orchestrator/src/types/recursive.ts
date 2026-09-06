export type BatchStrategy = 'depth-first' | 'breadth-first' | 'layer-sequential';

export interface RecursiveConfig {
  maxDepth: number;
  branchingFactor: number;
  batchStrategy: BatchStrategy;
  atomicThreshold: number;
}
