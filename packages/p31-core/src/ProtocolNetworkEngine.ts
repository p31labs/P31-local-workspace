export interface Graph {
  vertices: Array<string | number>;
  edges: Array<[string | number, string | number]>;
}

export function verifyGraphAsymmetricKey(graph: Graph, privateEdsSet: Array<string | number>): boolean {
  const vertexSet = new Set(graph.vertices);
  for (const v of privateEdsSet) {
    if (!vertexSet.has(v)) return false;
  }

  const adj = new Map<string | number, Set<string | number>>();
  for (const v of graph.vertices) adj.set(v, new Set());
  for (const [u, v] of graph.edges) {
    adj.get(u)!.add(v);
    adj.get(v)!.add(u);
  }

  const dominationCount = new Map<string | number, number>();
  for (const v of graph.vertices) dominationCount.set(v, 0);

  for (const d of privateEdsSet) {
    dominationCount.set(d, (dominationCount.get(d) || 0) + 1);
    for (const nb of adj.get(d) || []) {
      dominationCount.set(nb, (dominationCount.get(nb) || 0) + 1);
    }
  }

  for (const v of graph.vertices) {
    if (dominationCount.get(v) !== 1) return false;
  }
  return true;
}

export function calculateRsaKeyPair(p: number, q: number, e: number): { n: number; e: number; d: number } {
  const n = p * q;
  const phi = (p - 1) * (q - 1);
  let d = 0;
  for (let i = 1; i < phi; i++) {
    if ((e * i) % phi === 1) {
      d = i;
      break;
    }
  }
  if (d === 0) throw new Error('Could not compute modular inverse; check that e is coprime with phi');
  return { n, e, d };
}

export function evaluateWyeDeltaImbalance(phaseA: number, phaseB: number, phaseC: number): { floatingNeutralDrift: number; isResilient: boolean } {
  const avg = (phaseA + phaseB + phaseC) / 3;
  const drift = Math.sqrt((phaseA - avg) ** 2 + (phaseB - avg) ** 2 + (phaseC - avg) ** 2);
  return { floatingNeutralDrift: drift, isResilient: false };
}

export function initializeIsostaticStorage(): {
  walMode: boolean;
  useIndexedDB: boolean;
  syncDebounceMs: number;
  maxSyncAttempts: number;
} {
  return {
    walMode: true,
    useIndexedDB: true,
    syncDebounceMs: 500,
    maxSyncAttempts: 5,
  };
}
