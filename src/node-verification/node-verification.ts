/**
 * Node Verification Loop
 * Polls Zenodo for new DOIs and monitors Ko-fi for new supporters
 * TODO-Kwai: Implement full logic per WCD-Kwai.md
 */
import { EventEmitter } from 'events';
import { ZenodoClient, ZenodoRecord } from '../integrations/zenodo';
import { KofiWebhookHandler, KofiSupporter } from '../integrations/kofi';

/**
 * Node Count Milestones
 */
export const MILESTONES = {
  TETRAHEDRON: 4,    // First K4/Maxwell rigidity
  POSNER: 39,        // Posner molecule (9 Ca + 6 P + 24 O)
  DUNBAR: 150,       // Dunbar's number
  LARMOR: 863,       // Larmor frequency (P-31 in Earth field)
  ABDICATION: 1776   // Year of American independence
};

/**
 * Node types
 */
export type NodeSource = 'zenodo' | 'kofi' | 'github' | 'manual';

export interface Node {
  id: string;
  source: NodeSource;
  identifier: string;  // DOI for Zenodo, user ID for Ko-fi
  joinedAt: Date;
  metadata?: Record<string, any>;
}

export interface NodeState {
  count: number;
  nodes: Map<string, Node>;
  lastUpdated: Date;
  lastMilestone: number | null;
}

/**
 * Enhanced Node Verification Loop with API Integration
 */
export class EnhancedNodeVerificationLoop extends EventEmitter {
  private zenodoClient: ZenodoClient;
  private kofiHandler: KofiWebhookHandler;
  private state: NodeState;
  private pollInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(zenodoApiKey?: string, webhookSecret?: string) {
    super();
    this.zenodoClient = new ZenodoClient(zenodoApiKey);
    this.kofiHandler = new KofiWebhookHandler(webhookSecret);
    this.state = {
      count: 0,
      nodes: new Map(),
      lastUpdated: new Date(),
      lastMilestone: null
    };

    // Set up event listeners for Ko-fi
    this.kofiHandler.on('nodeAdded', (node) => {
      this.addNode(node);
    });

    this.kofiHandler.on('milestone', (event) => {
      this.emit('milestone', event);
    });
  }
}

/**
 * Node Verification Events
 */
export interface MilestoneEvent {
  milestone: number;
  nodeCount: number;
  achievedAt: Date;
}

/**
 * Legacy Node Verification Loop (for backward compatibility)
 */
export class NodeVerificationLoop extends EventEmitter {
  private state: NodeState;
  private zenodoApiKey: string | null;
  private kofiApiKey: string | null;
  private pollInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    super();
    this.state = {
      count: 0,
      nodes: new Map(),
      lastUpdated: new Date(),
      lastMilestone: null
    };
    this.zenodoApiKey = process.env.ZENODO_API_KEY || null;
    this.kofiApiKey = process.env.KOFI_API_KEY || null;
  }

  /**
   * Start the verification loop
   */
  async start(intervalMs: number = 15 * 60 * 1000): Promise<void> {
    if (this.isRunning) {
      console.log('[EnhancedNodeVerification] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[EnhancedNodeVerification] Starting verification loop');

    try {
      // Initialize clients
      await this.zenodoClient;
      await this.kofiHandler;
    } catch (error) {
      console.error('[EnhancedNodeVerification] Failed to initialize clients:', error);
    }

    // Initial check
    await this.checkZenodo();
    await this.checkKofi();

    // Set up polling
    this.pollInterval = setInterval(async () => {
      try {
        await this.checkZenodo();
        await this.checkKofi();
      } catch (error) {
        console.error('[EnhancedNodeVerification] Polling error:', error);
        this.emit('error', error);
      }
    }, intervalMs);

    this.emit('started');
  }

  /**
   * Stop the verification loop
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log('[EnhancedNodeVerification] Stopped verification loop');
    this.emit('stopped');
  }

  /**
   * Check Zenodo for new DOIs
   */
  async checkZenodo(): Promise<void> {
    try {
      const records = await this.zenodoClient.getAllP31Records();
      
      // Add new records as nodes
      for (const record of records) {
        const nodeId = `zenodo_${record.id}`;
        
        if (!this.state.nodes.has(nodeId)) {
          const node: Node = {
            id: nodeId,
            source: 'zenodo',
            identifier: record.doi,
            joinedAt: new Date(record.metadata.publication_date),
            metadata: {
              title: record.metadata.title,
              creators: record.metadata.creators,
              version: record.metadata.version
            }
          };
          this.state.nodes.set(nodeId, node);
          console.log(`[EnhancedNodeVerification] New Zenodo node: ${record.doi}`);
          this.emit('nodeAdded', node);
        }
      }

      this.updateState();
    } catch (error) {
      console.error('[EnhancedNodeVerification] Zenodo check failed:', error);
      throw error;
    }
  }

  /**
   * Check Ko-fi for new supporters
   */
  async checkKofi(): Promise<void> {
    try {
      // Get current supporters from Ko-fi handler
      const supporters = this.kofiHandler.getSupporters();
      
      // Add any new supporters as nodes
      for (const supporter of supporters) {
        const nodeId = supporter.id;
        
        if (!this.state.nodes.has(nodeId)) {
          const node: Node = {
            id: nodeId,
            source: 'kofi',
            identifier: supporter.identifier,
            joinedAt: supporter.joinedAt,
            metadata: supporter.metadata
          };
          this.state.nodes.set(nodeId, node);
          console.log(`[EnhancedNodeVerification] New Ko-fi node: ${supporter.metadata.name}`);
          this.emit('nodeAdded', node);
        }
      }

      this.updateState();
    } catch (error) {
      console.error('[EnhancedNodeVerification] Ko-fi check failed:', error);
      throw error;
    }
  }

  /**
   * Handle Ko-fi webhook for new supporters
   */
  async handleKofiWebhook(request: Request): Promise<{ success: boolean; message: string }> {
    return await this.kofiHandler.handleWebhook(request);
  }

  /**
   * Get Ko-fi webhook endpoint
   */
  getKofiWebhookEndpoint() {
    return this.kofiHandler.createWebhookEndpoint();
  }

  /**
   * Manually add a node
   */
  addNode(node: Node): void {
    if (!this.state.nodes.has(node.id)) {
      this.state.nodes.set(node.id, node);
      this.updateState();
      this.emit('nodeAdded', node);
    }
  }

  /**
   * Remove a node
   */
  removeNode(nodeId: string): void {
    if (this.state.nodes.has(nodeId)) {
      this.state.nodes.delete(nodeId);
      this.updateState();
      this.emit('nodeRemoved', nodeId);
    }
  }

  /**
   * Update state and check for milestones
   */
  private updateState(): void {
    const oldCount = this.state.count;
    this.state.count = this.state.nodes.size;
    this.state.lastUpdated = new Date();

    console.log(`[EnhancedNodeVerification] Node count: ${oldCount} -> ${this.state.count}`);

    // Check for milestones
    this.checkMilestones(oldCount, this.state.count);
  }

  /**
   * Check if a milestone was achieved
   */
  private checkMilestones(oldCount: number, newCount: number): void {
    const milestones = Object.values(MILESTONES).sort((a, b) => a - b);
    
    for (const milestone of milestones) {
      if (oldCount < milestone && newCount >= milestone) {
        this.state.lastMilestone = milestone;
        const event: MilestoneEvent = {
          milestone,
          nodeCount: newCount,
          achievedAt: new Date()
        };
        console.log(`[EnhancedNodeVerification] 🎉 Milestone reached: ${milestone} nodes!`);
        this.emit('milestone', event);
        break;  // Only emit one milestone per update
      }
    }
  }

  /**
   * Get current state
   */
  getState(): NodeState {
    return { ...this.state };
  }

  /**
   * Get node count
   */
  getCount(): number {
    return this.state.count;
  }

  /**
   * Check if running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get statistics from both Zenodo and Ko-fi
   */
  getStatistics(): {
    totalNodes: number;
    bySource: Record<string, number>;
    zenodoStats: any;
    kofiStats: any;
  } {
    const bySource: Record<string, number> = {};
    
    for (const node of this.state.nodes.values()) {
      bySource[node.source] = (bySource[node.source] || 0) + 1;
    }

    return {
      totalNodes: this.state.count,
      bySource,
      zenodoStats: {}, // TODO: Get from Zenodo client
      kofiStats: this.kofiHandler.getStatistics()
    };
  }

  /**
   * Export all nodes
   */
  exportNodes(): string {
    const data = {
      exportDate: new Date().toISOString(),
      totalNodes: this.state.count,
      nodes: Array.from(this.state.nodes.values()).map(n => ({
        ...n,
        joinedAt: n.joinedAt.toISOString()
      }))
    };

    return JSON.stringify(data, null, 2);
  }
}

/**
 * Factory function
 */
export function createEnhancedNodeVerificationLoop(zenodoApiKey?: string, webhookSecret?: string): EnhancedNodeVerificationLoop {
  return new EnhancedNodeVerificationLoop(zenodoApiKey, webhookSecret);
}

/**
 * Legacy Node Verification Loop (for backward compatibility)
 */
export class NodeVerificationLoop extends EventEmitter {
  private state: NodeState;
  private zenodoApiKey: string | null;
  private kofiApiKey: string | null;
  private pollInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    super();
    this.state = {
      count: 0,
      nodes: new Map(),
      lastUpdated: new Date(),
      lastMilestone: null
    };
    this.zenodoApiKey = process.env.ZENODO_API_KEY || null;
    this.kofiApiKey = process.env.KOFI_API_KEY || null;
  }

  /**
   * Start the verification loop
   */
  async start(intervalMs: number = 15 * 60 * 1000): Promise<void> {
    if (this.isRunning) {
      console.log('[NodeVerification] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[NodeVerification] Starting verification loop');

    // Initial check
    await this.checkZenodo();
    await this.checkKofi();

    // Set up polling
    this.pollInterval = setInterval(async () => {
      try {
        await this.checkZenodo();
        await this.checkKofi();
      } catch (error) {
        console.error('[NodeVerification] Polling error:', error);
        this.emit('error', error);
      }
    }, intervalMs);

    this.emit('started');
  }

  /**
   * Stop the verification loop
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log('[NodeVerification] Stopped verification loop');
    this.emit('stopped');
  }

  /**
   * Check Zenodo for new DOIs
   */
  async checkZenodo(): Promise<void> {
    if (!this.zenodoApiKey) {
      console.log('[NodeVerification] No Zenodo API key configured');
      return;
    }

    try {
      // Search for works from P31 Labs community
      const response = await fetch(
        'https://zenodo.org/api/records?communities=p31labs&size=100',
        {
          headers: {
            'Authorization': `Bearer ${this.zenodoApiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Zenodo API error: ${response.status}`);
      }

      const data: any = await response.json();
      const newDOIs = data.hits.hits.map((work: any) => work.doi);

      // Add new DOIs as nodes
      for (const doi of newDOIs) {
        if (!this.state.nodes.has(doi)) {
          const node: Node = {
            id: doi,
            source: 'zenodo',
            identifier: doi,
            joinedAt: new Date()
          };
          this.state.nodes.set(doi, node);
          console.log(`[NodeVerification] New Zenodo node: ${doi}`);
          this.emit('nodeAdded', node);
        }
      }

      this.updateState();
    } catch (error) {
      console.error('[NodeVerification] Zenodo check failed:', error);
      throw error;
    }
  }

  /**
   * Check Ko-fi for new supporters
   */
  async checkKofi(): Promise<void> {
    if (!this.kofiApiKey) {
      console.log('[NodeVerification] No Ko-fi API key configured');
      return;
    }

    try {
      // Note: Ko-fi API doesn't have a direct "list supporters" endpoint
      // This would typically use webhooks instead
      // For now, this is a placeholder for the webhook handler
      console.log('[NodeVerification] Ko-fi check (webhook mode)');
    } catch (error) {
      console.error('[NodeVerification] Ko-fi check failed:', error);
      throw error;
    }
  }

  /**
   * Handle Ko-fi webhook for new supporters
   */
  async handleKofiWebhook(supporter: KofiSupporter): Promise<void> {
    const nodeId = `kofi_${supporter.id}`;
    
    if (!this.state.nodes.has(nodeId)) {
      const node: Node = {
        id: nodeId,
        source: 'kofi',
        identifier: supporter.id,
        joinedAt: new Date(supporter.timestamp),
        metadata: {
          name: supporter.name,
          amount: supporter.amount
        }
      };
      this.state.nodes.set(nodeId, node);
      console.log(`[NodeVerification] New Ko-fi supporter: ${supporter.name}`);
      this.emit('nodeAdded', node);
      this.updateState();
    }
  }

  /**
   * Manually add a node
   */
  addNode(node: Node): void {
    if (!this.state.nodes.has(node.id)) {
      this.state.nodes.set(node.id, node);
      this.updateState();
      this.emit('nodeAdded', node);
    }
  }

  /**
   * Remove a node
   */
  removeNode(nodeId: string): void {
    if (this.state.nodes.has(nodeId)) {
      this.state.nodes.delete(nodeId);
      this.updateState();
      this.emit('nodeRemoved', nodeId);
    }
  }

  /**
   * Update state and check for milestones
   */
  private updateState(): void {
    const oldCount = this.state.count;
    this.state.count = this.state.nodes.size;
    this.state.lastUpdated = new Date();

    console.log(`[NodeVerification] Node count: ${oldCount} -> ${this.state.count}`);

    // Check for milestones
    this.checkMilestones(oldCount, this.state.count);
  }

  /**
   * Check if a milestone was achieved
   */
  private checkMilestones(oldCount: number, newCount: number): void {
    const milestones = Object.values(MILESTONES).sort((a, b) => a - b);
    
    for (const milestone of milestones) {
      if (oldCount < milestone && newCount >= milestone) {
        this.state.lastMilestone = milestone;
        const event: MilestoneEvent = {
          milestone,
          nodeCount: newCount,
          achievedAt: new Date()
        };
        console.log(`[NodeVerification] 🎉 Milestone reached: ${milestone} nodes!`);
        this.emit('milestone', event);
        break;  // Only emit one milestone per update
      }
    }
  }

  /**
   * Get current state
   */
  getState(): NodeState {
    return { ...this.state };
  }

  /**
   * Get node count
   */
  getCount(): number {
    return this.state.count;
  }

  /**
   * Check if running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * Factory function for legacy loop
 */
export function createNodeVerificationLoop(): NodeVerificationLoop {
  return new NodeVerificationLoop();
}
