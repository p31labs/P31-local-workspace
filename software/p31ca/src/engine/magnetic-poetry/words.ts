import { WordTile } from './types.ts';

export const WORD_BANK = [
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could',
  'shall', 'should', 'may', 'might', 'must', 'need', 'dare', 'ought', 'used',
  'go', 'come', 'take', 'make', 'give', 'get', 'see', 'know', 'think', 'want',
  'love', 'like', 'feel', 'hope', 'dream', 'live', 'grow', 'change', 'find', 'keep',
  'you', 'me', 'we', 'us', 'they', 'them', 'he', 'she', 'it', 'who',
  'this', 'that', 'here', 'there', 'now', 'then', 'always', 'never', 'sometimes', 'forever',
  'and', 'but', 'or', 'so', 'if', 'because', 'when', 'while', 'though', 'unless',
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'of', 'about',
  'not', 'no', 'yes', 'all', 'some', 'any', 'every', 'each', 'both', 'few',
  'good', 'bad', 'new', 'old', 'big', 'small', 'bright', 'dark', 'warm', 'calm',
  'beautiful', 'quiet', 'strong', 'gentle', 'free', 'wild', 'deep', 'true', 'whole', 'brave',
  'light', 'water', 'fire', 'earth', 'wind', 'sky', 'star', 'moon', 'sun', 'ocean',
  'heart', 'mind', 'soul', 'spirit', 'peace', 'joy', 'pain', 'fear', 'trust', 'grace',
  'together', 'apart', 'above', 'below', 'inside', 'outside', 'beyond', 'through', 'between', 'among',
];

let counter = 0;

export function pickWords(count: number, exclude: Set<string> = new Set()): WordTile[] {
  const available = WORD_BANK.filter(w => !exclude.has(w));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(text => ({
    id: `word-${++counter}`,
    text,
    x: Math.random() * 300,
    y: Math.random() * 200,
  }));
}
