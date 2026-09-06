#!/usr/bin/env node

export const COLOR_MAP = {
  '#00F0FF': 'var(--p31-accent-cyan, #00F0FF)',
  '#A78BFA': 'var(--p31-accent-violet, #A78BFA)',
  '#34D399': 'var(--p31-accent-green, #34D399)',
  '#FBBF24': 'var(--p31-accent-gold, #FBBF24)',
  '#FB7185': 'var(--p31-accent-red, #FB7185)',
  '#818CF8': 'var(--p31-accent-iris, #818CF8)',
  '#0A0A0F': 'var(--p31-bg, #0A0A0F)',
  '#F5F5F7': 'var(--p31-text-primary, #F5F5F7)',
  'oklch(65% 0.18 195)': 'var(--p31-accent-cyan)',
  'oklch(65% 0.18 285)': 'var(--p31-accent-violet)',
  'oklch(65% 0.18 15)': 'var(--p31-accent-gold)',
  'oklch(65% 0.18 105)': 'var(--p31-accent-green)',
  'oklch(96% 0.005 240)': 'var(--p31-text-primary)',
  'oklch(75% 0.01 240)': 'var(--p31-text-secondary)',
  'oklch(55% 0.01 240)': 'var(--p31-text-tertiary)',
  'oklch(10% 0.01 240)': 'var(--p31-bg)',
  'oklch(15% 0.015 240)': 'var(--p31-surface)',
  'oklch(100% 0.01 240 / 0.04)': 'var(--p31-glass-bg)',
  'oklch(100% 0.01 240 / 0.08)': 'var(--p31-glass-border)',
};

export function detectHardcodedColors(content) {
  const violations = [];
  const lines = content.split('\n');

  for (const [hex, replacement] of Object.entries(COLOR_MAP)) {
    let idx = 0;
    while (idx < content.length) {
      const pos = content.indexOf(hex, idx);
      if (pos === -1) break;
      const lineNum = content.slice(0, pos).split('\n').length;
      const line = lines[lineNum - 1];
      violations.push({
        value: hex,
        replacement,
        line: lineNum,
        column: pos - content.lastIndexOf('\n', pos - 1),
        snippet: line.trim(),
      });
      idx = pos + hex.length;
    }
  }

  return violations;
}
