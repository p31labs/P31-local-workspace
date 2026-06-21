import { describe, it, expect } from 'vitest';
import { BrosPhase } from './BrosPhase';

describe('BrosPhase', () => {
  it('initializes with 4 default personas', () => {
    const bros = new BrosPhase();
    const all = bros.getAllPersonas();
    expect(all).toHaveLength(4);
    const ids = all.map(p => p.id);
    expect(ids).toContain('wj');
    expect(ids).toContain('sj');
    expect(ids).toContain('cj');
    expect(ids).toContain('wij');
  });

  it('switches persona and emits event', () => {
    const bros = new BrosPhase();
    bros.activate();
    expect(bros.getCurrentPersona()).toBe('wj');

    bros.switchPersona('sj');
    expect(bros.getCurrentPersona()).toBe('sj');
    expect(bros.getSwitchHistory().length).toBe(1);
    expect(bros.getSwitchHistory()[0].from).toBe('wj');
    expect(bros.getSwitchHistory()[0].to).toBe('sj');
  });

  it('retrieves persona config by ID', () => {
    const bros = new BrosPhase();
    const wj = bros.getPersonaConfig('wj');
    expect(wj).toBeDefined();
    expect(wj?.name).toBe('W.J.');
    expect(wj?.mode).toBe('operator');
  });

  it('registers a custom persona', () => {
    const bros = new BrosPhase();
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

    const all = bros.getAllPersonas();
    expect(all).toHaveLength(5);
    const custom = bros.getPersonaConfig('custom_bot');
    expect(custom?.name).toBe('Custom Bot');
  });

  it('unregisters a persona', () => {
    const bros = new BrosPhase();
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
    expect(bros.getAllPersonas()).toHaveLength(5);

    const removed = bros.unregisterPersona('temp');
    expect(removed).toBe(true);
    expect(bros.getAllPersonas()).toHaveLength(4);
  });

  it('skips duplicate persona registration', () => {
    const bros = new BrosPhase();
    bros.registerPersona('sj', {
      name: 'Duplicate S.J.',
      mode: 'youth',
      color: 'pink',
      icon: '🎮',
      description: 'Should not replace',
      features: [],
      voiceTrigger: [],
      uiDensity: 'medium'
    });
    const all = bros.getAllPersonas();
    expect(all).toHaveLength(4);
    expect(bros.getPersonaConfig('sj')?.name).toBe('S.J.');
  });

  it('loads personas from CogPass-style data', () => {
    const bros = new BrosPhase();
    bros.loadFromCogPass([
      { id: 'dr_chen', name: 'Dr. Chen', mode: 'guardian', color: 'teal', features: ['voice', 'visual'] },
      { id: 'tutor_marco', name: 'Marco', mode: 'operator', color: 'indigo', features: ['voice'] }
    ]);

    const all = bros.getAllPersonas();
    expect(all).toHaveLength(6);
    expect(bros.getPersonaConfig('dr_chen')?.name).toBe('Dr. Chen');
    expect(bros.getPersonaConfig('tutor_marco')?.mode).toBe('operator');
  });

  it('ignores CogPass personas with duplicate IDs', () => {
    const bros = new BrosPhase();
    const before = bros.getAllPersonas().length;
    bros.loadFromCogPass([
      { id: 'wj', name: 'Hacked WJ', mode: 'child', color: 'red' }
    ]);
    expect(bros.getAllPersonas()).toHaveLength(before);
    expect(bros.getPersonaConfig('wj')?.name).toBe('W.J.');
  });

  it('reports state with correct metrics', () => {
    const bros = new BrosPhase();
    bros.activate();
    bros.switchPersona('cj');
    const state = bros.getState();
    expect(state.status).toBe('active');
    expect(state.metrics.personaSwitchCount).toBe(1);
  });

  it('matches voice triggers for all personas', () => {
    const bros = new BrosPhase();
    expect(bros.matchVoiceTrigger('switch to S.J. mode')).toBe('sj');
    expect(bros.matchVoiceTrigger('switch to guardian mode')).toBe('cj');
    expect(bros.matchVoiceTrigger('switch to kid mode')).toBe('wij');
    expect(bros.matchVoiceTrigger('switch to operator mode')).toBe('wj');
  });
});
