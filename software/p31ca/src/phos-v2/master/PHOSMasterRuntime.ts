/**
 * PHOS Master Runtime v2.0
 * Event bus and coordinator for all 8 parallel phases
 * 
 * The glow that guides without burning — converging from 8 paths to 1
 */

export interface PHOSPhase {
  id: string;
  version: string;
  status: 'alpha' | 'beta' | 'stable' | 'disabled';
  
  // Lifecycle
  initialize(config: PHOSConfig): Promise<void>;
  activate(): void;
  deactivate(): void;
  destroy(): void;
  
  // Convergence
  onConvergence(week: number, data: ConvergenceData): void;
  getState(): PhaseState;
  
  // Events
  emit(event: PHOSEvent): void;
  on(event: string, handler: (event: PHOSEvent) => void): void;
}

export interface PHOSEvent {
  type: string;
  payload: any;
  timestamp: number;
  source: string;
  persona?: 'wj' | 'sj' | 'cj' | 'wij' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface PHOSConfig {
  version: string;
  convergenceWeek: number;
  phases: Record<string, PhaseConfig>;
  features: {
    voice: boolean;
    bros: boolean;
    router: boolean;
    visual: boolean;
    predictive: boolean;
    guardian: boolean;
    bridge: boolean;
    memory: boolean;
  };
}

export interface PhaseConfig {
  enabled: boolean;
  version: string;
  targetWeek: number;
  mock?: boolean;
}

export interface PhaseState {
  status: 'active' | 'paused' | 'error' | 'initializing';
  lastActivity: number;
  errorCount: number;
  metrics: Record<string, number>;
}

export interface ConvergenceData {
  week: number;
  phaseId: string;
  deliverables: string[];
  dependencies: string[];
  blockers: string[];
  confidence: number; // 0-1
}

/**
 * PHOS Master Runtime
 * Central event bus and phase coordinator
 */
export class PHOSMasterRuntime {
  private phases: Map<string, PHOSPhase> = new Map();
  private eventListeners: Map<string, Set<(event: PHOSEvent) => void>> = new Map();
  private config: PHOSConfig;
  private convergenceWeek: number = 1;
  private eventHistory: PHOSEvent[] = [];
  private maxHistorySize: number = 1000;
  
  constructor(config: PHOSConfig) {
    this.config = config;
    this.convergenceWeek = config.convergenceWeek;
    console.log(`[PHOS Master] v${config.version} initialized — Week ${config.convergenceWeek} convergence`);
  }
  
  /**
   * Register a phase with the master runtime
   */
  registerPhase(phase: PHOSPhase): void {
    const phaseConfig = this.config.phases[phase.id];
    
    if (!phaseConfig || !phaseConfig.enabled) {
      console.log(`[PHOS Master] Phase ${phase.id} disabled in config`);
      phase.status = 'disabled';
      return;
    }
    
    this.phases.set(phase.id, phase);
    console.log(`[PHOS Master] Phase ${phase.id} v${phase.version} registered`);
    
    // Set up phase-to-master event forwarding
    phase.on = (event: string, handler: (event: PHOSEvent) => void) => {
      this.on(event, handler);
    };
    
    phase.emit = (event: PHOSEvent) => {
      this.emit(event);
    };
  }
  
  /**
   * Emit event to all registered listeners
   */
  emit(event: PHOSEvent): void {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    // Log high priority events
    if (event.priority === 'high' || event.priority === 'urgent') {
      console.log(`[PHOS Event] ${event.type} from ${event.source}`, event.payload);
    }
    
    // Notify listeners
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[PHOS Master] Event handler error for ${event.type}:`, error);
        }
      });
    }
    
    // Also notify wildcard listeners
    const wildcards = this.eventListeners.get('*');
    if (wildcards) {
      wildcards.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[PHOS Master] Wildcard handler error:`, error);
        }
      });
    }
  }
  
  /**
   * Subscribe to events
   */
  on(eventType: string, handler: (event: PHOSEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(handler);
  }
  
  /**
   * Unsubscribe from events
   */
  off(eventType: string, handler: (event: PHOSEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(handler);
    }
  }
  
  /**
   * Trigger convergence point for all phases
   */
  async converge(week: number): Promise<ConvergenceReport> {
    console.log(`[PHOS Master] Convergence Week ${week} initiated`);
    
    const report: ConvergenceReport = {
      week,
      timestamp: Date.now(),
      phaseReports: [],
      integrations: [],
      blockers: []
    };
    
    // Collect data from all phases
    for (const [id, phase] of this.phases) {
      const state = phase.getState();
      const data: ConvergenceData = {
        week,
        phaseId: id,
        deliverables: [],
        dependencies: [],
        blockers: [],
        confidence: 0
      };
      
      phase.onConvergence(week, data);
      
      report.phaseReports.push({
        phaseId: id,
        state,
        data
      });
      
      if (data.blockers.length > 0) {
        report.blockers.push(...data.blockers);
      }
    }
    
    // Check cross-phase integrations
    report.integrations = this.checkIntegrations(week);
    
    console.log(`[PHOS Master] Convergence Week ${week} complete — ${report.blockers.length} blockers`);
    
    return report;
  }
  
  /**
   * Check which phases can integrate at this convergence point
   */
  private checkIntegrations(week: number): IntegrationCheck[] {
    const integrations: IntegrationCheck[] = [];
    
    // Week 1: Core (Voice + Bros + Router)
    if (week >= 1) {
      integrations.push({
        phases: ['voice', 'bros', 'router'],
        name: 'Core Runtime',
        ready: this.arePhasesReady(['voice', 'bros', 'router']),
        demo: 'Voice command switches Bros persona'
      });
    }
    
    // Week 2: Voice-Persona
    if (week >= 2) {
      integrations.push({
        phases: ['voice', 'bros'],
        name: 'Voice-Persona Switching',
        ready: this.arePhasesReady(['voice', 'bros']),
        demo: '"Switch to S.J. mode" → UI transforms'
      });
    }
    
    // Week 4: Visual Core
    if (week >= 4) {
      integrations.push({
        phases: ['voice', 'bros', 'router', 'visual'],
        name: '3D Constellation Core',
        ready: this.arePhasesReady(['voice', 'bros', 'router', 'visual']),
        demo: 'Voice moves 3D nodes, Bros changes avatar'
      });
    }
    
    // Week 8: Full PHOS v2.0
    if (week >= 8) {
      integrations.push({
        phases: ['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory'],
        name: 'PHOS v2.0 GA',
        ready: this.arePhasesReady(['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory']),
        demo: 'Complete ecosystem — all 8 phases integrated'
      });
    }
    
    return integrations;
  }
  
  /**
   * Check if specified phases are ready
   */
  private arePhasesReady(phaseIds: string[]): boolean {
    return phaseIds.every(id => {
      const phase = this.phases.get(id);
      if (!phase) return false;
      const state = phase.getState();
      return state.status === 'active' && state.errorCount === 0;
    });
  }
  
  /**
   * Get event history
   */
  getEventHistory(type?: string): PHOSEvent[] {
    if (type) {
      return this.eventHistory.filter(e => e.type === type);
    }
    return [...this.eventHistory];
  }
  
  /**
   * Get all phase states
   */
  getAllStates(): Record<string, PhaseState> {
    const states: Record<string, PhaseState> = {};
    for (const [id, phase] of this.phases) {
      states[id] = phase.getState();
    }
    return states;
  }
  
  /**
   * Enable/disable a phase at runtime
   */
  setPhaseEnabled(phaseId: string, enabled: boolean): void {
    const phase = this.phases.get(phaseId);
    if (!phase) return;
    
    if (enabled) {
      phase.activate();
    } else {
      phase.deactivate();
    }
    
    this.config.phases[phaseId].enabled = enabled;
    
    this.emit({
      type: 'phase.status.changed',
      payload: { phaseId, enabled },
      timestamp: Date.now(),
      source: 'master'
    });
  }
  
  /**
   * Destroy all phases and clean up
   */
  destroy(): void {
    for (const phase of this.phases.values()) {
      phase.destroy();
    }
    this.phases.clear();
    this.eventListeners.clear();
    this.eventHistory = [];
    console.log('[PHOS Master] Destroyed');
  }
}

export interface ConvergenceReport {
  week: number;
  timestamp: number;
  phaseReports: Array<{
    phaseId: string;
    state: PhaseState;
    data: ConvergenceData;
  }>;
  integrations: IntegrationCheck[];
  blockers: string[];
}

export interface IntegrationCheck {
  phases: string[];
  name: string;
  ready: boolean;
  demo: string;
}

// Singleton instance
let masterRuntime: PHOSMasterRuntime | null = null;

export function getPHOSMaster(config?: PHOSConfig): PHOSMasterRuntime {
  if (!masterRuntime && config) {
    masterRuntime = new PHOSMasterRuntime(config);
  }
  if (!masterRuntime) {
    throw new Error('PHOSMasterRuntime not initialized — provide config');
  }
  return masterRuntime;
}

export function resetPHOSMaster(): void {
  if (masterRuntime) {
    masterRuntime.destroy();
    masterRuntime = null;
  }
}
