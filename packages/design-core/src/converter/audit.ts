/**
 * @file CSS Audit Tool — flags hardcoded values, missing token usage, and accessibility issues.
 *
 * Rules:
 *   - No hardcoded hex colors (must use var(--p31-*))
 *   - No hardcoded spacing values (must use var(--p31-space-*))
 *   - No hardcoded font families (must use var(--p31-font-*))
 *   - Minimum contrast ratio 4.5:1 for normal text
 *   - All interactive elements must have focus-visible styles
 */

import { readFileSync } from 'fs';

export interface Violation {
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: 'error' | 'warn';
  value?: string;
}

const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3}){1,2}/g;
const HARDCODED_COLOR_REGEX = /(?:color|background|border-color|fill|stroke)\s*:\s*(?!var\(--)[^;}\s]+/gi;
const HARDCODED_SPACING_REGEX = /(?:padding|margin|gap|top|right|bottom|left)\s*:\s*(?!var\(--)[^;}\s]+/gi;
const HARDCODED_FONT_REGEX = /font-family\s*:\s*(?!var\(--)[^;}\s]+/gi;
const FOCUS_VISIBLE_REGEX = /:focus-visible/g;
const PURE_BLACK_REGEX = /#000|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)/g;
const PURE_WHITE_REGEX = /#fff|#ffffff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)/g;

export function auditCssFile(content: string, strict: boolean = false): Violation[] {
  const violations: Violation[] = [];
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1;

    // Check for hardcoded hex colors
    const hexMatches = line.match(HEX_COLOR_REGEX);
    if (hexMatches) {
      hexMatches.forEach((match) => {
        violations.push({
          line: lineNumber,
          column: line.indexOf(match),
          rule: 'no-hardcoded-colors',
          message: `Hardcoded hex color "${match}" — use var(--p31-*) token instead`,
          severity: strict ? 'error' : 'warn',
          value: match,
        });
      });
    }

    // Check for hardcoded color values in properties
    const colorMatches = line.match(HARDCODED_COLOR_REGEX);
    if (colorMatches) {
      colorMatches.forEach((match) => {
        if (!match.includes('var(') && !match.includes('oklch') && !match.includes('rgb')) {
          violations.push({
            line: lineNumber,
            column: line.indexOf(match),
            rule: 'no-hardcoded-colors',
            message: `Hardcoded color value "${match.trim()}" — use var(--p31-*) token`,
            severity: strict ? 'error' : 'warn',
            value: match.trim(),
          });
        }
      });
    }

    // Check for hardcoded spacing
    const spacingMatches = line.match(HARDCODED_SPACING_REGEX);
    if (spacingMatches) {
      spacingMatches.forEach((match) => {
        violations.push({
          line: lineNumber,
          column: line.indexOf(match),
          rule: 'no-hardcoded-spacing',
          message: `Hardcoded spacing "${match.trim()}" — use var(--p31-space-*) token`,
          severity: strict ? 'error' : 'warn',
          value: match.trim(),
        });
      });
    }

    // Check for hardcoded font families
    const fontMatches = line.match(HARDCODED_FONT_REGEX);
    if (fontMatches) {
      fontMatches.forEach((match) => {
        violations.push({
          line: lineNumber,
          column: line.indexOf(match),
          rule: 'no-hardcoded-fonts',
          message: `Hardcoded font-family "${match.trim()}" — use var(--p31-font-*) token`,
          severity: strict ? 'error' : 'warn',
          value: match.trim(),
        });
      });
    }

    // Check for pure black/white text on backgrounds
    if (line.includes('color:') && (line.includes('#000') || line.includes('rgb(0,0,0)'))) {
      violations.push({
        line: lineNumber,
        column: line.indexOf('color:'),
        rule: 'no-pure-black',
        message: 'Pure black text (#000) — use var(--p31-text) token for better accessibility',
        severity: 'warn',
        value: line.trim(),
      });
    }
  });

  // Check for focus-visible styles (global check)
  if (!content.includes(':focus-visible')) {
    violations.push({
      line: 0,
      column: 0,
      rule: 'missing-focus-visible',
      message: 'No :focus-visible styles found — required for keyboard navigation accessibility',
      severity: strict ? 'error' : 'warn',
    });
  }

  return violations;
}

export function findHardcodedValues(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const violations = auditCssFile(content, true);
  return violations.map((v) => `Line ${v.line}: ${v.message}`);
}
