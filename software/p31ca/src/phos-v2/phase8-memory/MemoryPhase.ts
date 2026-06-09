/**
 * Phase 8: PHOS Memory
 * Long-term context, intent history, and persistence layer
 */

import type { PHOSPhase, PHOSEvent, PHOSConfig, PhaseState, ConvergenceData } from '../master';

export class MemoryPhase implements PHOSPhase {
  id = 'memory';
  version = '0.1.0';
  status: 'alpha' | 'beta' | 'stable' | 'disabled' = 'alpha';

  private config: PHOSConfig | null = null;
  private active = false;
  private errorCount = 0;
  private lastActivity = 0;

  // Memory-specific
  private contextStore: Map<string, any> = new Map();
  private intentHistory: Array<{ intent: string; result: any; timestamp: number }> = [];
  private userPreferences: Map<string, any> = new Map();
  private sessionLog: Array<{ event: string; data: any; timestamp: number }> = [];
  private storageBackend: 'local' | 'indexeddb' | 'cloud' = 'local';

  async initialize(config: PHOSConfig): Promise<void> {
    this.config = config;
    console.log('[MemoryPhase] Initializing memory layer...');
    await this.initStorage();
    this.lastActivity = Date.now();
  }

  activate(): void {
    this.active = true;
    this.status = 'alpha';
    console.log('[MemoryPhase] Activated');
  }

  deactivate(): void {
    this.active = false;
    this.persistToStorage();
    console.log('[MemoryPhase] Deactivated');
  }

  destroy(): void {
    this.persistToStorage();
    this.contextStore.clear();
    this.intentHistory = [];
    this.userPreferences.clear();
    this.sessionLog = [];
    console.log('[MemoryPhase] Destroyed');
  }

  onConvergence(week: number, data: ConvergenceData): void {
    data.deliverables = [
      'Context persistence',
      'Intent history store',
      'Preference management',
      'Storage abstraction'
    ];
    data.dependencies = ['master']; // Base dependency only
    data.blockers = [];
    data.confidence = week >= 1 ? 0.8 : 0.4;
  }

  getState(): PhaseState {
    return {
      status: this.active ? 'active' : 'paused',
      lastActivity: this.lastActivity,
      errorCount: this.errorCount,
      metrics: {
        contextsStored: this.contextStore.size,
        historySize: this.intentHistory.length,
        preferences: this.userPreferences.size,
        sessionEvents: this.sessionLog.length
      }
    };
  }

  emit(event: PHOSEvent): void {
    // Implementation via master registration
  }

  on(event: string, handler: (event: PHOSEvent) => void): void {
    // Implementation via master registration
  }

  // Memory-specific methods
  private async initStorage(): Promise<void> {
    // Check for IndexedDB support
    if ('indexedDB' in window) {
      this.storageBackend = 'indexeddb';
    }
    console.log(`[MemoryPhase] Storage backend: ${this.storageBackend}`);
  }

  private persistToStorage(): void {
    // TODO: Persist data to chosen backend
    console.log('[MemoryPhase] Persisting to storage...');
  }

  setContext(key: string, value: any): void {
    this.contextStore.set(key, {
      value,
      timestamp: Date.now()
    });
    this.lastActivity = Date.now();
  }

  getContext(key: string): any {
    const entry = this.contextStore.get(key);
    return entry?.value;
  }

  clearContext(key: string): void {
    this.contextStore.delete(key);
  }

  recordIntent(intent: string, result: any): void {
    this.intentHistory.push({
      intent,
      result,
      timestamp: Date.now()
    });
    // Keep last 1000 intents
    if (this.intentHistory.length > 1000) {
      this.intentHistory.shift();
    }
    this.lastActivity = Date.now();
  }

  getIntentHistory(filter?: { since?: number; intent?: string }): Array<{ intent: string; result: any; timestamp: number }> {
    let history = [...this.intentHistory];
    if (filter?.since) {
      history = history.filter(h => h.timestamp >= filter.since!);
    }
    if (filter?.intent) {
      history = history.filter(h => h.intent === filter.intent);
    }
    return history;
  }

  setPreference(key: string, value: any): void {
    this.userPreferences.set(key, value);
    this.lastActivity = Date.now();
  }

  getPreference(key: string): any {
    return this.userPreferences.get(key);
  }

  logSessionEvent(event: string, data: any): void {
    this.sessionLog.push({
      event,
      data,
      timestamp: Date.now()
    });
    // Keep last 500 events
    if (this.sessionLog.length > 500) {
      this.sessionLog.shift();
    }
  }

  getSessionLog(): Array<{ event: string; data: any; timestamp: number }> {
    return [...this.sessionLog];
  }

  async exportData(): Promise<string> {
    const exportObj = {
      contexts: Array.from(this.contextStore.entries()),
      history: this.intentHistory,
      preferences: Array.from(this.userPreferences.entries()),
      exportedAt: Date.now()
    };
    return JSON.stringify(exportObj);
  }

  async importData(json: string): Promise<void> {
    const data = JSON.parse(json);
    if (data.contexts) {
      this.contextStore = new Map(data.contexts);
    }
    if (data.history) {
      this.intentHistory = data.history;
    }
    if (data.preferences) {
      this.userPreferences = new Map(data.preferences);
    }
    console.log('[MemoryPhase] Data imported');
  }

  clearAll(): void {
    this.contextStore.clear();
    this.intentHistory = [];
    this.userPreferences.clear();
    this.sessionLog = [];
    console.log('[MemoryPhase] All memory cleared');
  }
}
