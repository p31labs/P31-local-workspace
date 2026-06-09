/**
 * P31 Agent Engine - Skill Tree System
 * 
 * Progressive skill tree system with prerequisites, effects, and P31 integration
 */

import { SkillTree, SkillNode, SkillCategory, SkillEffect } from './types';
import { v4 as uuidv4 } from 'uuid';

export class SkillTreeEngine {
  private skillTree: SkillTree;
  private skillDefinitions: Map<string, SkillDefinition>;

  constructor(initialSkills?: SkillNode[]) {
    this.skillTree = {
      rootSkills: initialSkills || [],
      unlockedSkills: [],
      skillPoints: 0,
      totalSkillPoints: 0,
      skillProgress: {},
    };
    
    this.skillDefinitions = new Map();
    this.initializeDefaultSkills();
  }

  /**
   * Initialize default skill definitions
   */
  private initializeDefaultSkills(): void {
    const defaultSkills: SkillDefinition[] = [
      // Communication Skills
      {
        id: 'communication_basic',
        name: 'Basic Communication',
        description: 'Fundamental ability to understand and respond to user input',
        category: 'communication',
        level: 1,
        prerequisites: [],
        effects: [
          { effectType: 'stat_boost', target: 'communicationAccuracy', value: 10 },
          { effectType: 'new_ability', target: 'basic_response', value: true },
        ],
        unlockCost: { spoons: 5, time: 0, skillPoints: 0 },
        cooldown: 0,
      },
      {
        id: 'communication_empathy',
        name: 'Empathetic Responses',
        description: 'Enhanced ability to recognize and respond to user emotions',
        category: 'communication',
        level: 2,
        prerequisites: ['communication_basic'],
        effects: [
          { effectType: 'stat_boost', target: 'empathyLevel', value: 25 },
          { effectType: 'behavior_change', target: 'mood_detection', value: true },
        ],
        unlockCost: { spoons: 10, time: 60000, skillPoints: 1 },
        cooldown: 30000,
      },
      {
        id: 'communication_clarification',
        name: 'Clarification Requests',
        description: 'Ability to ask clarifying questions when input is ambiguous',
        category: 'communication',
        level: 2,
        prerequisites: ['communication_basic'],
        effects: [
          { effectType: 'stat_boost', target: 'understandingAccuracy', value: 15 },
          { effectType: 'new_ability', target: 'ask_clarification', value: true },
        ],
        unlockCost: { spoons: 8, time: 30000, skillPoints: 1 },
        cooldown: 15000,
      },

      // Technical Skills
      {
        id: 'technical_basic',
        name: 'Basic Technical Understanding',
        description: 'Fundamental knowledge of common technical concepts',
        category: 'technical',
        level: 1,
        prerequisites: [],
        effects: [
          { effectType: 'stat_boost', target: 'technicalLevel', value: 20 },
          { effectType: 'new_ability', target: 'basic_tech_explanation', value: true },
        ],
        unlockCost: { spoons: 10, time: 0, skillPoints: 0 },
        cooldown: 0,
      },
      {
        id: 'technical_debugging',
        name: 'Debugging Assistance',
        description: 'Ability to help users debug technical issues',
        category: 'technical',
        level: 3,
        prerequisites: ['technical_basic'],
        effects: [
          { effectType: 'stat_boost', target: 'problemSolving', value: 30 },
          { effectType: 'new_ability', target: 'debug_assistance', value: true },
        ],
        unlockCost: { spoons: 15, time: 120000, skillPoints: 2 },
        cooldown: 60000,
      },
      {
        id: 'technical_code_review',
        name: 'Code Review',
        description: 'Ability to review and provide feedback on code',
        category: 'technical',
        level: 4,
        prerequisites: ['technical_debugging'],
        effects: [
          { effectType: 'stat_boost', target: 'codeQuality', value: 25 },
          { effectType: 'new_ability', target: 'code_review', value: true },
        ],
        unlockCost: { spoons: 20, time: 300000, skillPoints: 3 },
        cooldown: 120000,
      },

      // Creative Skills
      {
        id: 'creative_basic',
        name: 'Creative Thinking',
        description: 'Basic ability to generate creative responses and ideas',
        category: 'creative',
        level: 1,
        prerequisites: [],
        effects: [
          { effectType: 'stat_boost', target: 'creativity', value: 15 },
          { effectType: 'new_ability', target: 'creative_response', value: true },
        ],
        unlockCost: { spoons: 8, time: 0, skillPoints: 0 },
        cooldown: 0,
      },
      {
        id: 'creative_storytelling',
        name: 'Storytelling',
        description: 'Ability to craft engaging narratives and explanations',
        category: 'creative',
        level: 2,
        prerequisites: ['creative_basic'],
        effects: [
          { effectType: 'stat_boost', target: 'engagement', value: 20 },
          { effectType: 'new_ability', target: 'storytelling', value: true },
        ],
        unlockCost: { spoons: 12, time: 90000, skillPoints: 1 },
        cooldown: 45000,
      },
      {
        id: 'creative_problem_solving',
        name: 'Creative Problem Solving',
        description: 'Approach problems with innovative and unconventional solutions',
        category: 'creative',
        level: 3,
        prerequisites: ['creative_storytelling'],
        effects: [
          { effectType: 'stat_boost', target: 'innovation', value: 25 },
          { effectType: 'behavior_change', target: 'creative_approach', value: true },
        ],
        unlockCost: { spoons: 18, time: 180000, skillPoints: 2 },
        cooldown: 90000,
      },

      // Analytical Skills
      {
        id: 'analytical_basic',
        name: 'Basic Analysis',
        description: 'Fundamental ability to analyze and break down complex information',
        category: 'analytical',
        level: 1,
        prerequisites: [],
        effects: [
          { effectType: 'stat_boost', target: 'analysisSpeed', value: 15 },
          { effectType: 'new_ability', target: 'basic_analysis', value: true },
        ],
        unlockCost: { spoons: 10, time: 0, skillPoints: 0 },
        cooldown: 0,
      },
      {
        id: 'analytical_data',
        name: 'Data Analysis',
        description: 'Ability to analyze and interpret data patterns',
        category: 'analytical',
        level: 3,
        prerequisites: ['analytical_basic'],
        effects: [
          { effectType: 'stat_boost', target: 'dataInterpretation', value: 30 },
          { effectType: 'new_ability', target: 'data_analysis', value: true },
        ],
        unlockCost: { spoons: 20, time: 180000, skillPoints: 2 },
        cooldown: 120000,
      },
      {
        id: 'analytical_prediction',
        name: 'Predictive Analysis',
        description: 'Ability to make predictions based on available data',
        category: 'analytical',
        level: 4,
        prerequisites: ['analytical_data'],
        effects: [
          { effectType: 'stat_boost', target: 'predictionAccuracy', value: 25 },
          { effectType: 'new_ability', target: 'predictive_analysis', value: true },
        ],
        unlockCost: { spoons: 25, time: 300000, skillPoints: 3 },
        cooldown: 180000,
      },

      // Social Skills
      {
        id: 'social_basic',
        name: 'Basic Social Awareness',
        description: 'Fundamental understanding of social cues and norms',
        category: 'social',
        level: 1,
        prerequisites: [],
        effects: [
          { effectType: 'stat_boost', target: 'socialAwareness', value: 15 },
          { effectType: 'new_ability', target: 'social_cues', value: true },
        ],
        unlockCost: { spoons: 6, time: 0, skillPoints: 0 },
        cooldown: 0,
      },
      {
        id: 'social_conflict',
        name: 'Conflict Resolution',
        description: 'Ability to help resolve conflicts and de-escalate tense situations',
        category: 'social',
        level: 3,
        prerequisites: ['social_basic'],
        effects: [
          { effectType: 'stat_boost', target: 'conflictResolution', value: 35 },
          { effectType: 'new_ability', target: 'conflict_resolution', value: true },
        ],
        unlockCost: { spoons: 15, time: 120000, skillPoints: 2 },
        cooldown: 60000,
      },
      {
        id: 'social_teamwork',
        name: 'Teamwork Facilitation',
        description: 'Ability to help coordinate and facilitate team interactions',
        category: 'social',
        level: 4,
        prerequisites: ['social_conflict'],
        effects: [
          { effectType: 'stat_boost', target: 'teamCoordination', value: 30 },
          { effectType: 'new_ability', target: 'teamwork_facilitation', value: true },
        ],
        unlockCost: { spoons: 20, time: 240000, skillPoints: 3 },
        cooldown: 120000,
      },

      // Adaptive Skills
      {
        id: 'adaptive_basic',
        name: 'Basic Adaptation',
        description: 'Fundamental ability to adapt responses based on context',
        category: 'adaptive',
        level: 1,
        prerequisites: [],
        effects: [
          { effectType: 'stat_boost', target: 'adaptability', value: 15 },
          { effectType: 'new_ability', target: 'context_adaptation', value: true },
        ],
        unlockCost: { spoons: 8, time: 0, skillPoints: 0 },
        cooldown: 0,
      },
      {
        id: 'adaptive_learning',
        name: 'Learning Adaptation',
        description: 'Ability to learn from interactions and improve over time',
        category: 'adaptive',
        level: 3,
        prerequisites: ['adaptive_basic'],
        effects: [
          { effectType: 'stat_boost', target: 'learningSpeed', value: 25 },
          { effectType: 'behavior_change', target: 'continuous_learning', value: true },
        ],
        unlockCost: { spoons: 18, time: 180000, skillPoints: 2 },
        cooldown: 90000,
      },
      {
        id: 'adaptive_p31_integration',
        name: 'P31 Ecosystem Integration',
        description: 'Deep integration with P31 Labs ecosystem and tools',
        category: 'adaptive',
        level: 5,
        prerequisites: ['adaptive_learning', 'technical_code_review'],
        effects: [
          { effectType: 'integration', target: 'p31_ecosystem', value: true },
          { effectType: 'stat_boost', target: 'systemIntegration', value: 50 },
        ],
        unlockCost: { spoons: 30, time: 600000, skillPoints: 5 },
        cooldown: 300000,
      },

      // Integration Skills
      {
        id: 'integration_basic',
        name: 'Basic Integration',
        description: 'Fundamental ability to connect with external systems',
        category: 'integration',
        level: 1,
        prerequisites: [],
        effects: [
          { effectType: 'stat_boost', target: 'integrationCapability', value: 15 },
          { effectType: 'new_ability', target: 'external_api', value: true },
        ],
        unlockCost: { spoons: 12, time: 0, skillPoints: 0 },
        cooldown: 0,
      },
      {
        id: 'integration_spoons',
        name: 'Spoons Economy Integration',
        description: 'Deep integration with P31 Spoons economy system',
        category: 'integration',
        level: 3,
        prerequisites: ['integration_basic'],
        effects: [
          { effectType: 'integration', target: 'spoons_economy', value: true },
          { effectType: 'stat_boost', target: 'spoonAwareness', value: 40 },
        ],
        unlockCost: { spoons: 20, time: 180000, skillPoints: 2 },
        cooldown: 120000,
      },
      {
        id: 'integration_websocket',
        name: 'WebSocket Communication',
        description: 'Real-time communication through WebSocket connections',
        category: 'integration',
        level: 4,
        prerequisites: ['integration_spoons'],
        effects: [
          { effectType: 'integration', target: 'websocket_communication', value: true },
          { effectType: 'stat_boost', target: 'realTimeResponse', value: 35 },
        ],
        unlockCost: { spoons: 25, time: 300000, skillPoints: 3 },
        cooldown: 180000,
      },
    ];

    defaultSkills.forEach(skill => {
      this.skillDefinitions.set(skill.id, skill);
    });
  }

  /**
   * Get current skill tree state
   */
  getSkillTree(): SkillTree {
    return { ...this.skillTree };
  }

  /**
   * Get skill definition by ID
   */
  getSkillDefinition(skillId: string): SkillDefinition | undefined {
    return this.skillDefinitions.get(skillId);
  }

  /**
   * Get available skills for unlocking
   */
  getAvailableSkills(): SkillNode[] {
    const available: SkillNode[] = [];
    
    for (const [skillId, definition] of this.skillDefinitions) {
      if (!this.skillTree.unlockedSkills.includes(skillId) && 
          this.canUnlockSkill(skillId)) {
        available.push(this.createSkillNode(definition));
      }
    }
    
    return available;
  }

  /**
   * Check if a skill can be unlocked
   */
  private canUnlockSkill(skillId: string): boolean {
    const definition = this.skillDefinitions.get(skillId);
    if (!definition) return false;
    
    // Check prerequisites
    const hasPrerequisites = definition.prerequisites.every(prereq => 
      this.skillTree.unlockedSkills.includes(prereq)
    );
    
    // Check skill points
    const hasSkillPoints = this.skillTree.skillPoints >= definition.unlockCost.skillPoints;
    
    // Check spoons (this would integrate with P31 Spoons economy)
    const hasSpoons = true; // Placeholder - would check actual spoon balance
    
    return hasPrerequisites && hasSkillPoints && hasSpoons;
  }

  /**
   * Unlock a skill
   */
  async unlockSkill(skillId: string): Promise<SkillUnlockResult> {
    const definition = this.skillDefinitions.get(skillId);
    if (!definition) {
      return { success: false, error: 'Skill not found' };
    }

    if (this.skillTree.unlockedSkills.includes(skillId)) {
      return { success: false, error: 'Skill already unlocked' };
    }

    if (!this.canUnlockSkill(skillId)) {
      return { success: false, error: 'Prerequisites not met or insufficient resources' };
    }

    // Deduct resources (would integrate with P31 systems)
    this.skillTree.skillPoints -= definition.unlockCost.skillPoints;
    
    // Add to unlocked skills
    this.skillTree.unlockedSkills.push(skillId);
    
    // Apply skill effects
    this.applySkillEffects(definition);
    
    // Set initial progress
    this.skillTree.skillProgress[skillId] = 0;

    return { 
      success: true, 
      skill: this.createSkillNode(definition),
      effects: definition.effects 
    };
  }

  /**
   * Apply skill effects to the agent
   */
  private applySkillEffects(definition: SkillDefinition): void {
    // This would integrate with the agent's stat system
    // For now, we'll track the effects in the skill tree
    definition.effects.forEach(effect => {
      // Apply effect logic here
      console.log(`Applying effect: ${effect.effectType} to ${effect.target} with value ${effect.value}`);
    });
  }

  /**
   * Train a skill to increase its level
   */
  trainSkill(skillId: string, trainingTime: number): SkillTrainingResult {
    if (!this.skillTree.unlockedSkills.includes(skillId)) {
      return { success: false, error: 'Skill not unlocked' };
    }

    const definition = this.skillDefinitions.get(skillId);
    if (!definition) {
      return { success: false, error: 'Skill definition not found' };
    }

    // Calculate progress increase based on training time
    const progressIncrease = Math.min(100, trainingTime / 1000); // 1% per second
    
    // Update progress
    const currentProgress = this.skillTree.skillProgress[skillId] || 0;
    const newProgress = Math.min(100, currentProgress + progressIncrease);
    this.skillTree.skillProgress[skillId] = newProgress;

    // Check if skill leveled up
    let levelUp = false;
    if (newProgress >= 100) {
      // Level up logic would go here
      levelUp = true;
      this.skillTree.skillProgress[skillId] = 0; // Reset progress for next level
    }

    return {
      success: true,
      skillId,
      currentProgress: newProgress,
      levelUp,
      trainingTime
    };
  }

  /**
   * Use a skill (with cooldown management)
   */
  useSkill(skillId: string): SkillUseResult {
    if (!this.skillTree.unlockedSkills.includes(skillId)) {
      return { success: false, error: 'Skill not unlocked' };
    }

    const definition = this.skillDefinitions.get(skillId);
    if (!definition) {
      return { success: false, error: 'Skill definition not found' };
    }

    const lastUsed = this.skillTree.skillProgress[skillId] || 0;
    const now = Date.now();

    // Check cooldown (simplified - would need proper cooldown tracking)
    if ((definition.cooldown ?? 0) > 0) {
      // Cooldown logic would go here
    }

    // Execute skill
    const result = this.executeSkill(definition);
    
    return {
      success: true,
      skillId,
      result,
      cooldownRemaining: definition.cooldown || 0
    };
  }

  /**
   * Execute a skill's functionality
   */
  private executeSkill(definition: SkillDefinition): any {
    // This would contain the actual skill logic
    // For now, return a placeholder result
    return {
      message: `Executing ${definition.name}`,
      effects: definition.effects,
      category: definition.category
    };
  }

  /**
   * Get skill progress for a specific skill
   */
  getSkillProgress(skillId: string): number {
    return this.skillTree.skillProgress[skillId] || 0;
  }

  /**
   * Get all unlocked skills
   */
  getUnlockedSkills(): SkillNode[] {
    return this.skillTree.unlockedSkills.map(id => {
      const definition = this.skillDefinitions.get(id);
      return definition ? this.createSkillNode(definition) : null;
    }).filter(skill => skill !== null) as SkillNode[];
  }

  /**
   * Get skill tree statistics
   */
  getSkillStatistics(): SkillStatistics {
    const totalSkills = this.skillDefinitions.size;
    const unlockedCount = this.skillTree.unlockedSkills.length;
    const progressSum = Object.values(this.skillTree.skillProgress).reduce((sum, progress) => sum + progress, 0);
    const averageProgress = unlockedCount > 0 ? progressSum / unlockedCount : 0;

    return {
      totalSkills,
      unlockedSkills: unlockedCount,
      lockedSkills: totalSkills - unlockedCount,
      completionPercentage: (unlockedCount / totalSkills) * 100,
      averageSkillProgress: averageProgress,
      totalSkillPoints: this.skillTree.totalSkillPoints,
      availableSkillPoints: this.skillTree.skillPoints,
      categories: this.getCategoryBreakdown()
    };
  }

  /**
   * Get breakdown by skill category
   */
  private getCategoryBreakdown(): CategoryBreakdown {
    const breakdown: CategoryBreakdown = {
      communication: 0,
      technical: 0,
      creative: 0,
      analytical: 0,
      social: 0,
      adaptive: 0,
      integration: 0,
    };

    this.skillTree.unlockedSkills.forEach(skillId => {
      const definition = this.skillDefinitions.get(skillId);
      if (definition) {
        breakdown[definition.category]++;
      }
    });

    return breakdown;
  }

  /**
   * Create a skill node from definition
   */
  private createSkillNode(definition: SkillDefinition): SkillNode {
    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      category: definition.category,
      level: definition.level,
      prerequisites: definition.prerequisites,
      effects: definition.effects,
      unlockCost: definition.unlockCost,
      cooldown: definition.cooldown,
      isActive: true,
      isUnlocked: this.skillTree.unlockedSkills.includes(definition.id),
      progress: this.skillTree.skillProgress[definition.id] || 0,
    };
  }

  /**
   * Add skill points (would integrate with P31 economy)
   */
  addSkillPoints(points: number): void {
    this.skillTree.skillPoints += points;
    this.skillTree.totalSkillPoints += points;
  }

  /**
   * Reset skill tree (for testing or agent reset)
   */
  reset(): void {
    this.skillTree = {
      rootSkills: [],
      unlockedSkills: [],
      skillPoints: 0,
      totalSkillPoints: 0,
      skillProgress: {},
    };
  }
}

// Type definitions for internal use
interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  level: number;
  prerequisites: string[];
  effects: SkillEffect[];
  unlockCost: {
    spoons: number;
    time: number;
    skillPoints: number;
  };
  cooldown?: number;
}

interface SkillUnlockResult {
  success: boolean;
  skill?: SkillNode;
  effects?: SkillEffect[];
  error?: string;
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

interface SkillStatistics {
  totalSkills: number;
  unlockedSkills: number;
  lockedSkills: number;
  completionPercentage: number;
  averageSkillProgress: number;
  totalSkillPoints: number;
  availableSkillPoints: number;
  categories: CategoryBreakdown;
}

interface CategoryBreakdown {
  communication: number;
  technical: number;
  creative: number;
  analytical: number;
  social: number;
  adaptive: number;
  integration: number;
}

type SkillEffectType = 'stat_boost' | 'new_ability' | 'behavior_change' | 'integration';