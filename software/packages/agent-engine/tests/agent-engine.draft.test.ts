/**
 * P31 Agent Engine - Comprehensive Test Suite
 * 
 * Tests for the main AgentEngine class and all its components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentEngine } from '../src/agent-engine';
import { AgentProfile } from '../src/types';

describe('AgentEngine', () => {
  let testProfile: AgentProfile;
  let agent: AgentEngine;

  beforeEach(() => {
    testProfile = {
      identity: {
        id: 'test-agent-1',
        name: 'TestAgent',
        displayName: 'Test Agent',
        description: 'A test agent for unit testing',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        version: '1.0.0'
      },
      appearance: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        accentColor: '#ffc107',
        platformStyles: {
          discord: { status: 'online' },
          web: { widgetTheme: 'light', borderRadius: 8, shadow: true, compactMode: false },
          mobile: { iconStyle: 'minimal', notificationStyle: 'banner', hapticFeedback: false },
          desktop: { windowStyle: 'standard', alwaysOnTop: false, transparency: 0 }
        }
      },
      personality: {
        extraversion: 60,
        neuroticism: 30,
        openness: 80,
        agreeableness: 70,
        conscientiousness: 65,
        neurodiversityAwareness: 90,
        spoonSensitivity: 75,
        technicalAptitude: 70,
        creativity: 85,
        empathy: 80,
        learningRate: 50,
        adaptationSpeed: 40,
        emotionalRegulation: 60,
        communicationStyle: 'friendly',
        currentMood: {
          type: 'calm',
          intensity: 50,
          duration: 300000,
          timestamp: new Date()
        },
        moodTriggers: [],
        moodModifiers: []
      },
      skills: {
        rootSkills: [],
        unlockedSkills: ['communication_basic'],
        skillPoints: 5,
        totalSkillPoints: 5,
        skillProgress: {
          'communication_basic': 100
        }
      },
      integration: {
        spoonsEconomy: {
          isEnabled: true,
          creationCost: 10,
          maintenanceCost: 2,
          skillTrainingCost: 5,
          medicalCompliance: true,
          cognitiveLoadThreshold: 80,
          overloadProtection: true
        },
        webSocket: {
          isEnabled: true,
          connectionUrl: 'wss://test.p31labs.org/ws',
          channels: ['general', 'agent-updates'],
          messageHandlers: [],
          realTimeUpdates: true
        },
        nodeCount: {
          isEnabled: true,
          contributionWeight: 1.0,
          milestoneRewards: [],
          communityMetrics: true
        },
        qSuite: {
          isEnabled: true,
          testSuites: ['basic', 'integration'],
          complianceChecks: [],
          automatedTesting: true
        },
        koFi: {
          isEnabled: true,
          premiumFeatures: ['advanced_skills', 'priority_support'],
          monetizationEnabled: true,
          revenueSharing: 0.8
        }
      },
      deployment: {
        platforms: [
          { platform: 'discord', enabled: true, configuration: { name: 'discord', description: 'Discord bot', permissions: [], features: [], limitations: [] } },
          { platform: 'web', enabled: true, configuration: { name: 'web', description: 'Web application', permissions: [], features: [], limitations: [] } },
          { platform: 'mobile', enabled: false, configuration: { name: 'mobile', description: 'Mobile app', permissions: [], features: [], limitations: [] } },
          { platform: 'desktop', enabled: false, configuration: { name: 'desktop', description: 'Desktop app', permissions: [], features: [], limitations: [] } },
          { platform: 'api', enabled: true, configuration: { name: 'api', description: 'API service', permissions: [], features: [], limitations: [] } }
        ],
        environments: [
          { environment: 'development', enabled: true, configuration: { baseUrl: 'http://localhost:3000', databaseUrl: '', apiKey: 'dev-key', featureFlags: {} } },
          { environment: 'staging', enabled: false, configuration: { baseUrl: 'https://staging.p31labs.org', databaseUrl: '', apiKey: 'staging-key', featureFlags: {} } },
          { environment: 'production', enabled: true, configuration: { baseUrl: 'https://api.p31labs.org', databaseUrl: '', apiKey: 'prod-key', featureFlags: {} } }
        ],
        scaling: {
          autoScaling: true,
          maxInstances: 10,
          minInstances: 1,
          scalingThresholds: [
            { metric: 'cpu', threshold: 80, action: 'scale_up' },
            { metric: 'memory', threshold: 70, action: 'scale_down' }
          ]
        },
        monitoring: {
          enabled: true,
          metrics: ['cpu', 'memory', 'requests', 'errors'],
          alerts: [
            { metric: 'cpu', threshold: 90, severity: 'critical', notificationChannels: ['email'] },
            { metric: 'errors', threshold: 10, severity: 'warning', notificationChannels: ['slack'] }
          ],
          logging: {
            level: 'info',
            format: 'json',
            retentionDays: 30,
            includeSensitiveData: false
          }
        }
      },
      metadata: {
        creatorId: 'test-user-123',
        creationDate: new Date('2025-01-01'),
        lastModified: new Date('2025-01-01'),
        tags: ['test', 'agent'],
        visibility: 'public',
        version: '1.0.0',
        dependencies: []
      }
    };

    agent = new AgentEngine(testProfile);
  });

  describe('Initialization', () => {
    it('should create agent with correct profile', () => {
      const profile = agent.getProfile();
      expect(profile.identity.name).toBe('TestAgent');
      expect(profile.personality.communicationStyle).toBe('friendly');
      expect(profile.skills.unlockedSkills).toContain('communication_basic');
    });

    it('should initialize with correct state', () => {
      const instance = agent.getAgentInstance();
      expect(instance.state.isActive).toBe(true);
      expect(instance.state.energyLevel).toBe(100);
      expect(instance.state.currentMood.type).toBe('calm');
    });

    it('should initialize with correct runtime', () => {
      const instance = agent.getAgentInstance();
      expect(instance.runtime.platform).toBe('web');
      expect(instance.runtime.environment).toBe('development');
      expect(instance.runtime.errorCount).toBe(0);
    });
  });

  describe('Input Processing', () => {
    it('should process simple input', async () => {
      const response = await agent.processInput('Hello!');
      
      expect(response.success).toBe(true);
      expect(response.response).toBeDefined();
      expect(response.mood).toBeDefined();
      expect(response.energyLevel).toBeLessThanOrEqual(100);
    });

    it('should handle complex input', async () => {
      const complexInput = 'I need help with a complex algorithm that involves dynamic programming and optimization techniques. This is quite challenging and I feel overwhelmed.';
      
      const response = await agent.processInput(complexInput);
      
      expect(response.success).toBe(true);
      expect(response.response).toBeDefined();
      expect(response.mood.type).toBe('focused'); // Should detect technical content
    });

    it('should detect mood from input', async () => {
      const happyInput = 'I am so happy today! Everything is going great!';
      const sadInput = 'I feel really sad and down today.';
      const angryInput = 'I am so angry about this situation!';
      
      const happyResponse = await agent.processInput(happyInput);
      const sadResponse = await agent.processInput(sadInput);
      const angryResponse = await agent.processInput(angryInput);
      
      expect(happyResponse.mood.type).toBe('happy');
      expect(sadResponse.mood.type).toBe('sad');
      expect(angryResponse.mood.type).toBe('angry');
    });

    it('should manage energy levels', async () => {
      const initialEnergy = agent.getAgentInstance().state.energyLevel;
      
      await agent.processInput('This is a very long and complex question that requires a lot of processing power and energy to answer properly.');
      
      const afterEnergy = agent.getAgentInstance().state.energyLevel;
      expect(afterEnergy).toBeLessThan(initialEnergy);
    });
  });

  describe('Skill Management', () => {
    it('should train skills', async () => {
      const result = await agent.trainSkill('communication_basic', 60000);
      
      expect(result.success).toBe(true);
      expect(result.skillId).toBe('communication_basic');
      expect(result.currentProgress).toBeGreaterThan(0);
    });

    it('should handle skill training errors', async () => {
      const result = await agent.trainSkill('nonexistent_skill', 60000);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should use skills', async () => {
      const result = await agent.useSkill('communication_basic');
      
      expect(result.success).toBe(true);
      expect(result.skillId).toBe('communication_basic');
      expect(result.result).toBeDefined();
    });

    it('should get skill statistics', () => {
      const stats = agent.getSkillStatistics();
      
      expect(stats.totalSkills).toBeGreaterThan(0);
      expect(stats.unlockedSkills).toBeGreaterThan(0);
      expect(stats.completionPercentage).toBeGreaterThan(0);
    });
  });

  describe('Personality Management', () => {
    it('should update personality', () => {
      const initialEmpathy = agent.getPersonalitySummary().empathyLevel;
      
      agent.updatePersonality({
        trait: 'empathy',
        value: 10,
        intensity: 75,
        context: 'Test update'
      });
      
      const newEmpathy = agent.getPersonalitySummary().empathyLevel;
      expect(newEmpathy).toBeGreaterThan(initialEmpathy);
    });

    it('should get personality summary', () => {
      const summary = agent.getPersonalitySummary();
      
      expect(summary.currentMood).toBeDefined();
      expect(summary.communicationStyle).toBe('friendly');
      expect(summary.neurodiversityAwareness).toBe(90);
      expect(summary.spoonSensitivity).toBe(75);
    });
  });

  describe('Health and Monitoring', () => {
    it('should get health status', () => {
      const health = agent.getHealthStatus();
      
      expect(health.status).toBe('healthy');
      expect(health.energyLevel).toBe(100);
      expect(health.errorCount).toBe(0);
      expect(health.uptime).toBe('nominal');
    });

    it('should get statistics', () => {
      const stats = agent.getStatistics();
      
      expect(stats.profile.name).toBe('TestAgent');
      expect(stats.state.isActive).toBe(true);
      expect(stats.skills.totalUnlocked).toBeGreaterThan(0);
      expect(stats.personality.communicationStyle).toBe('friendly');
    });
  });

  describe('State Management', () => {
    it('should save and load state', () => {
      const saveData = agent.saveState();
      
      // Create new agent and load state
      const newAgent = new AgentEngine(testProfile);
      newAgent.loadState(saveData);
      
      const newProfile = newAgent.getProfile();
      expect(newProfile.identity.name).toBe('TestAgent');
    });

    it('should reset agent', () => {
      // Modify agent state
      agent.updatePersonality({
        trait: 'empathy',
        value: 50,
        intensity: 75,
        context: 'Test modification'
      });
      
      agent.reset();
      
      const summary = agent.getPersonalitySummary();
      // After reset, should be back to original state
      expect(summary.empathyLevel).toBeLessThan(100); // Should not be maxed out
    });
  });

  describe('Deployment', () => {
    it('should get deployment configuration', () => {
      const config = agent.getConfig();
      
      expect(config.platforms).toHaveLength(5);
      expect(config.environments).toHaveLength(3);
      expect(config.scaling.autoScaling).toBe(true);
      expect(config.monitoring.enabled).toBe(true);
    });

    it('should update deployment configuration', () => {
      const newConfig = {
        platforms: [
          { platform: 'discord', enabled: false },
          { platform: 'web', enabled: true }
        ]
      };
      
      agent.updateConfig(newConfig);
      
      const config = agent.getConfig();
      expect(config.platforms[0].enabled).toBe(false);
      expect(config.platforms[1].enabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle runtime errors gracefully', async () => {
      // Simulate an error by processing invalid input
      const response = await agent.processInput('');
      
      expect(response.success).toBe(true); // Should handle gracefully
    });

    it('should track error count', () => {
      const initialErrorCount = agent.getAgentInstance().runtime.errorCount;
      
      // Trigger an error condition
      agent.handleRuntimeError(new Error('Test error'));
      
      const newErrorCount = agent.getAgentInstance().runtime.errorCount;
      expect(newErrorCount).toBeGreaterThan(initialErrorCount);
    });
  });

  describe('Integration with P31 Systems', () => {
    it('should initialize P31 integrations', async () => {
      await agent.startIntegration();
      // Should not throw errors
    });

    it('should shutdown P31 integrations', async () => {
      await agent.stopIntegration();
      // Should not throw errors
    });
  });
});

describe('AgentEngine Edge Cases', () => {
  let agent: AgentEngine;

  beforeEach(() => {
    const minimalProfile: AgentProfile = {
      identity: {
        id: 'minimal-agent',
        name: 'Minimal',
        displayName: 'Minimal Agent',
        description: 'Minimal test agent',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0'
      },
      appearance: {
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        accentColor: '#000000',
        platformStyles: {
          discord: {},
          web: { widgetTheme: 'light', borderRadius: 0, shadow: false, compactMode: false },
          mobile: { iconStyle: 'minimal', notificationStyle: 'banner', hapticFeedback: false },
          desktop: { windowStyle: 'standard', alwaysOnTop: false, transparency: 0 }
        }
      },
      personality: {
        extraversion: 50,
        neuroticism: 50,
        openness: 50,
        agreeableness: 50,
        conscientiousness: 50,
        neurodiversityAwareness: 50,
        spoonSensitivity: 50,
        technicalAptitude: 50,
        creativity: 50,
        empathy: 50,
        learningRate: 50,
        adaptationSpeed: 50,
        emotionalRegulation: 50,
        communicationStyle: 'neutral',
        currentMood: {
          type: 'calm',
          intensity: 50,
          duration: 300000,
          timestamp: new Date()
        },
        moodTriggers: [],
        moodModifiers: []
      },
      skills: {
        rootSkills: [],
        unlockedSkills: [],
        skillPoints: 0,
        totalSkillPoints: 0,
        skillProgress: {}
      },
      integration: {
        spoonsEconomy: { isEnabled: false, creationCost: 0, maintenanceCost: 0, skillTrainingCost: 0, medicalCompliance: false, cognitiveLoadThreshold: 0, overloadProtection: false },
        webSocket: { isEnabled: false, connectionUrl: '', channels: [], messageHandlers: [], realTimeUpdates: false },
        nodeCount: { isEnabled: false, contributionWeight: 0, milestoneRewards: [], communityMetrics: false },
        qSuite: { isEnabled: false, testSuites: [], complianceChecks: [], automatedTesting: false },
        koFi: { isEnabled: false, premiumFeatures: [], monetizationEnabled: false, revenueSharing: 0 }
      },
      deployment: {
        platforms: [],
        environments: [],
        scaling: { autoScaling: false, maxInstances: 1, minInstances: 1, scalingThresholds: [] },
        monitoring: { enabled: false, metrics: [], alerts: [], logging: { level: 'info', format: 'json', retentionDays: 30, includeSensitiveData: false } }
      },
      metadata: {
        creatorId: 'test',
        creationDate: new Date(),
        lastModified: new Date(),
        tags: [],
        visibility: 'public',
        version: '1.0.0',
        dependencies: []
      }
    };

    agent = new AgentEngine(minimalProfile);
  });

  it('should handle minimal configuration', () => {
    const profile = agent.getProfile();
    expect(profile.identity.name).toBe('Minimal');
  });

  it('should handle empty skill training', async () => {
    const result = await agent.trainSkill('nonexistent', 1000);
    expect(result.success).toBe(false);
  });

  it('should handle empty skill usage', async () => {
    const result = await agent.useSkill('nonexistent');
    expect(result.success).toBe(false);
  });

  it('should handle empty personality updates', () => {
    agent.updatePersonality({
      trait: 'extraversion',
      value: 0,
      intensity: 0,
      context: 'empty'
    });
    
    const summary = agent.getPersonalitySummary();
    expect(summary).toBeDefined();
  });
});