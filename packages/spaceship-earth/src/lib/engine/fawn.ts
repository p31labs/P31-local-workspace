/**
 * @file fawn.ts — FawnGuard: detect fawn response patterns in text
 * 
 * Hardened with:
 * - Input sanitization (null/undefined, trimming, max length)
 * - Caching for repeated analyses
 * - Case‑insensitive matching option
 * - XSS‑safe warning output
 */

export interface FawnPattern {
  id: string;
  regex: RegExp;
  category: 'apology' | 'pleading' | 'diminishing' | 'self-effacing';
}

export const FAWN_PATTERNS: FawnPattern[] = [
  { id: 'over_apology', category: 'apology', regex: /\b(I'm so sorry|sorry if this is|so sorry to bother|sorry to bother you)\b/gi },
  { id: 'permission_pleading', category: 'pleading', regex: /\b(if it's okay|is it okay if|would you mind if|can i ask)\b/gi },
  { id: 'self_diminishing', category: 'diminishing', regex: /\b(I just thought|I'm probably wrong but|stupid question but|just wanted to say)\b/gi },
  { id: 'humble_brag', category: 'self-effacing', regex: /\b(I know this might be silly|I don't mean to bother)\b/gi },
  // Additional patterns
  { id: 'sorry_basic', category: 'apology', regex: /\bsorry\b/i },
  { id: 'my_fault', category: 'apology', regex: /\bmy fault\b/i },
  { id: 'apologize', category: 'apology', regex: /\bi apologize\b/i },
  { id: 'you_right', category: 'apology', regex: /\byou're right\b/i },
  { id: 'i_wrong', category: 'apology', regex: /\bi was wrong\b/i },
  { id: 'dont_angry', category: 'pleading', regex: /\bplease don't be angry\b/i },
  { id: 'do_better', category: 'pleading', regex: /\bi'll do better\b/i },
  { id: 'should_have', category: 'self-effacing', regex: /\bi should have known\b/i },
  { id: 'messed_up', category: 'self-effacing', regex: /\bi messed up\b/i },
  { id: 'i_failed', category: 'self-effacing', regex: /\bi failed\b/i },
];

export interface FawnAnalysis {
  triggered: boolean;
  matches: string[];
  severity: 'none' | 'mild' | 'moderate' | 'severe';
}

// LRU cache for repeated analyses
interface CacheEntry {
  result: FawnAnalysis;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_MAX_SIZE = 100;
const CACHE_TTL_MS = 60000;

function normalizeInput(text: string): string {
  if (typeof text !== 'string') return '';
  let normalized = text.trim();
  if (normalized.length > 10000) normalized = normalized.substring(0, 10000);
  return normalized.toLowerCase();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function analyzeInternal(text: string): FawnAnalysis {
  if (text === null || text === undefined || typeof text !== 'string') {
    return { triggered: false, matches: [], severity: 'none' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { triggered: false, matches: [], severity: 'none' };
  }

  const testText = trimmed.toLowerCase();
  const matchedPatterns: string[] = [];
  let severityScore = 0;

  for (const pattern of FAWN_PATTERNS) {
    if (pattern.regex.test(text)) {
      matchedPatterns.push(pattern.id);
      severityScore++;
    }
    pattern.regex.lastIndex = 0;
  }

  let severity: FawnAnalysis['severity'] = 'none';
  if (matchedPatterns.length > 0) {
    if (severityScore >= 3) severity = 'severe';
    else if (severityScore >= 2) severity = 'moderate';
    else severity = 'mild';
  }

  return { triggered: matchedPatterns.length > 0, matches: matchedPatterns, severity };
}

export function analyze(text: string): FawnAnalysis {
  const cacheKey = normalizeInput(text);
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return cached.result;
  }

  const result = analyzeInternal(text);

  if (cache.size >= CACHE_MAX_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(cacheKey, { result, timestamp: now });

  return result;
}

export function safeAnalyze(text: unknown): FawnAnalysis {
  let inputStr = '';
  if (typeof text === 'string') {
    inputStr = text;
  } else if (text !== null && text !== undefined) {
    inputStr = String(text);
  }
  return analyzeInternal(inputStr);
}

export function getWarning(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const result = analyze(text);
  if (!result.triggered) return '';

  const categoryLabels: Record<string, string> = {
    apology: 'Apology detected',
    pleading: 'Permission-seeking detected',
    diminishing: 'Self-diminishing language',
    selfEffacing: 'Self-effacing detected',
  };

  const categories = [...new Set(
    FAWN_PATTERNS
      .filter(p => result.matches.includes(p.id))
      .map(p => p.category)
  )];

  const escapedText = escapeHtml(text);
  return `⚠️ Fawn response: ${categories.map(c => categoryLabels[c]).join(', ')}. Text: "${escapedText.substring(0, 200)}${escapedText.length > 200 ? '…' : ''}"`;
}

export class FawnGuard {
  static analyze = analyze;
  static getWarning = getWarning;
  
  static grayRock(text: string): string {
    let clean = text;
    clean = clean.replace(/\b(I'm so sorry|sorry if this is|so sorry to bother|sorry to bother you)\b/gi, 'Note:');
    clean = clean.replace(/\b(I just thought|I'm probably wrong but|stupid question but)\b/gi, 'I noted');
    clean = clean.replace(/\b(if it's okay|is it okay if|would you mind if)\b/gi, 'Request:');
    clean = clean.replace(/\b(I know this might be silly|I don't mean to bother)\b/gi, 'Observation:');
    return clean;
  }

  static isSafe(text: string): boolean {
    return !this.analyze(text).triggered;
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
      }
    }
  }, 60000);
}