/**
 * Buffer Scoring Engine — P31 Labs
 * Gap E (continuation) — Message scoring for unified Matrix inbox
 *
 * Scores incoming messages on 5 axes, extracts BLUF, classifies intent.
 * Runs as a Matrix appservice interceptor before messages reach the client.
 *
 * Axes:
 *   - Priority (0-100): How urgently does this need attention?
 *   - FawnRisk (0-100): Fawn response patterns (people-pleasing under threat)
 *   - LegalWeight (0-100): Legal significance (deadlines, citations, orders)
 *   - ClarityScore (0-100): How well-structured is the message?
 *   - MedicalRelevance (0-100): Health/calcium/appointment keywords
 */

export interface BufferMessage {
  sender: string;          // Matrix user ID or email address
  subject?: string;        // Email subject or Matrix room name
  body: string;            // Raw message text
  timestamp: number;       // Unix ms
  source: 'matrix' | 'email' | 'sms' | 'signal' | 'whatsapp';
}

export interface BufferScore {
  priority: number;
  fawnRisk: number;
  legalWeight: number;
  clarityScore: number;
  medicalRelevance: number;

  // Derived
  overallScore: number;    // weighted composite
  tier: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'ARCHIVE';

  // Extraction
  bluf: string;            // Bottom Line Up Front (≤80 chars)
  intents: MessageIntent[];
  keywords: string[];

  // Flags
  flags: ScoreFlag[];
}

export type MessageIntent =
  | 'court_deadline'
  | 'medical_alert'
  | 'legal_motion'
  | 'family_coordination'
  | 'financial'
  | 'spam'
  | 'routine'
  | 'crisis';

export type ScoreFlag =
  | 'fawn_detected'
  | 'legal_citation'
  | 'deadline_mentioned'
  | 'calcium_keyword'
  | 'medication_keyword'
  | 'children_mentioned'
  | 'contempt_language'
  | 'threatening_tone';

// ── Keyword banks ─────────────────────────────────────────────────────────

const LEGAL_KEYWORDS = [
  'order', 'motion', 'contempt', 'hearing', 'court', 'judge', 'attorney',
  'counsel', 'filing', 'deadline', 'ocga', 'statute', 'subpoena',
  'deposition', 'discovery', 'injunction', 'custody', 'guardian',
  'peachcourt', 'enotify', 'superior court', 'camden county',
];

const MEDICAL_KEYWORDS = [
  'calcium', 'calcitriol', 'calcium carbonate', 'hypoparathyroid',
  'mg/dl', 'lab result', 'lab value', 'appointment', 'prescription',
  'refill', 'pharmacy', 'uf health', 'shands', 'spasm', 'tetany',
  'parathyroid', 'pth', 'vitamin d', 'calci', 'supplement',
];

const FAWN_PATTERNS = [
  /\bi'?m so sorry\b/i,
  /\bplease don'?t\b/i,
  /\bi understand (if|that)\b/i,
  /\bwhatever you (need|want|decide)\b/i,
  /\bi (just|only) wanted to\b/i,
  /\bi hope (this|that|it'?s) ok\b/i,
  /\bi'?m (not|never) trying to\b/i,
  /\bif you'?re ok with\b/i,
  /\bno worries (if|about)\b/i,
];

const DEADLINE_PATTERNS = [
  /\bby (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\bdue (date|by|on)\b/i,
  /\bdeadline\b/i,
  /\b(48|24|72|12)\s*hours?\b/i,
  /\bimmediately\b/i,
  /\basap\b/i,
  /\bno later than\b/i,
];

const CONTEMPT_PATTERNS = [
  /\bcontempt\b/i,
  /\bwillfully\b/i,
  /\bsanctions?\b/i,
  /\bfailed to comply\b/i,
  /\bviolat(ed|ing|ion)\b/i,
];

// ── Scoring functions ─────────────────────────────────────────────────────

function countKeywordHits(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw)).length;
}

function countPatternHits(text: string, patterns: RegExp[]): number {
  return patterns.filter(p => p.test(text)).length;
}

function scoreLegal(body: string, subject = ''): number {
  const full = `${subject} ${body}`;
  const hits = countKeywordHits(full, LEGAL_KEYWORDS);
  const contemptHits = countPatternHits(full, CONTEMPT_PATTERNS);
  const deadlineHits = countPatternHits(full, DEADLINE_PATTERNS);
  return Math.min(100, hits * 8 + contemptHits * 20 + deadlineHits * 15);
}

function scoreMedical(body: string, subject = ''): number {
  const full = `${subject} ${body}`;
  const hits = countKeywordHits(full, MEDICAL_KEYWORDS);
  return Math.min(100, hits * 12);
}

function scoreFawnRisk(body: string): number {
  const hits = countPatternHits(body, FAWN_PATTERNS);
  // Fawn risk is high when someone is over-apologizing + legal/pressure context present
  const legalContext = countKeywordHits(body, ['court', 'order', 'motion', 'custody']);
  return Math.min(100, hits * 18 + (legalContext > 0 ? 10 : 0));
}

function scoreClarity(body: string): number {
  const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length === 0) return 30;

  // Clarity signals: short sentences, list structure, clear ask
  const avgLen = sentences.reduce((n, s) => n + s.split(' ').length, 0) / sentences.length;
  const hasClearAsk = /\b(please|request|asking|need|require)\b/i.test(body);
  const hasStructure = /\n[-*•\d]/.test(body);

  let score = 50;
  if (avgLen < 20) score += 20;
  if (avgLen > 40) score -= 20;
  if (hasClearAsk) score += 15;
  if (hasStructure) score += 15;

  return Math.min(100, Math.max(0, score));
}

function derivePriority(
  legal: number,
  medical: number,
  subject = '',
  sender = '',
): number {
  let base = Math.max(legal * 0.6, medical * 0.5);

  // Court senders are always high priority
  if (/peachecourt|camdencounty|courts\.ga\.gov|enotify/i.test(sender)) base = Math.max(base, 85);

  // Email subject urgency
  if (/URGENT|CRITICAL|IMMEDIATE|DEADLINE/i.test(subject)) base = Math.max(base, 75);

  return Math.min(100, Math.round(base));
}

function extractBLUF(body: string, intents: MessageIntent[]): string {
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return 'No content';

  // Look for first meaningful sentence
  for (const line of lines.slice(0, 5)) {
    if (line.length >= 20 && line.length <= 120) {
      return line.length > 80 ? line.slice(0, 77) + '…' : line;
    }
  }

  // Fallback: summarize by intent
  if (intents.includes('court_deadline')) return 'Court deadline or filing action required';
  if (intents.includes('medical_alert')) return 'Medical information requires attention';
  if (intents.includes('legal_motion')) return 'Legal motion or order received';

  return lines[0].slice(0, 80);
}

function classifyIntents(
  body: string,
  subject = '',
  sender = '',
  legalScore: number,
  medScore: number,
): MessageIntent[] {
  const intents: MessageIntent[] = [];
  const full = `${subject} ${body}`.toLowerCase();

  if (legalScore > 60 && DEADLINE_PATTERNS.some(p => p.test(full))) intents.push('court_deadline');
  if (medScore > 40) intents.push('medical_alert');
  if (legalScore > 40 && CONTEMPT_PATTERNS.some(p => p.test(full))) intents.push('legal_motion');
  if (/\bwill(ow|iam)?\b|bash|s\.?j\.?|w\.?j\.?|kids?|children/i.test(full)) intents.push('family_coordination');
  if (/\bpayment|invoice|bank|stripe|ko-?fi|donation\b/i.test(full)) intents.push('financial');
  if (legalScore > 60 || medScore > 60) {
    // Already categorized
  } else if (full.length < 50 && !intents.length) {
    intents.push('routine');
  }

  if (!intents.length) intents.push('routine');
  return intents;
}

function extractKeywords(body: string, subject = ''): string[] {
  const full = `${subject} ${body}`;
  const found = new Set<string>();
  for (const kw of [...LEGAL_KEYWORDS, ...MEDICAL_KEYWORDS]) {
    if (full.toLowerCase().includes(kw)) found.add(kw);
  }
  for (const p of DEADLINE_PATTERNS) {
    const m = full.match(p);
    if (m) found.add(m[0].trim().slice(0, 40));
  }
  return [...found].slice(0, 10);
}

function extractFlags(
  body: string,
  subject = '',
  legalScore: number,
  medScore: number,
): ScoreFlag[] {
  const flags: ScoreFlag[] = [];
  const full = `${subject} ${body}`;

  if (scoreFawnRisk(body) > 25) flags.push('fawn_detected');
  if (legalScore > 30 && CONTEMPT_PATTERNS.some(p => p.test(full))) flags.push('contempt_language');
  if (DEADLINE_PATTERNS.some(p => p.test(full))) flags.push('deadline_mentioned');
  if (medScore > 30 && /calcium|ca\b|mg\/dl/i.test(full)) flags.push('calcium_keyword');
  if (medScore > 20 && /calcitriol|supplement|prescription|refill/i.test(full)) flags.push('medication_keyword');
  if (/\bwill(ow|iam)?\b|bash|kids?|children|custody\b/i.test(full)) flags.push('children_mentioned');
  if (CONTEMPT_PATTERNS.some(p => p.test(full))) flags.push('legal_citation');
  if (/\bthreaten|hostile|aggressive|harass\b/i.test(full)) flags.push('threatening_tone');

  return flags;
}

function tierFromPriority(priority: number): BufferScore['tier'] {
  if (priority >= 85) return 'CRITICAL';
  if (priority >= 60) return 'HIGH';
  if (priority >= 35) return 'NORMAL';
  if (priority >= 15) return 'LOW';
  return 'ARCHIVE';
}

// ── Main export ───────────────────────────────────────────────────────────

export function scoreMessage(msg: BufferMessage): BufferScore {
  const { body, subject = '', sender = '', source } = msg;

  const legalScore = scoreLegal(body, subject);
  const medScore = scoreMedical(body, subject);
  const fawnRisk = scoreFawnRisk(body);
  const clarity = scoreClarity(body);
  const priority = derivePriority(legalScore, medScore, subject, sender);

  const intents = classifyIntents(body, subject, sender, legalScore, medScore);
  const keywords = extractKeywords(body, subject);
  const flags = extractFlags(body, subject, legalScore, medScore);
  const bluf = extractBLUF(body, intents);

  // Weighted composite (priority-weighted)
  const overall = Math.round(
    priority * 0.40 +
    legalScore * 0.25 +
    medScore * 0.15 +
    clarity * 0.10 +
    (100 - fawnRisk) * 0.10
  );

  // Email from court sources gets bumped regardless
  const finalPriority = source === 'email' && /peachecourt|camdencounty|courts\.ga/i.test(sender)
    ? Math.max(priority, 85)
    : priority;

  return {
    priority: Math.round(finalPriority),
    fawnRisk: Math.round(fawnRisk),
    legalWeight: Math.round(legalScore),
    clarityScore: Math.round(clarity),
    medicalRelevance: Math.round(medScore),
    overallScore: Math.round(overall),
    tier: tierFromPriority(finalPriority),
    bluf,
    intents,
    keywords,
    flags,
  };
}

export function sortMessages<T extends { score: BufferScore }>(messages: T[]): T[] {
  return [...messages].sort((a, b) => b.score.priority - a.score.priority);
}
