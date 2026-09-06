import { telemetry } from './telemetryClient';

const FAWN_PATTERNS = [
  { id: 'over_apology', regex: /\b(I'm so sorry|sorry if this is|so sorry to bother)\b/gi },
  { id: 'permission_pleading', regex: /\b(if it's okay|is it okay if|would you mind if)\b/gi },
  { id: 'self_diminishing', regex: /\b(I just thought|I'm probably wrong but|stupid question but)\b/gi },
  { id: 'excessive_validation', regex: /\b(does that make sense|let me know if I'm crazy)\b/gi },
];

export interface FawnAnalysis {
  triggered: boolean;
  score: number;
  matches: string[];
}

export class FawnGuard {
  public static analyze(text: string): FawnAnalysis {
    let score = 0;
    const matches: string[] = [];

    FAWN_PATTERNS.forEach(pattern => {
      const found = text.match(pattern.regex);
      if (found) {
        score += found.length;
        matches.push(pattern.id);
      }
    });

    const triggered = score > 0;

    if (triggered) {
      telemetry.log({
        eventType: 'fawn_guard_trigger',
        payload: {
          score,
          patterns_matched: matches,
          timestamp: new Date().toISOString()
        }
      });
    }

    return { triggered, score, matches };
  }

  public static neutralize(text: string): string {
    let cleanText = text;
    cleanText = cleanText.replace(/\bI just thought\b/gi, 'I noted');
    cleanText = cleanText.replace(/\b(does that make sense\??)\b/gi, 'Let me know your thoughts.');
    return cleanText;
  }
}