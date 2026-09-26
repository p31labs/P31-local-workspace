/**
 * @file Pure MCP tool logic — transport-agnostic.
 *
 * This module contains all 13 tool handlers with no dependency on
 * StdioServerTransport, Node.js fs, or Cloudflare Worker runtime.
 * It can be consumed by:
 *   - src/mcp/server.ts          (stdio, local IDE)
 *   - src/mcp/http-worker.ts     (HTTP, Cloudflare Workers)
 */

import {
  listComponents,
  getComponentDef,
  COMPONENT_DEFS,
  COMPONENT_CATEGORIES,
  type ComponentCategory,
} from '../componentDefs.js';
import {
  generateReact,
  generateAstro,
  generateHtml,
  generateWebComponents,
} from '../generator/index.js';
import {
  convertReactToAstro,
  convertAstroToReact,
  convertHtmlToReact,
  convertReactToHtml,
} from '../converter/index.js';
import { auditCssFile } from '../converter/audit.js';
import { getPrinciples, getReviewRules } from '../principles.js';
import {
  TOKEN_MAP,
  TOKENS_DATA,
  RECIPE_MAP,
  RECIPE_NAMES,
  RECIPES_CSS,
  RECIPE_CATEGORIES,
} from './shared.js';
import { TOKENS_DTC } from './tokens-dtc.js';
import { resolveBrandTokens } from '../theming/theme-store.js';

import type {
  McpRequest,
  McpResponse,
  ToolResult,
} from './shared.js';
import {
  findToken,
  resolveTokenValue,
  extractClasses,
  extractTokens,
} from './shared.js';

// ─── Tool Handlers ──────────────────────────────────────────────────────────

export function handleToolCall(name: string, args: Record<string, any> = {}): ToolResult {
  try {
    switch (name) {
      // ─── Tokens ────────────────────────────────────────────────────────

      case 'list_tokens': {
        const category = args.category || 'all';
        let tokens = TOKENS_DATA.map(t => ({
          path: t.path,
          cssVar: t.cssVar,
          value: resolveTokenValue(t.path) || t.value,
        }));

        if (category !== 'all') {
          tokens = tokens.filter(t => t.path.startsWith(category));
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({ count: tokens.length, tokens }, null, 2) }],
        };
      }

      case 'resolve_token': {
        const { path } = args;
        if (!path) return { content: [{ type: 'text', text: 'Missing required arg: path' }], isError: true };

        const entry = findToken(path);
        if (!entry) {
          return { content: [{ type: 'text', text: `Token not found: ${path}` }], isError: true };
        }

        const value = resolveTokenValue(path) || entry.value;
        return {
          content: [{ type: 'text', text: JSON.stringify({ path, cssVar: entry.cssVar, value }, null, 2) }],
        };
      }

      case 'search_tokens': {
        const { query } = args;
        if (!query) return { content: [{ type: 'text', text: 'Missing required arg: query' }], isError: true };

        const lowerQuery = query.toLowerCase();
        const matches = TOKENS_DATA
          .filter(t => {
            const resolved = resolveTokenValue(t.path) || t.value;
            return t.path.toLowerCase().includes(lowerQuery) || resolved.toLowerCase().includes(lowerQuery);
          })
          .map(t => ({
            path: t.path,
            cssVar: t.cssVar,
            value: resolveTokenValue(t.path) || t.value,
          }));

        return {
          content: [{ type: 'text', text: JSON.stringify({ count: matches.length, matches }, null, 2) }],
        };
      }

      case 'list_tokens_dtc': {
        return {
          content: [{ type: 'text', text: JSON.stringify(TOKENS_DTC, null, 2) }],
        };
      }

      // ─── Components ────────────────────────────────────────────────────

      case 'list_components': {
        const category = args.category as string | undefined;
        let entries = Object.entries(COMPONENT_DEFS);
        if (category && category !== 'all') {
          if (!COMPONENT_CATEGORIES.includes(category as ComponentCategory)) {
            return {
              content: [{
                type: 'text',
                text: `Invalid category: ${category}. Valid categories: ${COMPONENT_CATEGORIES.join(', ')}`,
              }],
              isError: true,
            };
          }
          entries = entries.filter(([_, def]) => def.category === (category as ComponentCategory));
        }
        const result = entries.map(([name, def]) => ({
          name,
          description: def.description || '',
          css_class: def.css_class,
          category: def.category,
        }));
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_component': {
        const { name } = args;
        if (!name) return { content: [{ type: 'text', text: 'Missing required arg: name' }], isError: true };
        const def = COMPONENT_DEFS[name];
        if (!def) return { content: [{ type: 'text', text: `Component not found: ${name}` }], isError: true };
        return { content: [{ type: 'text', text: JSON.stringify(def, null, 2) }] };
      }

      case 'generate_component': {
        const { name, framework, options } = args;
        if (!name || !framework) {
          return { content: [{ type: 'text', text: 'Missing required args: name, framework' }], isError: true };
        }

        const def = COMPONENT_DEFS[name];
        if (!def) return { content: [{ type: 'text', text: `Component not found: ${name}` }], isError: true };

        let code = '';
        switch (framework) {
          case 'react': {
            const files = generateReact({ ...options, component: name });
            code = files[0]?.code || '';
            break;
          }
          case 'astro': {
            const files = generateAstro({ ...options, component: name });
            code = files[0]?.code || '';
            break;
          }
          case 'html': {
            const files = generateHtml({ ...options, component: name });
            code = files[0]?.code || '';
            break;
          }
          case 'webcomponent': {
            const files = generateWebComponents({ ...options, component: name });
            code = files[0]?.code || '';
            break;
          }
          default:
            return { content: [{ type: 'text', text: `Unsupported framework: ${framework}` }], isError: true };
        }

        return { content: [{ type: 'text', text: code }] };
      }

      // ─── Recipes ───────────────────────────────────────────────────────

      case 'list_recipes': {
        const category = args.category as string | undefined;
        if (category && category !== 'all') {
          const recipes = RECIPE_CATEGORIES[category];
          if (!recipes) {
            return {
              content: [{
                type: 'text',
                text: `Unknown category: ${category}. Valid categories: ${Object.keys(RECIPE_CATEGORIES).join(', ')}`,
              }],
              isError: true,
            };
          }
          return {
            content: [{ type: 'text', text: JSON.stringify({ count: recipes.length, category, recipes }, null, 2) }],
          };
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              count: RECIPE_NAMES.length,
              categories: Object.keys(RECIPE_CATEGORIES),
              recipes: RECIPE_NAMES,
            }, null, 2),
          }],
        };
      }

      case 'get_recipe': {
        const { name } = args;
        if (!name) return { content: [{ type: 'text', text: 'Missing required arg: name' }], isError: true };
        const css = RECIPE_MAP[name];
        if (!css) return { content: [{ type: 'text', text: `Recipe not found: ${name}` }], isError: true };
        return { content: [{ type: 'text', text: css }] };
      }

      case 'get_component_metadata': {
        const { name } = args;
        if (!name) return { content: [{ type: 'text', text: 'Missing required arg: name' }], isError: true };
        const def = getComponentDef(name);
        if (!def) return { content: [{ type: 'text', text: `Component not found: ${name}` }], isError: true };
        return {
          content: [{ type: 'text', text: JSON.stringify(def, null, 2) }],
        };
      }

      case 'validate_component': {
        const { name, code } = args;
        if (!name) return { content: [{ type: 'text', text: 'Missing required arg: name' }], isError: true };
        const def = getComponentDef(name);
        if (!def) return { content: [{ type: 'text', text: `Component not found: ${name}` }], isError: true };
        const issues: string[] = [];
        if (code) {
          const hasHex = /#[0-9a-fA-F]{3,8}/.test(code);
          if (hasHex) issues.push('Hardcoded hex colors detected — use var(--p31-*) tokens');
          const hasRgba = /rgba?\(/.test(code);
          if (hasRgba) issues.push('Hardcoded rgba() detected — use var(--p31-*) tokens or color-mix()');
        }
        const usesTokens = def.tokens.length > 0;
        if (!usesTokens) issues.push('Component does not declare any design tokens');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              component: name,
              valid: issues.length === 0,
              issues,
              tokenCount: def.tokens.length,
              status: def.status || 'stable',
            }, null, 2),
          }],
        };
      }

      case 'resolve_brand': {
        const { brand } = args;
        if (!brand) return { content: [{ type: 'text', text: 'Missing required arg: brand' }], isError: true };
        try {
          const tokens = resolveBrandTokens(brand as 'p31ca' | 'phos' | 'phosphorus31' | 'willow' | 'bonding');
          return {
            content: [{ type: 'text', text: JSON.stringify({ brand, tokens, count: Object.keys(tokens).length }, null, 2) }],
          };
        } catch (e) {
          return { content: [{ type: 'text', text: `Invalid brand: ${brand}. Valid: p31ca, phos, phosphorus31, willow, bonding` }], isError: true };
        }
      }

      // ─── Converter ────────────────────────────────────────────────────

      case 'convert_component': {
        const { source, target, code, componentName } = args;
        if (!source || !target || !code || !componentName) {
          return { content: [{ type: 'text', text: 'Missing required args: source, target, code, componentName' }], isError: true };
        }

        let result = '';
        const key = `${source}->${target}`;

        switch (key) {
          case 'react->astro':
            result = convertReactToAstro(code, componentName);
            break;
          case 'astro->react':
            result = convertAstroToReact(code, componentName);
            break;
          case 'html->react':
            result = convertHtmlToReact(code, componentName);
            break;
          case 'react->html':
            result = convertReactToHtml(code, componentName);
            break;
          default:
            return { content: [{ type: 'text', text: `Unsupported conversion: ${source} → ${target}` }], isError: true };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ source, target, componentName, code: result }, null, 2),
          }],
        };
      }

      // ─── Audit ────────────────────────────────────────────────────────

      case 'audit_css': {
        const { content: cssContent, strict = false } = args;
        if (!cssContent) return { content: [{ type: 'text', text: 'Missing required arg: content' }], isError: true };
        const violations = auditCssFile(cssContent, strict);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ violationCount: violations.length, violations }, null, 2),
          }],
        };
      }

      case 'validate_parity': {
        const { sourceContent, targetContent } = args;
        if (!sourceContent || !targetContent) {
          return { content: [{ type: 'text', text: 'Missing required args: sourceContent, targetContent' }], isError: true };
        }

        const sourceClasses = extractClasses(sourceContent);
        const targetClasses = extractClasses(targetContent);
        const sourceTokens = extractTokens(sourceContent);
        const targetTokens = extractTokens(targetContent);

        const missingInTarget = Array.from(sourceClasses).filter(c => !targetClasses.has(c));
        const missingInSource = Array.from(targetClasses).filter(c => !sourceClasses.has(c));
        const missingTokens = Array.from(sourceTokens).filter(t => !targetTokens.has(t));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              parity: missingInTarget.length === 0 && missingInSource.length === 0 && missingTokens.length === 0,
              missingClassesInTarget: missingInTarget,
              missingClassesInSource: missingInSource,
              missingTokens,
            }, null, 2),
          }],
        };
      }

      // ─── Principles ───────────────────────────────────────────────────

      case 'get_ui_principles': {
        const principles = getPrinciples();
        return { content: [{ type: 'text', text: JSON.stringify(principles, null, 2) }] };
      }

      case 'get_review_rules': {
        const rules = getReviewRules();
        return { content: [{ type: 'text', text: JSON.stringify(rules, null, 2) }] };
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
}
