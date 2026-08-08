import * as THREE from 'three';

export interface DockEdge {
  to: number;
  geodesicDist: number;
  probability: number;
  axis: 'family' | 'system' | 'care' | 'shield';
}

export interface EdgeCase {
  edge: [number, number];
  anomaly: 'isolated' | 'overloaded' | 'cross-axis';
  probability: number;
}

export interface SystemProbabilities {
  coherence: number;
  engagement: number;
  dunaReady: number;
  connectionDensity: number;
}

export interface DockRecord {
  memberId: string;
  portIndex: number;
  dockTime: number;
  axis: 'family' | 'system' | 'care' | 'shield';
  geodesicPosition: [number, number, number];
  edges: DockEdge[];
  edgeCases: EdgeCase[];
  systemProbabilities: SystemProbabilities;
}

const AXES: Array<'family' | 'system' | 'care' | 'shield'> = ['family', 'system', 'care', 'shield'];

export function allocatePort(
  dockedPorts: number[],
  totalPorts: number,
  getPortPosition: (index: number) => THREE.Vector3
): number {
  if (dockedPorts.length === 0) return 0;

  let bestPort = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < totalPorts; i++) {
    if (dockedPorts.includes(i)) continue;

    const pos = getPortPosition(i);
    let avgDist = 0;
    for (const docked of dockedPorts) {
      avgDist += pos.distanceTo(getPortPosition(docked));
    }
    avgDist /= dockedPorts.length;

    const score = -avgDist + (Math.sin(i * 0.5) * 0.3);
    if (score > bestScore) {
      bestScore = score;
      bestPort = i;
    }
  }

  return bestPort;
}

export function computeDockEdges(
  portPos: THREE.Vector3,
  allDockedPositions: THREE.Vector3[],
  maxEdges: number = 5,
  distanceThreshold: number = 8
): { index: number; distance: number }[] {
  const distances = allDockedPositions.map((pos, idx) => ({
    index: idx,
    distance: portPos.distanceTo(pos),
  }));
  distances.sort((a, b) => a.distance - b.distance);
  return distances
    .filter((d) => d.distance < distanceThreshold)
    .slice(0, maxEdges);
}

export function computeProbabilities(
  edges: { index: number; distance: number }[],
  memberAxes: ('family' | 'system' | 'care' | 'shield')[],
  currentAxis: 'family' | 'system' | 'care' | 'shield'
): { to: number; geodesicDist: number; probability: number; axis: 'family' | 'system' | 'care' | 'shield' }[] {
  const maxDist = 8;
  return edges.map((edge) => {
    const otherAxis = memberAxes[edge.index] || 'family';
    const distanceFactor = 1 - Math.min(1, edge.distance / maxDist);
    const axisBonus = otherAxis === currentAxis ? 0.3 : 0;
    const probability = 0.3 + 0.5 * distanceFactor + 0.2 * axisBonus;
    return {
      to: edge.index,
      geodesicDist: edge.distance,
      probability: Math.min(1, Math.max(0, probability)),
      axis: otherAxis,
    };
  });
}

export function detectEdgeCases(
  edges: { to: number; geodesicDist: number; probability: number; axis: string }[],
  allDockedPorts: number[],
  thresholdLow: number = 0.2,
  thresholdHigh: number = 0.8
): EdgeCase[] {
  const edgeCases: EdgeCase[] = [];

  const hasStrongEdge = edges.some((e) => e.probability > 0.1);
  if (!hasStrongEdge) {
    edgeCases.push({
      edge: [-1, -1] as [number, number],
      anomaly: 'isolated',
      probability: 0,
    });
  }

  const strongEdges = edges.filter((e) => e.probability > 0.7);
  if (strongEdges.length > 3) {
    edgeCases.push({
      edge: [-1, -1] as [number, number],
      anomaly: 'overloaded',
      probability: strongEdges.length / edges.length,
    });
  }

  const currentAxis = 'family';
  const crossAxisEdges = edges.filter((e) => e.axis !== currentAxis);
  if (crossAxisEdges.length > 0) {
    edgeCases.push({
      edge: [-1, -1] as [number, number],
      anomaly: 'cross-axis',
      probability: crossAxisEdges.length / edges.length,
    });
  }

  return edgeCases;
}

export function computeSystemProbabilities(
  dockedPorts: number[],
  totalPorts: number,
  edges: DockEdge[]
): SystemProbabilities {
  const density = dockedPorts.length / totalPorts;
  const avgProb = edges.reduce((sum, e) => sum + e.probability, 0) / (edges.length || 1);
  const coherence = 0.3 + 0.5 * density + 0.2 * avgProb;
  const engagement = 0.2 + 0.6 * density + 0.2 * avgProb;
  const dunaReady = Math.min(1, dockedPorts.length / 100);
  const connectionDensity = edges.length / (dockedPorts.length || 1);

  return {
    coherence: Math.min(1, coherence),
    engagement: Math.min(1, engagement),
    dunaReady: Math.min(1, dunaReady),
    connectionDensity: Math.min(1, connectionDensity),
  };
}

export function generateDockJSON(
  memberId: string,
  portIndex: number,
  dockTime: number,
  axis: 'family' | 'system' | 'care' | 'shield',
  geodesicPosition: [number, number, number],
  edges: DockEdge[],
  systemProbabilities: SystemProbabilities,
  edgeCases: EdgeCase[]
): DockRecord {
  return {
    memberId,
    portIndex,
    dockTime,
    axis,
    geodesicPosition,
    edges,
    edgeCases,
    systemProbabilities,
  };
}
