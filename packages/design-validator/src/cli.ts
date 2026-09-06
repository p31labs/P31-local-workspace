#!/usr/bin/env node
/**
 * design-validator CLI — validate files against @p31/design-core invariants.
 *
 * Usage:
 *   npx design-validator validate <file> [file...]
 *   npx design-validator components            # print allowed component list
 *   npx design-validator manifest              # print manifest as JSON
 */

import { validateFile, getAllowedComponents, getManifest, type ValidationResult } from './index.js';

const command = process.argv[2];
const args = process.argv.slice(3);

function printResult(result: ValidationResult): void {
  if (result.valid) {
    console.log('✅ Validation passed');
  } else {
    console.log('❌ Validation failed');
    for (const error of result.errors) {
      console.error(`  error: ${error}`);
    }
  }
  for (const warning of result.warnings) {
    console.warn(`  warning: ${warning}`);
  }
  process.exit(result.valid && result.warnings.length === 0 ? 0 : 1);
}

switch (command) {
  case 'validate': {
    if (args.length === 0) {
      console.error('Usage: design-validator validate <file> [file...]');
      process.exit(1);
    }
    let failed = false;
    for (const file of args) {
      console.log(`Validating ${file}...`);
      const result = validateFile(file);
      printResult(result);
      if (!result.valid) failed = true;
    }
    process.exit(failed ? 1 : 0);
  }

  case 'components': {
    const components = getAllowedComponents();
    console.log(JSON.stringify(components, null, 2));
    process.exit(0);
  }

  case 'manifest': {
    console.log(JSON.stringify(getManifest(), null, 2));
    process.exit(0);
  }

  default: {
    console.log(`
design-validator — @p31/design-core invariant enforcer

Commands:
  validate <file> [file...]   Validate file(s) against invariants
  components                  Print allowed component list
  manifest                    Print manifest as JSON

Examples:
  npx design-validator validate apps/phos/src/app.tsx
  npx design-validator components | jq .
`);
    process.exit(0);
  }
}
