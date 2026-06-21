/**
 * Phase 2: PHOS Bros
 * Companion persona system with 4 modes
 */

import type { PHOSPhase, PHOSEvent, PHOSConfig, PhaseState, ConvergenceData } from '../master';

export type BrosPersona = 'wj' | 'sj' | 'cj' | 'wij';

export class BrosPhase implements PHOSPhase {
  id = 'bros';
  version = '1.0.0';
  status: 'alpha' | 'beta' | 'stable' | 'disabled' = 'alpha';

  private config: PHOSConfig | null = null;
  private active = false;
  private errorCount = 0;
  private lastActivity = 0;
  private personasInitialized = false;

  // Bros-specific
  private currentPersona: BrosPersona = 'wj';
  private personas: Map<string, PersonaConfig> = new Map();
  private switchCount = 0;
  private switchHistory: Array<{ from: BrosPersona; to: BrosPersona; timestamp: number }> = [];

  constructor() {
    this.setupPersonas();
  }

  async initialize(config: PHOSConfig): Promise<void> {
    this.config = config;
    console.log('[BrosPhase] Initialized with', this.personas.size, 'personas');
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
  switchPersona(persona: BrosPersona | string): void {
    const target = String(persona);
    if (target === this.currentPersona) return;

    const from = this.currentPersona;
    this.currentPersona = target as BrosPersona;
    this.switchCount++;
    this.lastActivity = Date.now();

    this.switchHistory.push({
      from,
      to: target as BrosPersona,
      timestamp: Date.now()
    });

    if (this.switchHistory.length > 100) {
      this.switchHistory.shift();
    }

    console.log(`[BrosPhase] Switched from ${from} to ${target}`);

    this.emit({
      type: 'bros.persona.changed',
      payload: { persona: target, from, switchCount: this.switchCount },
      timestamp: Date.now(),
      source: 'bros',
      persona: target as BrosPersona
    });
  }

  matchVoiceTrigger(text: string): BrosPersona | null {
    const normalized = text.toLowerCase().trim();

    for (const [persona, config] of this.personas) {
      for (const trigger of config.voiceTrigger) {
        if (normalized.includes(trigger.toLowerCase())) {
          return persona as BrosPersona;
        }
      }
    }

    return null;
  }

  getCurrentPersona(): BrosPersona {
    return this.currentPersona;
  }

  getPersonaConfig(persona: string): PersonaConfig | undefined {
    return this.personas.get(persona);
  }

  getAllPersonas(): Array<{ id: string; config: PersonaConfig }> {
    return Array.from(this.personas.entries()).map(([id, config]) => ({ id, config }));
  }

  registerPersona(id: string, config: Omit<PersonaConfig, 'id'>): void {
    if (this.personas.has(id)) return;
    this.personas.set(id, config as PersonaConfig);
    this.lastActivity = Date.now();
  }

  unregisterPersona(id: string): boolean {
    const existed = this.personas.delete(id);
    if (existed) this.lastActivity = Date.now();
    return existed;
  }

  loadFromCogPass(personas: Array<{ id: string; name?: string; mode?: string; color?: string; icon?: string; features?: string[] }>): void {
    for (const p of personas) {
      if (!p.id || this.personas.has(p.id)) continue;
      const mode = (p.mode as PersonaConfig['mode']) || 'operator';
      const color = p.color || 'gray';
      const icon = p.icon || '👤';
      const name = p.name || p.id;
      this.personas.set(p.id, {
        name,
        mode,
        color,
        icon,
        description: `${mode} mode — loaded from Cognitive Passport`,
        features: p.features || [],
        voiceTrigger: [`${name} mode`, `${p.id} mode`],
        uiDensity: mode === 'child' ? 'low' : mode === 'youth' ? 'medium' : 'high'
      });
    }
    this.lastActivity = Date.now();
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
