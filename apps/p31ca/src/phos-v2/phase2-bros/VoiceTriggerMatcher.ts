export interface VoiceTriggerMatch {
  personaId: string;
  confidence: number;
  matchedTrigger: string;
  phoneticScore: number;
  recencyScore: number;
}

export interface VoiceTriggerMatcherOptions {
  fuzzyThreshold?: number;
  phoneticWeight?: number;
  recencyWeight?: number;
  recencyDecayMs?: number;
}

export interface TriggerStats {
  lastMatchedAt: number;
  matchCount: number;
}

export class VoiceTriggerMatcher {
  private fuzzyThreshold: number;
  private phoneticWeight: number;
  private recencyWeight: number;
  private recencyDecayMs: number;
  private triggerStats: Map<string, TriggerStats> = new Map();

  constructor(options: VoiceTriggerMatcherOptions = {}) {
    this.fuzzyThreshold = options.fuzzyThreshold ?? 0.4;
    this.phoneticWeight = options.phoneticWeight ?? 0.3;
    this.recencyWeight = options.recencyWeight ?? 0.3;
    this.recencyDecayMs = options.recencyDecayMs ?? 3600000;
  }

  match(text: string, triggers: Array<{ personaId: string; trigger: string }>): VoiceTriggerMatch[] {
    const normalized = text.toLowerCase().trim();
    const results: VoiceTriggerMatch[] = [];

    for (const { personaId, trigger } of triggers) {
      const tl = trigger.toLowerCase();
      const exact = this.exactMatchScore(normalized, tl);
      const fuzzy = this.fuzzyMatchScore(normalized, tl);
      const phonetic = this.phoneticHintScore(normalized, tl);
      const recency = this.recencyScore(personaId);

      const confidence = Math.max(0, Math.min(1,
        exact * 0.5 + fuzzy * 0.5 +
        this.phoneticWeight * phonetic +
        this.recencyWeight * recency
      ));

      if (confidence >= this.fuzzyThreshold) {
        results.push({
          personaId,
          confidence,
          matchedTrigger: trigger,
          phoneticScore: phonetic,
          recencyScore: recency
        });
      }
    }

    results.sort((a, b) => b.confidence - a.confidence);
    return results;
  }

  bestMatch(text: string, triggers: Array<{ personaId: string; trigger: string }>): VoiceTriggerMatch | null {
    const results = this.match(text, triggers);
    return results.length > 0 ? results[0] : null;
  }

  recordMatch(personaId: string): void {
    const now = Date.now();
    const existing = this.triggerStats.get(personaId);
    if (existing) {
      existing.lastMatchedAt = now;
      existing.matchCount++;
    } else {
      this.triggerStats.set(personaId, { lastMatchedAt: now, matchCount: 1 });
    }
  }

  reset(): void {
    this.triggerStats.clear();
  }

  private exactMatchScore(text: string, trigger: string): number {
    if (text === trigger) return 1.0;
    if (text.startsWith(trigger)) return 0.9;
    const idx = text.indexOf(trigger);
    if (idx !== -1) {
      return 0.7 + (trigger.length / text.length) * 0.2;
    }
    return 0;
  }

  private fuzzyMatchScore(text: string, trigger: string): number {
    if (trigger.length === 0) return 0;
    const matrix: number[][] = Array.from({ length: trigger.length + 1 }, () =>
      new Array(text.length + 1).fill(0)
    );
    for (let i = 0; i <= trigger.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= text.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= trigger.length; i++) {
      for (let j = 1; j <= text.length; j++) {
        const cost = text[j - 1] === trigger[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[trigger.length][text.length];
    const maxDist = Math.max(trigger.length, text.length);
    return Math.max(0, 1 - distance / maxDist);
  }

  private phoneticHintScore(text: string, trigger: string): number {
    const textChars = text.replace(/[^a-z0-9]/g, '');
    const triggerChars = trigger.replace(/[^a-z0-9]/g, '');
    if (textChars.length === 0 || triggerChars.length === 0) return 0;

    const startMatch = textChars[0] === triggerChars[0] ? 0.3 : 0;
    const shorter = Math.min(textChars.length, triggerChars.length);
    const longer = Math.max(textChars.length, triggerChars.length);
    const contained = textChars.includes(triggerChars) || triggerChars.includes(textChars) ? 0.5 : 0;
    const lengthRatio = shorter / longer;

    return Math.min(1, startMatch + contained + lengthRatio * 0.2);
  }

  private recencyScore(personaId: string): number {
    const stats = this.triggerStats.get(personaId);
    if (!stats) return 0;
    const age = Date.now() - stats.lastMatchedAt;
    const decay = Math.exp(-age / this.recencyDecayMs);
    return decay;
  }
}

export const DEFAULT_VOICE_TRIGGER_OPTIONS: VoiceTriggerMatcherOptions = {
  fuzzyThreshold: 0.4,
  phoneticWeight: 0.3,
  recencyWeight: 0.3,
  recencyDecayMs: 3600000
};
