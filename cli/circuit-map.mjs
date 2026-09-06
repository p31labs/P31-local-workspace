#!/usr/bin/env node
/**
 * @file Circuit Map Generator — emits Mermaid/DOT architecture diagrams from wrangler.toml files.
 *
 * Usage:
 *   node cli/circuit-map.mjs              # Mermaid to stdout
 *   node cli/circuit-map.mjs --dot        # DOT to stdout
 *   node cli/circuit-map.mjs --output architecture.md
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DIRS = [
  join(ROOT, 'workers'),
  join(ROOT, 'apps'),
];

const METAPHOR_COLORS = {
  Transformer: '#00F0FF',
  Inverter: '#A78BFA',
  Regulator: '#FB7185',
  Capacitor: '#34D399',
  Resistor: '#FBBF24',
  'Frequency Drive': '#818CF8',
};

const METAPHOR_ICONS = {
  Transformer: '⚡',
  Inverter: '🔀',
  Regulator: '🛡️',
  Capacitor: '🔋',
  Resistor: '🚧',
  'Frequency Drive': '⚙️',
};

function walkTomlFiles(dir) {
  if (!existsSync(dir)) return [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const results = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTomlFiles(full));
    } else if (entry.name === 'wrangler.toml') {
      results.push(full);
    }
  }
  return results;
}

function parseWranglerToml(text) {
  const result = {
    name: null,
    main: null,
    services: [],
    d1: [],
    kv: [],
    r2: [],
    routes: [],
    customDomains: [],
    ai: false,
    queues: [],
    triggers: [],
  };

  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('name = ')) {
      result.name = trimmed.split('=')[1].trim().replace(/"/g, '');
    } else if (trimmed.startsWith('main = ')) {
      result.main = trimmed.split('=')[1].trim().replace(/"/g, '');
    } else if (trimmed.startsWith('[[services]]')) {
      const bindingLine = lines[lines.indexOf(line) + 1];
      if (bindingLine && bindingLine.trim().startsWith('binding = ')) {
        result.services.push(bindingLine.split('=')[1].trim().replace(/"/g, ''));
      }
    } else if (trimmed.startsWith('[[d1_databases]]')) {
      const bindingLine = lines[lines.indexOf(line) + 1];
      if (bindingLine && bindingLine.trim().startsWith('binding = ')) {
        result.d1.push(bindingLine.split('=')[1].trim().replace(/"/g, ''));
      }
    } else if (trimmed.startsWith('[[kv_namespaces]]')) {
      const bindingLine = lines[lines.indexOf(line) + 1];
      if (bindingLine && bindingLine.trim().startsWith('binding = ')) {
        result.kv.push(bindingLine.split('=')[1].trim().replace(/"/g, ''));
      }
    } else if (trimmed.startsWith('[[r2_buckets]]')) {
      const bindingLine = lines[lines.indexOf(line) + 1];
      if (bindingLine && bindingLine.trim().startsWith('binding = ')) {
        result.r2.push(bindingLine.split('=')[1].trim().replace(/"/g, ''));
      }
    } else if (trimmed.startsWith('[[routes]]')) {
      const patternLine = lines[lines.indexOf(line) + 1];
      if (patternLine && patternLine.trim().startsWith('pattern = ')) {
        result.routes.push(patternLine.split('=')[1].trim().replace(/"/g, ''));
      }
    } else if (trimmed.startsWith('[[custom_domains]]')) {
      const domainLine = lines[lines.indexOf(line) + 1];
      if (domainLine && domainLine.trim().startsWith('domain = ')) {
        result.customDomains.push(domainLine.split('=')[1].trim().replace(/"/g, ''));
      }
    } else if (trimmed.startsWith('[ai]')) {
      result.ai = true;
    } else if (trimmed.startsWith('[[queues]]')) {
      result.queues.push('queue');
    } else if (trimmed.startsWith('[triggers]') || trimmed.startsWith('[[triggers]]')) {
      result.triggers.push('trigger');
    }
  }

  return result;
}

function classifyMetaphor(entry) {
  const services = entry.services.join(',').toLowerCase();
  const hasAi = entry.ai;
  const hasD1 = entry.d1.length > 0;
  const hasKv = entry.kv.length > 0;
  const hasR2 = entry.r2.length > 0;
  const hasRoutes = entry.routes.length > 0 || entry.customDomains.length > 0;

  if (hasAi || services.includes('phos-ai-proxy') || services.includes('intent-resolver')) {
    return 'Transformer';
  }
  if (hasRoutes || entry.name?.includes('phos') || entry.name?.includes('p31ca') || entry.name?.includes('bonding') || entry.name?.includes('willow')) {
    return 'Inverter';
  }
  if (entry.name?.includes('gateway') || entry.name?.includes('auth') || entry.name?.includes('bouncer')) {
    return 'Regulator';
  }
  if (hasD1 || hasKv || hasR2 || services.includes('love-ledger')) {
    return 'Capacitor';
  }
  if (services.includes('rate-limit') || entry.name?.includes('willow-chat')) {
    return 'Resistor';
  }
  if (entry.queues.length > 0 || entry.triggers.length > 0 || services.includes('care-mesh')) {
    return 'Frequency Drive';
  }
  return 'Transformer';
}

function generateMermaid(nodes, edges) {
  const lines = ['graph TD'];
  lines.push('  classDef transformer fill:#00F0FF22,stroke:#00F0FF,color:#00F0FF');
  lines.push('  classDef inverter fill:#A78BFA22,stroke:#A78BFA,color:#A78BFA');
  lines.push('  classDef regulator fill:#FB718522,stroke:#FB7185,color:#FB7185');
  lines.push('  classDef capacitor fill:#34D39922,stroke:#34D399,color:#34D399');
  lines.push('  classDef resistor fill:#FBBF2422,stroke:#FBBF24,color:#FBBF24');
  lines.push('  classDef frequencyDrive fill:#818CF822,stroke:#818CF8,color:#818CF8');

  for (const node of nodes) {
    const label = `${METAPHOR_ICONS[node.metaphor] || '📦'} ${node.name}`;
    const safeId = node.name.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`  ${safeId}["${label}"]`);
    const cls = node.metaphor.toLowerCase().replace(/[^a-z]/g, '');
    const classMap = {
      'transformer': 'transformer',
      'inverter': 'inverter',
      'regulator': 'regulator',
      'capacitor': 'capacitor',
      'resistor': 'resistor',
      'frequencydrive': 'frequencyDrive',
    };
    lines.push(`  class ${safeId} ${classMap[cls] || 'transformer'}`);
  }

  for (const edge of edges) {
    const from = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
    const to = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`  ${from} --> ${to}`);
  }

  return lines.join('\n');
}

function generateDot(nodes, edges) {
  const lines = ['digraph G {'];
  lines.push('  rankdir=LR;');
  lines.push('  node [shape=box, style="rounded,filled", fontname="Inter"];');

  for (const node of nodes) {
    const color = METAPHOR_COLORS[node.metaphor] || '#888888';
    const label = `${METAPHOR_ICONS[node.metaphor] || '📦'} ${node.name}`;
    const safeId = node.name.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`  ${safeId} [label="${label}", fillcolor="${color}22", color="${color}"];`);
  }

  for (const edge of edges) {
    const from = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
    const to = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`  ${from} -> ${to};`);
  }

  lines.push('}');
  return lines.join('\n');
}

function buildCircuitMap(dot = false) {
  const nodes = [];
  const edges = [];
  const seen = new Set();

  for (const dir of DIRS) {
    const files = walkTomlFiles(dir);
    for (const file of files) {
      const text = readFileSync(file, 'utf-8');
      const entry = parseWranglerToml(text);

      if (!entry.name) continue;

      const metaphor = classifyMetaphor(entry);
      nodes.push({
        name: entry.name,
        metaphor,
        bindings: [
          ...entry.services.map(s => ({ type: 'service', name: s })),
          ...entry.d1.map(d => ({ type: 'd1', name: d })),
          ...entry.kv.map(k => ({ type: 'kv', name: k })),
          ...entry.r2.map(r => ({ type: 'r2', name: r })),
        ],
        routes: entry.routes,
        customDomains: entry.customDomains,
      });

      for (const svc of entry.services) {
        const edgeKey = `${entry.name}->${svc}`;
        if (!seen.has(edgeKey)) {
          seen.add(edgeKey);
          edges.push({ from: entry.name, to: svc, type: 'service' });
        }
      }
    }
  }

  if (dot) {
    return generateDot(nodes, edges);
  }
  return generateMermaid(nodes, edges);
}

// CLI
const args = process.argv.slice(2);
const dot = args.includes('--dot');
const outputIdx = args.indexOf('--output');
const output = outputIdx !== -1 ? args[outputIdx + 1] : null;

const diagram = buildCircuitMap(dot);

if (output) {
  const content = dot ? diagram : '```mermaid\n' + diagram + '\n```';
  try {
    import('fs').then(({ writeFileSync }) => {
      writeFileSync(output, content);
      console.log(`Circuit map written to ${output}`);
    });
  } catch {
    console.error('Failed to write file:', output);
    process.exit(1);
  }
} else {
  console.log(diagram);
}
