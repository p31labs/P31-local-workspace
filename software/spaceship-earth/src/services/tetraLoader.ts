/**
 * @file tetraLoader.ts — Tetrahedron data loading and caching service
 * 
 * Central service for Spaceship Earth to fetch tetrahedron data from
 * various sources (bonding-relay, k4-personal, p31ca APIs, local simulation).
 * 
 * Maintains an LRU cache of tetrahedrons by id and scale.
 * Polls for updates at configurable intervals.
 * Handles recursive subdivision on demand.
 */

import { TetraData, tetraFromJSON, hashTetra, createPhysiologicalTetra, TETRA_SCHEMA } from '../lib/tetra/schema';

interface TetraCacheEntry {
  data: TetraData;
  fetchedAt: number;
  hash: string;
}

const CACHE_TTL = 30_000;  // 30 seconds
const MAX_CACHE_SIZE = 100;

class TetraLoader {
  private cache: Map<string, TetraCacheEntry> = new Map();
  private subscribers: Set<(tetra: TetraData | null, id: string) => void> = new Set();
  private pollingIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private isInitialized = false;

  /**
   * Initialize the tetra loader and start default polling
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Start polling for personal physiological tetrahedron
    this.startPolling('will', 'personal', 30_000);
    this.startPolling('family-cage', 'family', 60_000);
    this.startPolling('p31-hub', 'hub', 60_000);
    
    this.isInitialized = true;
    console.log('[TetraLoader] Initialized — synergetic coordinate system active');
  }

  /**
   * Start polling for a specific tetrahedron id
   */
  private startPolling(id: string, scale: string, intervalMs: number): void {
    const key = `${scale}:${id}`;
    const interval = setInterval(async () => {
      try {
        const tetra = await this.fetchTetra(id, scale);
        if (tetra) {
          this.notifySubscribers(tetra, key);
        }
      } catch (err) {
        console.error(`[TetraLoader] Polling error for ${key}:`, err);
      }
    }, intervalMs);
    
    this.pollingIntervals.set(key, interval);
  }

  /**
   * Fetch tetrahedron data from bonding-relay worker
   */
  private async fetchTetra(id: string, scale: string): Promise<TetraData | null> {
    // Build cache key
    const cacheKey = `${scale}:${id}`;
    
     // Check cache first
     const cached = this.cache.get(cacheKey);
     if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
       return cached.data;
     }

     try {
       let endpoint: string;
       switch (scale) {
         case 'personal':
           // Calcium data from k4-personal (via bonding-relay)
           endpoint = `https://bonding-relay.trimtab-signal.workers.dev/api/mesh/calcium-latest?subject_id=${id}`;
           break;
         case 'hub':
         case 'marketplace':
           // SpIn DO not deployed yet — use simulation
           return this.simulateTetra(id, scale);
         default:
           endpoint = `https://p31ca.org/api/tetra/${scale}/${id}`;
       }

       const res = await fetch(endpoint, {
         headers: { 'Accept': 'application/json' },
       });

       if (!res.ok) {
         // For now, simulate data for non-existent endpoints
         return this.simulateTetra(id, scale);
       }

       const json = await res.json();
       
       // Handle SpIn DO responses by converting to tetrahedron
       if (scale === 'marketplace' && json.intentId) {
         // SpIn Matchmaking DO active intent response
         return this.createSpinIntentTetra(
           json.intentId,
           json.offerWeight || 0.5,
           json.wantWeight || 0.5,
           json.urgency || 0.5,
           json.trustScore || 0.5
         );
       }
       
       if (scale === 'hub' && json.cycleId) {
         // SpIn Logistics DO active cycle response
         return this.createSpinHandshakeTetra(
           json.cycleId,
           json.handshakeProgress || 0.0
         );
       }

       // If the endpoint returns raw calcium data, convert to tetra
       if ('calcium' in json && !json.vertices) {
         return createPhysiologicalTetra(
           `k4-personal-${id}`,
           json.calcium,
           65 + Math.random() * 30,  // simulated HRV
           12 - Math.random() * 3,   // simulated spoons
           json.calcium < 8.0 ? 0.3 : 0.9  // genesis sync status
         );
       }

       const tetra = tetraFromJSON(JSON.stringify(json));
       if (!tetra) {
         console.warn('[TetraLoader] Invalid tetra data from', endpoint);
         return null;
       }

       // Cache it
       const hash = await hashTetra(tetra);
       this.cache.set(cacheKey, {
         data: tetra,
         fetchedAt: Date.now(),
         hash,
       });

       // Trim cache if too large
       if (this.cache.size > MAX_CACHE_SIZE) {
         const firstKey = this.cache.keys().next().value;
         this.cache.delete(firstKey);
       }

       return tetra;
     } catch (err) {
       console.error(`[TetraLoader] Failed to fetch ${cacheKey}:`, err);
       return null;
     }
  }

  /**
   * Simulate tetrahedron data for development (when real API not available)
   */
  private simulateTetra(id: string, scale: string): TetraData {
    const now = new Date().toISOString();
    
    if (scale === 'personal') {
      // Simulate fluctuating calcium around 8.4 with occasional dips
      const calcium = 7.8 + Math.random() * 2.0;
      const isCritical = calcium < 8.0;
      
      return createPhysiologicalTetra(
        `k4-personal-${id}`,
        calcium,
        55 + Math.random() * 35,
        Math.max(0, 12 - (isCritical ? 2 : 0) - Math.random()),
        isCritical ? 0.2 : 0.95
      );
    }
    
    if (scale === 'hub') {
      return {
        schema: TETRA_SCHEMA,
        id: `hub-${id}`,
        metadata: {
          timestamp: now,
          source: 'simulation',
          version: '1.0.0',
          scale: 'hub',
          class: 'AGENT_HUB',
        },
        vertices: [
          { id: 'v0', label: 'Active Nodes', val: 0.3 + Math.random() * 0.5, color: '#00D4FF' },
          { id: 'v1', label: 'Connections', val: 0.4 + Math.random() * 0.4, color: '#00FF88' },
          { id: 'v2', label: 'Queue Depth', val: Math.random() * 0.3, color: '#FFD93D' },
          { id: 'v3', label: 'Health',    val: 0.5 + Math.random() * 0.5, color: '#EF4444' },
        ],
        edges: [
          { source: 'v0', target: 'v1', weight: 0.8 },
          { source: 'v0', target: 'v2', weight: 0.6 },
          { source: 'v0', target: 'v3', weight: 0.9 },
          { source: 'v1', target: 'v2', weight: 0.7 },
          { source: 'v1', target: 'v3', weight: 0.8 },
          { source: 'v2', target: 'v3', weight: 0.5 },
        ],
      };
    }
    
    // Generic tetra for other scales
    return {
      schema: TETRA_SCHEMA,
      id: `${scale}-${id}`,
      metadata: {
        timestamp: now,
        source: 'simulation',
        version: '1.0.0',
        scale: scale as any,
        class: 'ECOSYSTEM',
      },
      vertices: Array(4).fill(null).map((_, i) => ({
        id: `v${i}`,
        label: `Node ${i+1}`,
        val: Math.random(),
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      })),
      edges: [
        { source: 'v0', target: 'v1', weight: Math.random() },
        { source: 'v0', target: 'v2', weight: Math.random() },
        { source: 'v0', target: 'v3', weight: Math.random() },
        { source: 'v1', target: 'v2', weight: Math.random() },
        { source: 'v1', target: 'v3', weight: Math.random() },
        { source: 'v2', target: 'v3', weight: Math.random() },
      ],
    };
  }

  /**
   * Subscribe to tetrahedron updates
   */
  subscribe(callback: (tetra: TetraData | null, id: string) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(tetra: TetraData, id: string): void {
    this.subscribers.forEach(cb => cb(tetra, id));
  }

  /**
   * Manually trigger a refresh for a specific tetra
   */
  async refresh(scale: string, id: string): Promise<TetraData | null> {
    return await this.fetchTetra(id, scale);
  }

  /**
   * Get cached tetrahedron without fetching
   */
  getCached(scale: string, id: string): TetraData | null {
    const cached = this.cache.get(`${scale}:${id}`);
    return cached?.data ?? null;
  }

  /**
   * Generate child tetrahedrons from a parent tetra's vertices
   * (For recursive zoom: each vertex becomes a new tetrahedron)
   */
  generateChildren(parent: TetraData): Record<string, TetraData> {
    const children: Record<string, TetraData> = {};
    
    for (const vertex of parent.vertices) {
      // Create a new tetrahedron centered on this vertex
      // In full implementation, this would use barycentric subdivision
      const child: TetraData = {
        ...parent,
        id: `${parent.id}/${vertex.id}`,
        parent_id: parent.id,
        metadata: {
          ...parent.metadata,
          depth: (parent.metadata.depth || 0) + 1,
        },
        // Subdivide vertices conceptually (real implementation would compute new 3D positions)
        vertices: parent.vertices.map(v => ({
          ...v,
          id: v.id === vertex.id ? 'center' : v.id,  // Mark center vertex
        })),
        sub_tetras: undefined,  // Children start empty
      };
      children[vertex.id] = child;
    }
    
    return children;
  }

  /**
   * Create a SpIn Intent Tetrahedron from SpIn DO data
   * Maps to marketplace scale tetrahedron
   */
  private createSpinIntentTetra(
    intentId: string,
    offerValue: number,  // Normalized 0-1
    wantValue: number,   // Normalized 0-1
    urgency: number,     // Normalized 0-1
    trustScore: number   // Derived from Joy Attestation HKDF (0-1)
  ): TetraData {
    return {
      schema: TETRA_SCHEMA,
      id: `spin-intent-${intentId}`,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'spin-matchmaking-do',
        version: '1.0.0',
        scale: 'marketplace',
        class: 'MARKETPLACE'
      },
      vertices: [
        { id: 'v0', label: 'Offered', val: offerValue, color: '#4D96FF' },
        { id: 'v1', label: 'Wanted', val: wantValue, color: '#FFD93D' },
        { id: 'v2', label: 'Urgency', val: urgency, color: '#EF4444' },
        { id: 'v3', label: 'Attestation', val: trustScore, color: '#6BCB77' }
      ],
      edges: [
        { source: 'v0', target: 'v1', weight: 0.9, relation: 'flow' },
        { source: 'v0', target: 'v2', weight: urgency, relation: 'dependency' },
        { source: 'v0', target: 'v3', weight: trustScore, relation: 'causal' },
        { source: 'v1', target: 'v2', weight: urgency, relation: 'dependency' },
        { source: 'v1', target: 'v3', weight: trustScore, relation: 'causal' },
        { source: 'v2', target: 'v3', weight: 0.5 }
      ]
    };
  }

  /**
   * Create a SpIn Handshake / Cycle Tetrahedron from SpIn DO data
   * Maps to hub scale tetrahedron
   * Shows X3DH key exchange progress via jitterbug transformation
   */
  private createSpinHandshakeTetra(
    cycleId: string,
    progress: number // 0.0 (started) to 1.0 (L.O.V.E. minted)
  ): TetraData {
    return {
      schema: TETRA_SCHEMA,
      id: `spin-cycle-${cycleId}`,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'spin-logistics-do',
        version: '1.0.0',
        scale: 'hub',
        class: 'AGENT_HUB'
      },
      vertices: [
        { id: 'v0', label: 'Alice X25519', val: progress > 0.3 ? 1 : 0.2, color: '#9B59B6' },
        { id: 'v1', label: 'Bob X25519', val: progress > 0.6 ? 1 : 0.2, color: '#9B59B6' },
        { id: 'v2', label: 'Carol X25519', val: progress > 0.9 ? 1 : 0.2, color: '#9B59B6' },
        { id: 'v3', label: 'L.O.V.E. Mint', val: progress, color: '#00FF88' }
      ],
      edges: [
        { source: 'v0', target: 'v1', weight: 1.0 },
        { source: 'v0', target: 'v2', weight: 1.0 },
        { source: 'v0', target: 'v3', weight: 1.0 },
        { source: 'v1', target: 'v2', weight: 1.0 },
        { source: 'v1', target: 'v3', weight: 1.0 },
        { source: 'v2', target: 'v3', weight: 1.0 }
      ],
      transform: {
        // Contract the geometry (jitterbug) while computing shared secrets
        jitterbugPhase: progress < 1.0 ? 0.5 + Math.sin(Date.now()/200)*0.2 : 0,
        opacity: 1.0
      }
    };
  }

  /**
   * Clean up polling intervals
   */
  destroy(): void {
    this.pollingIntervals.forEach(clearInterval);
    this.pollingIntervals.clear();
    this.cache.clear();
    this.subscribers.clear();
  }
}

// ── Singleton instance ──────────────────────────────────────────────────────

export const tetraLoader = new TetraLoader();

export default tetraLoader;
