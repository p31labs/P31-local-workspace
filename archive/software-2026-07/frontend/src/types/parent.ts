/**
 * Parent Dashboard Types
 * TypeScript interfaces for the parent supervision system
 */

// Child profile for family management
export interface Child {
  id: string;
  name: string;
  avatar?: string;
  createdAt: number;
  deviceId?: string;
  difficultyMode: 'seed' | 'sprout' | 'sapling';
}

// Activity types from BONDING
export type ActivityActionType = 
  | 'element_place'
  | 'bond_create'
  | 'molecule_complete'
  | 'quest_progress'
  | 'achievement_unlock'
  | 'element_unlock';

export interface BONDINGActivity {
  id: string;
  childId: string;
  timestamp: number;
  actionType: ActivityActionType;
  element?: string;
  bondsCreated?: number;
  moleculeName?: string;
  questId?: string;
  achievementId?: string;
}

// Time control settings
export type TimeLimit = 15 | 30 | 60 | 120;

export interface TimeSchedule {
  enabled: boolean;
  allowedStart: string; // HH:MM format
  allowedEnd: string; // HH:MM format
}

export interface ChildTimeSettings {
  dailyLimit: TimeLimit;
  usedToday: number; // minutes
  lastResetDate: string; // YYYY-MM-DD
  isPaused: boolean;
  schedule: TimeSchedule;
}

// Webhook events from Discord Bot
export type WebhookEventType = 
  | 'bonding-match'
  | 'kofi-purchase'
  | 'node-one-status'
  | 'family-event'
  | 'system-alert';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: number;
  data: {
    childId?: string;
    amount?: number;
    productName?: string;
    message?: string;
    status?: string;
  };
  read: boolean;
}

// Family settings
export interface FamilySettings {
  familyCode: string;
  children: Child[];
  webhookUrl?: string;
  createdAt: number;
  updatedAt: number;
}

// Parent controls state
export interface ParentControlsState {
  family: FamilySettings;
  childSettings: Record<string, ChildTimeSettings>;
  activities: BONDINGActivity[];
  webhookEvents: WebhookEvent[];
  selectedChildId: string | null;
}

// Activity filter options
export interface ActivityFilter {
  childId?: string;
  startDate?: number;
  endDate?: number;
  actionTypes?: ActivityActionType[];
}

// Time control actions
export type TimeControlAction = 
  | { type: 'SET_LIMIT'; childId: string; limit: TimeLimit }
  | { type: 'PAUSE_ACCESS'; childId: string }
  | { type: 'RESUME_ACCESS'; childId: string }
  | { type: 'SET_SCHEDULE'; childId: string; schedule: TimeSchedule }
  | { type: 'RESET_DAILY_USAGE'; childId: string };

// Family management actions
export type FamilyAction = 
  | { type: 'ADD_CHILD'; child: Child }
  | { type: 'REMOVE_CHILD'; childId: string }
  | { type: 'UPDATE_CHILD'; child: Child }
  | { type: 'SET_FAMILY_CODE'; code: string }
  | { type: 'SET_WEBHOOK_URL'; url: string }
  | { type: 'MARK_EVENT_READ'; eventId: string };

// Webhook configuration
export interface WebhookConfig {
  url: string;
  events: WebhookEventType[];
  enabled: boolean;
}