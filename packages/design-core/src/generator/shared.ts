/**
 * @file Shared types, YAML parsing, and token resolution for design-core generators.
 * Single source of truth for component/token I/O across all adapters.
 */

import { readFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export const ROOT = resolve(process.cwd(), '..', '..');
export const COMPONENTS_YAML = resolve(ROOT, 'cli', 'tokens', 'components.yml');
export const TOKENS_YAML = resolve(ROOT, 'cli', 'tokens', 'tokens.yml');

export interface ComponentDef {
  description?: string;
  css_class?: string;
  aiGuidance?: {
    useWhen?: string;
    avoidWhen?: string;
    examples?: string[];
  };
  props?: Record<string, any>;
  slots?: string[];
  variants?: string[];
  tokens?: string[];
}

export interface ComponentsFile {
  version: string;
  components: Record<string, ComponentDef>;
}

export interface TokensFile {
  version: string;
  primitive: Record<string, any>;
  semantic: Record<string, any>;
  component?: Record<string, any>;
  theme?: Record<string, any>;
  bounding_boxes?: Record<string, any>;
  layout_containers?: Record<string, any>;
  spacing_rules?: Record<string, any>;
  cascade_layers?: Record<string, any>;
  svg_rules?: Record<string, any>;
}

export interface GeneratedFile {
  name: string;
  path: string;
  code: string;
}

export function cssVarName(pathStr: string): string {
  return '--p31-' + pathStr.replace(/\./g, '-');
}

export interface GeneratorOptions {
  component?: string;
  componentsPath?: string;
  tokensPath?: string;
  outputDir?: string;
  force?: boolean;
  parallel?: boolean;
  componentsData?: any;
  tokensData?: TokensFile;
}

export function parseYamlSimple(text: string): any {
  const root: any = {};
  const lines = text.split('\n');
  const stack: { obj: any; indent: number }[] = [{ obj: root, indent: -1 }];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    const content = line.trim();

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1].obj;

    if (content.startsWith('- ')) {
      const value = content.slice(2).replace(/^["']|["']$/g, '');
      const parent = stack[stack.length - 2]?.obj;
      const lastKey = parent ? Object.keys(parent).pop() : undefined;

      if (lastKey && !Array.isArray(parent[lastKey])) {
        parent[lastKey] = [];
      }

      const targetArray = lastKey ? parent[lastKey] : current;
      if (Array.isArray(targetArray)) {
        targetArray.push(value);
      }
    } else if (content.includes(':')) {
      const colonIndex = content.indexOf(':');
      const key = content.slice(0, colonIndex).trim();
      const value = content.slice(colonIndex + 1).trim();

      if (!value) {
        current[key] = {};
        stack.push({ obj: current[key], indent });
      } else if (value.startsWith('[') && value.endsWith(']')) {
        current[key] = value.slice(1, -1).split(',').map((v: string) => v.trim().replace(/^["']|["']$/g, ''));
      } else {
        current[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  return root;
}

export function loadYaml(path: string): any {
  const content = readFileSync(path, 'utf-8');
  return parseYamlSimple(content);
}

export function loadComponents(path = COMPONENTS_YAML): ComponentsFile {
  return loadYaml(path) as ComponentsFile;
}

export function loadTokens(path = TOKENS_YAML): TokensFile {
  return loadYaml(path) as TokensFile;
}

export function resolveRawToken(pathStr: string, tokens: TokensFile): any {
  const parts = pathStr.split('.');
  let node: any = tokens;
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return node?.$value ?? node;
}

export function resolveToken(pathStr: string, tokens: TokensFile): string | undefined {
  const raw = resolveRawToken(pathStr, tokens);
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string') return String(raw);
  return resolveReferences(raw, tokens);
}

export function resolveReferences(value: string, tokens: TokensFile, seen = new Set<string>()): string {
  return value.replace(/\{([^}]+)\}/g, (_, ref) => {
    if (seen.has(ref)) return `{${ref}}`;
    seen.add(ref);
    const resolved = resolveRawToken(ref, tokens);
    if (resolved === undefined) return `{${ref}}`;
    return typeof resolved === 'string' ? resolveReferences(resolved, tokens, seen) : String(resolved);
  });
}

export function tokenPathToVar(pathStr: string): string {
  return '--p31-' + pathStr.replace(/\./g, '-');
}

export function resolveTokenVar(pathStr: string, tokens: TokensFile): string {
  const value = resolveToken(pathStr, tokens);
  if (value === undefined) return `var(${tokenPathToVar(pathStr)})`;
  return value;
}

export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeJs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
}

export function ensureDir(dir: string): void {
  try {
    mkdirSync(dir, { recursive: true });
  } catch {}
}
