/**
 * @file fawn.ts — Fawn-Guard: detect fawning / over-apologetic language.
 *
 * A lightweight signal-safety guard that flags over-apology, self-diminishing,
 * and permission-seeking phrasing before it is surfaced to the user. All
 * warnings are XSS-escaped.
 */

export interface FawnPattern {
  id: string;
  label: string;
  severity: 'mild' | 'moderate' | 'severe';
  pattern: RegExp;
}

export interface FawnAnalysis {
  triggered: boolean;
  matches: string[];
}

export const FAWN_PATTERNS: readonly FawnPattern[] = [
  {
    id: 'over_apology',
    label: 'Over-apology',
    severity: 'mild',
    pattern: /(?:i'?m|i am) (?:so |very |really )?sorry|(?:so|very|really) sorry|\bsorry\b|sorry for (?:bothering|being a burden)/i,
  },
  {
    id: 'self_diminishing',
    label: 'Self-diminishing',
    severity: 'moderate',
    pattern: /i(?:'?m| am) (?:probably|maybe) wrong|just thought (?:maybe )?i (?:was|am) wrong|i always mess (?:up|everything)/i,
  },
  {
    id: 'permission_seeking',
    label: 'Permission-seeking',
    severity: 'severe',
    pattern: /is it (?:ok|okay|fine|alright) if/i,
  },
] as const;

const MAX_LENGTH = 14000;

const severityLevel: Record<FawnPattern['severity'], number> = { mild: 1, moderate: 2, severe: 3 };

const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function analyze(text: unknown): FawnAnalysis {
  if (typeof text !== 'string' || text.length === 0) return { triggered: false, matches: [] };
  const matches: string[] = [];
  for (const p of FAWN_PATTERNS) {
    if (p.pattern.test(text)) matches.push(p.id);
  }
  return { triggered: matches.length > 0, matches };
}

/** Crash-safe variant: non-strings and over-long input return "safe". */
export function safeAnalyze(text: unknown): FawnAnalysis {
  if (typeof text !== 'string' || text.length > MAX_LENGTH) return { triggered: false, matches: [] };
  return analyze(text);
}

/** Human-facing warning with XSS-escaped snippet. Empty string when safe. */
export function getWarning(text: unknown): string {
  const analysis = safeAnalyze(text);
  if (!analysis.triggered || typeof text !== 'string') return '';
  const snippet = text.length > 160 ? `${text.slice(0, 160)}…` : text;
  return `Fawn language detected — reconsider phrasing: “${esc(snippet)}”`;
}

export class FawnGuard {
  static isSafe(text: unknown): boolean {
    return !analyze(text).triggered;
  }

  /** Gate a signal against a coherence-derived threshold severity. */
  static gate(text: unknown, threshold: FawnPattern['severity']): { triggered: boolean } {
    const analysis = analyze(text);
    if (!analysis.triggered) return { triggered: false };
    const maxSeverity = FAWN_PATTERNS.filter((p) => analysis.matches.includes(p.id)).reduce(
      (max, p) => Math.max(max, severityLevel[p.severity]),
      0,
    );
    return { triggered: maxSeverity >= severityLevel[threshold] };
  }
}
