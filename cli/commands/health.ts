// cli/commands/health.ts
// CLI command: p31 health — Design system health check

import { Command } from 'commander';
import { SpatialValidator } from '../validators/spatialValidator';

export function registerHealthCommand(program: Command) {
  program
    .command('health')
    .description('Run P31-Q design system health check')
    .option('--tokens <path>', 'Path to tokens.yml', 'cli/tokens/tokens.yml')
    .option('--components <path>', 'Path to components.yml', 'cli/tokens/components.yml')
    .option('--src <path>', 'Source directory to scan', 'apps/p31ca/src')
    .option('--machine-readable', 'Output JSON for AI agents')
    .action((options) => {
      const validator = new SpatialValidator(options.tokens);
      const health = validator.healthScore({
        componentsPath: options.components,
        srcDir: options.src,
      });

      if (options.machineReadable) {
        console.log(JSON.stringify({ mode: 'health', ...health }, null, 2));
        process.exit(health.score >= 70 ? 0 : 1);
      }

      console.log('\n🏥 P31-Q System Health');
      console.log('   ─────────────────────');
      console.log(`   Score:  ${health.score}/100 (Grade: ${health.grade})`);
      console.log(`   Checks: ${health.totalChecks} total, ${health.cleanChecks} clean`);
      console.log(`   Violations: ${health.violations}`);
      console.log(`   Warnings: ${health.warnings}`);
      console.log(`   Auto-fixable: ${health.fixes}`);
      console.log('');

      if (health.score >= 90) {
        console.log('   ✅ System is healthy.');
      } else if (health.score >= 70) {
        console.log('   ⚠️  System needs attention.');
      } else {
        console.log('   ❌ System is degraded. Run validate:spacing --fix to auto-correct.');
      }

      process.exit(health.score >= 70 ? 0 : 1);
    });
}
