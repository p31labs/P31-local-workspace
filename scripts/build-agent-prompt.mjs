#!/usr/bin/env node
/**
 * scripts/build-agent-prompt.mjs — Auto-build system prompts from A2UI catalog.
 *
 * Reads .well-known/a2ui-catalog.json and generates role-specific markdown
 * prompts for Claude, Gemini, and Kilo agents.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, '.well-known', 'a2ui-catalog.json');
const OUTPUT_DIR = path.join(ROOT, 'workers', 'design-mcp', 'src', 'prompts');

if (!fs.existsSync(CATALOG_PATH)) {
  console.error('❌ Catalog not found. Run `p31 a2ui generate` first.');
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

function buildPrompt(catalog, role) {
  const componentList = catalog.components.map(c =>
    `- **${c.name}**: ${c.description || 'A2UI component'}`
  ).join('\n');

  const propExamples = catalog.components.slice(0, 5).map(c => {
    const props = c.props || {};
    const propStr = Object.entries(props).map(([k, v]) => `${k}: ${v.type || 'any'}`).join(', ');
    return `  - ${c.name}: ${propStr}`;
  }).join('\n');

  return `# A2UI Component Catalog (v${catalog.version})

You are a ${role} agent. You can generate user interfaces by returning A2UI JSON.

## Available Components:
${componentList}

## Example Prop Structures:
${propExamples}

## Rules:
1. Always include a valid component name.
2. Use the \`component\` property to specify the component.
3. Include appropriate \`props\` based on the component's schema.
4. You can nest components via \`children\` arrays where supported.

## Response Format:
Return only valid JSON in the form:
{
  "component": "ComponentName",
  "props": { ... },
  "children": [ ... ]
}
`;
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const roles = ['claude', 'gemini', 'kilo'];
  for (const role of roles) {
    const prompt = buildPrompt(catalog, role);
    const outPath = path.join(OUTPUT_DIR, `a2ui-${role}-prompt.txt`);
    fs.writeFileSync(outPath, prompt);
    console.log(`✅ Generated ${outPath}`);
  }

  console.log('📝 Update workers/design-mcp/src/data.ts to load these prompts.');
}

main();
