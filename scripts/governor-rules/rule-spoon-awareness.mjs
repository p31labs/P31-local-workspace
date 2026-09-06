#!/usr/bin/env node
/**
 * @file rule-spoon-awareness.mjs
 * AI Governor — Pluggable rule: validates spoon-aware accessibility in CSS.
 *
 * Severity levels:
 *   error   — missing crisis mode, missing reduced motion
 *   warning — long animations without spoon gating, motion without spoon override
 *
 * Usage:
 *   node scripts/governor-rules/rule-spoon-awareness.mjs [path/to/css ...]
 *   node scripts/governor-rules/rule-spoon-awareness.mjs --dir packages/ui/src
 */

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// ─── Configuration ───────────────────────────────────────────────────────────

const CHROME_SELECTORS = [
  '.ui-chrome',
  '#main-content',
  'header',
  'nav',
  'footer',
  '.nav',
  '.footer',
  '.sidebar',
  '.topbar',
  '.app-bar',
  '.chrome',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
];

const SPOON_ATTRS = [
  '[data-spoons="0"]',
  "[data-spoons='0']",
  '[data-spoons="1"]',
  "[data-spoons='1']",
  '[data-spoons="2"]',
  "[data-spoons='2']",
];

const DISABLE_PATTERNS = [
  /animation:\s*none/i,
  /animation-duration:\s*0/i,
  /transition:\s*none/i,
  /transition-duration:\s*0/i,
];

// ─── Result Types ────────────────────────────────────────────────────────────

class Finding {
  constructor({ file, line, severity, rule, message, source }) {
    this.file = file;
    this.line = line;
    this.severity = severity;   // 'error' | 'warning'
    this.rule = rule;           // short rule identifier
    this.message = message;
    this.source = source;       // matching CSS snippet
  }
}

function report(findings) {
  const errors   = findings.filter(f => f.severity === 'error');
  const warnings = findings.filter(f => f.severity === 'warning');

  for (const f of findings) {
    const tag = f.severity === 'error' ? 'ERROR' : 'WARN';
    console.log(`  [${tag}] ${f.rule}:${f.file}:${f.line || 1}`);
    console.log(`         ${f.message}`);
    if (f.source) console.log(`         → ${f.source.trim()}`);
  }

  console.log(`\n  Summary: ${errors.length} errors, ${warnings.length} warnings`);

  return { errors, warnings };
}

// ─── CSS Parsing Utilities ──────────────────────────────────────────────────

function linesWithIndices(code) {
  return code.split('\n');
}

// Simple block-aware scanner: finds @keyframes blocks, @media blocks,
// @property blocks and selector rule blocks in a flat pass.
function* scanBlocks(code) {
  const lines = linesWithIndices(code);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('@keyframes ')) {
      const start = i;
      while (i < lines.length && !lines[i].trim().startsWith('}') && !(lines[i].trim() === '}')) i++;
      if (i < lines.length && lines[i].trim() === '}') i++;
      yield { type: 'keyframes', startLine: start + 1, endLine: i, text: lines.slice(start, i).join('\n') };
      continue;
    }

    if (trimmed.startsWith('@media')) {
      const start = i;
      let depth = 0;
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.includes('{')) depth += (t.match(/\{/g) || []).length;
        if (t.includes('}')) depth -= (t.match(/\}/g) || []).length;
        i++;
        if (depth <= 0) break;
      }
      yield { type: 'media', startLine: start + 1, endLine: i, text: lines.slice(start, i).join('\n') };
      continue;
    }

    // Regular rule block — lines ending with { or containing {
    if (trimmed.includes('{') && !trimmed.startsWith('@') && !trimmed.startsWith('/*')) {
      const start = i;
      let depth = 0;
      const blockText = [];
      while (i < lines.length) {
        const t = lines[i];
        blockText.push(t);
        if (t.includes('{')) depth += (t.match(/\{/g) || []).length;
        if (t.includes('}')) depth -= (t.match(/\}/g) || []).length;
        i++;
        if (depth <= 0) break;
      }
      yield { type: 'rule', startLine: start + 1, endLine: i, text: blockText.join('\n') };
      continue;
    }

    i++;
  }
}

function extractSelectors(blockText) {
  const firstBrace = blockText.indexOf('{');
  if (firstBrace === -1) return [];
  const selectorPart = blockText.slice(0, firstBrace).trim();
  return selectorPart.split(',').map(s => s.trim()).filter(Boolean);
}

function extractDeclarations(blockText) {
  const firstBrace = blockText.indexOf('{');
  const lastBrace = blockText.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) return [];
  const decls = blockText.slice(firstBrace + 1, lastBrace);
  return decls.split(';').map(d => d.trim()).filter(Boolean);
}

// ─── Check 1: Motion at Low Spoons ──────────────────────────────────────────

function checkMotionLowSpoons(code, filePath, findings) {
  const hasSpoonOverride = SPOON_ATTRS.some(attr => code.includes(attr));

  // If the file already has global spoon overrides (like motion.css), skip
  if (hasSpoonOverride) return;

  // Find all animation- and transition-related declarations outside @keyframes
  for (const block of scanBlocks(code)) {
    if (block.type === 'keyframes') continue;
    if (block.type === 'media' && block.text.includes('prefers-reduced-motion')) continue;

    const selectors = extractSelectors(block.text);
    const declarations = extractDeclarations(block.text);

    const hasMotion = declarations.some(d =>
      /^animation\b/i.test(d) ||
      /^animation-name\b/i.test(d) ||
      /^transition\b/i.test(d) ||
      /^transition-property\b/i.test(d)
    );

    if (!hasMotion) continue;

    // Check if this selector is inside a spoon override context
    const selectorStr = selectors.join(', ');
    const insideSpoonOverride = SPOON_ATTRS.some(attr =>
      selectorStr.startsWith(attr) || selectorStr.includes(attr)
    );

    if (insideSpoonOverride) {
      // Verify it actually disables motion
      const disables = declarations.some(d => DISABLE_PATTERNS.some(p => p.test(d)));
      if (!disables) {
        findings.push(new Finding({
          file: filePath,
          line: block.startLine,
          severity: 'warning',
          rule: 'motion-low-spoons',
          message: 'Spoon override selector present but does not disable animation/transition',
          source: block.text.slice(0, 200),
        }));
      }
      continue;
    }

    // Animation duration check — if it has a duration > 0 that's not 0s
    const hasActiveDuration = declarations.some(d => {
      const durMatch = d.match(/(?:animation-duration|transition-duration):\s*([^;!]+)/i);
      if (!durMatch) return false;
      const val = durMatch[1].trim();
      return val !== '0s' && val !== '0ms' && val !== '0';
    });

    if (hasActiveDuration) {
      findings.push(new Finding({
        file: filePath,
        line: block.startLine,
        severity: 'warning',
        rule: 'motion-low-spoons',
        message: 'Animation/transition without spoon override selector — motion not gated at low spoons',
        source: block.text.slice(0, 200),
      }));
    }
  }
}

// ─── Check 2: Crisis Mode (spoons=0) ───────────────────────────────────────

function spoon0Pattern() {
  return /\[data-spoons=['"]0['"]\]/;
}

/**
 * Per-file crisis mode scanning. Returns metadata for project-level aggregation.
 * Returns an object: { hasSpoon0, hasAnySpoons, chromeHiddenSet }.
 */
function scanCrisisMode(code) {
  const hasAnySpoons = /\[data-spoons=['"][0-5]['"]\]/.test(code);
  const hasSpoon0 = spoon0Pattern().test(code);
  let chromeHiddenSet = false;

  if (!hasAnySpoons) return { hasSpoon0: false, hasAnySpoons: false, chromeHiddenSet: false };

  // Check if any [data-spoons="0"] rule hides a chrome element
  for (const block of scanBlocks(code)) {
    if (block.type === 'keyframes') continue;
    const selectors = extractSelectors(block.text);

    const isCrisisChrome = selectors.some(sel =>
      spoon0Pattern().test(sel) &&
      CHROME_SELECTORS.some(chromeSel => sel.includes(chromeSel))
    );

    if (!isCrisisChrome) continue;

    const declarations = extractDeclarations(block.text);
    const hasDisplayNone = declarations.some(d =>
      /display:\s*none/i.test(d) || /visibility:\s*hidden/i.test(d)
    );

    if (hasDisplayNone) {
      chromeHiddenSet = true;
    } else {
      // Rule uses [data-spoons="0"] + chrome selector but doesn't hide it
      // (collect as per-file finding below)
    }
  }

  return { hasSpoon0, hasAnySpoons, chromeHiddenSet };
}

// ─── Check 3: Reduced Motion ────────────────────────────────────────────────

function checkReducedMotion(code, filePath, findings) {
  const hasReducedMotion = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i.test(code);
  const hasSpoonOverrides = SPOON_ATTRS.some(attr => code.includes(attr));

  if (!hasReducedMotion && hasSpoonOverrides) {
    findings.push(new Finding({
      file: filePath,
      line: 1,
      severity: 'error',
      rule: 'reduced-motion',
      message: 'Spoon overrides present but @media (prefers-reduced-motion: reduce) is missing',
      source: null,
    }));
  }

  if (hasReducedMotion) {
    // Verify the @media block contains actual motion disable rules
    for (const block of scanBlocks(code)) {
      if (block.type !== 'media') continue;
      if (!block.text.includes('prefers-reduced-motion')) continue;

      const declarations = extractDeclarations(block.text);
      const disablesMotion = declarations.some(d =>
        DISABLE_PATTERNS.some(p => p.test(d)) ||
        /animation-duration:\s*0/i.test(d) ||
        /transition-duration:\s*0/i.test(d)
      );

      if (!disablesMotion) {
        findings.push(new Finding({
          file: filePath,
          line: block.startLine,
          severity: 'warning',
          rule: 'reduced-motion',
          message: '@media (prefers-reduced-motion: reduce) block exists but does not disable animation/transition durations',
          source: block.text.slice(0, 200),
        }));
      }
    }
  }
}

// ─── Check 4: Spoon Gating on Long Animations ──────────────────────────────

function checkLongAnimationSpoonGating(code, filePath, findings) {
  // Find all @keyframes blocks by name
  const keyframeNames = new Set();
  for (const block of scanBlocks(code)) {
    if (block.type !== 'keyframes') continue;
    const match = block.text.match(/@keyframes\s+(\S+)/);
    if (match) keyframeNames.add(match[1]);
  }

  // Find all animation declarations that reference named keyframes
  for (const block of scanBlocks(code)) {
    if (block.type === 'keyframes') continue;

    const declarations = extractDeclarations(block.text);
    const selectors = extractSelectors(block.text);
    const selectorStr = selectors.join(', ');

    // Skip if already inside a spoon override
    const insideSpoonOverride = SPOON_ATTRS.some(attr =>
      selectorStr.includes(attr)
    );
    if (insideSpoonOverride) continue;

    for (const decl of declarations) {
      // Check animation shorthand and animation-duration
      let duration = null;

      // animation: <name> <duration> ...
      const animShorthand = decl.match(/^animation\s*:\s*([^;]+)/i);
      if (animShorthand) {
        // Parse duration from shorthand — typically the second value or a time value
        const parts = animShorthand[1].trim().split(/\s+/);
        for (const part of parts) {
          const dur = parseDuration(part);
          if (dur !== null) {
            duration = dur;
            break;
          }
        }
      }

      const explicitDuration = decl.match(/animation-duration\s*:\s*([^;!]+)/i);
      if (explicitDuration) {
        duration = parseDuration(explicitDuration[1].trim());
      }

      // Check if this animation uses a named keyframe
      const animNameMatch = decl.match(/animation-name\s*:\s*([^;!]+)/i);
      if (animNameMatch) {
        const names = animNameMatch[1].trim().split(/\s+/);
        const usesNamed = names.some(n => keyframeNames.has(n));
        if (!usesNamed) continue;
      } else if (animShorthand) {
        const firstPart = animShorthand[1].trim().split(/\s+/)[0];
        if (!keyframeNames.has(firstPart)) continue;
      } else {
        continue;
      }

      if (duration !== null && duration > 1000) {
        // Check if there's any spoon gate for this selector
        const hasGate = SPOON_ATTRS.some(attr => {
          const gatePattern = new RegExp(
            `${escapeRegex(attr)}\\s+${escapeRegex(selectorStr)}`,
            'i'
          );
          return gatePattern.test(code) ||
                 new RegExp(
                   `${escapeRegex(attr)}\\s+${escapeRegex(selectors[0])}`,
                   'i'
                 ).test(code);
        });

        if (!hasGate) {
          findings.push(new Finding({
            file: filePath,
            line: block.startLine,
            severity: 'warning',
            rule: 'long-animation-spoon-gating',
            message: `Long animation (${duration}ms) without spoon override selector to disable at low spoons`,
            source: `${selectorStr} { ${decl}; }`,
          }));
        }
      }
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDuration(str) {
  const match = str.match(/^([\d.]+)(ms|s)$/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2];
  return unit === 's' ? val * 1000 : val;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function findCSSFiles(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results.push(...await findCSSFiles(full));
    } else if (entry.isFile() && /\.css$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  let filePaths = [];
  let isDirScan = false;

  const dirIdx = args.indexOf('--dir');
  if (dirIdx !== -1 && args[dirIdx + 1]) {
    const dirPath = resolve(args[dirIdx + 1]);
    if (!existsSync(dirPath)) {
      console.error(`Directory not found: ${dirPath}`);
      process.exit(1);
    }
    filePaths.push(...await findCSSFiles(dirPath));
    isDirScan = true;
    args.splice(dirIdx, 2);
  }

  for (const arg of args) {
    const resolved = resolve(arg);
    if (existsSync(resolved) && resolved.endsWith('.css')) {
      filePaths.push(resolved);
    }
  }

  if (filePaths.length === 0) {
    console.error('No CSS files specified. Usage:');
    console.error('  node rule-spoon-awareness.mjs path/to/file.css [file2.css ...]');
    console.error('  node rule-spoon-awareness.mjs --dir packages/ui/src');
    process.exit(1);
  }

  const findings = [];
  // Crisis mode is a project-level invariant — track across all files when scanning a directory
  let projectHasCrisisChrome = false;

  for (const fp of filePaths) {
    const code = readFileSync(fp, 'utf8');

    checkMotionLowSpoons(code, fp, findings);
    checkReducedMotion(code, fp, findings);
    checkLongAnimationSpoonGating(code, fp, findings);

    // Crisis mode: collect cross-file metadata for directory scans;
    // for individual files, run per-file check only if the file has both
    // spoon references and chrome selectors.
    const crisisMeta = scanCrisisMode(code);
    if (isDirScan) {
      if (crisisMeta.chromeHiddenSet) projectHasCrisisChrome = true;
    } else {
      // Single-file mode: only check crisis mode if the file has spoon + chrome
      if (crisisMeta.hasAnySpoons) {
        const hasChromeSelectors = CHROME_SELECTORS.some(sel => {
          const pattern = new RegExp(escapeRegex(sel), 'i');
          return pattern.test(code);
        });
        if (hasChromeSelectors && !crisisMeta.chromeHiddenSet) {
          findings.push(new Finding({
            file: fp,
            line: 1,
            severity: 'error',
            rule: 'crisis-mode',
            message: 'File has data-spoons and chrome selectors but crisis mode does not hide chrome — DESIGN.md invariant: crisis mode must hide all chrome (display:none)',
            source: null,
          }));
        }
      }
    }
  }

  // Project-level crisis mode check (directory scans only)
  if (isDirScan && !projectHasCrisisChrome) {
    findings.push(new Finding({
      file: filePaths[0],
      line: 1,
      severity: 'error',
      rule: 'crisis-mode',
      message: 'No [data-spoons="0"] + chrome selector found across scanned files — DESIGN.md invariant: crisis mode must hide all chrome (display:none)',
      source: null,
    }));
  }

  const { errors, warnings } = report(findings);

  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
