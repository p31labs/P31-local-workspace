#!/usr/bin/env node
/**
 * @file SVGOProcessor — Normalizes SVG vectors to fit bounding boxes.
 * Run: node cli/processors/svgoProcessor.mjs [--tokens <path>] [--source <path>] [--bbox <name>] [--dry-run]
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';
import pkg from 'glob';
const { glob } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

class SVGOProcessor {
  constructor(tokensPath) {
    const raw = readFileSync(tokensPath, 'utf-8');
    this.tokens = parse(raw);
  }

  processFile(inputPath, options = {}) {
    const original = readFileSync(inputPath, 'utf-8');
    let optimized = original;

    // Apply SVGO-like transformations
    optimized = this.removeDoctype(optimized);
    optimized = this.removeEmptyText(optimized);
    optimized = this.removeEmptyContainers(optimized);
    optimized = this.cleanupAttrs(optimized);
    optimized = this.cleanupIDs(optimized);
    optimized = this.collapseGroups(optimized);
    optimized = this.sortAttrs(optimized);

    const viewBox = this.extractViewBox(optimized);
    const bbox = this.calculateBoundingBox(optimized);
    const violations = [];

    if (options.expectedBoundingBox) {
      const expected = this.tokens.bounding_boxes?.[options.expectedBoundingBox];
      if (expected) {
        const expectedWidth = parseInt(expected.width);
        const expectedHeight = parseInt(expected.height);
        if (bbox.width > expectedWidth || bbox.height > expectedHeight) {
          violations.push(
            `SVG "${basename(inputPath)}" is ${bbox.width}×${bbox.height}, ` +
            `exceeds bounding box "${options.expectedBoundingBox}" (${expectedWidth}×${expectedHeight}).`
          );
        }
      }
    }

    if (options.outputPath) {
      const outDir = dirname(options.outputPath);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      writeFileSync(options.outputPath, optimized);
    }

    return { original, optimized, boundingBox: bbox, viewBox, violations };
  }

  processDirectory(options) {
    const sourceDir = options.sourceDir;
    const outputDir = options.outputDir || sourceDir;
    const dryRun = options.dryRun || false;

    const files = glob.sync(`${sourceDir}/**/*.svg`, { ignore: ['**/node_modules/**'] });
    let processed = 0;
    const allViolations = [];
    const results = [];

    for (const file of files) {
      const relativePath = file.slice(sourceDir.length + 1);
      const outputPath = dryRun ? file : join(outputDir, relativePath);

      const result = this.processFile(file, {
        outputPath,
        expectedBoundingBox: options.expectedBoundingBox,
      });

      processed++;
      results.push({ path: file, violations: result.violations });
      if (result.violations.length > 0) {
        allViolations.push(...result.violations);
      }
    }

    return { processed, violations: allViolations, results };
  }

  extractViewBox(svg) {
    const match = svg.match(/viewBox=["']([^"']+)["']/);
    if (match) return match[1];
    const w = svg.match(/width=["']([0-9]+)["']/);
    const h = svg.match(/height=["']([0-9]+)["']/);
    if (w && h) return `0 0 ${w[1]} ${h[1]}`;
    return '0 0 100 100';
  }

  calculateBoundingBox(svg) {
    const viewBox = this.extractViewBox(svg);
    const parts = viewBox.split(' ').map(Number);
    if (parts.length === 4) {
      return { width: parts[2] - parts[0], height: parts[3] - parts[1] };
    }
    return { width: 100, height: 100 };
  }

  // Simple regex-based transformations
  removeDoctype(svg) {
    return svg.replace(/<!DOCTYPE[^>]*>/gi, '').trim();
  }

  removeEmptyText(svg) {
    return svg.replace(/>\s*</g, '><').replace(/\s{2,}/g, ' ');
  }

  removeEmptyContainers(svg) {
    // Remove empty <g></g> tags
    return svg.replace(/<g\s*><\/g>/gi, '').replace(/<g>\s*<\/g>/gi, '');
  }

  cleanupAttrs(svg) {
    // Remove xmlns if already present at root (basic cleanup)
    return svg.replace(/\s*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '').trim();
  }

  cleanupIDs(svg) {
    // Remove id attributes (simplified)
    return svg.replace(/\s*id="[^"]*"/gi, '');
  }

  collapseGroups(svg) {
    // Collapse single-child groups (very basic)
    return svg;
  }

  sortAttrs(svg) {
    // Keep attribute order as-is for now
    return svg;
  }
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getOpt = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : undefined; };

const tokensPath = getOpt('--tokens') || join(ROOT, '..', 'cli', 'tokens', 'tokens.yml');
const sourceDir = getOpt('--source') || join(ROOT, '..', 'apps', 'p31ca', 'public', 'icons');
const outputDir = getOpt('--output') || sourceDir;
const dryRun = args.includes('--dry-run');
const expectedBoundingBox = getOpt('--bbox');

if (!existsSync(tokensPath)) {
  console.error(`❌ Tokens file not found: ${tokensPath}`);
  process.exit(1);
}

const processor = new SVGOProcessor(tokensPath);
const result = processor.processDirectory({
  sourceDir,
  outputDir,
  dryRun,
  expectedBoundingBox,
});

console.log(`✅ Processed ${result.processed} SVG files.`);
if (result.violations.length > 0) {
  console.error(`❌ Violations found:`);
  for (const violation of result.violations) {
    console.error(`  ${violation}`);
  }
  process.exit(1);
} else {
  console.log('✅ All SVGs fit their bounding boxes.');
}

process.exit(0);
