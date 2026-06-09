/**
 * Unit Tests for Abdication Controller
 * TODO-Kwai: Expand with >90% coverage per WCD-Kwai.md
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  AbdicationController, 
  createAbdicationController 
} from '../src/abdication/AbdicationController';
import {
  AbdicationReason,
  Node,
  NodeStatus
} from '../interfaces/IAbdicationProtocol';

// Mock implementations
class MockStateDatabase {
  private nodes: Map<string, Node> = new Map();
  private abdications: any[] = [];
  private transfers: any[] = [];

  async saveAbdication(result: any): Promise<void> {
    this.abdications.push(result);
  }

  async saveArtifactTransfer(result: any): Promise<void> {
    this.transfers.push(result);
  }

  async updateNodeStatus(nodeId: string, status: NodeStatus): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
    }
  }

  async getNode(nodeId: string): Promise<Node | null> {
    return this.nodes.get(nodeId) || null;
  }

  async getAbdicationHistory(nodeId: string): Promise<any[]> {
    return this.abdications.filter(a => a.nodeId === nodeId);
  }

  // Test helpers
  addNode(node: Node): void {
    this.nodes.set(node.id, node);
  }

  getAbdications(): any[] {
    return this.abdications;
  }

  getTransfers(): any[] {
    return this.transfers;
  }
}

class MockAuditTrail {
  private logs: any[] = [];

  async log(event: string, data: any): Promise<void> {
    this.logs.push({ event, data, timestamp: new Date() });
  }

  async verify(transactionId: string): Promise<boolean> {
    return this.logs.some(l => l.data.transactionId === transactionId);
  }

  // Test helpers
  getLogs(): any[] {
    return this.logs;
  }

  clear(): void {
    this.logs = [];
  }
}

describe('AbdicationController', () => {
  let controller: AbdicationController;
  let db: MockStateDatabase;
  let audit: MockAuditTrail;

  beforeEach(() => {
    db = new MockStateDatabase();
    audit = new MockAuditTrail();
    controller = createAbdicationController(db, audit);
  });

  describe('initiateAbdication', () => {
    it('should create a transaction ID', async () => {
      const node: Node = {
        id: 'node-1',
        name: 'Test Node',
        role: 'engineer',
        artifacts: [],
        status: 'active',
        lastActive: new Date()
      };
      db.addNode(node);

      const result = await controller.initiateAbdication('node-1', 'personal_choice');

      expect(result.transactionId).toBeDefined();
      expect(result.transactionId.length).toBeGreaterThan(0);
    });

    it('should set next steps on successful initiation', async () => {
      const node: Node = {
        id: 'node-1',
        name: 'Test Node',
        role: 'engineer',
        artifacts: [],
        status: 'active',
        lastActive: new Date()
      };
      db.addNode(node);

      const result = await controller.initiateAbdication('node-1', 'health');

      expect(result.success).toBe(true);
      expect(result.nextSteps).toContain('Identify successor node');
      expect(result.nextSteps).toContain('Transfer artifacts');
    });

    it('should fail if node not found', async () => {
      const result = await controller.initiateAbdication('nonexistent', 'personal_choice');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should log to audit trail', async () => {
      const node: Node = {
        id: 'node-1',
        name: 'Test Node',
        role: 'engineer',
        artifacts: [],
        status: 'active',
        lastActive: new Date()
      };
      db.addNode(node);

      await controller.initiateAbdication('node-1', 'term_limit');

      const logs = audit.getLogs();
      expect(logs.some(l => l.event === 'abdication_initiated')).toBe(true);
    });
  });

  describe('transferArtifacts', () => {
    it('should generate verification hash', async () => {
      const oldNode: Node = {
        id: 'old-node',
        name: 'Old Node',
        role: 'engineer',
        artifacts: [
          { id: 'artifact-1', type: 'document', data: {}, lastModified: new Date() },
          { id: 'artifact-2', type: 'key', data: {}, lastModified: new Date() }
        ],
        status: 'active',
        lastActive: new Date()
      };
      const newNode: Node = {
        id: 'new-node',
        name: 'New Node',
        role: 'engineer',
        artifacts: [],
        status: 'active',
        lastActive: new Date()
      };

      const result = await controller.transferArtifacts(oldNode, newNode);

      expect(result.verificationHash).toBeDefined();
      expect(result.artifactsTransferred).toHaveLength(2);
    });

    it('should log transfer to audit trail', async () => {
      const oldNode: Node = {
        id: 'old-node',
        name: 'Old Node',
        role: 'engineer',
        artifacts: [],
        status: 'active',
        lastActive: new Date()
      };
      const newNode: Node = {
        id: 'new-node',
        name: 'New Node',
        role: 'engineer',
        artifacts: [],
        status: 'active',
        lastActive: new Date()
      };

      await controller.transferArtifacts(oldNode, newNode);

      const logs = audit.getLogs();
      expect(logs.some(l => l.event === 'artifacts_transferred')).toBe(true);
    });
  });

  describe('updateNodeRegistry', () => {
    it('should update node status', async () => {
      const node: Node = {
        id: 'node-1',
        name: 'Test Node',
        role: 'engineer',
        artifacts: [],
        status: 'active',
        lastActive: new Date()
      };
      db.addNode(node);

      await controller.updateNodeRegistry('node-1', 'retired');

      const updated = await db.getNode('node-1');
      expect(updated?.status).toBe('retired');
    });
  });

  describe('verifyAbdicationCompleteness', () => {
    it('should return false if no history', async () => {
      const result = await controller.verifyAbdicationCompleteness('node-1');
      expect(result).toBe(false);
    });

    it('should verify successful abdication', async () => {
      const node: Node = {
        id: 'node-1',
        name: 'Test Node',
        role: 'engineer',
        artifacts: [],
        status: 'active',
        lastActive: new Date()
      };
      db.addNode(node);

      await controller.initiateAbdication('node-1', 'personal_choice');
      const result = await controller.verifyAbdicationCompleteness('node-1');
      expect(result).toBe(true);
    });
  });
});

describe('MILESTONES', () => {
  it('should have correct values', () => {
    const { MILESTONES } = require('../src/abdication/AbdicationController');
    
    expect(MILESTONES.TETRAHEDRON).toBe(4);
    expect(MILESTONES.POSNER).toBe(39);
    expect(MILESTONES.DUNBAR).toBe(150);
    expect(MILESTONES.LARMOR).toBe(863);
    expect(MILESTONES.ABDICATION).toBe(1776);
  });
});
