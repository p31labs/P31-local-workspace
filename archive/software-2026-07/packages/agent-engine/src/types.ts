/**
 * P31 Agent Engine Type Definitions
 * 
 * Core types for the interactive personalized AI agent creator system
 */

import { z } from 'zod';
import { UUID } from 'crypto';

// ============================================================================
// Core Agent Identity Types
// ============================================================================

export interface AgentIdentity {
  id: string;
  name: string;
  displayName: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export interface VisualTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  avatarUrl?: string;
  animations?: AgentAnimation[];
  platformStyles: PlatformStyles;
}

export interface AgentAnimation {
  type: 'idle' | 'speaking' | 'thinking' | 'happy' | 'sad' | 'angry' | 'surprised';
  duration: number;
  intensity: number;
  loop: boolean;
}

export interface PlatformStyles {
  discord: DiscordStyle;
  web: WebStyle;
  mobile: MobileStyle;
  desktop: DesktopStyle;
}

export interface DiscordStyle {
  avatarUrl?: string;
  status?: 'online' | 'idle' | 'dnd' | 'invisible';
  activity?: {
    name: string;
    type: 'playing' | 'streaming' | 'listening' | 'watching';
  };
}

export interface WebStyle {
  widgetTheme: 'light' | 'dark' | 'auto';
  borderRadius: number;
  shadow: boolean;
  compactMode: boolean;
}

export interface MobileStyle {
  iconStyle: 'minimal' | 'detailed' | 'animated';
  notificationStyle: 'banner' | 'modal' | 'quiet';
  hapticFeedback: boolean;
}

export interface DesktopStyle {
  windowStyle: 'borderless' | 'standard' | 'compact';
  alwaysOnTop: boolean;
  transparency: number;
}

// ============================================================================
// Personality Engine Types
// ============================================================================

export interface PersonalityMatrix {
  // Big Five Personality Traits (0-100 scale)
  extraversion: number;
  neuroticism: number;
  openness: number;
  agreeableness: number;
  conscientiousness: number;
  
  // P31-Specific Traits
  neurodiversityAwareness: number;
  spoonSensitivity: number;
  technicalAptitude: number;
  creativity: number;
  empathy: number;
  
  // Behavioral Modifiers
  learningRate: number;
  adaptationSpeed: number;
  emotionalRegulation: number;
  communicationStyle: CommunicationStyle;
  
  // Mood System
  currentMood: MoodState;
  moodTriggers: MoodTrigger[];
  moodModifiers: MoodModifier[];
}

export type CommunicationStyle = 
  | 'formal' 
  | 'casual' 
  | 'professional' 
  | 'friendly' 
  | 'technical' 
  | 'creative' 
  | 'minimalist';

export interface MoodState {
  type: 'happy' | 'sad' | 'angry' | 'calm' | 'excited' | 'tired' | 'anxious' | 'focused';
  intensity: number; // 0-100
  duration: number; // milliseconds
  timestamp: Date;
}

export interface MoodTrigger {
  triggerType: 'user_input' | 'time_of_day' | 'event' | 'external_data';
  triggerValue: string | number;
  resultingMood: MoodState;
  probability: number; // 0-1
}

export interface MoodModifier {
  modifierType: 'positive' | 'negative' | 'neutral';
  effect: number; // -50 to +50
  duration: number; // milliseconds
  conditions: ModifierCondition[];
}

export interface ModifierCondition {
  conditionType: 'time' | 'user_mood' | 'agent_state' | 'external';
  conditionValue: any;
}

// ============================================================================
// Skill Tree System Types
// ============================================================================

export interface SkillTree {
  rootSkills: SkillNode[];
  unlockedSkills: string[];
  skillPoints: number;
  totalSkillPoints: number;
  skillProgress: Record<string, number>; // skillId -> progress 0-100
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  level: number;
  prerequisites: string[];
  effects: SkillEffect[];
  unlockCost: {
    spoons: number;
    time: number; // milliseconds
    skillPoints: number;
  };
  cooldown?: number; // milliseconds
  isActive: boolean;
  isUnlocked: boolean;
  progress: number; // 0-100
}

export type SkillCategory = 
  | 'communication' 
  | 'technical' 
  | 'creative' 
  | 'analytical' 
  | 'social' 
  | 'adaptive' 
  | 'integration';

export interface SkillEffect {
  effectType: 'stat_boost' | 'new_ability' | 'behavior_change' | 'integration';
  target: string;
  value: number | string | boolean;
  duration?: number;
}

// ============================================================================
// P31 Ecosystem Integration Types
// ============================================================================

export interface P31Integration {
  spoonsEconomy: SpoonsIntegration;
  webSocket: WebSocketIntegration;
  nodeCount: NodeCountIntegration;
  qSuite: QSuiteIntegration;
  koFi: KoFiIntegration;
}

export interface SpoonsIntegration {
  isEnabled: boolean;
  creationCost: number;
  maintenanceCost: number;
  skillTrainingCost: number;
  medicalCompliance: boolean;
  cognitiveLoadThreshold: number;
  overloadProtection: boolean;
}

export interface WebSocketIntegration {
  isEnabled: boolean;
  connectionUrl: string;
  channels: string[];
  messageHandlers: MessageHandler[];
  realTimeUpdates: boolean;
}

export interface MessageHandler {
  messageType: string;
  handlerFunction: string;
  priority: number;
}

export interface NodeCountIntegration {
  isEnabled: boolean;
  contributionWeight: number;
  milestoneRewards: MilestoneReward[];
  communityMetrics: boolean;
}

export interface MilestoneReward {
  milestone: number;
  rewardType: 'badge' | 'feature' | 'resource';
  rewardValue: string;
}

export interface QSuiteIntegration {
  isEnabled: boolean;
  testSuites: string[];
  complianceChecks: ComplianceCheck[];
  automatedTesting: boolean;
}

export interface ComplianceCheck {
  checkType: 'medical' | 'security' | 'performance';
  required: boolean;
  frequency: 'on_create' | 'daily' | 'weekly' | 'monthly';
}

export interface KoFiIntegration {
  isEnabled: boolean;
  premiumFeatures: string[];
  monetizationEnabled: boolean;
  revenueSharing: number;
}

// ============================================================================
// Deployment Configuration Types
// ============================================================================

export interface DeploymentConfig {
  platforms: DeploymentPlatform[];
  environments: DeploymentEnvironment[];
  scaling: ScalingConfig;
  monitoring: MonitoringConfig;
}

export interface DeploymentPlatform {
  platform: 'discord' | 'web' | 'mobile' | 'desktop' | 'api';
  enabled: boolean;
  configuration: PlatformConfig;
  credentials?: PlatformCredentials;
}

export interface PlatformConfig {
  name: string;
  description: string;
  permissions: string[];
  features: string[];
  limitations: string[];
}

export interface PlatformCredentials {
  clientId?: string;
  clientSecret?: string;
  token?: string;
  apiKey?: string;
  webhookUrl?: string;
}

export interface DeploymentEnvironment {
  environment: 'development' | 'staging' | 'production';
  enabled: boolean;
  configuration: EnvironmentConfig;
}

export interface EnvironmentConfig {
  baseUrl: string;
  databaseUrl: string;
  apiKey: string;
  featureFlags: Record<string, boolean>;
}

export interface ScalingConfig {
  autoScaling: boolean;
  maxInstances: number;
  minInstances: number;
  scalingThresholds: ScalingThreshold[];
}

export interface ScalingThreshold {
  metric: 'cpu' | 'memory' | 'requests' | 'concurrent_users';
  threshold: number;
  action: 'scale_up' | 'scale_down';
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfig[];
  logging: LoggingConfig;
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  notificationChannels: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  retentionDays: number;
  includeSensitiveData: boolean;
}

// ============================================================================
// Agent Profile Schema
// ============================================================================

export interface AgentProfile {
  identity: AgentIdentity;
  appearance: VisualTheme;
  personality: PersonalityMatrix;
  skills: SkillTree;
  integration: P31Integration;
  deployment: DeploymentConfig;
  metadata: AgentMetadata;
}

export interface AgentMetadata {
  creatorId: string;
  creationDate: Date;
  lastModified: Date;
  tags: string[];
  visibility: 'public' | 'private' | 'unlisted';
  version: string;
  dependencies: string[];
}

// ============================================================================
// Agent Instance Types
// ============================================================================

export interface AgentInstance {
  profile: AgentProfile;
  state: AgentState;
  runtime: AgentRuntime;
  connections: AgentConnection[];
}

export interface AgentState {
  isActive: boolean;
  currentMood: MoodState;
  energyLevel: number; // 0-100 (related to spoons)
  skillProgress: Record<string, number>;
  learningProgress: Record<string, number>;
  lastInteraction: Date;
  uptime: number;
}

export interface AgentRuntime {
  platform: string;
  environment: string;
  version: string;
  memoryUsage: number;
  cpuUsage: number;
  networkStatus: 'connected' | 'disconnected' | 'limited';
  errorCount: number;
  lastError?: ErrorInfo;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentConnection {
  type: 'websocket' | 'api' | 'database' | 'external_service';
  status: 'connected' | 'disconnected' | 'error';
  lastPing: Date;
  latency: number;
  endpoint: string;
}

// ============================================================================
// Training and Evolution Types
// ============================================================================

export interface TrainingSession {
  sessionId: string;
  agentId: string;
  startTime: Date;
  endTime?: Date;
  feedback: UserFeedback[];
  progress: TrainingProgress;
  outcomes: TrainingOutcome[];
}

export interface UserFeedback {
  type: 'positive' | 'negative' | 'neutral';
  category: 'response' | 'behavior' | 'skill' | 'personality';
  content: string;
  rating: number; // 1-5
  timestamp: Date;
  context?: FeedbackContext;
}

export interface FeedbackContext {
  conversationId?: string;
  skillId?: string;
  personalityTrait?: string;
  externalFactors: string[];
}

export interface TrainingProgress {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  skillImprovements: SkillImprovement[];
  personalityShifts: PersonalityShift[];
  timeSpent: number;
}

export interface SkillImprovement {
  skillId: string;
  beforeLevel: number;
  afterLevel: number;
  improvementRate: number;
}

export interface PersonalityShift {
  trait: keyof PersonalityMatrix;
  beforeValue: number;
  afterValue: number;
  shiftMagnitude: number;
}

export interface TrainingOutcome {
  outcomeType: 'skill_unlocked' | 'personality_change' | 'new_behavior' | 'error';
  description: string;
  timestamp: Date;
  affectedComponents: string[];
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const AgentIdentitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.string(),
});

export const PersonalityMatrixSchema = z.object({
  extraversion: z.number().min(0).max(100),
  neuroticism: z.number().min(0).max(100),
  openness: z.number().min(0).max(100),
  agreeableness: z.number().min(0).max(100),
  conscientiousness: z.number().min(0).max(100),
  neurodiversityAwareness: z.number().min(0).max(100),
  spoonSensitivity: z.number().min(0).max(100),
  technicalAptitude: z.number().min(0).max(100),
  creativity: z.number().min(0).max(100),
  empathy: z.number().min(0).max(100),
  learningRate: z.number().min(0).max(100),
  adaptationSpeed: z.number().min(0).max(100),
  emotionalRegulation: z.number().min(0).max(100),
  communicationStyle: z.enum(['formal', 'casual', 'professional', 'friendly', 'technical', 'creative', 'minimalist']),
  currentMood: z.object({
    type: z.enum(['happy', 'sad', 'angry', 'calm', 'excited', 'tired', 'anxious', 'focused']),
    intensity: z.number().min(0).max(100),
    duration: z.number().min(0),
    timestamp: z.date(),
  }),
  moodTriggers: z.array(z.object({
    triggerType: z.enum(['user_input', 'time_of_day', 'event', 'external_data']),
    triggerValue: z.union([z.string(), z.number()]),
    resultingMood: z.object({
      type: z.enum(['happy', 'sad', 'angry', 'calm', 'excited', 'tired', 'anxious', 'focused']),
      intensity: z.number().min(0).max(100),
      duration: z.number().min(0),
      timestamp: z.date(),
    }),
    probability: z.number().min(0).max(1),
  })),
  moodModifiers: z.array(z.object({
    modifierType: z.enum(['positive', 'negative', 'neutral']),
    effect: z.number().min(-50).max(50),
    duration: z.number().min(0),
    conditions: z.array(z.object({
      conditionType: z.enum(['time', 'user_mood', 'agent_state', 'external']),
      conditionValue: z.any(),
    })),
  })),
});

export const AgentProfileSchema = z.object({
  identity: AgentIdentitySchema,
  appearance: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    backgroundColor: z.string(),
    textColor: z.string(),
    accentColor: z.string(),
    avatarUrl: z.string().optional(),
    animations: z.array(z.object({
      type: z.enum(['idle', 'speaking', 'thinking', 'happy', 'sad', 'angry', 'surprised']),
      duration: z.number(),
      intensity: z.number(),
      loop: z.boolean(),
    })).optional(),
    platformStyles: z.object({
      discord: z.object({
        avatarUrl: z.string().optional(),
        status: z.enum(['online', 'idle', 'dnd', 'invisible']).optional(),
        activity: z.object({
          name: z.string(),
          type: z.enum(['playing', 'streaming', 'listening', 'watching']),
        }).optional(),
      }),
      web: z.object({
        widgetTheme: z.enum(['light', 'dark', 'auto']),
        borderRadius: z.number(),
        shadow: z.boolean(),
        compactMode: z.boolean(),
      }),
      mobile: z.object({
        iconStyle: z.enum(['minimal', 'detailed', 'animated']),
        notificationStyle: z.enum(['banner', 'modal', 'quiet']),
        hapticFeedback: z.boolean(),
      }),
      desktop: z.object({
        windowStyle: z.enum(['borderless', 'standard', 'compact']),
        alwaysOnTop: z.boolean(),
        transparency: z.number().min(0).max(1),
      }),
    }),
  }),
  personality: PersonalityMatrixSchema,
  skills: z.object({
    rootSkills: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      category: z.enum(['communication', 'technical', 'creative', 'analytical', 'social', 'adaptive', 'integration']),
      level: z.number(),
      prerequisites: z.array(z.string()),
      effects: z.array(z.object({
        effectType: z.enum(['stat_boost', 'new_ability', 'behavior_change', 'integration']),
        target: z.string(),
        value: z.union([z.number(), z.string(), z.boolean()]),
        duration: z.number().optional(),
      })),
      unlockCost: z.object({
        spoons: z.number(),
        time: z.number(),
        skillPoints: z.number(),
      }),
      cooldown: z.number().optional(),
      isActive: z.boolean(),
      isUnlocked: z.boolean(),
      progress: z.number().min(0).max(100),
    })),
    unlockedSkills: z.array(z.string()),
    skillPoints: z.number(),
    totalSkillPoints: z.number(),
    skillProgress: z.record(z.string(), z.number().min(0).max(100)),
  }),
  integration: z.object({
    spoonsEconomy: z.object({
      isEnabled: z.boolean(),
      creationCost: z.number(),
      maintenanceCost: z.number(),
      skillTrainingCost: z.number(),
      medicalCompliance: z.boolean(),
      cognitiveLoadThreshold: z.number(),
      overloadProtection: z.boolean(),
    }),
    webSocket: z.object({
      isEnabled: z.boolean(),
      connectionUrl: z.string(),
      channels: z.array(z.string()),
      messageHandlers: z.array(z.object({
        messageType: z.string(),
        handlerFunction: z.string(),
        priority: z.number(),
      })),
      realTimeUpdates: z.boolean(),
    }),
    nodeCount: z.object({
      isEnabled: z.boolean(),
      contributionWeight: z.number(),
      milestoneRewards: z.array(z.object({
        milestone: z.number(),
        rewardType: z.enum(['badge', 'feature', 'resource']),
        rewardValue: z.string(),
      })),
      communityMetrics: z.boolean(),
    }),
    qSuite: z.object({
      isEnabled: z.boolean(),
      testSuites: z.array(z.string()),
      complianceChecks: z.array(z.object({
        checkType: z.enum(['medical', 'security', 'performance']),
        required: z.boolean(),
        frequency: z.enum(['on_create', 'daily', 'weekly', 'monthly']),
      })),
      automatedTesting: z.boolean(),
    }),
    koFi: z.object({
      isEnabled: z.boolean(),
      premiumFeatures: z.array(z.string()),
      monetizationEnabled: z.boolean(),
      revenueSharing: z.number(),
    }),
  }),
  deployment: z.object({
    platforms: z.array(z.object({
      platform: z.enum(['discord', 'web', 'mobile', 'desktop', 'api']),
      enabled: z.boolean(),
      configuration: z.object({
        name: z.string(),
        description: z.string(),
        permissions: z.array(z.string()),
        features: z.array(z.string()),
        limitations: z.array(z.string()),
      }),
      credentials: z.object({
        clientId: z.string().optional(),
        clientSecret: z.string().optional(),
        token: z.string().optional(),
        apiKey: z.string().optional(),
        webhookUrl: z.string().optional(),
      }).optional(),
    })),
    environments: z.array(z.object({
      environment: z.enum(['development', 'staging', 'production']),
      enabled: z.boolean(),
      configuration: z.object({
        baseUrl: z.string(),
        databaseUrl: z.string(),
        apiKey: z.string(),
        featureFlags: z.record(z.string(), z.boolean()),
      }),
    })),
    scaling: z.object({
      autoScaling: z.boolean(),
      maxInstances: z.number(),
      minInstances: z.number(),
      scalingThresholds: z.array(z.object({
        metric: z.enum(['cpu', 'memory', 'requests', 'concurrent_users']),
        threshold: z.number(),
        action: z.enum(['scale_up', 'scale_down']),
      })),
    }),
    monitoring: z.object({
      enabled: z.boolean(),
      metrics: z.array(z.string()),
      alerts: z.array(z.object({
        metric: z.string(),
        threshold: z.number(),
        severity: z.enum(['info', 'warning', 'error', 'critical']),
        notificationChannels: z.array(z.string()),
      })),
      logging: z.object({
        level: z.enum(['debug', 'info', 'warn', 'error']),
        format: z.enum(['json', 'text']),
        retentionDays: z.number(),
        includeSensitiveData: z.boolean(),
      }),
    }),
  }),
  metadata: z.object({
    creatorId: z.string(),
    creationDate: z.date(),
    lastModified: z.date(),
    tags: z.array(z.string()),
    visibility: z.enum(['public', 'private', 'unlisted']),
    version: z.string(),
    dependencies: z.array(z.string()),
  }),
});

