/**
 * ⚠️ HONEST LABEL
 * K4 graph topology for the P31 Tetrahedral Mesh. K₄ is the complete graph
 * on 4 vertices — a standard mathematical object from graph theory (planar,
 * 6 edges, 4 vertices). No quantum or metaphysical claims are made beyond
 * the abstract graph structure. See docs/QF1_CONTESTED_SCIENCE.md.
 */

export interface K4Vertex {
  id: number;
  label: string;
  weight: number;
}

export interface K4Edge {
  source: number;
  target: number;
  weight: number;
  label: string;
}

export class K4Graph {
  readonly vertices: K4Vertex[] = [];
  readonly edges: K4Edge[] = [];

  constructor() {
    this.vertices = [
      { id: 1, label: 'Apex', weight: 1 },
      { id: 2, label: 'Nonprofit', weight: 1 },
      { id: 3, label: 'Workspace', weight: 1 },
      { id: 4, label: 'Companion', weight: 1 },
    ];

    const pairs: [number, number, string][] = [
      [1, 2, 'Hub ↔ NP'],
      [1, 3, 'Hub ↔ OS'],
      [1, 4, 'Hub ↔ Willow'],
      [2, 3, 'NP ↔ OS'],
      [2, 4, 'NP ↔ Willow'],
      [3, 4, 'OS ↔ Willow'],
    ];

    for (const [s, t, label] of pairs) {
      this.edges.push({ source: s, target: t, weight: 1, label });
    }
  }

  get vertexCount(): number { return this.vertices.length; }
  get edgeCount(): number { return this.edges.length; }

  isComplete(): boolean {
    const n = this.vertexCount;
    return this.edgeCount === (n * (n - 1)) / 2;
  }

  isPlanar(): boolean {
    return this.vertexCount <= 4 || this.edgeCount <= 6;
  }

  getVertex(id: number): K4Vertex | undefined {
    return this.vertices.find((v) => v.id === id);
  }

  getEdge(s: number, t: number): K4Edge | undefined {
    return this.edges.find((e) => (e.source === s && e.target === t) || (e.source === t && e.target === s));
  }

  adjacencyMatrix(): number[][] {
    const n = this.vertexCount;
    const mat: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (const e of this.edges) {
      mat[e.source - 1][e.target - 1] = e.weight;
      mat[e.target - 1][e.source - 1] = e.weight;
    }
    return mat;
  }

  shortestPath(s: number, t: number): number[] {
    if (s === t) return [s];
    const n = this.vertexCount;
    const adj = this.adjacencyMatrix();
    const dist = Array(n).fill(Infinity);
    const prev = Array(n).fill(-1);
    const visited = Array(n).fill(false);
    const start = s - 1; const end = t - 1;
    dist[start] = 0;
    for (let i = 0; i < n; i++) {
      let u = -1;
      for (let j = 0; j < n; j++) {
        if (!visited[j] && (u === -1 || dist[j] < dist[u])) u = j;
      }
      if (u === -1 || u === end) break;
      visited[u] = true;
      for (let v = 0; v < n; v++) {
        if (adj[u][v] > 0 && dist[u] + adj[u][v] < dist[v]) {
          dist[v] = dist[u] + adj[u][v];
          prev[v] = u;
        }
      }
    }
    const path: number[] = [];
    let cur = end;
    while (cur >= 0) {
      path.unshift(cur + 1);
      cur = prev[cur];
    }
    return path.length > 1 || s === t ? path : [];
  }
}
