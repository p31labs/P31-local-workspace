// cli/commands/optimize-svgs.ts
// CLI command: p31 optimize:svgs

import { Command } from 'commander';
import { runSVGONormalization } from '../processors/svgoProcessor';

export function registerOptimizeCommand(program: Command) {
  program
    .command('optimize:svgs')
    .description('Normalize SVG vectors to fit bounding boxes (SVGO pipeline)')
    .option('--tokens <path>', 'Path to tokens.yml', 'cli/tokens/tokens.yml')
    .option('--source <path>', 'Source directory containing SVGs', 'apps/p31ca/public/icons')
    .option('--output <path>', 'Output directory for optimized SVGs (default: same as source)')
    .option('--dry-run', 'Preview changes without writing')
    .option('--bbox <name>', 'Expected bounding box size (e.g., icon_lg)', 'icon_lg')
    .action((options) => {
      runSVGONormalization({
        tokensPath: options.tokens,
        sourceDir: options.source,
        outputDir: options.output,
        dryRun: options.dryRun,
        expectedBoundingBox: options.bbox,
      });
    });
}
