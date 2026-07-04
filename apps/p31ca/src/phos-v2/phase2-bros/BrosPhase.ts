/**
 * Phase 2: PHOS Bros
 * Dynamic companion persona system
 */

import type { PHOSPhase, PHOSEvent, PHOSConfig, PhaseState, ConvergenceData } from '../master';
import { VoiceTriggerMatcher } from './VoiceTriggerMatcher';

export type BrosPersona = string;

export interface PersonaConfig {
  id: string;
  name: string;
  mode: string;
  color?: string;
  icon?: string;
  description?: string;
  features: string[];
  voiceTrigger: string[];
  uiDensity: 'low' | 'medium' | 'high';
  relationshipType?: string;
  customLabel?: string;
}

export interface VoiceTriggerMatch {
  personaId: string;
  confidence: number;
  matchedTrigger: string;
}

const PLACEHOLDER_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta'];
const PLACEHOLDER_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899'];
const PLACEHOLDER_MODES = ['companion', 'mentor', 'caregiver', 'friend'];

function randomPlaceholder(index: number): PersonaConfig {
  return {
    id: `ph_${index}`,
    name: PLACEHOLDER_NAMES[index % PLACEHOLDER_NAMES.length],
    mode: PLACEHOLDER_MODES[index % PLACEHOLDER_MODES.length],
    color: PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length],
    icon: ['🤖', '🧭', '🫂', '🍃'][index % 4],
    description: `Placeholder persona — personalize via voice`,
    features: ['voice'],
    voiceTrigger: [`${PLACEHOLDER_NAMES[index]} mode`, `mode ${PLACEHOLDER_NAMES[index]}`],
    uiDensity: 'medium'
  };
}

function generatePlaceholders(count: number): PersonaConfig[] {
  return Array.from({ length: count }, (_, i) => randomPlaceholder(i));
}

export class BrosPhase implements PHOSPhase {
  id = 'bros';
  version = '0.0.0';
  status: 'alpha' | 'beta' | 'stable' | 'disabled' = 'alpha';

  private config: PHOSConfig | null = null;
  private active = false;
  private errorCount = 0;
  private lastActivity = 0;
  private currentPersona: BrosPersona = '';
  private personas: Map<string, PersonaConfig> = new Map();
  private switchCount = 0;
  private switchHistory: Array<{ from: BrosPersona; to: BrosPersona; timestamp: number }> = [];
  private emitFn: ((event: PHOSEvent) => void) | null = null;
  private onFn: ((event: string, handler: (event: PHOSEvent) => void) => void) | null = null;
  private triggerMatcher: VoiceTriggerMatcher;

  constructor() {
    this.currentPersona = '';
    this.triggerMatcher = new VoiceTriggerMatcher();
  }

  async initialize(config: PHOSConfig): Promise<void> {
    this.config = config;
    this.version = config.version;

    const cogPassPersonas = (config as any).personas as Array<{ id: string; name?: string; mode?: string; color?: string; icon?: string; features?: string[] }> | undefined;
    if (cogPassPersonas && cogPassPersonas.length > 0) {
      this.loadFromCogPass(cogPassPersonas);
    } else {
      const placeholders = generatePlaceholders(4);
      for (const p of placeholders) {
        this.personas.set(p.id, p);
      }
      this.currentPersona = placeholders[0].id;
    }

    if (this.personas.size > 0 && !this.currentPersona) {
      this.currentPersona = this.personas.keys().next().value as BrosPersona;
    }

    this.lastActivity = Date.now();
  }

  activate(): void {
    this.active = true;
    this.updateStatus();
    this.lastActivity = Date.now();
  }

  deactivate(): void {
    this.active = false;
    this.updateStatus();
  }

  destroy(): void {
    this.personas.clear();
    this.active = false;
    this.currentPersona = '';
    this.switchHistory = [];
    this.switchCount = 0;
    this.errorCount = 0;
  }

  emit(event: PHOSEvent): void {
    if (this.emitFn) {
      this.emitFn(event);
    }
  }

  on(event: string, handler: (event: PHOSEvent) => void): void {
    if (this.onFn) {
      this.onFn(event, handler);
    }
  }

  onConvergence(week: number, data: ConvergenceData): void {
    const states = this.config
      ? (this.config as any).masterStates
      : null;
    const hasPersonas = this.personas.size > 0;
    const hasActivePersona = this.currentPersona !== '';
    const hasVoiceTriggers = Array.from(this.personas.values()).some(p => p.voiceTrigger.length > 0);
    const baselineReady = hasPersonas && hasActivePersona && hasVoiceTriggers;
    const errorPenalty = Math.max(0, 1 - this.errorCount * 0.15);

    let confidence = 0;
    if (week >= 2) {
      confidence = baselineReady ? 0.85 * errorPenalty : 0.35 * errorPenalty;
    } else if (week >= 1) {
      confidence = baselineReady ? 0.7 * errorPenalty : 0.25 * errorPenalty;
    } else {
      confidence = baselineReady ? 0.5 * errorPenalty : 0.15;
    }

    data.deliverables = [
      `${this.personas.size} persona${this.personas.size === 1 ? '' : 's'} loaded`,
      'Persona switching engine',
      'Voice trigger integration',
      'PersonaSwitcher UI component'
    ];
    data.dependencies = ['voice'];
    data.blockers = this.errorCount > 0 ? [`${this.errorCount} engine error(s)`] : [];
    data.confidence = Math.min(1, Math.max(0, confidence));
  }

  getState(): PhaseState {
    const personaList = Array.from(this.personas.values()).map(p => p.id);
    return {
      status: this.active ? 'active' : 'paused',
      lastActivity: this.lastActivity,
      errorCount: this.errorCount,
      metrics: {
        personaCount: this.personas.size,
        personaSwitchCount: this.switchCount,
        currentPersona: this.personas.has(this.currentPersona) ? 1 : 0,
        voiceTriggersLoaded: Array.from(this.personas.values()).reduce((sum, p) => sum + p.voiceTrigger.length, 0)
      }
    };
  }

  getDetailedState(): Record<string, any> {
    return {
      ...this.getState(),
      currentPersona: this.currentPersona,
      personaList: Array.from(this.personas.entries()).map(([id, config]) => ({ id, config })),
      version: this.version,
      errorCount: this.errorCount,
      lastActivity: this.lastActivity
    };
  }

  registerPersona(id: string, config: Omit<PersonaConfig, 'id'>): void {
    const full: PersonaConfig = { ...config, id } as PersonaConfig;
    this.personas.set(id, full);
    if (!this.currentPersona) {
      this.currentPersona = id;
    }
    this.lastActivity = Date.now();
  }

  unregisterPersona(id: string): boolean {
    const existed = this.personas.delete(id);
    if (existed) {
      this.lastActivity = Date.now();
      if (this.currentPersona === id) {
        const next = this.personas.keys().next().value as BrosPersona | undefined;
        this.currentPersona = next || '';
      }
    }
    return existed;
  }

  loadFromCogPass(personas: Array<{ id: string; name?: string; mode?: string; color?: string; icon?: string; features?: string[] }>): void {
    this.personas.clear();
    for (const p of personas) {
      if (!p.id) continue;
      const mode = p.mode || 'companion';
      const color = p.color || '#888888';
      const icon = p.icon || '👤';
      const name = p.name || p.id;
      const config: PersonaConfig = {
        id: p.id,
        name,
        mode,
        color,
        icon,
        description: `${mode} mode — loaded from Cognitive Passport`,
        features: p.features || [],
        voiceTrigger: [`${name} mode`, `${p.id} mode`],
        uiDensity: mode === 'child' || mode === 'youth' ? 'medium' : 'high',
        relationshipType: mode
      };
      this.personas.set(p.id, config);
    }
    const first = this.personas.keys().next().value as BrosPersona | undefined;
    if (first && !this.currentPersona) {
      this.currentPersona = first;
    }
    this.lastActivity = Date.now();
  }

  switchPersona(persona: BrosPersona | string): void {
    try {
      const target = String(persona);
      if (!this.personas.has(target)) {
        throw new Error(`Persona "${target}" not found`);
      }
      if (target === this.currentPersona) return;

      const from = this.currentPersona;
      this.currentPersona = target;
      this.switchCount++;
      this.lastActivity = Date.now();

      this.switchHistory.push({ from, to: target, timestamp: Date.now() });
      if (this.switchHistory.length > 100) {
        this.switchHistory.shift();
      }

      this.emit({
        type: 'bros.persona.changed',
        payload: { persona: target, from, switchCount: this.switchCount, trustScore: this.personas.get(target)?.features?.length ? 0.5 : 0.3 },
        timestamp: Date.now(),
        source: 'bros',
        persona: target
      });

      // Push K₄ entry for trust dimension
      const trustScore = this.personas.get(target)?.features?.length ? 0.5 : 0.3;
      try {
        const { K4Bridge } = await import('../../../../../phos/src/lib/K4Bridge');
        K4Bridge.pushEntry({
          level: 0,
          feature: 'trust',
          vertex: 'VERIFY',
          edge: 'E34',
          value: trustScore,
          source: `bros:${target}`,
        });
      } catch { /* K4Bridge not available in non-PHOS context */ }
    } catch (err) {
      this.recordError(err instanceof Error ? err.message : 'switchPersona failed');
    }
  }

  matchVoiceTrigger(text: string): BrosPersona | null {
    const triggers = this.buildTriggerList();
    const best = this.triggerMatcher.bestMatch(text, triggers);
    if (best) {
      this.triggerMatcher.recordMatch(best.personaId);
    }
    return best?.personaId ?? null;
  }

  disambiguateAndSwitch(text: string): VoiceTriggerMatch[] {
    const triggers = this.buildTriggerList();
    return this.triggerMatcher.match(text, triggers);
  }

  private buildTriggerList(): Array<{ personaId: string; trigger: string }> {
    const list: Array<{ personaId: string; trigger: string }> = [];
    for (const [id, config] of this.personas) {
      for (const trigger of config.voiceTrigger) {
        list.push({ personaId: id, trigger });
      }
    }
    return list;
  }

  recordError(message: string): void {
    this.errorCount++;
    this.lastActivity = Date.now();
    this.emit({
      type: 'bros.error',
      payload: { message, errorCount: this.errorCount },
      timestamp: Date.now(),
      source: 'bros',
      priority: 'high'
    });
  }

  getErrorCount(): number {
    return this.errorCount;
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

  getSwitchHistory(): Array<{ from: BrosPersona; to: BrosPersona; timestamp: number }> {
    return [...this.switchHistory];
  }

  setEmitDelegate(fn: (event: PHOSEvent) => void): void {
    this.emitFn = fn;
  }

  setOnDelegate(fn: (event: string, handler: (event: PHOSEvent) => void) => void): void {
    this.onFn = fn;
  }

  private updateStatus(): void {
    if (!this.active) {
      this.status = 'disabled';
    } else if (this.errorCount === 0) {
      this.status = 'beta';
    } else if (this.errorCount < 3) {
      this.status = 'alpha';
    } else {
      this.status = 'alpha';
    }
  }
}
