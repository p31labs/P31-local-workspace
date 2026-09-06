#!/usr/bin/env node
/**
 * cli/a2ui-cli.js — Full CLI control for A2UI catalog operations.
 *
 * Usage:
 *   node cli/a2ui-cli.js <command>
 *
 * Commands:
 *   generate   Scan source and generate catalog.json
 *   validate   Validate catalog against JSON Schema
 *   serve      Display catalog location
 *   deploy     Copy catalog to all 5 consumer apps
 *   prompt     Build system prompt from catalog (Phase C)
 *   help       Show this help
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, '.well-known', 'a2ui-catalog.json');

function run(cmd, options = {}) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...options });
}

const commands = {
  generate() {
    console.log('🔍 Generating A2UI catalog...');
    run('node scripts/scan-a2ui-catalog.mjs');
  },

  validate() {
    console.log('🔍 Validating catalog against schema...');
    const schemaPath = path.join(ROOT, 'packages', 'interface-generator', 'src', 'adapters', 'a2ui.schema.json');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema not found. Run `pnpm install` first.');
      process.exit(1);
    }
    if (!fs.existsSync(CATALOG_PATH)) {
      console.error('❌ Catalog not found. Run `p31 a2ui generate` first.');
      process.exit(1);
    }
    try {
      run(`npx ajv-cli validate -s ${schemaPath} -d ${CATALOG_PATH}`);
      console.log('✅ Catalog is valid.');
    } catch {
      console.error('❌ Catalog validation failed.');
      process.exit(1);
    }
  },

  serve() {
    if (!fs.existsSync(CATALOG_PATH)) {
      console.error('❌ Catalog not found. Run `p31 a2ui generate` first.');
      process.exit(1);
    }
    console.log(`📡 Catalog available at: file://${CATALOG_PATH}`);
    console.log('   Serve it via your web server at /.well-known/a2ui-catalog.json');
  },

  deploy() {
    console.log('📦 Deploying catalog to all consumer apps...');
    const deployScript = path.join(ROOT, 'scripts', 'deploy-a2ui-catalog.mjs');
    if (fs.existsSync(deployScript)) {
      run(`node ${deployScript} --fix`);
    } else {
      console.error('❌ deploy-a2ui-catalog.mjs not found.');
      process.exit(1);
    }
  },

  prompt() {
    console.log('🧠 Building system prompt from catalog...');
    const promptScript = path.join(ROOT, 'scripts', 'build-agent-prompt.mjs');
    if (fs.existsSync(promptScript)) {
      run(`node ${promptScript}`);
    } else {
      console.error('❌ build-agent-prompt.mjs not found.');
      process.exit(1);
    }
  },

  help() {
    console.log(`
p31 a2ui <command>

Commands:
  generate   Scan source and generate catalog.json
  validate   Validate catalog against JSON Schema
  serve      Display catalog location
  deploy     Copy catalog to all 5 consumer apps
  prompt     Build system prompt from catalog

Options:
  --help     Show this help
    `);
  },
};

const cmd = process.argv[2] || 'help';
if (commands[cmd]) commands[cmd]();
else commands.help();
