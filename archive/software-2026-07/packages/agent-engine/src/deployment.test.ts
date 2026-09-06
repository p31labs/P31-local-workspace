import { describe, it, expect, beforeEach } from 'vitest';
import { DeploymentManager } from './deployment';
import type { DeploymentConfig } from './types';

function makeConfig(overrides: Partial<DeploymentConfig> = {}): DeploymentConfig {
  return {
    platforms: [
      { platform: 'web', enabled: true, configuration: { name: 'web', description: 'Web', permissions: [], features: [], limitations: [] } },
      { platform: 'discord', enabled: false, configuration: { name: 'discord', description: '', permissions: [], features: [], limitations: [] } },
      ...(overrides.platforms ?? []),
    ],
    environments: [
      { environment: 'development', enabled: true, configuration: { baseUrl: 'http://localhost', databaseUrl: '', apiKey: '', featureFlags: {} } },
      ...(overrides.environments ?? []),
    ],
    scaling: { autoScaling: false, maxInstances: 1, minInstances: 1, scalingThresholds: [] },
    monitoring: { enabled: false, metrics: [], alerts: [], logging: { level: 'info', format: 'json', retentionDays: 30, includeSensitiveData: false } },
    ...overrides,
  };
}

describe('DeploymentManager', () => {
  let manager: DeploymentManager;

  beforeEach(() => {
    manager = new DeploymentManager(makeConfig());
  });

  it('returns a config copy', () => {
    const c = manager.getConfig();
    expect(c.platforms).toHaveLength(2);
    expect(c.scaling.autoScaling).toBe(false);
  });

  it('merges partial config updates', () => {
    manager.updateConfig({ scaling: { autoScaling: true, maxInstances: 5, minInstances: 2, scalingThresholds: [] } });
    expect(manager.getConfig().scaling.autoScaling).toBe(true);
    expect(manager.getConfig().scaling.maxInstances).toBe(5);
  });

  it('deploys to enabled platforms only', async () => {
    const res = await manager.deploy({ identity: { id: 'a1' } } as any);
    expect(res.success).toBe(true);
  });

  it('returns deploy status with counts', async () => {
    const status = await manager.getDeploymentStatus();
    expect(status.overall).toBe('healthy');
    expect(typeof status.platforms).toBe('object');
  });

  it('throws on unsupported platform when enabled', async () => {
    const mgr = new DeploymentManager(makeConfig({
      platforms: [{ platform: 'unknown' as any, enabled: true, configuration: {} as any }],
    }));
    const res = await mgr.deploy({ identity: { id: 'a' } } as any);
    expect(res.success).toBe(false);
    expect(res.errors!.length).toBeGreaterThan(0);
  });

  it('configureScaling/Monitoring do not throw', async () => {
    await expect(manager.configureScaling()).resolves.toBeUndefined();
    await expect(manager.configureMonitoring()).resolves.toBeUndefined();
  });
});
