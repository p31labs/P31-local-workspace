interface CareMetrics {
  biometricScore: number;
  bondScore: number;
  ledgerScore: number;
  confidence: number;
  lastTimestamp: number;
}

interface ScoreUpdate {
  biometricDelta?: number;
  bondDelta?: number;
  ledgerBump?: number;
}

interface ScoreResult {
  composite: number;
  updatedMetrics: CareMetrics;
}

const DECAY_RATE = 0.001;

export function createInitialMetrics(): CareMetrics {
  return { biometricScore: 0.1, bondScore: 0.1, ledgerScore: 0.1, confidence: 0, lastTimestamp: Math.floor(Date.now() / 1000) };
}

export class ReputationEngine {
  computeCompositeScore(current: CareMetrics, update: ScoreUpdate, now: number): ScoreResult {
    const timeDelta = Math.max(0, now - current.lastTimestamp);
    const decay = Math.exp(-DECAY_RATE * timeDelta);

    const biom = (current.biometricScore + (update.biometricDelta || 0)) * decay;
    const bond = (current.bondScore + (update.bondDelta || 0)) * decay;
    const ledge = (current.ledgerScore + (update.ledgerBump || 0)) * decay;

    const composite = Math.min(1, (biom * 0.3 + bond * 0.35 + ledge * 0.35));

    return {
      composite,
      updatedMetrics: { biometricScore: biom, bondScore: bond, ledgerScore: ledge, confidence: current.confidence, lastTimestamp: now },
    };
  }

  getDecayedScores(current: CareMetrics, now: number): CareMetrics {
    const timeDelta = Math.max(0, now - current.lastTimestamp);
    const decay = Math.exp(-DECAY_RATE * timeDelta);
    return {
      biometricScore: current.biometricScore * decay,
      bondScore: current.bondScore * decay,
      ledgerScore: current.ledgerScore * decay,
      confidence: current.confidence,
      lastTimestamp: current.lastTimestamp,
    };
  }

  computeConfidence(interactionCount: number): number {
    return Math.min(1, interactionCount / 100);
  }
}
