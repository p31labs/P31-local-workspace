#!/usr/bin/env node
/**
 * @file P31 Component Converter CLI
 *
 * Usage:
 *   tsx src/converter/cli.ts react-to-astro --input Topbar.tsx --output Topbar.astro
 *   tsx src/converter/cli.ts astro-to-react --input Topbar.astro --output Topbar.tsx
 *   tsx src/converter/cli.ts html-to-react --input Topbar.html --output Topbar.tsx
 *   tsx src/converter/cli.ts react-to-html --input Topbar.tsx --output Topbar.html
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

import {
  convertReactToAstro,
  convertAstroToReact,
  convertHtmlToReact,
  convertReactToHtml,
} from './index.js';

const COMMANDS = ['react-to-astro', 'astro-to-react', 'html-to-react', 'react-to-html'];

function usage() {
  console.log(`
P31 Component Converter
Usage:
  tsx src/converter/cli.ts <command> --input <path> --output <path> [--name <ComponentName>]

Commands:
  react-to-astro   Convert React .tsx to Astro .astro
  astro-to-react   Convert Astro .astro to React .tsx
  html-to-react    Convert HTML to React .tsx
  react-to-html    Convert React .tsx to HTML

Options:
  --input   Path to source file
  --output  Path to output file
  --name    Component name (default: filename)
  --help    Show this help
  `);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const inputIndex = args.indexOf('--input');
  const outputIndex = args.indexOf('--output');
  const nameIndex = args.indexOf('--name');

  if (!command || !COMMANDS.includes(command) || inputIndex === -1 || outputIndex === -1) {
    usage();
    process.exit(1);
  }

  const inputPath = resolve(args[inputIndex + 1]);
  const outputPath = resolve(args[outputIndex + 1]);
  const componentName = nameIndex !== -1 ? args[nameIndex + 1] : inputPath.split(/[\/\\]/).pop()?.replace(/\.\w+$/, '') || 'Component';

  return { command, inputPath, outputPath, componentName };
}

function main() {
  const { command, inputPath, outputPath, componentName } = parseArgs();
  const code = readFileSync(inputPath, 'utf-8');

  let result: string;
  switch (command) {
    case 'react-to-astro':
      result = convertReactToAstro(code, componentName);
      break;
    case 'astro-to-react':
      result = convertAstroToReact(code, componentName);
      break;
    case 'html-to-react':
      result = convertHtmlToReact(code, componentName);
      break;
    case 'react-to-html':
      result = convertReactToHtml(code, componentName);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }

  const dir = outputPath.split(/[\/\\]/).slice(0, -1).join('/');
  try { mkdirSync(dir, { recursive: true }); } catch {}

  writeFileSync(outputPath, result);
  console.log(`Converted ${inputPath} → ${outputPath} (${command})`);
}

main();
