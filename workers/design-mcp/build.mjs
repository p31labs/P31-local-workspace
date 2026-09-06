#!/usr/bin/env node
/**
 * Build the design-mcp Worker data module from tokens.yml + components.yml.
 * Generates workers/design-mcp/src/data.ts
 */

import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_FILE = path.resolve(__dirname, '..', '..', 'cli', 'tokens', 'tokens.yml');
const COMPS_FILE = path.resolve(__dirname, '..', '..', 'cli', 'tokens', 'components.yml');
const ICONS_DIR = '/home/p31/p31-icon-pack/icons';
const OUT_FILE = path.join(__dirname, 'src', 'data.ts');

const tokens = yaml.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
const comps = yaml.parse(fs.readFileSync(COMPS_FILE, 'utf8'));

function readIconSvg(relPath) {
  try {
    return fs.readFileSync(path.join(ICONS_DIR, relPath), 'utf8').trim();
  } catch {
    return '';
  }
}

const REGULAR_ICONS = [
  { id: 'k4-tetrahedron', name: 'K4 Tetrahedron', file: 'regular/k4-tetrahedron.svg', description: 'Foundational structure, sovereignty' },
  { id: 'molecule', name: 'Molecule / Atom', file: 'regular/molecule.svg', description: 'Bonding, quantum mechanics, care connections' },
  { id: 'signal', name: 'Signal', file: 'regular/signal.svg', description: 'Coordination, communication, mesh signalling' },
  { id: 'mesh-node', name: 'Mesh Node', file: 'regular/mesh-node.svg', description: 'Mesh infrastructure, distributed nodes' },
  { id: 'spoon', name: 'Spoon', file: 'regular/spoon.svg', description: 'Cognitive capacity, spoon-aware design' },
  { id: 'p31-wordmark', name: 'P31 Wordmark', file: 'regular/p31-wordmark.svg', description: 'Sovereign brand identity' },
  { id: 'love-heart', name: 'LOVE Heart', file: 'regular/love-heart.svg', description: 'Care economy, LOVE ledger' },
  { id: '863hz-resonance', name: '863 Hz Resonance', file: 'regular/863hz-resonance.svg', description: 'Phosphorus-31 Larmor frequency, quantum resonance' },
];

const ADVANCED_ICONS = [
  { id: 'sovereign-crown', name: 'Sovereign Crown', file: 'advanced/sovereign-crown.svg', description: 'Sovereign authority, six-faceted leadership' },
  { id: 'prism-fold', name: 'Prism Fold', file: 'advanced/prism-fold.svg', description: 'Geometric transformation, multi-facet perspective' },
  { id: 'nebula-burst', name: 'Nebula Burst', file: 'advanced/nebula-burst.svg', description: 'Emergence, chaos to structure, generative particles' },
  { id: 'comet-orb', name: 'Comet Orb', file: 'advanced/comet-orb.svg', description: 'Swirling energy, harmonized orbital motion' },
];

const allIcons = [
  ...REGULAR_ICONS.map(i => ({ ...i, family: 'regular', colors: ['--p31-accent', '--p31-accent-violet', '--p31-text'], animated: true })),
  ...ADVANCED_ICONS.map(i => ({ ...i, family: 'advanced', colors: ['--p31-accent', '--p31-accent-violet', '--p31-accent-gold', '--p31-accent-green', '--p31-accent-iris', '--p31-accent-red'], animated: true })),
];

const iconsJson = JSON.stringify(
  allIcons.map(i => ({ ...i, svg: readIconSvg(i.file) })),
  null,
  2
);

const iconCatalogEntries = allIcons.map(i => `    ${JSON.stringify(i.id)}: { family: ${JSON.stringify(i.family)}, colors: ${JSON.stringify(i.colors)}, animated: ${i.animated}, description: ${JSON.stringify(i.description)}, svg: ${JSON.stringify(readIconSvg(i.file))} }`).join(',\n');

const tokensJson = JSON.stringify(tokens, null, 2);
const compsJson = JSON.stringify(comps, null, 2);

const output = `// Auto-generated from cli/tokens/tokens.yml + components.yml + p31-icon-pack/icons
// DO NOT EDIT — run: node workers/design-mcp/build.mjs

export const tokens = ${tokensJson} as const;

export const components = ${compsJson} as const;

export const icons = ${iconsJson} as const;

export const iconCatalog: Record<string, { family: string; colors: string[]; animated: boolean; description: string; svg: string }> = {
${iconCatalogEntries}
};
`;

fs.writeFileSync(OUT_FILE, output);
console.log(`Generated ${OUT_FILE} (${(output.length / 1024).toFixed(1)} KB)`);
