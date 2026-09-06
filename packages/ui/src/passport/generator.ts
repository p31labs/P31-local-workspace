/**
 * @file generator — sovereign, client-side "AI assist" for the Cognitive
 * Passport. No network, no LLM. Maps onboarding answers to template fragments
 * and produces a coherent oneLiner + curated strengths/challenges. The user
 * can edit everything before finalizing.
 */

import type { CognitivePassport, PassportAccessibility, Role } from './schema';

export interface OnboardingInput {
  displayName?: string;
  pronouns?: string;
  role?: Role;
  oneLiner?: string;
  processingStyle?: string;
  learningPreference?: 'visual' | 'kinetic' | 'text' | 'audio' | 'multimodal';
  executiveFunctionNotes?: string;
  strengths?: string[];
  challenges?: string[];
  preferredTone?: 'direct' | 'gentle' | 'analytical' | 'casual' | 'formal';
  avoidList?: string[];
  languagePrimary?: string;
  accessibility?: Partial<PassportAccessibility>;
}

const STRENGTH_PHRASES: Record<string, string[]> = {
  pattern: ['spots patterns others miss', 'connects distant ideas'],
  focus: ['falls into deep, rewarding focus', 'sustains attention on loved topics'],
  memory: ['holds rich detailed memories', 'recalls sensory detail vividly'],
  empathy: ['reads the room with precision', 'cares deeply and loudly'],
  creativity: ['builds strange beautiful things', 'thinks in images and systems'],
  logic: ['reasons from first principles', 'loves a clean proof'],
  honesty: ['says the true thing', 'refuses to perform'],
  stamina: ['powers through when it matters', 'protects the people they love'],
};

const CHALLENGE_PHRASES: Record<string, string[]> = {
  initiation: ['starting the first step is the hardest part', 'task initiation needs scaffolding'],
  switching: ['context switches cost real energy', 'needs a runway to change tracks'],
  memory: ['working memory drops under load', 'needs external notes to offload'],
  sensory: ['bright or loud environments drain fast', 'sensory load must be managed'],
  social: ['unwritten social rules are exhausting', 'needs explicit expectations'],
  executive: ['plans fall apart without structure', 'needs checklists and timers'],
  rejection: ['rejection sensitivity runs hot', 'needs warmth, not correction'],
};

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}

/** Build a one-sentence function statement from onboarding input. */
export function generateOneLiner(input: OnboardingInput): string {
  const name = input.displayName?.trim() || 'I';
  const role = input.role ? `a ${input.role.replace(/_/g, ' ').toLowerCase()}` : 'an operator';
  const topStrength = input.strengths?.[0];
  const topChallenge = input.challenges?.[0];

  let sentence = `${name} is ${role} who `;
  if (topStrength && STRENGTH_PHRASES[topStrength]) {
    sentence += pick(STRENGTH_PHRASES[topStrength], hash(name));
  } else {
    sentence += 'shows up exactly as they are';
  }
  if (topChallenge && CHALLENGE_PHRASES[topChallenge]) {
    sentence += `, and asks the world to ${pick(CHALLENGE_PHRASES[topChallenge], hash(name) + 7)}.`;
  } else {
    sentence += '.';
  }
  return sentence.slice(0, 128);
}

/** Curate strengths/challenges into human-readable phrases. */
export function generateStrengths(strengths?: string[]): string[] {
  if (!strengths?.length) return [];
  return strengths.flatMap((s) => (STRENGTH_PHRASES[s] ? [pick(STRENGTH_PHRASES[s], hash(s))] : [s])).slice(0, 6);
}

export function generateChallenges(challenges?: string[]): string[] {
  if (!challenges?.length) return [];
  return challenges.flatMap((c) => (CHALLENGE_PHRASES[c] ? [pick(CHALLENGE_PHRASES[c], hash(c) + 3)] : [c])).slice(0, 6);
}

const DEFAULT_ACCESSIBILITY: PassportAccessibility = {
  screenComfort: 60,
  motionPreference: 'reduced',
  contrastPreference: 'high',
  fontSize: 16,
  density: 40,
};

/**
 * Produce a complete CognitivePassport draft from onboarding input.
 * Identity (keys) is attached separately by the store. This is the content.
 */
export function generatePassportDraft(input: OnboardingInput): Omit<CognitivePassport, 'did' | 'publicKey'> {
  const oneLiner = input.oneLiner || generateOneLiner(input);
  const now = new Date().toISOString();
  return {
    identity: {
      displayName: input.displayName,
      pronouns: input.pronouns,
      role: input.role,
      oneLiner,
    },
    cognition: {
      processingStyle: input.processingStyle,
      learningPreference: input.learningPreference,
      executiveFunctionNotes: input.executiveFunctionNotes,
      strengths: generateStrengths(input.strengths),
      challenges: generateChallenges(input.challenges),
    },
    communication: {
      preferredTone: input.preferredTone,
      avoidList: input.avoidList,
      languagePrimary: input.languagePrimary,
      responseLength: 'bullet-points',
    },
    accessibility: { ...DEFAULT_ACCESSIBILITY, ...(input.accessibility || {}) },
    baselineSpoons: 3,
    created: now,
    updated: now,
  };
}
