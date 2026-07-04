/**
 * Sovereign Trust Graph — DCSocial Implementation
 * Trust-based credit capacity without banks or credit scores
 */

export interface TrustEdge {
  from: string;
  to: string;
  weight: number;
  confidence: number;
  timestamp: number;
  signature: string;
}

export interface TrustNode {
  did: string;
  displayName: string;
  totalTrust: number;
  connections: string[];
  reputation: number;
}

export class TrustGraph {
  private edges: Map<string, TrustEdge[]> = new Map();
  private nodes: Map<string, TrustNode> = new Map();

  addEdge(from: string, to: string, weight: number, confidence: number, signature: string): void {
    const edge: TrustEdge = {
      from,
      to,
      weight: Math.max(0, Math.min(1, weight)),
      confidence: Math.max(0, Math.min(1, confidence)),
      timestamp: Date.now(),
      signature,
    };

    if (!this.edges.has(from)) this.edges.set(from, []);
    this.edges.get(from)!.push(edge);

    const reciprocal: TrustEdge = {
      from: to,
      to: from,
      weight: edge.weight * 0.9,
      confidence: edge.confidence * 0.85,
      timestamp: Date.now(),
      signature: '',
    };
    if (!this.edges.has(to)) this.edges.set(to, []);
    this.edges.get(to)!.push(reciprocal);

    this.updateNode(from);
    this.updateNode(to);
  }

  calculateTrustScore(did: string): number {
    const node = this.nodes.get(did);
    if (!node) return 0.1;

    const directEdges = this.edges.get(did) || [];
    const directTrust = this.calculateDirectTrust(did, directEdges);
    const networkTrust = this.calculateNetworkTrust(did);

    return Math.min(1, (directTrust + networkTrust) / 1.0);
  }

  private calculateDirectTrust(did: string, edges: TrustEdge[]): number {
    if (edges.length === 0) return 0.1;
    let totalWeighted = 0;
    let totalWeight = 0;
    for (const edge of edges) {
      totalWeighted += edge.weight * edge.confidence;
      totalWeight += edge.confidence;
    }
    return totalWeight > 0 ? totalWeighted / totalWeight : 0.1;
  }

  private calculateNetworkTrust(did: string): number {
    const visited = new Set<string>();
    const queue: { did: string; depth: number; trust: number }[] = [{ did, depth: 0, trust: 1.0 }];
    let totalNetworkTrust = 0;
    let count = 0;

    while (queue.length > 0 && count < 10) {
      const current = queue.shift()!;
      if (visited.has(current.did)) continue;
      visited.add(current.did);

      const edges = this.edges.get(current.did) || [];
      for (const edge of edges) {
        if (edge.to === did || visited.has(edge.to)) continue;
        const propagatedTrust = current.trust * edge.weight * 0.5;
        totalNetworkTrust += propagatedTrust;
        count++;
        if (current.depth < 3) {
          queue.push({ did: edge.to, depth: current.depth + 1, trust: propagatedTrust });
        }
      }
    }

    return count > 0 ? totalNetworkTrust / Math.min(count, 10) : 0.1;
  }

  calculateCapacity(did: string): number {
    const trustScore = this.calculateTrustScore(did);
    const node = this.nodes.get(did);
    const connections = node?.connections.length || 0;
    const avgConfidence = this.calculateAverageConfidence(did);
    const capacity = 1000 * Math.pow(trustScore, 1.5) * avgConfidence * (1 + Math.log(1 + connections));
    return Math.round(Math.max(0, Math.min(10000, capacity)));
  }

  calculateInterestRate(from: string, to: string): number {
    const trustScoreFrom = this.calculateTrustScore(from);
    const trustScoreTo = this.calculateTrustScore(to);
    const avgTrust = (trustScoreFrom + trustScoreTo) / 2;
    const riskPremium = (1 - avgTrust) * 0.05;
    const hopPremium = this.calculateHopPremium(from, to) * 0.01;
    const baseRate = 0.05;
    return Math.max(0.01, baseRate + riskPremium + hopPremium);
  }

  private calculateHopPremium(from: string, to: string): number {
    const visited = new Set<string>();
    const queue: { did: string; depth: number }[] = [{ did: from, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.did === to) return Math.max(0, current.depth - 1) * 0.5;
      if (visited.has(current.did)) continue;
      visited.add(current.did);

      const edges = this.edges.get(current.did) || [];
      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          queue.push({ did: edge.to, depth: current.depth + 1 });
        }
      }
    }
    return 5;
  }

  private calculateAverageConfidence(did: string): number {
    const edges = this.edges.get(did) || [];
    if (edges.length === 0) return 0.5;
    const total = edges.reduce((sum, e) => sum + e.confidence, 0);
    return total / edges.length;
  }

  private updateNode(did: string): void {
    const edges = this.edges.get(did) || [];
    const connections = new Set<string>();
    for (const edge of edges) connections.add(edge.to);
    const trustScore = this.calculateTrustScore(did);
    this.nodes.set(did, {
      did,
      displayName: `Node-${did.slice(0, 8)}`,
      totalTrust: trustScore,
      connections: Array.from(connections),
      reputation: Math.round(trustScore * 100),
    });
  }

  getGraph(): { nodes: TrustNode[]; edges: TrustEdge[] } {
    const nodes = Array.from(this.nodes.values());
    const edges = Array.from(this.edges.values()).flat();
    return { nodes, edges };
  }

  getTrustProfile(did: string): {
    did: string;
    trustScore: number;
    capacity: number;
    connections: number;
    reputation: number;
    interestRate: number;
  } {
    const trustScore = this.calculateTrustScore(did);
    const capacity = this.calculateCapacity(did);
    const node = this.nodes.get(did);
    const edges = this.edges.get(did) || [];

    return {
      did,
      trustScore,
      capacity,
      connections: node?.connections.length || 0,
      reputation: node?.reputation || 50,
      interestRate: this.calculateInterestRate(did, 'system:genesis'),
    };
  }
}

export const trustGraph = new TrustGraph();
