import { describe, it, expect } from 'vitest';
import { AgentIdentitySchema, PersonalityMatrixSchema, AgentProfileSchema } from './types';
import { z } from 'zod';

describe('types / zod schemas', () => {
  it('AgentIdentitySchema accepts valid input with Date fields', () => {
    const now = new Date();
    const data = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'A',
      displayName: 'A',
      description: '',
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
    };
    const parsed = AgentIdentitySchema.parse(data);
    expect(parsed.id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('rejects non-uuid id', () => {
    expect(() => AgentIdentitySchema.parse({ id: 'bad', name: 'A', displayName: 'A', description: '', createdAt: new Date(), updatedAt: new Date(), version: '1.0.0' })).toThrow();
  });

  it('PersonalityMatrixSchema accepts full valid input', () => {
    const parsed = PersonalityMatrixSchema.parse({
      extraversion: 50, neuroticism: 30, openness: 70, agreeableness: 60, conscientiousness: 65,
      neurodiversityAwareness: 80, spoonSensitivity: 75, technicalAptitude: 70, creativity: 85, empathy: 75,
      learningRate: 50, adaptationSpeed: 40, emotionalRegulation: 60,
      communicationStyle: 'friendly',
      currentMood: { type: 'calm', intensity: 50, duration: 300000, timestamp: new Date() },
      moodTriggers: [], moodModifiers: [],
    });
    expect(parsed.empathy).toBe(75);
  });

  it('AgentProfileSchema rejects missing identity', () => {
    expect(() => AgentProfileSchema.parse({})).toThrow();
  });

  it('re-exports contain expected keys', () => {
    expect(typeof AgentIdentitySchema.parse).toBe('function');
    expect(typeof PersonalityMatrixSchema.parse).toBe('function');
    expect(typeof AgentProfileSchema.parse).toBe('function');
  });
});
