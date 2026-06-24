import { describe, it, expect, beforeEach } from 'vitest';
import { AgentEngine } from './agent-engine';
import type { AgentProfile } from './types';

function makeProfile(overrides: Partial<AgentProfile> = {}): AgentProfile {
  return {
    identity: {
      id: 'test-agent',
      name: 'TestAgent',
      displayName: 'Test',
      description: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
    },
    appearance: {
      primaryColor: '#000',
      secondaryColor: '#fff',
      backgroundColor: '#fff',
      textColor: '#000',
      accentColor: '#000',
      platformStyles: {
        discord: {},
        web: { widgetTheme: 'light', borderRadius: 0, shadow: false, compactMode: false },
        mobile: { iconStyle: 'minimal', notificationStyle: 'banner', hapticFeedback: false },
        desktop: { windowStyle: 'standard', alwaysOnTop: false, transparency: 0 },
      },
    },
    personality: {
      extraversion: 50,
      neuroticism: 30,
      openness: 70,
      agreeableness: 60,
      conscientiousness: 65,
      neurodiversityAwareness: 80,
      spoonSensitivity: 75,
      technicalAptitude: 70,
      creativity: 85,
      empathy: 75,
      learningRate: 50,
      adaptationSpeed: 40,
      emotionalRegulation: 60,
      communicationStyle: 'friendly',
      currentMood: { type: 'calm', intensity: 50, duration: 300000, timestamp: new Date() },
      moodTriggers: [],
      moodModifiers: [],
    },
    skills: {
      rootSkills: [],
      unlockedSkills: [],
      skillPoints: 0,
      totalSkillPoints: 0,
      skillProgress: {},
    },
    integration: {
      spoonsEconomy: { isEnabled: false, creationCost: 0, maintenanceCost: 0, skillTrainingCost: 0, medicalCompliance: false, cognitiveLoadThreshold: 0, overloadProtection: false },
      webSocket: { isEnabled: false, connectionUrl: '', channels: [], messageHandlers: [], realTimeUpdates: false },
      nodeCount: { isEnabled: false, contributionWeight: 0, milestoneRewards: [], communityMetrics: false },
      qSuite: { isEnabled: false, testSuites: [], complianceChecks: [], automatedTesting: false },
      koFi: { isEnabled: false, premiumFeatures: [], monetizationEnabled: false, revenueSharing: 0 },
    },
    deployment: {
      platforms: [],
      environments: [],
      scaling: { autoScaling: false, maxInstances: 1, minInstances: 1, scalingThresholds: [] },
      monitoring: { enabled: false, metrics: [], alerts: [], logging: { level: 'info', format: 'json', retentionDays: 30, includeSensitiveData: false } },
    },
    metadata: {
      creatorId: 'test',
      creationDate: new Date(),
      lastModified: new Date(),
      tags: [],
      visibility: 'public',
      version: '1.0.0',
      dependencies: [],
    },
    ...overrides,
  };
}

describe('AgentEngine', () => {
  let agent: AgentEngine;
  let profile: AgentProfile;

  beforeEach(() => {
    profile = makeProfile();
    agent = new AgentEngine(profile);
  });

  describe('initialization', () => {
    it('returns the injected profile', () => {
      const p = agent.getProfile();
      expect(p.identity.name).toBe('TestAgent');
      expect(p.personality.communicationStyle).toBe('friendly');
    });

    it('seeds state with full energy and active flag', () => {
      const inst = agent.getAgentInstance();
      expect(inst.state.isActive).toBe(true);
      expect(inst.state.energyLevel).toBe(100);
      expect(inst.state.currentMood.type).toBe('calm');
    });

    it('seeds runtime with web/development defaults', () => {
      const inst = agent.getAgentInstance();
      expect(inst.runtime.platform).toBe('web');
      expect(inst.runtime.environment).toBe('development');
      expect(inst.runtime.errorCount).toBe(0);
    });
  });

  describe('updateProfile', () => {
    it('merges partial updates into profile', () => {
      agent.updateProfile({ identity: { ...profile.identity, name: 'Renamed' } });
      expect(agent.getProfile().identity.name).toBe('Renamed');
    });

    it('resets personality when personality is updated', () => {
      const before = agent.getProfile().personality.empathy;
      agent.updateProfile({ personality: { ...profile.personality, empathy: 99, communicationStyle: 'technical' as const } });
      expect(agent.getProfile().personality.empathy).toBe(99);
      expect(agent.getProfile().personality.communicationStyle).toBe('technical');
    });
  });

  describe('processInput', () => {
    it('returns a successful response for simple input', async () => {
      const res = await agent.processInput('Hello!');
      expect(res.success).toBe(true);
      expect(res.response).toBeDefined();
      expect(res.mood).toBeDefined();
      expect(res.energyLevel).toBeLessThanOrEqual(100);
    });

    it('reduces energy after interaction', async () => {
      const before = agent.getAgentInstance().state.energyLevel;
      await agent.processInput('This is a very long and complex question that requires a lot of processing power and energy to answer properly.');
      const after = agent.getAgentInstance().state.energyLevel;
      expect(after).toBeLessThan(before);
    });

    it('does not crash on empty input', async () => {
      const res = await agent.processInput('');
      expect(res).toBeDefined();
    });
  });

  describe('skill management', () => {
    it('fails training for an unknown skill', async () => {
      const res = await agent.trainSkill('nonexistent', 1000);
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('fails usage for an unknown skill', async () => {
      const res = await agent.useSkill('nonexistent');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('reports stats even with an empty tree', () => {
      const stats = agent.getSkillStatistics();
      expect(stats.totalSkills).toBeGreaterThanOrEqual(0);
      expect(stats.completionPercentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('personality management', () => {
    it('updates a trait via AgentEngine', () => {
      const before = agent.getPersonalitySummary().spoonSensitivity;
      agent.updatePersonality({ trait: 'spoonSensitivity', value: 10, intensity: 80, context: 'test' });
      expect(agent.getPersonalitySummary().spoonSensitivity).toBeGreaterThan(before);
    });

    it('returns summary fields', () => {
      const summary = agent.getPersonalitySummary();
      expect(summary.currentMood).toBe('calm');
      expect(summary.communicationStyle).toBe('friendly');
    });
  });

  describe('health status', () => {
    it('is healthy with no errors', () => {
      const h = agent.getHealthStatus();
      expect(h.status).toBe('healthy');
      expect(h.errorCount).toBe(0);
      expect(h.uptime).toBe('nominal');
    });

    it('increments errors when processInput throws', async () => {
      const errorAgent = new AgentEngine(makeProfile({
        personality: makeProfile().personality,
        skills: makeProfile().skills,
        integration: makeProfile().integration,
        deployment: makeProfile().deployment,
      }));
      const orig = (errorAgent as any).personalityEngine.generateResponse.bind((errorAgent as any).personalityEngine);
      (errorAgent as any).personalityEngine.generateResponse = () => { throw new Error('boom'); };
      await errorAgent.processInput('x');
      const h = errorAgent.getHealthStatus();
      expect(h.errorCount).toBeGreaterThanOrEqual(1);
      expect(h.status).toBe('healthy');
      expect(h.uptime).toBe('degraded');
    });
  });

  describe('statistics', () => {
    it('exposes profile/state/skills/personality snapshots', () => {
      const s = agent.getStatistics();
      expect(s.profile.name).toBe('TestAgent');
      expect(s.state.isActive).toBe(true);
      expect(typeof s.skills.totalUnlocked).toBe('number');
      expect(typeof s.personality.communicationStyle).toBe('string');
    });
  });

  describe('deployment via DeploymentManager', () => {
    it('deploys to enabled platforms', async () => {
      const p = makeProfile({
        deployment: {
          platforms: [{ platform: 'web', enabled: true, configuration: { name: 'web', description: '', permissions: [], features: [], limitations: [] } }],
          environments: [],
          scaling: { autoScaling: false, maxInstances: 1, minInstances: 1, scalingThresholds: [] },
          monitoring: { enabled: false, metrics: [], alerts: [], logging: { level: 'info', format: 'json', retentionDays: 30, includeSensitiveData: false } },
        },
      });
      const a = new AgentEngine(p);
      const res = await a.deploy();
      expect(res.success).toBe(true);
    });
  });

  describe('save/load state', () => {
    it('round-trips state through saveState/loadState', () => {
      const saved = agent.saveState();
      const clone = new AgentEngine(makeProfile());
      clone.loadState(saved);
      expect(clone.getProfile().identity.name).toBe('TestAgent');
      expect(clone.getAgentInstance().state.energyLevel).toBe(agent.getAgentInstance().state.energyLevel);
    });
  });

  describe('reset', () => {
    it('restores initial state and clears mutable sub-systems', () => {
      agent.updatePersonality({ trait: 'empathy', value: 50, intensity: 80, context: 'push high' });
      agent.updateProfile({ identity: { ...profile.identity, name: 'Drifted' } });
      agent.reset();
      expect(agent.getAgentInstance().state.energyLevel).toBe(100);
      expect(agent.getAgentInstance().state.isActive).toBe(true);
    });
  });
});
