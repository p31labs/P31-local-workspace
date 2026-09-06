// cli/commands/validate.ts
// CLI command: p31 validate:spacing

import { Command } from 'commander';
import { runSpatialValidation } from '../validators/spatialValidator';

export function registerValidateCommand(program: Command) {
  program
    .command('validate:spacing')
    .description('Validate that components and templates follow spatial rules (no external margins)')
    .option('--tokens <path>', 'Path to tokens.yml', 'cli/tokens/tokens.yml')
    .option('--components <path>', 'Path to components.yml', 'cli/tokens/components.yml')
    .option('--src <path>', 'Source directory to scan for templates', 'apps/p31ca/src')
    .option('--strict', 'Fail on first violation (default: report all)')
    .option('--fix', 'Automatically fix violations (experimental)')
    .action((options) => {
      runSpatialValidation({
        tokensPath: options.tokens,
        componentsPath: options.components,
        srcDir: options.src,
        strict: options.strict,
        fix: options.fix,
      });
    });
}
