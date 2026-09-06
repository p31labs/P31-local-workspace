import { describe, it, expect, beforeEach } from 'vitest';
import { P31IntegrationManager } from './integration';
import type { P31Integration } from './types';

function makeIntegration(overrides: Partial<P31Integration> = {}): P31Integration {
  return {
    spoonsEconomy: { isEnabled: false, creationCost: 0, maintenanceCost: 0, skillTrainingCost: 0, medicalCompliance: false, cognitiveLoadThreshold: 0, overloadProtection: false },
    webSocket: { isEnabled: false, connectionUrl: '', channels: [], messageHandlers: [], realTimeUpdates: false },
    nodeCount: { isEnabled: false, contributionWeight: 0, milestoneRewards: [], communityMetrics: false },
    qSuite: { isEnabled: false, testSuites: [], complianceChecks: [], automatedTesting: false },
    koFi: { isEnabled: false, premiumFeatures: [], monetizationEnabled: false, revenueSharing: 0 },
    ...overrides,
  };
}

describe('P31IntegrationManager', () => {
  let mgr: P31IntegrationManager;

  beforeEach(() => {
    mgr = new P31IntegrationManager(makeIntegration());
  });

  it('initializes and shuts down with all integrations disabled', async () => {
    await expect(mgr.initialize()).resolves.toBeUndefined();
    await expect(mgr.shutdown()).resolves.toBeUndefined();
  });

  it('getSpoonsBalance throws when spoons disabled', async () => {
    await expect(mgr.getSpoonsBalance()).rejects.toThrow('Spoons integration not enabled');
  });

  it('deductSpoons throws when spoons disabled', async () => {
    await expect(mgr.deductSpoons(1, 'test')).rejects.toThrow('Spoons integration not enabled');
  });

  it('sendMessage throws when websocket disabled', async () => {
    await expect(mgr.sendMessage('ch', {})).rejects.toThrow('WebSocket integration not enabled');
  });

  it('subscribeToChannel throws when websocket disabled', async () => {
    await expect(mgr.subscribeToChannel('ch', () => {})).rejects.toThrow('WebSocket integration not enabled');
  });

  it('getNodeCountContribution throws when disabled', async () => {
    await expect(mgr.getNodeCountContribution()).rejects.toThrow('Node count integration not enabled');
  });

  it('runComplianceChecks throws when qSuite disabled', async () => {
    await expect(mgr.runComplianceChecks()).rejects.toThrow('Q-Suite integration not enabled');
  });

  it('getPremiumFeatures throws when koFi disabled', async () => {
    await expect(mgr.getPremiumFeatures()).rejects.toThrow('Ko-Fi integration not enabled');
  });

  it('hasPremiumAccess throws when koFi disabled', async () => {
    await expect(mgr.hasPremiumAccess()).rejects.toThrow('Ko-Fi integration not enabled');
  });
});
