import { describe, it, expect, beforeEach } from 'vitest';
import { BrosPhase, BrosPersona } from './BrosPhase';

describe('BrosPhase', () => {
  let bros: BrosPhase;

  beforeEach(() => {
    bros = new BrosPhase();
  });

  it('initializes with zero personas before initialize()', () => {
    expect(bros.getAllPersonas()).toHaveLength(0);
  });

  it('loads personas from CogPass-style data', () => {
    bros.loadFromCogPass([
      { id: 'dr_chen', name: 'Dr. Chen', mode: 'guardian', color: 'teal', features: ['voice', 'visual'] },
      { id: 'tutor_marco', name: 'Marco', mode: 'operator', color: 'indigo', features: ['voice'] }
    ]);
    const all = bros.getAllPersonas();
    expect(all).toHaveLength(2);
    expect(bros.getPersonaConfig('dr_chen')?.name).toBe('Dr. Chen');
    expect(bros.getPersonaConfig('tutor_marco')?.mode).toBe('operator');
  });

  it('ignores CogPass personas with duplicate IDs', () => {
    bros.loadFromCogPass([
      { id: 'alpha', name: 'Alpha', mode: 'operator', features: [] },
      { id: 'alpha', name: 'Duplicate Alpha', mode: 'child', features: [] }
    ]);
    expect(bros.getAllPersonas()).toHaveLength(1);
    expect(bros.getPersonaConfig('alpha')?.name).toBe('Alpha');
  });

  it('initializes placeholders when no CogPass provided', async () => {
    await bros.initialize({ version: '2.0.0', convergenceWeek: 1, phases: {}, features: {} } as any);
    const all = bros.getAllPersonas();
    expect(all.length).toBeGreaterThanOrEqual(1);
    const first = bros.getCurrentPersona();
    expect(first).toBeTruthy();
  });

  it('registers a custom persona', () => {
    bros.registerPersona('custom_bot', {
      name: 'Custom Bot',
      mode: 'operator',
      color: 'purple',
      icon: '🤖',
      description: 'A custom persona loaded at runtime',
      features: ['voice', 'visual'],
      voiceTrigger: ['custom mode'],
      uiDensity: 'medium'
    });
    expect(bros.getAllPersonas()).toHaveLength(1);
    expect(bros.getPersonaConfig('custom_bot')?.name).toBe('Custom Bot');
  });

  it('unregisters a persona', () => {
    bros.registerPersona('temp', {
      name: 'Temp',
      mode: 'operator',
      color: 'gray',
      icon: '👤',
      description: 'Temporary',
      features: [],
      voiceTrigger: [],
      uiDensity: 'low'
    });
    expect(bros.getAllPersonas()).toHaveLength(1);
    const removed = bros.unregisterPersona('temp');
    expect(removed).toBe(true);
    expect(bros.getAllPersonas()).toHaveLength(0);
  });

  it('skips duplicate persona registration', () => {
    bros.registerPersona('alpha', {
      name: 'Alpha',
      mode: 'operator',
      color: 'blue',
      icon: '🤖',
      description: 'First',
      features: [],
      voiceTrigger: [],
      uiDensity: 'medium'
    });
    bros.registerPersona('alpha', {
      name: 'Alpha Duplicate',
      mode: 'child',
      color: 'red',
      icon: '👤',
      description: 'Should not replace',
      features: [],
      voiceTrigger: [],
      uiDensity: 'low'
    });
    expect(bros.getAllPersonas()).toHaveLength(1);
    expect(bros.getPersonaConfig('alpha')?.name).toBe('Alpha');
  });

  it('switches persona and emits event', () => {
    bros.activate();
    let captured: any = null;
    bros.setEmitDelegate((event: any) => { captured = event; });
    bros.setOnDelegate((_e: string, _h: any) => {});

    expect(bros.getCurrentPersona()).toBe('');

    bros.registerPersona('dr_chen', {
      name: 'Dr. Chen',
      mode: 'guardian',
      color: 'teal',
      icon: '🧭',
      description: 'Guardian',
      features: ['voice', 'visual'],
      voiceTrigger: ['chen mode'],
      uiDensity: 'medium'
    });
    bros.switchPersona('dr_chen');
    expect(bros.getCurrentPersona()).toBe('dr_chen');
    expect(bros.getSwitchHistory().length).toBe(1);
    expect(captured?.type).toBe('bros.persona.changed');
    expect(captured?.payload?.persona).toBe('dr_chen');
  });

  it('records and returns errors', () => {
    bros.activate();
    bros.setEmitDelegate(() => {});
    bros.setOnDelegate(() => {});
    expect(bros.getErrorCount()).toBe(0);
    bros.recordError('test error');
    expect(bros.getErrorCount()).toBe(1);
    bros.recordError('another error');
    expect(bros.getErrorCount()).toBe(2);
  });

  it('switchPersona calls recordError on invalid persona', () => {
    bros.activate();
    bros.setEmitDelegate(() => {});
    bros.setOnDelegate(() => {});
    expect(bros.getErrorCount()).toBe(0);
    bros.switchPersona('nonexistent');
    expect(bros.getErrorCount()).toBe(1);
  });

  it('reports state with correct metrics', async () => {
    bros.activate();
    bros.setEmitDelegate(() => {});
    bros.setOnDelegate(() => {});

    bros.loadFromCogPass([
      { id: 'alpha', name: 'Alpha', mode: 'operator', features: [] }
    ]);
    bros.switchPersona('alpha');

    const state = bros.getState();
    expect(state.status).not.toBe('paused');
    expect(state.metrics.personaSwitchCount).toBe(1);
  });

  it('returns detailed state including persona list', async () => {
    await bros.initialize({ version: '2.0.0', convergenceWeek: 1, phases: {}, features: {} } as any);
    const detailed = bros.getDetailedState();
    expect(detailed.currentPersona).toBeTruthy();
    expect(detailed.personaList.length).toBeGreaterThanOrEqual(1);
    expect(detailed.version).toBe('2.0.0');
  });

  it('records voice trigger matches with confidence', () => {
    bros.registerPersona('dr_chen', {
      name: 'Dr. Chen',
      mode: 'guardian',
      color: 'teal',
      icon: '🧭',
      description: 'Guardian',
      features: ['voice', 'visual'],
      voiceTrigger: ['chen mode', 'guardian mode'],
      uiDensity: 'medium'
    });
    const result = bros.matchVoiceTrigger('switch to chen mode');
    expect(result).toBe('dr_chen');
  });

  it('returns null for no voice trigger match', () => {
    const result = bros.matchVoiceTrigger('something unrelated');
    expect(result).toBeNull();
  });

  it('disambiguateAndSwitch returns ranked matches', () => {
    bros.registerPersona('dr_chen', {
      name: 'Dr. Chen',
      mode: 'guardian',
      color: 'teal',
      icon: '🧭',
      description: 'Guardian',
      features: [],
      voiceTrigger: ['chen', 'guardian'],
      uiDensity: 'medium'
    });
    bros.registerPersona('marco', {
      name: 'Marco',
      mode: 'operator',
      color: 'indigo',
      icon: '🧑‍💻',
      description: 'Tutor',
      features: [],
      voiceTrigger: ['marco', 'tutor'],
      uiDensity: 'medium'
    });
    const matches = bros.disambiguateAndSwitch('call marco');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].personaId).toBe('marco');
    expect(matches[0].confidence).toBeGreaterThan(0);
  });

  it('loads persona data with full CogPass fields', () => {
    bros.loadFromCogPass([
      {
        id: 'caregiver',
        name: 'Brenda',
        mode: 'caregiver',
        color: 'green',
        icon: '🫂',
        features: ['voice', 'visual', 'memory']
      }
    ]);
    const config = bros.getPersonaConfig('caregiver');
    expect(config?.relationshipType).toBe('caregiver');
    expect(config?.voiceTrigger).toContain('Brenda mode');
  });
});
