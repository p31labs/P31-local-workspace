/**
 * P31 Z-Index Cockpit Types
 * =========================
 * 
 * TypeScript type definitions for the Z-Index Cockpit frontend state management.
 * These types define the complete state structure for the cockpit interface.
 * 
 * Author: P31 Labs
 * License: MIT
 */

import { CatchersMittSignal, MetabolicState, VoltageLogPayload } from './contracts';

// Core State Types
export interface CockpitState {
  // Core State
  isInitialized: boolean;
  isLocked: boolean;
  lockoutReason: string | null;
  lockoutUntil: number | null;
  
  // Voltage & Metabolic State
  voltageLevel: number;
  metabolicState: MetabolicState;
  voltageLogs: VoltageLogPayload[];
  
  // Fawn Guard
  fawnGuard: FawnGuardState;
  
  // Catcher's Mitt
  catchersMitt: CatchersMittState;
  
  // System Status
  systemStatus: SystemStatus;
  
  // UI State
  ui: UIState;
}

// Fawn Guard State
export interface FawnGuardState {
  isActive: boolean;
  isModalOpen: boolean;
  currentSignal: CatchersMittSignal | null;
  interventionMode: 'passive' | 'active';
  lastIntervention: number | null;
}

// Catcher's Mitt State
export interface CatchersMittState {
  isProcessing: boolean;
  lastSignal: CatchersMittSignal | null;
  signalHistory: (CatchersMittSignal & { receivedAt: number })[];
  rawSequestered: boolean;
}

// System Status
export interface SystemStatus {
  backendConnected: boolean;
  websocketConnected: boolean;
  lastHeartbeat: number | null;
  errorCount: number;
}

// UI State
export interface UIState {
  activeRoom: string;
  isFullscreen: boolean;
  theme: 'light' | 'dark';
  notifications: NotificationItem[];
}

// Notification Types
export interface NotificationItem {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  duration?: number;
}

// Signal History Item
export interface SignalHistoryItem extends CatchersMittSignal {
  receivedAt: number;
}

// Cockpit Actions
export interface CockpitActions {
  // Core Actions
  initialize: () => void;
  setLockout: (reason: string | null, until: number | null) => void;
  checkLockout: () => void;
  
  // Voltage Management
  updateVoltage: (level: number) => void;
  addVoltageLog: (log: VoltageLogPayload) => void;
  updateMetabolicState: (state: MetabolicState) => void;
  drainSpoons: (taskCost: number, lambda?: number) => void;
  
  // Fawn Guard Actions
  activateFawnGuard: (signal: CatchersMittSignal) => void;
  deactivateFawnGuard: () => void;
  setFawnGuardMode: (mode: 'passive' | 'active') => void;
  
  // Catcher's Mitt Actions
  processVoltageSignal: (signal: CatchersMittSignal) => void;
  setProcessing: (isProcessing: boolean) => void;
  
  // System Status
  setBackendConnected: (connected: boolean) => void;
  setWebsocketConnected: (connected: boolean) => void;
  incrementErrorCount: () => void;
  resetErrorCount: () => void;
  
  // UI Actions
  setActiveRoom: (room: string) => void;
  toggleFullscreen: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: NotificationItem) => void;
  removeNotification: (id: string) => void;
  
  // Reset function
  reset: () => void;
}

// Complete Cockpit Store Type
export type CockpitStore = CockpitState & CockpitActions;

// Hook Return Types
export interface UseCockpitStoreReturn extends CockpitStore {}

// Voltage Tier Types
export type VoltageTier = 'LOW' | 'MODERATE' | 'HIGH';

// Room Types
export type RoomType = 'z-10' | 'z-20' | 'z-30' | 'z-40' | 'z-50' | 'z-60';

// Theme Types
export type ThemeType = 'light' | 'dark';

// Lockout Reason Types
export type LockoutReason = 
  | 'CRITICAL_VOLTAGE'
  | 'SYSTEM_ERROR'
  | 'MANUAL_LOCKOUT'
  | 'TIMEOUT'
  | null;

// Intervention Mode Types
export type InterventionMode = 'passive' | 'active';

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'signal' | 'heartbeat' | 'error';
  payload: any;
  timestamp: number;
}

// Error Types
export interface CockpitError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

// Configuration Types
export interface CockpitConfig {
  websocketUrl: string;
  backendUrl: string;
  theme: ThemeType;
  lockoutDuration: number;
  voltageThresholds: {
    low: number;
    moderate: number;
    high: number;
  };
}

// Default Configuration
export const DEFAULT_COCKPIT_CONFIG: CockpitConfig = {
  websocketUrl: 'ws://localhost:8031/ws',
  backendUrl: 'http://localhost:8000',
  theme: 'dark',
  lockoutDuration: 300000, // 5 minutes
  voltageThresholds: {
    low: 30,
    moderate: 70,
    high: 100
  }
};