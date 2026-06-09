/**
 * Phase 2: PHOS Bros
 * Companion persona system with 4 modes
 */

import type { PHOSPhase, PHOSEvent, PHOSConfig, PhaseState, ConvergenceData } from '../master';

export type BrosPersona = 'wj' | 'sj' | 'cj' | 'wij';

export class BrosPhase implements PHOSPhase {
  id = 'bros';
  version = '0.1.0';
  status: 'alpha' | 'beta' | 'stable' | 'disabled' = 'alpha';

  private config: PHOSConfig | null = null;
  private active = false;
  private errorCount = 0;
  private lastActivity = 0;

  // Bros-specific
  private currentPersona: BrosPersona = 'wj';
  private personas: Map<BrosPersona, PersonaConfig> = new Map();
  private switchCount = 0;
  private switchHistory: Array<{ from: BrosPersona; to: BrosPersona; timestamp: number }> = [];

  async initialize(config: PHOSConfig): Promise<void> {
    this.config = config;
    console.log('[BrosPhase] Initializing 4 personas...');
    this.setupPersonas();
    this.lastActivity = Date.now();
  }

  private setupPersonas(): void {
    this.personas.set('wj', {
      name: 'W.J.',
      mode: 'operator',
      color: 'cyan',
      icon: '👤',
      description: 'Operator mode. Full system access.',
      features: ['voice', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory'],
      voiceTrigger: ['operator mode', 'W.J. mode', 'adult mode'],
      uiDensity: 'high'
    });

    this.personas.set('sj', {
      name: 'S.J.',
      mode: 'youth',
      color: 'emerald',
      icon: '🎮',
      description: 'Youth mode. Teen-friendly interface.',
      features: ['voice', 'router', 'visual', 'memory'],
      voiceTrigger: ['S.J. mode', 'youth mode', 'teen mode', 'bash mode'],
      uiDensity: 'medium'
    });

    this.personas.set('cj', {
      name: 'C.J.',
      mode: 'guardian',
      color: 'amber',
      icon: '🛡️',
      description: 'Guardian mode. Family oversight.',
      features: ['voice', 'router', 'guardian', 'predictive'],
      voiceTrigger: ['C.J. mode', 'guardian mode', 'parent mode'],
      uiDensity: 'medium'
    });

    this.personas.set('wij', {
      name: 'Wi.J.',
      mode: 'child',
      color: 'rose',
      icon: '⭐',
      description: 'Child mode. Safe, simple, fun.',
      features: ['voice', 'visual'],
      voiceTrigger: ['Wi.J. mode', 'child mode', 'kid mode', 'willow mode'],
      uiDensity: 'low'
    });
  }

  activate(): void {
    this.active = true;
    this.status = 'alpha';
    console.log('[BrosPhase] Activated with persona:', this.currentPersona);
  }

  deactivate(): void {
    this.active = false;
    console.log('[BrosPhase] Deactivated');
  }

  destroy(): void {
    this.personas.clear();
    console.log('[BrosPhase] Destroyed');
  }

  onConvergence(week: number, data: ConvergenceData): void {
    data.deliverables = [
      '4 persona implementations',
      'Persona switching UI',
      'Voice-persona integration (W2)',
      'Visual avatar per persona (W4)'
    ];
    data.dependencies = ['voice']; // Needs voice for W2 convergence
    data.blockers = [];
    data.confidence = week >= 2 ? 0.85 : 0.4;
  }

  getState(): PhaseState {
    return {
      status: this.active ? 'active' : 'paused',
      lastActivity: this.lastActivity,
      errorCount: this.errorCount,
      metrics: {
        currentPersona: this.currentPersona === 'wj' ? 0 : this.currentPersona === 'sj' ? 1 : this.currentPersona === 'cj' ? 2 : 3,
        personaSwitchCount: this.switchCount
      }
    };
  }

  getSwitchHistory(): Array<{ from: BrosPersona; to: BrosPersona; timestamp: number }> {
    return [...this.switchHistory];
  }

  emit(event: PHOSEvent): void {
    // Implementation via master registration
  }

  on(event: string, handler: (event: PHOSEvent) => void): void {
    // Implementation via master registration
  }

  // Bros-specific methods
  switchPersona(persona: BrosPersona): void {
    if (persona === this.currentPersona) return;

    const from = this.currentPersona;
    this.currentPersona = persona;
    this.switchCount++;
    this.lastActivity = Date.now();

    this.switchHistory.push({
      from,
      to: persona,
      timestamp: Date.now()
    });

    // Keep history manageable
    if (this.switchHistory.length > 100) {
      this.switchHistory.shift();
    }

    console.log(`[BrosPhase] Switched from ${from} to ${persona}`);

    // Emit event for other phases
    this.emit({
      type: 'bros.persona.changed',
      payload: { persona, from, switchCount: this.switchCount },
      timestamp: Date.now(),
      source: 'bros',
      persona
    });
  }

  matchVoiceTrigger(text: string): BrosPersona | null {
    const normalized = text.toLowerCase().trim();

    for (const [persona, config] of this.personas) {
      for (const trigger of config.voiceTrigger) {
        if (normalized.includes(trigger.toLowerCase())) {
          return persona;
        }
      }
    }

    return null;
  }

  getCurrentPersona(): BrosPersona {
    return this.currentPersona;
  }

  getPersonaConfig(persona: BrosPersona): PersonaConfig | undefined {
    return this.personas.get(persona);
  }
}

export interface PersonaConfig {
  name: string;
  mode: 'operator' | 'youth' | 'guardian' | 'child';
  color: string;
  icon: string;
  description: string;
  features: string[];
  voiceTrigger: string[];
  uiDensity: 'low' | 'medium' | 'high';
}
