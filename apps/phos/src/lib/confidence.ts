export interface ConfidenceSignals {
  entropy: number;
  variance: number;
  semantic: number;
  abstention: number;
}

export interface ConfidenceResult {
  score: number;
  route: 'local' | 'edge';
  signals: ConfidenceSignals;
}

const ABSTRACT_WORDS = new Set([
  'always', 'never', 'maybe', 'think', 'feel', 'believe', 'seems', 'perhaps',
  'possibly', 'probably', 'understand', 'meaning', 'purpose', 'soul', 'spirit',
  'love', 'hate', 'good', 'bad', 'right', 'wrong', 'should', 'could', 'would',
]);

const ABSTENTION_PATTERNS = [
  /\bi don'?t know\b/i,
  /\bnot sure\b/i,
  /\bcan'?t say\b/i,
  /\bno idea\b/i,
  /\buncertain\b/i,
  /\bmaybe\b/i,
  /\bperhaps\b/i,
];

export function calculateConfidence(prompt: string): ConfidenceResult {
  const entropy = computeEntropy(prompt);
  const variance = computeVariance(prompt);
  const semantic = computeSemantic(prompt);
  const abstention = computeAbstention(prompt);

  const score =
    entropy * 0.25 +
    (1 - variance) * 0.20 +
    semantic * 0.35 +
    (1 - abstention) * 0.20;

  return {
    score: Math.max(0, Math.min(1, score)),
    route: score >= 0.6 ? 'local' : 'edge',
    signals: { entropy, variance, semantic, abstention },
  };
}

function computeEntropy(text: string): number {
  if (!text) return 0;
  const freq: Record<string, number> = {};
  for (const char of text.toLowerCase()) {
    if (char === ' ' || char === '\n' || char === '\t') continue;
    freq[char] = (freq[char] || 0) + 1;
  }
  const len = text.replace(/\s/g, '').length;
  if (len === 0) return 0;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Math.min(1, entropy / 4.5);
}

function computeVariance(prompt: string): number {
  const sentences = prompt.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  if (sentences.length < 2) return 0;
  const lengths = sentences.map(s => s.split(/\s+/).filter(w => w.length > 0).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (mean === 0) return 0;
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.min(1, cv / 2);
}

function computeSemantic(prompt: string): number {
  const words = prompt.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  if (words.length === 0) return 0.5;
  const concreteCount = words.filter(w => !ABSTRACT_WORDS.has(w)).length;
  return concreteCount / words.length;
}

function computeAbstention(prompt: string): number {
  const matches = ABSTENTION_PATTERNS.filter(p => p.test(prompt)).length;
  return Math.min(1, matches / 2);
}
