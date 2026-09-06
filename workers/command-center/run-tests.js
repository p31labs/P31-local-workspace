/**
 * Test Runner Script
 * Orchestrates running all test suites
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

const tests = [
  {
    name: 'Unit Tests',
    command: 'npm run test',
    description: 'Run Jest unit tests',
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    description: 'Run IAM, D1, R2 integration tests',
  },
  {
    name: 'Security Tests',
    command: 'npm run test:security',
    description: 'Run security validation tests',
  },
  {
    name: 'Performance Tests',
    command: 'npm run test:perf',
    description: 'Run performance and latency tests',
  },
  {
    name: 'E2E Tests',
    command: 'npm run test:e2e',
    description: 'Run Playwright browser tests',
    optional: true,
  },
];

function runTest(test) {
  console.log(chalk.cyan(`\n▶ Running: ${test.name}`));
  console.log(chalk.gray(`  ${test.description}`));
  console.log(chalk.gray(`  $ ${test.command}`));
  
  try {
    execSync(test.command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log(chalk.green(`✓ ${test.name} passed`));
    return true;
  } catch (error) {
    if (test.optional) {
      console.log(chalk.yellow(`⚠ ${test.name} failed (optional, continuing)`));
      return true;
    }
    console.log(chalk.red(`✗ ${test.name} failed`));
    return false;
  }
}

function main() {
  console.log(chalk.bold.cyan('\nEPCP Test Suite Runner'));
  console.log(chalk.gray('========================\n'));
  
  const results = tests.map(runTest);
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(chalk.bold.cyan(`\n========================`));
  console.log(chalk.bold(`Results: ${passed}/${total} test suites passed`));
  
  if (passed === total) {
    console.log(chalk.green('✓ All tests passed!\n'));
    process.exit(0);
  } else {
    console.log(chalk.red('✗ Some tests failed\n'));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
