export interface SpoonLedger {
  focusSpoons: number;
  executiveSpoons: number;
  sensorySpoons: number;
  globalSpoons: number;
}

export interface InterfaceParameters {
  visualComplexity: 'high' | 'reduced' | 'minimal' | 'jitter';
  audioGainDb: number;
  taskDecomposition: boolean;
  highlightedZones: boolean;
  academicLoad: boolean;
  renderingStyle: 'crystalline' | 'smooth' | 'muted' | 'decoherent';
}

export function evaluateTelemetryThreshold(ledger: SpoonLedger): InterfaceParameters {
  const global = (ledger.focusSpoons + ledger.executiveSpoons + ledger.sensorySpoons) / 3;

  if (global >= 9.0) {
    return {
      visualComplexity: 'high',
      audioGainDb: 0,
      taskDecomposition: false,
      highlightedZones: false,
      academicLoad: true,
      renderingStyle: 'crystalline',
    };
  }

  if (global >= 6.0) {
    return {
      visualComplexity: 'reduced',
      audioGainDb: 0,
      taskDecomposition: false,
      highlightedZones: false,
      academicLoad: true,
      renderingStyle: 'smooth',
    };
  }

  if (global >= 3.0) {
    return {
      visualComplexity: 'minimal',
      audioGainDb: -6,
      taskDecomposition: true,
      highlightedZones: true,
      academicLoad: true,
      renderingStyle: 'muted',
    };
  }

  return {
    visualComplexity: 'jitter',
    audioGainDb: -12,
    taskDecomposition: true,
    highlightedZones: false,
    academicLoad: false,
    renderingStyle: 'decoherent',
  };
}

export function reduceSpoons(
  ledger: SpoonLedger,
  dimension: 'focus' | 'executive' | 'sensory',
  amount: number = 1
): SpoonLedger {
  const newLedger = { ...ledger };
  switch (dimension) {
    case 'focus':
      newLedger.focusSpoons = Math.max(0, ledger.focusSpoons - amount);
      break;
    case 'executive':
      newLedger.executiveSpoons = Math.max(0, ledger.executiveSpoons - amount);
      break;
    case 'sensory':
      newLedger.sensorySpoons = Math.max(0, ledger.sensorySpoons - amount);
      break;
  }
  newLedger.globalSpoons = (newLedger.focusSpoons + newLedger.executiveSpoons + newLedger.sensorySpoons) / 3;
  return newLedger;
}

export function regenerateSpoons(ledger: SpoonLedger, amount: number = 1): SpoonLedger {
  const newLedger = { ...ledger };
  newLedger.focusSpoons = Math.min(12, ledger.focusSpoons + amount);
  newLedger.executiveSpoons = Math.min(12, ledger.executiveSpoons + amount);
  newLedger.sensorySpoons = Math.min(12, ledger.sensorySpoons + amount);
  newLedger.globalSpoons = (newLedger.focusSpoons + newLedger.executiveSpoons + newLedger.sensorySpoons) / 3;
  return newLedger;
}
