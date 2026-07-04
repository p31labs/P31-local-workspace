// spaceship-earth/src/utils/fawnPatterns.ts
// Unified fawn guard ruleset — canonical patterns across all P31 implementations
// Consolidates: BufferRoom (12 rules), Discord bot (8 patterns), firmware (hardware trigger)

export interface FawnFlag {
  pattern: string;
  category: 'apologizing' | 'minimizing' | 'over-agreeing' | 'seeking-validation' | 'self-erasing' | 'self-deprecation' | 'over-explaining' | 'defensive';
  guidance: string;
  weight: number;
}

export interface FawnResult {
  flags: FawnFlag[];
  matchCount: number;
  score: number;
  suggestion?: string;
}

/**
 * Canonical fawn pattern ruleset.
 * Union of BufferRoom (12 rules) + Discord bot (8 patterns) + self-deprecation/defensive additions.
 * 20 unique patterns across 8 categories.
 */
export const FAWN_RULES: { re: RegExp; flag: FawnFlag }[] = [
  // ── Apologizing ──
  { re: /\bi'?m sorry\b/gi, flag: { pattern: "I'm sorry", category: 'apologizing', guidance: "Is this your fault? If not, you don't owe an apology.", weight: 0.3 } },
  { re: /\bsorry (to bother|for asking|sorry)\b/gi, flag: { pattern: 'sorry to bother', category: 'apologizing', guidance: 'Your needs are not a bother.', weight: 0.25 } },
  { re: /\bsrry|srs\b/gi, flag: { pattern: 'srry/srs', category: 'apologizing', guidance: 'Casual apology is still apology. Check if it\'s warranted.', weight: 0.2 } },

  // ── Minimizing ──
  { re: /\bjust\b/gi, flag: { pattern: 'just', category: 'minimizing', guidance: '"Just" minimizes your request. Your needs aren\'t small.', weight: 0.12 } },
  { re: /\bit'?s probably nothing\b/gi, flag: { pattern: "it's probably nothing", category: 'minimizing', guidance: 'If it matters enough to mention, it matters.', weight: 0.25 } },
  { re: /\bi'?m probably overreacting\b/gi, flag: { pattern: "I'm probably overreacting", category: 'minimizing', guidance: 'Your reaction is valid. Trust your response.', weight: 0.25 } },
  { re: /\bit'?s not a big deal\b/gi, flag: { pattern: "it's not a big deal", category: 'minimizing', guidance: 'If it\'s worth saying, it\'s a deal.', weight: 0.2 } },

  // ── Self-erasing ──
  { re: /\bit'?s fine\b/gi, flag: { pattern: "it's fine", category: 'self-erasing', guidance: 'Is it actually fine, or are you suppressing a boundary?', weight: 0.2 } },
  { re: /\bno worries\b/gi, flag: { pattern: 'no worries', category: 'self-erasing', guidance: 'If there ARE worries, name them.', weight: 0.15 } },
  { re: /\bi don'?t mind\b/gi, flag: { pattern: "I don't mind", category: 'self-erasing', guidance: 'Do you mind? Check before answering.', weight: 0.2 } },
  { re: /\bwhatever you (want|need|think)\b/gi, flag: { pattern: 'whatever you...', category: 'self-erasing', guidance: 'What do YOU want? State it.', weight: 0.2 } },
  { re: /\bi don'?t want to (bother|burden|trouble)\b/gi, flag: { pattern: "I don't want to bother", category: 'self-erasing', guidance: 'Your needs are not a burden.', weight: 0.25 } },

  // ── Seeking validation ──
  { re: /\bdoes that make sense\b/gi, flag: { pattern: 'does that make sense?', category: 'seeking-validation', guidance: 'You made sense. Trust your communication.', weight: 0.2 } },
  { re: /\bi (hope|think|feel like) (that'?s?|it'?s?|this is) ok/gi, flag: { pattern: "I hope that's ok", category: 'seeking-validation', guidance: "You don't need permission for your truth.", weight: 0.2 } },
  { re: /\bif that'?s? ok\b/gi, flag: { pattern: "if that's ok", category: 'seeking-validation', guidance: "State your need. Don't pre-apologize for having one.", weight: 0.2 } },
  { re: /\?{2,}/g, flag: { pattern: '??', category: 'seeking-validation', guidance: 'One question mark is enough. Your point is valid.', weight: 0.15 } },
  { re: /\blet me know if that'?s? okay\b/gi, flag: { pattern: "let me know if that's okay", category: 'seeking-validation', guidance: 'State your position. Don\'t outsource validation.', weight: 0.2 } },
  { re: /\bi hope that'?s? fine\b/gi, flag: { pattern: "I hope that's fine", category: 'seeking-validation', guidance: 'Your needs are valid without caveats.', weight: 0.2 } },

  // ── Over-agreeing ──
  { re: /\btotally\b/gi, flag: { pattern: 'totally', category: 'over-agreeing', guidance: 'Do you actually fully agree, or are you performing agreement?', weight: 0.1 } },
  { re: /!{2,}/g, flag: { pattern: '!!', category: 'over-agreeing', guidance: 'Excessive exclamation can mask real feelings.', weight: 0.1 } },

  // ── Self-deprecation ──
  { re: /\bi'?m (bad|terrible|awful|useless|stupid|dumb)\b/gi, flag: { pattern: "I'm [negative]", category: 'self-deprecation', guidance: 'Your self-talk matters. Would you speak to a friend this way?', weight: 0.35 } },

  // ── Over-explaining ──
  { re: /\bi know i might be wrong\b/gi, flag: { pattern: "I know I might be wrong", category: 'over-explaining', guidance: 'You don\'t need to pre-qualify every statement.', weight: 0.25 } },
  { re: /\bi'?m not sure but\b/gi, flag: { pattern: "I'm not sure but", category: 'over-explaining', guidance: 'State your thought. Uncertainty is implied.', weight: 0.2 } },
  { re: /\bi'?m just saying\b/gi, flag: { pattern: "I'm just saying", category: 'over-explaining', guidance: 'Your words matter. Don\'t diminish them.', weight: 0.15 } },

  // ── Defensive ──
  { re: /\bi didn'?t mean\b/gi, flag: { pattern: "I didn't mean", category: 'defensive', guidance: 'State what you DID mean instead.', weight: 0.2 } },
  { re: /\bdon'?t get me wrong\b/gi, flag: { pattern: "don't get me wrong", category: 'defensive', guidance: 'Clarify your position without the defensive frame.', weight: 0.2 } },
  { re: /\bthat wasn'?t my intent\b/gi, flag: { pattern: "that wasn't my intent", category: 'defensive', guidance: 'Focus on impact, not intent.', weight: 0.2 } },
];

/**
 * Analyze text for fawn patterns.
 * Returns matched flags, match count, and composite score (0-1).
 */
export function analyzeFawn(text: string): FawnResult {
  const seen = new Map<string, FawnFlag>();
  let matchCount = 0;

  for (const { re, flag } of FAWN_RULES) {
    re.lastIndex = 0;
    while (re.exec(text) !== null) {
      matchCount++;
      if (!seen.has(flag.pattern)) seen.set(flag.pattern, flag);
    }
  }

  const flags = [...seen.values()];
  const categories = new Set(flags.map(f => f.category));
  const score = Math.min(1, matchCount * 0.12 + categories.size * 0.1);

  // Generate suggestion from highest-weighted pattern
  const suggestion = flags.length > 0
    ? flags.reduce((a, b) => a.weight > b.weight ? a : b).guidance
    : undefined;

  return { flags, matchCount, score, suggestion };
}
