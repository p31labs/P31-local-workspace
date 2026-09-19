#!/usr/bin/env node
/**
 * @p31/canon-mcp — src/server.ts
 *
 * The canon's agent-facing surface. An MCP server that exposes the canon's
 * component contracts as tools. Agents call:
 *
 *   list_components — what components have a contract today
 *   get_contract    — read the full contract for one component
 *   validate_props  — check a props payload against a contract
 *   list_tokens     — what tokens EXIST in the DTCG tree (verified source)
 *
 * Everything is derived, nothing is hardcoded. The REGISTRY below is built
 * by walking src/contracts/*.contract.ts and import()ing each — the exact
 * same walk validate-contracts.mjs performs. A contract that does not
 * validate on disk does not get registered. An agent can never receive a
 * contract the canon does not believe in.
 *
 * Tools note (2026 SDK v2): @modelcontextprotocol/server v2 registers
 * tools via server.registerTool(name, { inputSchema, description }, fn),
 * not the deprecated server.tool() form. Zod v4 is the schema language.
 *
 * Run: npm run start   (tsx, stdio transport)
 */
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ComponentContract } from '@p31/canon/contracts';
import { observe, traverse, propose, awaitReviews, resolveLogPath } from './loom-tools';

const here = dirname(fileURLToPath(import.meta.url));
const canonRoot = resolve(here, '..', '..', 'canon');
const contractsDir = join(canonRoot, 'src', 'contracts');
const dtcgPath = join(canonRoot, 'tokens', 'tokens.dtc.json');

// Startup gate: @p31/canon must be present and have contracts
if (!existsSync(contractsDir)) {
  console.error(`⛔ canon-mcp: FATAL — @p31/canon not found at ${canonRoot}`);
  console.error('   Install with: npm install @p31/canon (or check file: dependency)');
  process.exit(1);
}

/** Walk a DTCG tree and return every leaf path with $value. */
function walkDtcg(
  node: unknown,
  prefix: string[] = [],
  out: Array<{ path: string; value: unknown; type: string }> = [],
): Array<{ path: string; value: unknown; type: string }> {
  if (!node || typeof node !== 'object') return out;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (value && typeof value === 'object' && '$value' in value) {
      const v = value as { $value: unknown; $type?: string };
      out.push({ path: [...prefix, key].join('.'), value: v.$value, type: v.$type ?? 'unknown' });
    } else if (value && typeof value === 'object') {
      walkDtcg(value, [...prefix, key], out);
    }
  }
  return out;
}

/** Build the registry from disk — same walk as validate-contracts.mjs.
 * Returns { registry, dropped } — callers must check dropped.length and fail
 * if any contracts were dropped. A partial registry is worse than empty. */
async function buildRegistry(): Promise<{
  registry: Map<string, ComponentContract>;
  dropped: string[];
}> {
  const registry = new Map<string, ComponentContract>();
  const dropped: string[] = [];
  for (const entry of readdirSync(contractsDir)) {
    if (!entry.endsWith('.contract.ts')) continue;
    const stem = basename(entry, '.contract.ts');
    try {
      const mod = await import(join(canonRoot, 'src', 'contracts', entry).replace(/\\/g, '/'));
      const contract = Object.values(mod).find((v): v is ComponentContract => {
        return typeof v === 'object' && v !== null && 'layer' in v && 'intent' in v;
      });
      if (!contract) throw new Error(`${entry}: no component contract export found`);
      registry.set(stem.toLowerCase(), contract);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dropped.push(`${entry}: ${msg}`);
    }
  }
  return { registry, dropped };
}

const { registry: REGISTRY, dropped: DROPPED } = await buildRegistry();

// Hard gate: the server must serve EVERY contract, or none.
// A partial registry is worse than empty — an agent that calls list_components
// and gets four of five contracts, with the fifth missing and unannounced,
// will write code against a canon that doesn't exist. Fail instead.
if (DROPPED.length > 0) {
  console.error('⛔ canon-mcp: FATAL — contracts were dropped during registry build:');
  for (const d of DROPPED) console.error(`   - ${d}`);
  console.error('   A partial registry is worse than empty. Fix the contracts or exit.');
  process.exit(1);
}

// Empty registry gate (kept from the original startup gate)
if (REGISTRY.size === 0) {
  console.error('⛔ canon-mcp: FATAL — no contracts registered. Check that @p31/canon is installed and contracts exist.');
  process.exit(1);
}

const server = new McpServer({ name: 'p31-canon', version: '0.1.0' });

// The Loom's shared log — resolved once, shared by all four loom_* tools.
const loomLogPath = resolveLogPath();

server.registerTool(
  'list_components',
  {
    description:
      'List every component that has a machine-readable contract in the P31 canon. ' +
      'Call this first to discover what exists before writing code.',
    inputSchema: z.object({
      layer: z
        .enum(['contract', 'primitive', 'semantic', 'component', 'composition'])
        .optional()
        .describe('Filter by canon layer. Omit for all.'),
    }),
  },
  async ({ layer }) => {
    const items = [...REGISTRY.values()]
      .filter((c) => !layer || c.layer === layer)
      .map((c) => ({ name: c.name, layer: c.layer, intent: c.intent, props: c.props.length }));
    return {
      content: [{ type: 'text', text: JSON.stringify({ components: items }, null, 2) }],
    };
  },
);

server.registerTool(
  'get_contract',
  {
    description:
      'Read the FULL contract for a single component — props, semantics, required ARIA, ' +
      'token references, import statement. Read this before writing any code against the component.',
    inputSchema: z.object({
      component: z.string().describe('Component name, case-insensitive. e.g. "Button".'),
    }),
  },
  async ({ component }) => {
    const contract = REGISTRY.get(component.toLowerCase());
    if (!contract) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'component_not_found',
              message: `No contract registered for "${component}". Call list_components to see what exists.`,
            }),
          },
        ],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: JSON.stringify(contract, null, 2) }] };
  },
);

server.registerTool(
  'validate_props',
  {
    description:
      'Validate a props payload AGAINST a component contract. Returns every violation: ' +
      'unknown props, invalid enum values, missing required props. Call this after writing ' +
      'component code to prove it satisfies the contract. NOTE: this tool validates a props ' +
      'object, not the contract definition itself — contract-definition validation happens at ' +
      'build time via validate-contracts.mjs.',
    inputSchema: z.object({
      component: z.string().describe('Component name, case-insensitive. e.g. "Button".'),
      props: z.record(z.string(), z.unknown()).describe('The props object to validate.'),
    }),
  },
  async ({ component, props }) => {
    const contract = REGISTRY.get(component.toLowerCase());
    if (!contract) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'component_not_found',
              message: `No contract registered for "${component}".`,
            }),
          },
        ],
        isError: true,
      };
    }

    const violations = [];
    const declared = new Map(contract.props.map((p) => [p.name, p]));

    // Closed-shape enforcement: every provided prop must be declared.
    for (const key of Object.keys(props)) {
      if (!declared.has(key)) {
        violations.push({ kind: 'unknown_prop', prop: key, message: `"${key}" is not declared on ${contract.name}. Declared: ${[...declared.keys()].join(', ')}` });
      }
    }

    // Enum + required enforcement.
    for (const def of contract.props) {
      const provided = props[def.name];
      if (def.required && provided === undefined) {
        violations.push({ kind: 'missing_required', prop: def.name, message: `"${def.name}" is required on ${contract.name}.` });
      } else if (def.type === 'enum' && provided !== undefined) {
        const options = def.options ?? [];
        if (!options.includes(String(provided))) {
          violations.push({ kind: 'invalid_enum', prop: def.name, message: `"${provided}" is not a valid option. Valid: ${options.join(', ')}` });
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { component: contract.name, valid: violations.length === 0, violations },
            null,
            2,
          ),
        },
      ],
    };
  },
);

server.registerTool(
  'list_tokens',
  {
    description:
      'List every token that EXISTS in the canon DTCG tree — BOTH namespaces. ' +
      'Each result is flagged contractResolvable: only tokens whose path starts with ' +
      '"p31." may be referenced by a component contract (validate-contracts hard-gates ' +
      'on the p31.* namespace). Tokens under "themes.<id>.*" are the per-theme palette ' +
      'for external designers — informational, present for inspection, NEVER contract-resolvable. ' +
      'This walks tokens/tokens.dtc.json — the same tree validate-contracts hard-gates against.',
    inputSchema: z.object({
      prefix: z.string().optional().describe('Filter to paths starting with this prefix, e.g. "p31.color.action".'),
      resolvable: z
        .boolean()
        .optional()
        .describe('If true, return only contractResolvable tokens (p31.*). If false, only informational (themes.*). Omit for all.'),
    }),
  },
  async ({ prefix, resolvable }) => {
    let all: Array<{ path: string; value: unknown; type: string }> = [];
    try {
      const raw = JSON.parse(readFileSync(dtcgPath, 'utf8'));
      // Walk the WHOLE tree so themes.<id>.* and p31.* both appear. Earlier
      // this only walked raw.p31 — but tokens.dtc.json has 261 per-theme
      // palette leaves that designers DO inspect. The old walker returned
      // less than the description promised it would ("every token that
      // EXISTS in the DTCG tree"). Fixed here; the shoe drops on both.
      all = walkDtcg(raw, []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: 'dtcg_unreadable', message: msg }) }],
        isError: true,
      };
    }
    const filtered = all
      .filter((t) => {
        if (prefix && !t.path.startsWith(prefix)) return false;
        const cr = t.path.startsWith('p31.');
        if (resolvable === true && !cr) return false;
        if (resolvable === false && cr) return false;
        return true;
      })
      .map((t) => ({
        path: t.path,
        contractResolvable: t.path.startsWith('p31.'),
        type: t.type,
      }));
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { count: filtered.length, tokens: filtered },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// ── Loom presence tools ────────────────────────────────────────────────
// The agent-facing half of the shared event log. Every write goes through
// commit(); these emit agent-only events (traverse/propose). Observe/await
// read the log. See loom-tools.ts for the shared handlers.

server.registerTool(
  'loom_observe',
  {
    description:
      'Observe the live Loom: what the human is focused on, where the agent cursor is, ' +
      'the agent attention level, and every open proposal. Reads the current state of the shared log.',
    inputSchema: z.object({
      proposalId: z.string().optional().describe('If set, also return this single proposal (or null).'),
    }),
  },
  async ({ proposalId }) => {
    const view = observe(loomLogPath, proposalId);
    return { content: [{ type: 'text', text: JSON.stringify(view, null, 2) }] };
  },
);

server.registerTool(
  'loom_traverse',
  {
    description:
      'Record a traversal step through the design-system graph (agent-only). Appends to the shared log through the gate.',
    inputSchema: z.object({
      from: z.string().describe('Bare node name the traversal starts from, e.g. "--p31-accent".'),
      to: z.string().describe('Bare node name the traversal ends at, e.g. ".glass-card".'),
      reason: z.string().describe('Why the step was taken, e.g. "referenced-by".'),
    }),
  },
  async ({ from, to, reason }) => {
    const r = traverse(loomLogPath, from, to, reason);
    return { content: [{ type: 'text', text: JSON.stringify(r) }], isError: !r.valid };
  },
);

server.registerTool(
  'loom_propose',
  {
    description:
      'Propose a change against a node in the graph (agent-only). The id is caller-chosen and must be unique. Appends through the gate.',
    inputSchema: z.object({
      id: z.string().describe('Unique proposal id, e.g. "prop_demo_1".'),
      node: z.string().describe('Bare node name the proposal targets, e.g. ".feature-card".'),
      body: z.unknown().describe('The proposal body (any JSON).'),
      author: z.string().optional().describe('Free-form agent identity (e.g. "presence-01"). Omit for "unknown".'),
    }),
  },
  async ({ id, node, body, author }) => {
    const r = propose(loomLogPath, id, node, body, author);
    return { content: [{ type: 'text', text: JSON.stringify(r) }], isError: !r.valid };
  },
);

server.registerTool(
  'loom_await',
  {
    description:
      'Wait for a review event on a proposal, up to timeoutMs. Returns { status: "timeout" } ' +
      'when nothing arrives — a return value, not an error. Waits on the log file via fs.watch, ' +
      'not polling.',
    inputSchema: z.object({
      proposalId: z.string(),
      timeoutMs: z.number().int().positive().max(120000).optional().describe('Default 30000, max 120000.'),
    }),
  },
  async ({ proposalId, timeoutMs }) => {
    const result = await awaitReviews(loomLogPath, proposalId, timeoutMs ?? 30_000);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  },
);

serveStdio(() => server);
