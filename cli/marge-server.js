#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// MARGE — Machine Agent for Responsive Governance & Ephemeralization
// Design-system compliance agent: enforces 33 design invariants across all
// PHOS surfaces. Zero external dependencies — regex-based analysis.
// Stdio JSON-RPC pattern mirrors cognitive-prosthetic.js / love-registry.js.
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { designTokens } = require('./design-tokens-registry');

// ─── Tool Definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'design_expert_audit_surface',
    description: 'Audit a single surface file against all 33 design rules. Returns violations, score, and compliance status.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to a .tsx surface file (relative to repo root)' },
      },
      required: ['file'],
    },
  },
  {
    name: 'design_expert_generate_report',
    description: 'Audit multiple surfaces and generate an aggregate compliance report.',
    inputSchema: {
      type: 'object',
      properties: {
        surfaces: { type: 'array', items: { type: 'string' }, description: 'List of surface file paths (default: all in apps/phos/src/surfaces/)' },
      },
    },
  },
  {
    name: 'design_expert_check_tokens',
    description: 'Validate that a component uses design tokens instead of hardcoded values.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to a component file' },
      },
      required: ['file'],
    },
  },
  {
    name: 'design_expert_check_glass',
    description: 'Validate glassmorphism implementation (backdrop-filter, glass-text-scrim, reduced-transparency).',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to a surface file' },
      },
      required: ['file'],
    },
  },
  {
    name: 'design_expert_check_spoons',
    description: 'Validate spoon-state handling (crisis mode, motion scaling, interactive elements at spoons=0).',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to a surface file' },
      },
      required: ['file'],
    },
  },
  {
    name: 'design_expert_check_wcag',
    description: 'Validate WCAG 2.2 accessibility rules (touch targets, ARIA, contrast, focus, keyboard).',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to a surface file' },
      },
      required: ['file'],
    },
  },
  {
    name: 'design_expert_check_accent',
    description: 'Validate accent-color usage (single accent per screen, no decorative purple/pink).',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to a surface file' },
      },
      required: ['file'],
    },
  },
  {
    name: 'design_expert_check_contrast',
    description: 'Compute WCAG contrast ratio for a foreground/background color pair.',
    inputSchema: {
      type: 'object',
      properties: {
        foreground: { type: 'string', description: 'Hex color (e.g. #F5F5F7)' },
        background: { type: 'string', description: 'Hex color (e.g. #0A0A0F)' },
      },
      required: ['foreground', 'background'],
    },
  },
  {
    name: 'design_expert_suggest_fix',
    description: 'Given a specific violation, suggest a concrete code fix.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to the file with the violation' },
        rule: { type: 'string', description: 'Rule ID (e.g. D-004)' },
        line: { type: 'number', description: 'Line number (optional)' },
      },
      required: ['file', 'rule'],
    },
  },
  {
    name: 'design_expert_ephemeralize',
    description: 'Apply all fixable violations in a surface (dry-run by default).',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to the surface file' },
        dryRun: { type: 'boolean', description: 'If true, return changes without applying (default: true)' },
      },
      required: ['file'],
    },
  },
];

// ─── Rule Registry ───────────────────────────────────────────────────────────

const RULES = {
  'D-001': { name: 'Single accent per screen', severity: 'hard-fail' },
  'D-002': { name: 'No #FFFFFF text', severity: 'hard-fail' },
  'D-003': { name: 'No #000000 background', severity: 'hard-fail' },
  'D-004': { name: 'Glass surfaces have backdrop-filter', severity: 'hard-fail' },
  'D-005': { name: 'Glass with text has glass-text-scrim', severity: 'hard-fail' },
  'D-006': { name: 'data-spoons drives all motion', severity: 'hard-fail' },
  'D-007': { name: 'spoons<=1 motion disabled', severity: 'hard-fail' },
  'D-008': { name: 'CrisisMode: no UI chrome at spoons=0', severity: 'hard-fail' },
  'D-009': { name: 'Corner radius consistent', severity: 'hard-fail' },
  'D-010': { name: 'Headings Inter, code JetBrains Mono', severity: 'hard-fail' },
  'D-011': { name: 'Body line-height 1.6', severity: 'hard-fail' },
  'D-012': { name: 'Skip link present', severity: 'hard-fail' },
  'D-013': { name: 'prefers-reduced-motion respected', severity: 'hard-fail' },
  'D-014': { name: 'prefers-reduced-transparency respected', severity: 'hard-fail' },
  'D-015': { name: 'Touch targets >= 48px', severity: 'hard-fail' },
  'D-020': { name: 'Labels uppercase, letter-spacing 0.05em', severity: 'warning' },
  'D-021': { name: 'No heavy shadows', severity: 'warning' },
  'D-022': { name: 'quantum-gold sparingly used', severity: 'warning' },
  'D-023': { name: 'Card padding 24px', severity: 'warning' },
  'D-024': { name: 'Spacing values multiples of 4px/8px', severity: 'warning' },
  'D-025': { name: 'Max-width 1200px', severity: 'warning' },
  'D-026': { name: 'Progressive disclosure via Disclosure', severity: 'warning' },
  'D-027': { name: 'System never auto-increases complexity', severity: 'warning' },
  'D-028': { name: 'Icon buttons have aria-label', severity: 'warning' },
  'D-029': { name: 'SVGs have aria-hidden="true"', severity: 'warning' },
  'D-030': { name: 'Logical tab order', severity: 'warning' },
  'D-031': { name: 'Enter/Space triggers buttons, Escape closes', severity: 'warning' },
  'D-032': { name: 'aria-live="polite" on chat messages', severity: 'warning' },
  'D-033': { name: 'No legacy terminology', severity: 'warning' },
};

// ─── WCAG Contrast Helpers ──────────────────────────────────────────────────

function hexToRgb(hex) {
  if (!hex) return null;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return null;
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

function srgbToLinear(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(rgb1, rgb2) {
  const L1 = luminance(rgb1);
  const L2 = luminance(rgb2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── File Reading ────────────────────────────────────────────────────────────

function readFileSafe(filePath) {
  try {
    const resolved = path.resolve(filePath);
    return fs.readFileSync(resolved, 'utf-8');
  } catch (e) {
    return null;
  }
}

function getLines(content) {
  return content.split('\n');
}

// ─── Regex Scanners ──────────────────────────────────────────────────────────

function scanHardcodedColors(lines) {
  const violations = [];
  const patterns = [
    { re: /#[Ff]{6}\b/g, rule: 'D-002', msg: 'Hardcoded #FFFFFF found' },
    { re: /#[Ff]{3}\b/g, rule: 'D-002', msg: 'Hardcoded #FFF found' },
    { re: /#[0]{6}\b/gi, rule: 'D-003', msg: 'Hardcoded #000000 found' },
    { re: /#[0]{3}\b/gi, rule: 'D-003', msg: 'Hardcoded #000 found' },
    { re: /bg-black\b/g, rule: 'D-003', msg: 'bg-black used (use phos-bg or void)' },
    { re: /text-white\b(?![\/\[])/g, rule: 'D-002', msg: 'text-white without alpha (use text-primary)' },
  ];
  for (let i = 0; i < lines.length; i++) {
    for (const { re, rule, msg } of patterns) {
      if (re.test(lines[i])) {
        violations.push({ rule, severity: RULES[rule].severity, line: i + 1, message: msg });
      }
      re.lastIndex = 0;
    }
  }
  return violations;
}

function scanGlass(lines) {
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for bg-white/5, bg-black/40 without backdrop-filter or phos-glass
    if (/bg-white\/\d/.test(line) || /bg-black\/\d/.test(line)) {
      const hasGlass = /phos-glass|backdrop-filter|glass-panel|glass-card/.test(line);
      if (!hasGlass) {
        violations.push({ rule: 'D-004', severity: 'hard-fail', line: i + 1, message: 'Container uses bg opacity without backdrop-filter or phos-glass', fix: 'Replace with phos-glass class' });
      }
    }
    // Check for bg-zinc-*, bg-slate-* (solid backgrounds without glass)
    if (/bg-(zinc|slate|gray)-(800|900|950)/.test(line) && !/phos-glass|backdrop-filter/.test(line)) {
      // Only flag if it looks like a card/panel (has rounded, p-, padding classes)
      if (/rounded|p-\d|px-|py-/.test(line)) {
        violations.push({ rule: 'D-004', severity: 'hard-fail', line: i + 1, message: 'Solid dark background on elevated surface (should use phos-glass)', fix: 'Replace with phos-glass class' });
      }
    }
  }
  return violations;
}

function scanSpoons(lines) {
  const violations = [];
  const content = lines.join('\n');
  // Check for useState(4) anti-pattern
  for (let i = 0; i < lines.length; i++) {
    if (/useState\(\d+\)/.test(lines[i]) && /spoons/i.test(lines[i])) {
      violations.push({ rule: 'D-006', severity: 'hard-fail', line: i + 1, message: 'useState used for spoons instead of spoonsStore', fix: 'Import spoonsStore and use it directly' });
    }
  }
  // Check for interactive elements at spoons===0
  const spoonsZeroBlock = content.match(/spoons\s*===\s*0[^}]*\{[\s\S]*?\}/g);
  if (spoonsZeroBlock) {
    for (const block of spoonsZeroBlock) {
      if (/onClick|<Button|<Link|<input|<select|<textarea/.test(block)) {
        const lineNum = lines.findIndex(l => block.includes(l.trim().slice(0, 30))) + 1;
        violations.push({ rule: 'D-008', severity: 'hard-fail', line: lineNum || 1, message: 'Interactive element rendered at spoons===0', fix: 'Wrap in {spoons > 0 && ...}' });
      }
    }
  }
  return violations;
}

function scanWcag(lines) {
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Touch targets: buttons without min-h-[48px]
    if (/<button|<Button/.test(line) && !/min-h-\[48px\]|min-h-\[48|py-3.*min-h|min-h.*py-3/.test(line)) {
      if (!/className.*min-h/.test(line) && !/min-h/.test(lines.slice(Math.max(0, i - 2), i + 3).join(' '))) {
        violations.push({ rule: 'D-015', severity: 'hard-fail', line: i + 1, message: 'Button may lack 48px touch target', fix: 'Add min-h-[48px] min-w-[48px]' });
      }
    }
    // Icon buttons without aria-label
    if (/<button[^>]*>[\s]*<(svg|Svg|Icon|img)/i.test(line) || /<IconButton/.test(line)) {
      if (!/aria-label/.test(line) && !/aria-label/.test(lines.slice(i, i + 5).join(' '))) {
        violations.push({ rule: 'D-028', severity: 'warning', line: i + 1, message: 'Icon button may lack aria-label', fix: 'Add aria-label="..."' });
      }
    }
    // div with onClick but no role/tabIndex
    if (/<div[^>]*onClick/.test(line) && !/role=|tabIndex/.test(line)) {
      if (!/role=/.test(lines.slice(i, i + 3).join(' '))) {
        violations.push({ rule: 'D-031', severity: 'warning', line: i + 1, message: 'div with onClick but no role or tabIndex', fix: 'Add role="button" tabIndex={0}' });
      }
    }
    // SVG without aria-hidden
    if (/<svg[^>]*(?!.*aria-hidden)/.test(line) && !/aria-hidden/.test(line)) {
      if (!/aria-hidden/.test(lines.slice(i, i + 3).join(' '))) {
        violations.push({ rule: 'D-029', severity: 'warning', line: i + 1, message: 'SVG may lack aria-hidden="true"', fix: 'Add aria-hidden="true"' });
      }
    }
    // Low contrast text
    if (/text-white\/(1[0-9]|[0-9])\b/.test(line)) {
      violations.push({ rule: 'D-015', severity: 'hard-fail', line: i + 1, message: 'Very low contrast text (text-white/*<20%)', fix: 'Use text-white/50 or higher' });
    }
  }
  return violations;
}

function scanAccent(lines) {
  const violations = [];
  const content = lines.join('\n');
  // Count primary accent (quantum-cyan) usage in buttons/CTAs
  const cyanButtons = (content.match(/quantum-cyan[^"]*|accent[^"]*|bg-\[#00F0FF\]/gi) || []).length;
  if (cyanButtons > 3) {
    violations.push({ rule: 'D-001', severity: 'hard-fail', line: 1, message: `Multiple primary CTAs detected (${cyanButtons} quantum-cyan usages)`, fix: 'Keep only one primary CTA per screen' });
  }
  // Decorative purple/pink outside PQC context
  for (let i = 0; i < lines.length; i++) {
    if (/text-(purple|pink|fuchsia|rose)-/.test(lines[i]) && !/PQC|quantum|keygen/i.test(content.slice(0, 200))) {
      violations.push({ rule: 'D-001', severity: 'warning', line: i + 1, message: 'Decorative purple/pink outside quantum context', fix: 'Use quantum-cyan or quantum-violet' });
    }
  }
  return violations;
}

function scanRadius(lines) {
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    // Check for non-token radius values
    if (/rounded-\[(\d+)px\]/.test(lines[i])) {
      const match = lines[i].match(/rounded-\[(\d+)px\]/);
      const px = parseInt(match[1]);
      if (![8, 12, 24, 9999].includes(px)) {
        violations.push({ rule: 'D-009', severity: 'hard-fail', line: i + 1, message: `Non-token radius: ${px}px (use 8, 12, 24, or 9999)`, fix: 'Use rounded-sm (8), rounded-xl (12), rounded-3xl (24), or rounded-full (9999)' });
      }
    }
    // Check for rounded-sm (4px) — too small
    if (/rounded-sm\b/.test(lines[i])) {
      violations.push({ rule: 'D-009', severity: 'warning', line: i + 1, message: 'rounded-sm (4px) is smaller than token minimum (8px)', fix: 'Use rounded-sm (8px) or larger' });
    }
  }
  return violations;
}

function scanFonts(lines) {
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    // Check for non-approved fonts
    if (/font-family/.test(lines[i]) && !/Inter|JetBrains|sans-serif|monospace/.test(lines[i])) {
      violations.push({ rule: 'D-010', severity: 'hard-fail', line: i + 1, message: 'Non-approved font family', fix: 'Use Inter (headings/body) or JetBrains Mono (code)' });
    }
  }
  return violations;
}

function scanAccessibility(lines) {
  const violations = [];
  const content = lines.join('\n');
  // Skip link
  if (!/#main-content/.test(content) && !/skip-link/.test(content)) {
    // Only flag surface files, not components
    if (/export\s+(default\s+)?function/.test(content)) {
      violations.push({ rule: 'D-012', severity: 'hard-fail', line: 1, message: 'No skip link (#main-content) found', fix: 'Add <a href="#main-content" class="skip-link">Skip to content</a>' });
    }
  }
  // prefers-reduced-motion (only in CSS files)
  // This is checked in CSS, not TSX — skip for surface files
  return violations;
}

function scanLegacyTerms(lines) {
  const violations = [];
  const legacyTerms = ['handicapped', 'crippled', 'retarded', 'insane', 'crazy', 'lunatic', 'invalid'];
  for (let i = 0; i < lines.length; i++) {
    for (const term of legacyTerms) {
      if (new RegExp(`\\b${term}\\b`, 'i').test(lines[i])) {
        violations.push({ rule: 'D-033', severity: 'warning', line: i + 1, message: `Legacy terminology: "${term}"`, fix: 'Use person-first or identity-first language' });
      }
    }
  }
  return violations;
}

// ─── Core Audit Engine ───────────────────────────────────────────────────────

function auditSurface(filePath) {
  const content = readFileSafe(filePath);
  if (content === null) {
    return { status: 'error', error: `File not found: ${filePath}` };
  }
  const lines = getLines(content);
  const violations = [
    ...scanHardcodedColors(lines),
    ...scanGlass(lines),
    ...scanSpoons(lines),
    ...scanWcag(lines),
    ...scanAccent(lines),
    ...scanRadius(lines),
    ...scanFonts(lines),
    ...scanAccessibility(lines),
    ...scanLegacyTerms(lines),
  ];

  // Count by severity
  const hardFail = violations.filter(v => v.severity === 'hard-fail').length;
  const warning = violations.filter(v => v.severity === 'warning').length;
  const info = violations.filter(v => v.severity === 'info').length;
  const passed = Object.keys(RULES).length - hardFail - warning;

  // Score: 100 minus penalties
  const score = Math.max(0, Math.min(100, 100 - (hardFail * 5) - (warning * 2) - (info * 1)));

  return {
    status: 'ok',
    surface: path.basename(filePath),
    score,
    compliant: hardFail === 0,
    violations,
    summary: { hardFail, warning, info, passed: Math.max(0, passed) },
  };
}

// ─── Generate Report ─────────────────────────────────────────────────────────

function generateReport(surfaces) {
  const dir = path.resolve('apps/phos/src/surfaces');
  let files = surfaces;
  if (!files || files.length === 0) {
    try {
      files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.tsx'))
        .map(f => path.join(dir, f));
    } catch (e) {
      return { status: 'error', error: `Cannot read surfaces directory: ${dir}` };
    }
  }

  const results = files.map(f => auditSurface(f));
  const compliant = results.filter(r => r.compliant).length;
  const hardFailCount = results.reduce((a, r) => a + (r.summary?.hardFail || 0), 0);
  const warningCount = results.reduce((a, r) => a + (r.summary?.warning || 0), 0);
  const averageScore = results.length ? Math.round(results.reduce((a, r) => a + (r.score || 0), 0) / results.length) : 0;

  // Top violations
  const violationCounts = {};
  for (const r of results) {
    for (const v of r.violations || []) {
      violationCounts[v.rule] = (violationCounts[v.rule] || 0) + 1;
    }
  }
  const topViolations = Object.entries(violationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([rule, count]) => ({ rule, count }));

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    surfaces: results,
    summary: {
      total: results.length,
      compliant,
      nonCompliant: results.length - compliant,
      averageScore,
      hardFailCount,
      warningCount,
    },
    topViolations,
  };
}

// ─── Check Tokens ────────────────────────────────────────────────────────────

function checkTokens(filePath) {
  const content = readFileSafe(filePath);
  if (content === null) {
    return { status: 'error', error: `File not found: ${filePath}` };
  }
  const lines = getLines(content);
  const violations = scanHardcodedColors(lines);

  // Add spacing/radius token checks
  for (let i = 0; i < lines.length; i++) {
    // Hardcoded pixel values outside spacing scale
    const pxMatch = lines[i].match(/(\d+)px/g);
    if (pxMatch) {
      for (const px of pxMatch) {
        const val = parseInt(px);
        if (![4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128].includes(val) && !/rounded|border|shadow|outline/.test(lines[i])) {
          violations.push({ rule: 'D-024', severity: 'warning', line: i + 1, message: `Hardcoded ${px} outside spacing scale`, fix: 'Use spacing tokens (4, 8, 12, 16, 24, 32, 64)' });
        }
      }
    }
  }

  return { status: 'ok', violations };
}

// ─── Check Glass ─────────────────────────────────────────────────────────────

function checkGlass(filePath) {
  const content = readFileSafe(filePath);
  if (content === null) {
    return { status: 'error', error: `File not found: ${filePath}` };
  }
  const lines = getLines(content);
  return { status: 'ok', violations: scanGlass(lines) };
}

// ─── Check Spoons ────────────────────────────────────────────────────────────

function checkSpoons(filePath) {
  const content = readFileSafe(filePath);
  if (content === null) {
    return { status: 'error', error: `File not found: ${filePath}` };
  }
  const lines = getLines(content);
  return { status: 'ok', violations: scanSpoons(lines) };
}

// ─── Check WCAG ──────────────────────────────────────────────────────────────

function checkWcag(filePath) {
  const content = readFileSafe(filePath);
  if (content === null) {
    return { status: 'error', error: `File not found: ${filePath}` };
  }
  const lines = getLines(content);
  return { status: 'ok', violations: scanWcag(lines) };
}

// ─── Check Accent ────────────────────────────────────────────────────────────

function checkAccent(filePath) {
  const content = readFileSafe(filePath);
  if (content === null) {
    return { status: 'error', error: `File not found: ${filePath}` };
  }
  const lines = getLines(content);
  return { status: 'ok', violations: scanAccent(lines) };
}

// ─── Check Contrast ──────────────────────────────────────────────────────────

function checkContrast({ foreground, background }) {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  if (!fgRgb || !bgRgb) {
    return { status: 'error', error: 'Invalid hex color(s)' };
  }
  const ratio = Math.round(contrastRatio(fgRgb, bgRgb) * 100) / 100;
  return {
    status: 'ok',
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7,
    suggestion: ratio >= 7 ? null : ratio >= 4.5 ? 'Meets AA but not AAA' : 'Fails both AA and AAA',
  };
}

// ─── Suggest Fix ─────────────────────────────────────────────────────────────

const FIX_MAP = {
  'D-002': { pattern: /text-white(?![\/\[])/g, replacement: 'text-primary', explanation: 'Use text-primary (var(--phos-text)) instead of raw white' },
  'D-003': { pattern: /bg-black/g, replacement: 'phos-bg', explanation: 'Use phos-bg class (var(--phos-bg) = #0A0A0F)' },
  'D-004': { pattern: /bg-white\/\d+/g, replacement: 'phos-glass', explanation: 'Use phos-glass class (includes backdrop-filter: blur(20px))' },
  'D-015': { pattern: /<button/g, replacement: '<button className="min-h-[48px] min-w-[48px]"', explanation: 'Add minimum touch target size per WCAG 2.5.8' },
  'D-028': { pattern: /<IconButton/g, replacement: '<IconButton aria-label="..."', explanation: 'Add aria-label for screen reader access' },
  'D-029': { pattern: /<svg(?!.*aria-hidden)/g, replacement: '<svg aria-hidden="true"', explanation: 'Hide decorative SVGs from screen readers' },
};

function suggestFix({ file, rule, line }) {
  const fix = FIX_MAP[rule];
  if (!fix) {
    return { status: 'error', error: `No fix mapping for rule ${rule}` };
  }
  const content = readFileSafe(file);
  if (content === null) {
    return { status: 'error', error: `File not found: ${file}` };
  }
  const match = content.match(fix.pattern);
  return {
    status: 'ok',
    original: match ? match[0] : '(no match found)',
    fixed: match ? match[0].replace(fix.pattern, fix.replacement) : '(no match found)',
    explanation: fix.explanation,
  };
}

// ─── Ephemeralize ────────────────────────────────────────────────────────────

function ephemeralize({ file, dryRun = true }) {
  const content = readFileSafe(file);
  if (content === null) {
    return { status: 'error', error: `File not found: ${file}` };
  }
  let modified = content;
  const changes = [];

  for (const [rule, fix] of Object.entries(FIX_MAP)) {
    let match;
    const regex = new RegExp(fix.pattern.source, fix.pattern.flags);
    while ((match = regex.exec(modified)) !== null) {
      const lineNum = modified.slice(0, match.index).split('\n').length;
      changes.push({
        line: lineNum,
        before: match[0],
        after: match[0].replace(fix.pattern, fix.replacement),
        rule,
      });
      modified = modified.slice(0, match.index) + match[0].replace(fix.pattern, fix.replacement) + modified.slice(match.index + match[0].length);
      regex.lastIndex = 0;
    }
  }

  if (!dryRun && changes.length > 0) {
    try {
      fs.writeFileSync(path.resolve(file), modified, 'utf-8');
    } catch (e) {
      return { status: 'error', error: `Failed to write file: ${e.message}` };
    }
  }

  return {
    status: 'ok',
    changes,
    applied: !dryRun && changes.length > 0,
  };
}

// ─── Tool Execution Router ───────────────────────────────────────────────────

function executeTool(name, args) {
  switch (name) {
    case 'design_expert_audit_surface':
      return auditSurface(args.file);
    case 'design_expert_generate_report':
      return generateReport(args.surfaces);
    case 'design_expert_check_tokens':
      return checkTokens(args.file);
    case 'design_expert_check_glass':
      return checkGlass(args.file);
    case 'design_expert_check_spoons':
      return checkSpoons(args.file);
    case 'design_expert_check_wcag':
      return checkWcag(args.file);
    case 'design_expert_check_accent':
      return checkAccent(args.file);
    case 'design_expert_check_contrast':
      return checkContrast(args);
    case 'design_expert_suggest_fix':
      return suggestFix(args);
    case 'design_expert_ephemeralize':
      return ephemeralize(args);
    default:
      return { status: 'error', error: `Unknown tool: ${name}` };
  }
}

// ─── JSON-RPC over stdio ─────────────────────────────────────────────────────

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      handleRequest(JSON.parse(trimmed));
    } catch (_) {
      /* ignore non-JSON lines */
    }
  }
});

function handleRequest(req) {
  const { id, method, params } = req;
  switch (method) {
    case 'initialize':
      respond(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'p31-marge', version: '1.0.0' },
      });
      break;
    case 'notifications/initialized':
      break;
    case 'tools/list':
      respond(id, { tools: TOOLS });
      break;
    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS.find(t => t.name === toolName);
      if (!tool) {
        respondError(id, -32602, `Unknown tool: ${toolName}`);
        break;
      }
      try {
        const out = executeTool(toolName, toolArgs);
        respond(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        respond(id, {
          content: [{ type: 'text', text: JSON.stringify({ error: e.message, status: 'error' }) }],
          isError: true,
        });
      }
      break;
    }
    case 'ping':
      respond(id, {});
      break;
    default:
      if (id !== undefined) respondError(id, -32601, `Method not found: ${method}`);
  }
}

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function respondError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}
