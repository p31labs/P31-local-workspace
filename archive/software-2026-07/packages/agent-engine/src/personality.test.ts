import { describe, it, expect, beforeEach } from 'vitest';
import { PersonalityEngine } from './personality';

describe('PersonalityEngine', () => {
  let engine: PersonalityEngine;

  beforeEach(() => {
    engine = new PersonalityEngine();
  });

  it('creates default personality values', () => {
    const p = engine.getPersonality();
    expect(p.extraversion).toBe(50);
    expect(p.neurodiversityAwareness).toBe(80);
    expect(p.spoonSensitivity).toBe(75);
    expect(p.communicationStyle).toBe('friendly');
    expect(p.currentMood.type).toBe('calm');
  });

  it('merges custom partial personality', () => {
    const custom = new PersonalityEngine({ empathy: 90, communicationStyle: 'technical' });
    const p = custom.getPersonality();
    expect(p.empathy).toBe(90);
    expect(p.communicationStyle).toBe('technical');
    // unset traits remain defaults
    expect(p.extraversion).toBe(50);
  });

  it('updates a trait with bounded clamping', () => {
    engine.updatePersonality({ trait: 'empathy', value: 100, intensity: 100, context: 'max out' });
    const p = engine.getPersonality();
    expect(p.empathy).toBeLessThanOrEqual(100);
    expect(p.empathy).toBeGreaterThanOrEqual(0);
  });

  it('returns non-empty personality summary', () => {
    const s = engine.getPersonalitySummary();
    expect(s.currentMood).toBe('calm');
    expect(s.interactionCount).toBe(0);
  });

  it('changes mood based on explicit userMood', () => {
    const mood = engine.processUserInput('anything', 'happy');
    expect(mood.type).toBe('happy');
  });

  it('detects moods from text input', () => {
    expect(engine.processUserInput('I feel sad').type).toBe('sad');
    expect(engine.processUserInput('I am furious!').type).toBe('angry');
    expect(engine.processUserInput('So excited!!').type).toBe('excited');
    expect(engine.processUserInput('Tired and drained').type).toBe('tired');
  });

  it('returns a response style', () => {
    const style = engine.getResponseStyle();
    expect(['calm','enthusiastic','gentle','professional','warm','precise','expressive','concise','neutral']).toContain(style.tone);
    expect(style.empathyLevel).toBeGreaterThanOrEqual(0);
    expect(style.empathyLevel).toBeLessThanOrEqual(100);
  });

  it('generates a non-empty response', () => {
    const res = engine.generateResponse('Help', {
      conversationHistory: [],
      userPreferences: { communicationStyle: 'friendly', technicalLevel: 50, responseLength: 'medium', empathyNeeds: true },
      currentTask: 'general_conversation',
    });
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(0);
  });
});
