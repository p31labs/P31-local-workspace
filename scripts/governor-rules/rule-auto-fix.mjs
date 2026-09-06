#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { COLOR_MAP, detectHardcodedColors } from '../token-replacement-map.mjs';

const TOKEN_FILE_PATTERNS = [
  /tokens\.css$/,
  /tokens\.yml$/,
  /token-replacement-map\.mjs$/,
];

function isTokenFile(filePath) {
  return TOKEN_FILE_PATTERNS.some(p => p.test(filePath));
}

export const name = 'no-hardcoded-colors';

export function check(filePath, content) {
  if (isTokenFile(filePath)) return [];

  const violations = detectHardcodedColors(content);

  return violations.map(v => ({
    rule: name,
    file: filePath,
    line: v.line,
    column: v.column,
    message: `Hardcoded color \`${v.value}\` found. Replace with \`${v.replacement}\`.`,
    severity: 'error',
    fix: {
      value: v.value,
      replacement: v.replacement,
    },
  }));
}

export function fix(filePath) {
  const content = readFileSync(filePath, 'utf8');
  if (isTokenFile(filePath)) return { fixed: false, changes: 0 };

  let fixed = content;
  let changes = 0;

  for (const [value, replacement] of Object.entries(COLOR_MAP)) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    const re = new RegExp(escaped, 'g');
    if (re.test(fixed)) {
      changes += (fixed.match(re) || []).length;
      fixed = fixed.replace(re, replacement);
    }
  }

  if (changes > 0) {
    writeFileSync(filePath, fixed, 'utf8');
    return { fixed: true, changes };
  }

  return { fixed: false, changes: 0 };
}
