/**
 * P31 Agent Engine - Main Agent Engine Class
 * 
 * Orchestrates all agent components and provides the main API
 */

import { AgentProfile, AgentInstance, AgentState, AgentRuntime, AgentConnection } from './types';
import { PersonalityEngine } from './personality';
import { SkillTreeEngine } from './skills';
import { P31IntegrationManager } from './integration';
import { DeploymentManager } from './deployment';
import { v4 as uuidv4 } from 'uuid';

export class AgentEngine {
  private profile: AgentProfile;
  private personalityEngine: PersonalityEngine;
  private skillTreeEngine: SkillTreeEngine;
  private integrationManager: P31IntegrationManager;
  private deploymentManager: DeploymentManager;
  private state: AgentState;
  private runtime: AgentRuntime;
  private connections: AgentConnection[] = [];

  constructor(profile: AgentProfile) {
    this.profile = profile;
    this.personalityEngine = new PersonalityEngine(profile.personality);
    this.skillTreeEngine = new SkillTreeEngine(profile.skills.rootSkills);
    this.integrationManager = new P31IntegrationManager(profile.integration);
    this.deploymentManager = new DeploymentManager(profile.deployment);
    
    this.state = this.createInitialState();
    this.runtime = this.createRuntimeState();
  }

  /**
   * Create initial agent state
   */
  private createInitialState(): AgentState {
    return {
      isActive: true,
      currentMood: this.profile.personality.currentMood,
      energyLevel: 100, // Start with full energy
      skillProgress: this.profile.skills.skillProgress,
      learningProgress: {},
      lastInteraction: new Date(),
      uptime: 0,
    };
  }

  /**
   * Create initial runtime state
   */
  private createRuntimeState(): AgentRuntime {
    return {
      platform: 'web',
      environment: 'development',
      version: this.profile.metadata.version,
      memoryUsage: 0,
      cpuUsage: 0,
      networkStatus: 'connected',
      errorCount: 0,
    };
  }

  /**
   * Get current agent instance
   */
  getAgentInstance(): AgentInstance {
    return {
      profile: this.profile,
      state: this.state,
      runtime: this.runtime,
      connections: this.connections,
    };
  }

  /**
   * Get agent profile
   */
  getProfile(): AgentProfile {
    return { ...this.profile };
  }

  /**
   * Update agent profile
   */
  updateProfile(updates: Partial<AgentProfile>): void {
    this.profile = { ...this.profile, ...updates };
    
    // Update dependent engines
    if (updates.personality) {
      this.personalityEngine = new PersonalityEngine(updates.personality);
    }
    
    if (updates.skills) {
      this.skillTreeEngine = new SkillTreeEngine(updates.skills.rootSkills);
    }
    
    if (updates.integration) {
      this.integrationManager = new P31IntegrationManager(updates.integration);
    }
    
    if (updates.deployment) {
      this.deploymentManager = new DeploymentManager(updates.deployment);
    }
  }

  /**
   * Process user input and generate response
   */
  async processInput(input: string, context?: any): Promise<AgentResponse> {
    try {
      // Update last interaction time
      this.state.lastInteraction = new Date();
      
      // Process mood changes based on input
      const newMood = this.personalityEngine.processUserInput(input);
      this.state.currentMood = newMood;
      
      // Generate response considering personality and skills
      const response = this.personalityEngine.generateResponse(input, {
        conversationHistory: [],
        userPreferences: {
          communicationStyle: this.profile.personality.communicationStyle,
          technicalLevel: this.profile.personality.technicalAptitude,
          responseLength: 'medium',
          empathyNeeds: true,
        },
        currentTask: 'general_conversation',
      });

      // Update energy level based on interaction complexity
      this.updateEnergyLevel(input);

      return {
        success: true,
        response,
        mood: newMood,
        energyLevel: this.state.energyLevel,
        timestamp: new Date(),
      };
    } catch (error) {
      this.handleRuntimeError(error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Update agent energy level based on interaction
   */
  private updateEnergyLevel(input: string): void {
    // Calculate energy cost based on input complexity
    const wordCount = input.split(' ').length;
    const complexityFactor = this.calculateInputComplexity(input);
    
    // Energy cost formula
    const energyCost = Math.min(20, wordCount * 0.5 * complexityFactor);
    
    // Update energy level
    this.state.energyLevel = Math.max(0, this.state.energyLevel - energyCost);
    
    // If energy is low, trigger tired mood
    if (this.state.energyLevel < 30 && this.state.currentMood.type !== 'tired') {
      this.state.currentMood = {
        type: 'tired',
        intensity: 70,
        duration: 600000, // 10 minutes
        timestamp: new Date(),
      };
    }
  }

  /**
   * Calculate input complexity
   */
  private calculateInputComplexity(input: string): number {
    const technicalTerms = ['algorithm', 'function', 'variable', 'class', 'API', 'database'];
    const hasTechnicalTerms = technicalTerms.some(term => input.toLowerCase().includes(term));
    
    const questionMarks = (input.match(/\?/g) || []).length;
    const exclamationMarks = (input.match(/!/g) || []).length;
    
    let complexity = 1.0;
    
    if (hasTechnicalTerms) complexity += 0.5;
    if (questionMarks > 2) complexity += 0.3;
    if (exclamationMarks > 3) complexity += 0.2;
    
    return complexity;
  }

  /**
   * Train agent skills
   */
  async trainSkill(skillId: string, trainingTime: number): Promise<SkillTrainingResult> {
    return this.skillTreeEngine.trainSkill(skillId, trainingTime);
  }

  /**
   * Use a skill
   */
  async useSkill(skillId: string): Promise<SkillUseResult> {
    return this.skillTreeEngine.useSkill(skillId);
  }

  /**
   * Update personality based on feedback
   */
  updatePersonality(feedback: PersonalityFeedback): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.personalityEngine.updatePersonality(feedback as any);
  }

  /**
   * Get personality summary
   */
  getPersonalitySummary(): PersonalitySummary {
    return this.personalityEngine.getPersonalitySummary();
  }

  /**
   * Get skill statistics
   */
  getSkillStatistics(): SkillStatistics {
    return this.skillTreeEngine.getSkillStatistics();
  }

  /**
   * Deploy agent to specified platforms
   */
  async deploy(): Promise<DeploymentResult> {
    return this.deploymentManager.deploy(this.profile);
  }

  /**
   * Start P31 ecosystem integration
   */
  async startIntegration(): Promise<void> {
    await this.integrationManager.initialize();
  }

  /**
   * Stop P31 ecosystem integration
   */
  async stopIntegration(): Promise<void> {
    await this.integrationManager.shutdown();
  }

  /**
   * Handle runtime errors
   */
  private handleRuntimeError(error: Error): void {
    this.runtime.errorCount++;
    this.runtime.lastError = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      severity: 'medium',
    };
    
    // Log error (would integrate with P31 telemetry)
    console.error(`Agent ${this.profile.identity.id} error:`, error);
  }

  /**
   * Get agent health status
   */
  getHealthStatus(): AgentHealth {
    const uptime = Date.now() - (this.runtime.lastError?.timestamp.getTime() ?? 0);
    
    return {
      status: this.state.isActive ? 'healthy' : 'inactive',
      uptime: this.runtime.errorCount === 0 ? 'nominal' : 'degraded',
      energyLevel: this.state.energyLevel,
      errorCount: this.runtime.errorCount,
      lastError: this.runtime.lastError,
      connections: this.connections.length,
      timestamp: new Date(),
    };
  }

  /**
   * Save agent state
   */
  saveState(): AgentSaveData {
    return {
      profile: this.profile,
      state: this.state,
      runtime: this.runtime,
      connections: this.connections,
      timestamp: new Date(),
    };
  }

  /**
   * Load agent state
   */
  loadState(saveData: AgentSaveData): void {
    this.profile = saveData.profile;
    this.state = saveData.state;
    this.runtime = saveData.runtime;
    this.connections = saveData.connections;
    
    // Reinitialize engines with loaded data
    this.personalityEngine = new PersonalityEngine(this.profile.personality);
    this.skillTreeEngine = new SkillTreeEngine(this.profile.skills.rootSkills);
    this.integrationManager = new P31IntegrationManager(this.profile.integration);
    this.deploymentManager = new DeploymentManager(this.profile.deployment);
  }

  /**
   * Reset agent to initial state
   */
  reset(): void {
    this.state = this.createInitialState();
    this.runtime = this.createRuntimeState();
    this.connections = [];
    this.skillTreeEngine.reset();
  }

  /**
   * Get agent statistics for monitoring
   */
  getStatistics(): AgentStatistics {
    const skillStats = this.skillTreeEngine.getSkillStatistics();
    const personalitySummary = this.getPersonalitySummary();
    
    return {
      profile: {
        name: this.profile.identity.name,
        version: this.profile.metadata.version,
        creationDate: this.profile.metadata.creationDate,
      },
      state: {
        isActive: this.state.isActive,
        currentMood: this.state.currentMood.type,
        energyLevel: this.state.energyLevel,
        uptime: this.runtime.errorCount === 0 ? 'nominal' : 'degraded',
      },
      skills: {
        totalUnlocked: skillStats.unlockedSkills,
        completionPercentage: skillStats.completionPercentage,
        averageProgress: skillStats.averageSkillProgress,
      },
      personality: {
        communicationStyle: personalitySummary.communicationStyle,
        neurodiversityAwareness: personalitySummary.neurodiversityAwareness,
        spoonSensitivity: personalitySummary.spoonSensitivity,
      },
      integration: {
        spoonsEnabled: this.profile.integration.spoonsEconomy.isEnabled,
        webSocketEnabled: this.profile.integration.webSocket.isEnabled,
        nodeCountEnabled: this.profile.integration.nodeCount.isEnabled,
      },
      timestamp: new Date(),
    };
  }
}

// Type definitions for internal use
interface AgentResponse {
  success: boolean;
  response?: string;
  mood?: any;
  energyLevel?: number;
  error?: string;
  timestamp: Date;
}

interface SkillTrainingResult {
  success: boolean;
  skillId?: string;
  currentProgress?: number;
  levelUp?: boolean;
  trainingTime?: number;
  error?: string;
}

interface SkillUseResult {
  success: boolean;
  skillId?: string;
  result?: unknown;
  cooldownRemaining?: number;
  error?: string;
}

interface DeploymentResult {
  success: boolean;
  platform: string;
  environment: string;
  url?: string;
  errors?: string[];
}

interface AgentHealth {
  status: 'healthy' | 'degraded' | 'inactive';
  uptime: 'nominal' | 'degraded';
  energyLevel: number;
  errorCount: number;
  lastError?: any;
  connections: number;
  timestamp: Date;
}

interface AgentSaveData {
  profile: AgentProfile;
  state: AgentState;
  runtime: AgentRuntime;
  connections: AgentConnection[];
  timestamp: Date;
}

interface AgentStatistics {
  profile: {
    name: string;
    version: string;
    creationDate: Date;
  };
  state: {
    isActive: boolean;
    currentMood: string;
    energyLevel: number;
    uptime: string;
  };
  skills: {
    totalUnlocked: number;
    completionPercentage: number;
    averageProgress: number;
  };
  personality: {
    communicationStyle: string;
    neurodiversityAwareness: number;
    spoonSensitivity: number;
  };
  integration: {
    spoonsEnabled: boolean;
    webSocketEnabled: boolean;
    nodeCountEnabled: boolean;
  };
  timestamp: Date;
}

interface PersonalityFeedback {
  trait: string;
  value: number;
  intensity: number;
  context: string;
}

interface PersonalitySummary {
  currentMood: string;
  moodIntensity: number;
  communicationStyle: string;
  neurodiversityAwareness: number;
  spoonSensitivity: number;
  lastUpdated: Date;
  interactionCount: number;
}

interface SkillStatistics {
  totalSkills: number;
  unlockedSkills: number;
  lockedSkills: number;
  completionPercentage: number;
  averageSkillProgress: number;
  totalSkillPoints: number;
  availableSkillPoints: number;
  categories: any;
}