#!/usr/bin/env node
/**
 * p31 vibe generate — Generate code from a natural language prompt.
 * Usage: p31 vibe generate "Build a star-catching game" --calm --sparkly
 */
import { P31Client } from '../../packages/vibe-sdk/src/index.ts';

const prompt = process.argv.slice(2).filter(a => !a.startsWith('--')).join(' ');
const tags = process.argv.filter(a => a.startsWith('--') && !a.includes('=')).map(a => a.slice(2));
const ageIdx = process.argv.findIndex(a => a.startsWith('--age='));
const age = ageIdx >= 0 ? process.argv[ageIdx].split('=')[1] : 'adult';

if (!prompt) {
  console.error('Usage: p31 vibe generate "prompt" [--calm] [--sparkly] [--age=child|youth|adult]');
  process.exit(1);
}

const p31 = new P31Client();
console.log(`🎨 Generating: "${prompt}"`);
console.log(`   Tags: ${tags.join(', ') || 'none'}, Age: ${age}`);

try {
  console.log('   (Vibe Studio requires PHOS gateway — use the web UI at phos.p31ca.org/vibe for full pipeline)');
  console.log(`\n   To deploy: p31 vibe deploy --name "My App" --html "<h1>Hi</h1>"`);
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
