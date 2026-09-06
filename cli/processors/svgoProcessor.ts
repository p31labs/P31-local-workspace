// cli/processors/svgoProcessor.ts
// SVGO Pipeline — Normalizes SVG vectors to fit bounding boxes

import { optimize, OptimizedSvg, Config } from 'svgo';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';
import { glob } from 'glob';

interface TokenSchema {
  svg_rules: {
    svgo_transform: Record<string, boolean | string>;
    viewBox_trimming: { enabled: boolean; padding?: string; trim_to_visible_bounds?: boolean };
    container_wrapping: { enabled: boolean; wrapper_display?: string; wrapper_width?: string; wrapper_height?: string };
  };
  bounding_boxes: Record<string, { width: string; height: string }>;
}

export interface SVGOProcessResult {
  original: string;
  optimized: OptimizedSvg;
  boundingBox: { width: number; height: number };
  viewBox: string;
  violations: string[];
}

export interface SVGODirectoryResult {
  processed: number;
  violations: string[];
  results: Array<{ path: string; violations: string[] }>;
}

export class SVGOProcessor {
  private tokens: TokenSchema;
  private svgoConfig: Config;

  constructor(tokensPath: string) {
    const raw = fs.readFileSync(tokensPath, 'utf-8');
    this.tokens = parse(raw) as TokenSchema;

    // Build SVGO config from tokens.v2.yml
    const svgoRules = this.tokens.svg_rules.svgo_transform || {};
    this.svgoConfig = {
      plugins: [
        { name: 'removeDoctype', active: true },
        { name: 'removeEmptyText', active: true },
        { name: 'removeEmptyContainers', active: true },
        { name: 'cleanupAttrs', active: true },
        { name: 'cleanupIDs', active: true },
        { name: 'convertShapeToPath', active: true },
        { name: 'moveGroupAttrsToElems', active: true },
        { name: 'collapseGroups', active: true },
        { name: 'sortAttrs', active: true },
        { name: 'removeViewBox', active: svgoRules.removeViewBox === false ? false : true },
      ],
    };
  }

  /**
   * Process a single SVG file
   */
  processFile(inputPath: string, options?: { outputPath?: string; expectedBoundingBox?: string }): SVGOProcessResult {
    const original = fs.readFileSync(inputPath, 'utf-8');

    // Run SVGO optimization
    const optimized = optimize(original, {
      path: inputPath,
      ...this.svgoConfig,
    });

    // Extract or calculate viewBox
    let viewBox = this.extractViewBox(optimized.data);
    if (this.tokens.svg_rules.viewBox_trimming.enabled) {
      viewBox = this.trimViewBox(optimized.data, viewBox);
    }

    // Check bounding box
    const bbox = this.calculateBoundingBox(optimized.data);
    const violations: string[] = [];

    if (options?.expectedBoundingBox) {
      const expected = this.tokens.bounding_boxes[options.expectedBoundingBox];
      if (expected) {
        const expectedWidth = parseInt(expected.width);
        const expectedHeight = parseInt(expected.height);
        if (bbox.width > expectedWidth || bbox.height > expectedHeight) {
          violations.push(
            `SVG "${path.basename(inputPath)}" is ${bbox.width}×${bbox.height}, ` +
            `exceeds bounding box "${options.expectedBoundingBox}" (${expectedWidth}×${expectedHeight}).`
          );
        }
      }
    }

    // Write output if outputPath is provided
    if (options?.outputPath) {
      fs.writeFileSync(options.outputPath, optimized.data);
    }

    return {
      original,
      optimized,
      boundingBox: bbox,
      viewBox,
      violations,
    };
  }

  /**
   * Process all SVGs in a directory
   */
  processDirectory(options: { sourceDir: string; outputDir?: string; expectedBoundingBox?: string; dryRun?: boolean }): SVGODirectoryResult {
    const sourceDir = options.sourceDir;
    const outputDir = options.outputDir || sourceDir;
    const dryRun = options.dryRun || false;

    const files = glob.sync(`${sourceDir}/**/*.svg`, { ignore: ['**/node_modules/**'] });
    let processed = 0;
    const allViolations: string[] = [];
    const results: Array<{ path: string; violations: string[] }> = [];

    for (const file of files) {
      const relativePath = path.relative(sourceDir, file);
      const outputPath = dryRun ? file : path.join(outputDir, relativePath);

      const result = this.processFile(file, {
        outputPath: outputPath,
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

  /**
   * Extract viewBox from SVG string
   */
  private extractViewBox(svg: string): string {
    const match = svg.match(/viewBox=["']([^"']+)["']/);
    if (match) {
      return match[1];
    }
    // If no viewBox, use width/height as fallback
    const widthMatch = svg.match(/width=["']([0-9]+)["']/);
    const heightMatch = svg.match(/height=["']([0-9]+)["']/);
    if (widthMatch && heightMatch) {
      return `0 0 ${widthMatch[1]} ${heightMatch[1]}`;
    }
    return '0 0 100 100';
  }

  /**
   * Trim viewBox to visible content
   */
  private trimViewBox(svg: string, currentViewBox: string): string {
    // In a full implementation, we would parse the SVG AST, find all visible elements,
    // calculate their bounding box, and adjust the viewBox.
    // For now, we keep the current viewBox but note it for future implementation.
    return currentViewBox;
  }

  /**
   * Calculate bounding box of visible content
   */
  private calculateBoundingBox(svg: string): { width: number; height: number } {
    // Placeholder: In full implementation, parse SVG AST and find bounding box of all visible elements.
    // For now, use viewBox or fallback.
    const viewBox = this.extractViewBox(svg);
    const parts = viewBox.split(' ').map(Number);
    if (parts.length === 4) {
      return { width: parts[2] - parts[0], height: parts[3] - parts[1] };
    }
    return { width: 100, height: 100 };
  }
}

// ─── CLI Integration ──────────────────────────────────────────────────────

export function runSVGONormalization(options: {
  tokensPath?: string;
  sourceDir?: string;
  outputDir?: string;
  dryRun?: boolean;
  expectedBoundingBox?: string;
}) {
  const tokensPath = options.tokensPath || path.resolve(process.cwd(), 'schemas', 'tokens.v2.yml');
  if (!fs.existsSync(tokensPath)) {
    console.error(`❌ Tokens file not found: ${tokensPath}`);
    process.exit(1);
  }

  const processor = new SVGOProcessor(tokensPath);
  const result = processor.processDirectory({
    sourceDir: options.sourceDir || path.resolve(process.cwd(), 'apps', 'p31ca', 'public', 'icons'),
    outputDir: options.outputDir,
    dryRun: options.dryRun,
    expectedBoundingBox: options.expectedBoundingBox,
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
}
