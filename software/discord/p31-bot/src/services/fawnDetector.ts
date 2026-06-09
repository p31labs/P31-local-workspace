/**
 * P31 Fawn Detector — Discord Bot
 * Unified ruleset matching spaceship-earth/src/utils/fawnPatterns.ts
 * Source of truth: 28 patterns across 8 categories
 *
 * The canonical version lives in BufferRoom's shared module.
 * This copy is kept in sync manually.
 */

export interface FawnAnalysisResult {
  isFawning: boolean;
  confidence: number;
  patterns: string[];
  suggestion?: string;
}

export interface FawnPattern {
  name: string;
  regex: RegExp;
  weight: number;
  category: string;
}

const FAWN_PATTERNS: FawnPattern[] = [
  // ── Apologizing ──
  { name: 'excessive_apology', regex: /i'm sorry|i am sorry|sorry sorry|srry|srs/i, weight: 0.3, category: 'apologizing' },
  { name: 'sorry_to_bother', regex: /sorry (to bother|for asking|sorry)/i, weight: 0.25, category: 'apologizing' },

  // ── Minimizing ──
  { name: 'minimizing_just', regex: /\bjust\b/i, weight: 0.12, category: 'minimizing' },
  { name: 'minimizing_nothing', regex: /it's probably nothing/i, weight: 0.25, category: 'minimizing' },
  { name: 'minimizing_overreacting', regex: /i'm probably overreacting/i, weight: 0.25, category: 'minimizing' },
  { name: 'minimizing_big_deal', regex: /it's not a big deal/i, weight: 0.2, category: 'minimizing' },

  // ── Self-erasing ──
  { name: 'self_erasing_fine', regex: /it's fine/i, weight: 0.2, category: 'self-erasing' },
  { name: 'self_erasing_no_worries', regex: /no worries/i, weight: 0.15, category: 'self-erasing' },
  { name: 'self_erasing_dont_mind', regex: /i don't mind/i, weight: 0.2, category: 'self-erasing' },
  { name: 'self_erasing_whatever', regex: /whatever you (want|need|think)/i, weight: 0.2, category: 'self-erasing' },
  { name: 'self_erasing_burden', regex: /i don't want to (bother|burden|trouble)/i, weight: 0.25, category: 'self-erasing' },

  // ── Seeking validation ──
  { name: 'seeking_validation_makes_sense', regex: /does that make sense/i, weight: 0.2, category: 'seeking-validation' },
  { name: 'seeking_validation_hope_ok', regex: /i (hope|think|feel like) (that's?|it's?|this is) ok/i, weight: 0.2, category: 'seeking-validation' },
  { name: 'seeking_validation_if_ok', regex: /if that's? ok/i, weight: 0.2, category: 'seeking-validation' },
  { name: 'seeking_validation_double_q', regex: /\?{2,}/, weight: 0.15, category: 'seeking-validation' },
  { name: 'seeking_validation_let_me_know', regex: /let me know if that's? okay/i, weight: 0.2, category: 'seeking-validation' },
  { name: 'seeking_validation_hope_fine', regex: /i hope that's? fine/i, weight: 0.2, category: 'seeking-validation' },

  // ── Over-agreeing ──
  { name: 'over_agreeing_totally', regex: /\btotally\b/i, weight: 0.1, category: 'over-agreeing' },
  { name: 'over_agreeing_bangs', regex: /!{2,}/, weight: 0.1, category: 'over-agreeing' },

  // ── Self-deprecation ──
  { name: 'self_deprecation', regex: /i'm (bad|terrible|awful|useless|stupid|dumb)/i, weight: 0.35, category: 'self-deprecation' },

  // ── Over-explaining ──
  { name: 'over_explaining_might_be_wrong', regex: /i know i might be wrong/i, weight: 0.25, category: 'over-explaining' },
  { name: 'over_explaining_not_sure', regex: /i'm not sure but/i, weight: 0.2, category: 'over-explaining' },
  { name: 'over_explaining_just_saying', regex: /i'm just saying/i, weight: 0.15, category: 'over-explaining' },
  { name: 'over_explaining_paragraphs', regex: /^(?:[^\n]*(?:\n|$)){3,}/, weight: 0.2, category: 'over-explaining' },

  // ── Defensive ──
  { name: 'defensive_didnt_mean', regex: /i didn't mean/i, weight: 0.2, category: 'defensive' },
  { name: 'defensive_dont_get_wrong', regex: /don't get me wrong/i, weight: 0.2, category: 'defensive' },
  { name: 'defensive_wasnt_intent', regex: /that wasn't my intent/i, weight: 0.2, category: 'defensive' },
  { name: 'defensive_qualification', regex: /i know i might be wrong|i'm not sure but|i'm probably overthinking|i'm just saying/i, weight: 0.25, category: 'defensive' },
];

class FawnDetector {
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  public analyze(text: string): FawnAnalysisResult {
    if (!this.enabled || !text || text.trim().length === 0) {
      return { isFawning: false, confidence: 0, patterns: [] };
    }

    const matchedPatterns: string[] = [];
    let totalWeight = 0;

    for (const pattern of FAWN_PATTERNS) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(text)) {
        matchedPatterns.push(pattern.name);
        totalWeight += pattern.weight;
      }
    }

    const confidence = Math.min(totalWeight, 1);
    const suggestion = this.generateSuggestion(matchedPatterns);

    return {
      isFawning: confidence > 0.3,
      confidence,
      patterns: matchedPatterns,
      suggestion,
    };
  }

  private generateSuggestion(patterns: string[]): string | undefined {
    if (patterns.length === 0) return undefined;

    if (patterns.includes('excessive_apology') || patterns.includes('sorry_to_bother')) {
      return "You don't need to apologize. Your perspective is valid.";
    }
    if (patterns.includes('self_deprecation')) {
      return "Your self-talk matters. Would you speak to a friend this way?";
    }
    if (patterns.includes('over_explaining_paragraphs') || patterns.includes('over_explaining_just_saying')) {
      return "Sometimes less is more. The core point matters most.";
    }
    if (patterns.includes('minimizing_nothing') || patterns.includes('minimizing_big_deal')) {
      return "Your feelings are valid. They don't need to be minimized.";
    }
    if (patterns.includes('seeking_validation_double_q') || patterns.includes('seeking_validation_makes_sense')) {
      return "One question mark is enough. Your point is valid as stated.";
    }
    if (patterns.includes('self_erasing_burden')) {
      return "Your needs are not a burden.";
    }

    return "Consider checking in with your authentic voice.";
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}

export default FawnDetector;
export { FawnDetector, FAWN_PATTERNS };
