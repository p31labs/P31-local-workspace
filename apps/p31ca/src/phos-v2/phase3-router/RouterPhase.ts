/**
 * Phase 3: PHOS Router
 * Mesh routing, vertex handoff between family members
 */

import type { PHOSPhase, PHOSEvent, PHOSConfig, PhaseState, ConvergenceData } from '../master';

export class RouterPhase implements PHOSPhase {
  id = 'router';
  version = '0.1.0';
  status: 'alpha' | 'beta' | 'stable' | 'disabled' = 'alpha';

  private config: PHOSConfig | null = null;
  private active = false;
  private errorCount = 0;
  private lastActivity = 0;

  // Router-specific
  private routes: Map<string, string> = new Map();
  private currentVertex: string | null = null;
  private handoffQueue: Array<{ from: string; to: string; context: any }> = [];
  private vertices: Map<string, Vertex> = new Map();
  private routingPolicy: RoutingPolicy = 'round-robin';
  private personaPolicies: Map<string, RoutingPolicy> = new Map();
  private meshTopology: MeshTopology = { vertices: [], edges: [], lastUpdated: 0 };
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  async initialize(config: PHOSConfig): Promise<void> {
    this.config = config;
    console.log('[RouterPhase] Initializing mesh router...');

    // Discover K4 mesh topology
    this.discoverMesh();

    // Register default routes
    this.registerRoute('home', '/');
    this.registerRoute('family', '/families');
    this.registerRoute('apps', '/apps');
    this.registerRoute('glassbox', '/glass-box');

    // Start health monitoring
    this.startHealthChecks(30000);

    this.lastActivity = Date.now();
    console.log(`[RouterPhase] Initialized with ${this.vertices.size} vertices`);
  }

  activate(): void {
    this.active = true;
    this.status = 'alpha';
    console.log('[RouterPhase] Activated');
  }

  deactivate(): void {
    this.active = false;
    this.handoffQueue = [];
    console.log('[RouterPhase] Deactivated');
  }

  destroy(): void {
    this.stopHealthChecks();
    this.routes.clear();
    this.vertices.clear();
    this.handoffQueue = [];
    this.currentVertex = null;
    this.personaPolicies.clear();
    console.log('[RouterPhase] Destroyed');
  }

  onConvergence(week: number, data: ConvergenceData): void {
    data.deliverables = [
      'Vertex route table',
      'Handoff protocol',
      'Context preservation'
    ];
    data.dependencies = ['master', 'bros']; // Needs Bros for persona context
    data.blockers = [];
    data.confidence = week >= 1 ? 0.8 : 0.2;
  }

  getState(): PhaseState {
    return {
      status: this.active ? 'active' : 'paused',
      lastActivity: this.lastActivity,
      errorCount: this.errorCount,
      metrics: {
        routesRegistered: this.routes.size,
        handoffsPending: this.handoffQueue.length,
        currentVertex: this.currentVertex ? 1 : 0
      }
    };
  }

  emit(event: PHOSEvent): void {
    // Implementation via master registration
  }

  on(event: string, handler: (event: PHOSEvent) => void): void {
    // Implementation via master registration
  }

  // Router-specific methods
  registerRoute(vertexId: string, endpoint: string): void {
    this.routes.set(vertexId, endpoint);
    console.log(`[RouterPhase] Route registered: ${vertexId} -> ${endpoint}`);
  }

  async handoff(fromVertex: string, toVertex: string, context: any): Promise<boolean> {
    console.log(`[RouterPhase] Handoff: ${fromVertex} -> ${toVertex}`);
    this.handoffQueue.push({ from: fromVertex, to: toVertex, context });
    // TODO: Implement actual handoff protocol
    return true;
  }

  getCurrentVertex(): string | null {
    return this.currentVertex;
  }

  switchVertex(vertexId: string): void {
    this.currentVertex = vertexId;
    this.lastActivity = Date.now();
    console.log(`[RouterPhase] Switched to vertex: ${vertexId}`);
  }

  resolveRoute(intent: string): string | null {
    // TODO: Resolve intent to vertex route
    return this.routes.get(intent) || null;
  }

  // Mesh discovery and management
  discoverMesh(): MeshTopology {
    // Initialize K4 topology (4 vertices, 6 edges)
    const k4Vertices: Vertex[] = [
      { id: 'wj', name: 'W.J.', status: 'online', persona: 'wj', lastSeen: Date.now(), capabilities: ['voice', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory'] },
      { id: 'sj', name: 'S.J.', status: 'online', persona: 'sj', lastSeen: Date.now(), capabilities: ['voice', 'router', 'visual', 'memory'] },
      { id: 'cj', name: 'C.J.', status: 'online', persona: 'cj', lastSeen: Date.now(), capabilities: ['voice', 'router', 'guardian', 'predictive'] },
      { id: 'wij', name: 'Wi.J.', status: 'online', persona: 'wij', lastSeen: Date.now(), capabilities: ['voice', 'visual'] }
    ];

    // K4 complete graph: 6 edges connecting all pairs
    const k4Edges: MeshEdge[] = [
      { from: 'wj', to: 'sj', weight: 1, latency: 20 },
      { from: 'wj', to: 'cj', weight: 1, latency: 20 },
      { from: 'wj', to: 'wij', weight: 1, latency: 20 },
      { from: 'sj', to: 'cj', weight: 1, latency: 20 },
      { from: 'sj', to: 'wij', weight: 1, latency: 20 },
      { from: 'cj', to: 'wij', weight: 1, latency: 20 }
    ];

    this.meshTopology = {
      vertices: k4Vertices,
      edges: k4Edges,
      lastUpdated: Date.now()
    };

    // Register all vertices
    k4Vertices.forEach(v => this.vertices.set(v.id, v));

    // Set up persona routing policies
    this.personaPolicies.set('wj', 'priority-local');
    this.personaPolicies.set('sj', 'youth-optimized');
    this.personaPolicies.set('cj', 'guardian-supervised');
    this.personaPolicies.set('wij', 'child-safe');

    console.log('[RouterPhase] K4 mesh discovered: 4 vertices, 6 edges');

    return this.meshTopology;
  }

  getMeshTopology(): MeshTopology {
    return { ...this.meshTopology };
  }

  getVertex(vertexId: string): Vertex | undefined {
    return this.vertices.get(vertexId);
  }

  getAllVertices(): Vertex[] {
    return Array.from(this.vertices.values());
  }

  updateVertexStatus(vertexId: string, status: VertexStatus): void {
    const vertex = this.vertices.get(vertexId);
    if (vertex) {
      vertex.status = status;
      vertex.lastSeen = Date.now();
      this.vertices.set(vertexId, vertex);

      this.emit({
        type: 'router.vertex.status.changed',
        payload: { vertexId, status },
        timestamp: Date.now(),
        source: 'router'
      });
    }
  }

  // Persona-aware routing
  setPersonaPolicy(persona: string, policy: RoutingPolicy): void {
    this.personaPolicies.set(persona, policy);
    console.log(`[RouterPhase] Policy set: ${persona} -> ${policy}`);
  }

  getRouteForPersona(persona: string, intent: string): string | null {
    const policy = this.personaPolicies.get(persona) || 'round-robin';

    switch (policy) {
      case 'priority-local':
        // W.J.: Route to local edge first
        return this.routes.get(`${persona}:local:${intent}`) || this.routes.get(intent);

      case 'youth-optimized':
        // S.J.: Prefer low-latency game routes
        return this.routes.get(`${persona}:game:${intent}`) || this.routes.get(intent);

      case 'guardian-supervised':
        // C.J.: Route through guardian checkpoint
        return this.routes.get(`${persona}:guardian:${intent}`) || this.routes.get(intent);

      case 'child-safe':
        // Wi.J.: Only safe routes
        return this.routes.get(`${persona}:safe:${intent}`) || null;

      default:
        return this.routes.get(intent);
    }
  }

  // Health monitoring
  startHealthChecks(intervalMs: number = 30000): void {
    this.healthCheckInterval = setInterval(() => {
      this.checkMeshHealth();
    }, intervalMs);
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private checkMeshHealth(): void {
    const now = Date.now();
    const timeout = 60000; // 60 second timeout

    for (const [id, vertex] of this.vertices) {
      if (now - vertex.lastSeen > timeout && vertex.status === 'online') {
        this.updateVertexStatus(id, 'away');
        console.log(`[RouterPhase] Vertex ${id} marked away (timeout)`);
      }
    }
  }
}

// Types
export type VertexStatus = 'online' | 'away' | 'offline' | 'busy';
export type RoutingPolicy = 'round-robin' | 'priority-local' | 'youth-optimized' | 'guardian-supervised' | 'child-safe';

export interface Vertex {
  id: string;
  name: string;
  status: VertexStatus;
  persona: string;
  lastSeen: number;
  capabilities: string[];
  metadata?: Record<string, any>;
}

export interface MeshEdge {
  from: string;
  to: string;
  weight: number;
  latency: number;
  bandwidth?: number;
}

export interface MeshTopology {
  vertices: Vertex[];
  edges: MeshEdge[];
  lastUpdated: number;
}
