/**
 * @file Shared MCP tool logic — types, helpers, and data.
 * Consumed by tools.ts (stdio) and tools.worker.ts (Cloudflare Worker).
 */

import { TOKEN_MAP, TOKENS_DATA } from './tokens-data.js';
import { RECIPE_MAP, RECIPE_NAMES, RECIPES_CSS, RECIPE_CATEGORIES } from './recipes-data.js';
import { COMPONENT_CATEGORIES, type ComponentCategory } from '../componentDefs.js';

export { TOKEN_MAP, TOKENS_DATA };
export { RECIPE_MAP, RECIPE_NAMES, RECIPES_CSS, RECIPE_CATEGORIES };
export { COMPONENT_CATEGORIES, type ComponentCategory };

// ─── Types ──────────────────────────────────────────────────────────────────

export interface McpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: {
    name: string;
    arguments?: Record<string, any>;
  };
}

export interface ToolResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function ok(data: any): McpResponse {
  return { jsonrpc: '2.0', id: 0, result: data };
}

export function err(code: number, message: string, data?: any): McpResponse {
  return { jsonrpc: '2.0', id: 0, error: { code, message, data } };
}

export function toolOk(data: any): ToolResult {
  return { content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] };
}

export function toolErr(code: number, message: string, data?: any): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify({ code, message, data }, null, 2) }], isError: true };
}

export function findToken(path: string): { cssVar: string; value: string; raw: string } | undefined {
  return TOKEN_MAP[path];
}

export function resolveTokenValue(path: string, seen = new Set<string>()): string | undefined {
  const entry = TOKEN_MAP[path];
  if (!entry) return undefined;
  if (seen.has(path)) return `{${path}}`;
  seen.add(path);
  let value = entry.value;
  if (value.includes('{')) {
    value = value.replace(/\{([^}]+)\}/g, (_match: string, ref: string) => {
      const resolved = resolveTokenValue(ref, seen);
      return resolved ?? `{${ref}}`;
    });
  }
  return value;
}

export function extractClasses(code: string): Set<string> {
  const classes = new Set<string>();
  const regex = /(?:class|className)\s*=\s*(?:"([^"]+)"|'([^']+)')/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const cls = match[1] ?? match[2];
    if (cls) {
      cls.split(/\s+/).forEach(c => { if (c) classes.add(c); });
    }
  }
  return classes;
}

export function extractTokens(code: string): Set<string> {
  const tokens = new Set<string>();
  const regex = /var\(--([a-zA-Z0-9-]+)(?:\s*,[^)]*)?\)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    tokens.add(match[1]);
  }
  return tokens;
}
