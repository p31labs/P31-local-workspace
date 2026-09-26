/**
 * @file Single source of truth for MCP tool metadata.
 *
 * Extracted from the duplicated tool lists that previously lived in
 * server.ts and http-worker.ts. Both consumers now import from here,
 * eliminating drift between stdio and HTTP tool registries.
 *
 * Note: this module is pure TypeScript with no Node.js or Cloudflare
 * runtime imports, so it can be safely consumed by both the stdio
 * server and the Cloudflare Worker HTTP endpoint.
 */

import { COMPONENT_CATEGORIES } from '../componentDefs.js';

export const SERVER_NAME = 'p31-design-mcp';
export const SERVER_VERSION = '2.2.0';

export const SERVER_INFO = {
  name: SERVER_NAME,
  version: SERVER_VERSION,
  description: 'P31 Design System — tokens, components, CSS recipes, multi-framework converter, and WCAG audit tools.',
};

export interface McpToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const MCP_TOOLS: McpToolSchema[] = [
  {
    name: 'list_tokens',
    description: 'List all P31 design tokens (colors, spacing, typography, glass, motion). Returns token paths, CSS variables, and resolved values. Supports category filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['all', 'color', 'spacing', 'typography', 'glass', 'motion', 'z-index'],
          default: 'all',
          description: 'Filter tokens by category. Use "all" for the complete set.',
        },
      },
    },
  },
  {
    name: 'resolve_token',
    description: 'Resolve a single design token path to its CSS custom property and value, following {ref} indirections. Example: resolve_token("color.accent.default") → "--p31-color-accent-default: oklch(65% 0.18 195)".',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Dot-separated token path, e.g. "color.accent.default" or "glass.blur"',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_tokens',
    description: 'Search tokens by keyword. Returns matching token paths, CSS variables, and resolved values.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term, e.g. "cyan", "blur", or "radius"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_tokens_dtc',
    description: 'List all P31 design tokens in W3C Design Tokens Format Module 2025.10 (DTCG) JSON. Returns the complete token set with $value, $type, and $description fields for AI consumption and design-tool interchange.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_components',
    description: `List all available P31 design system components with their CSS classes, category, and AI guidance. Supports category filtering. Valid categories: ${COMPONENT_CATEGORIES.join(', ')}.`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['all', ...COMPONENT_CATEGORIES],
          default: 'all',
          description: 'Filter components by category. Use "all" for the complete set.',
        },
      },
    },
  },
  {
    name: 'get_component',
    description: 'Get the full definition of a P31 component: CSS class, category, tokens used, props, slots, variants, and AI guidance (useWhen / avoidWhen / examples).',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Component name, e.g. "GlassPanel", "Topbar", "SpoonDial"',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_component_metadata',
    description: 'Get structured metadata for a P31 component: props, slots, variants, accessibility requirements, status, and import path. Optimized for AI agent consumption.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Component name, e.g. "GlassPanel", "Topbar", "SpoonDial"',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'validate_component',
    description: 'Validate a component usage against P31 design rules. Checks for hardcoded colors, token usage, and component-specific constraints.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Component name to validate against',
        },
        code: {
          type: 'string',
          description: 'Optional code snippet to validate',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'resolve_brand',
    description: 'Resolve a brand token set by extending a base theme. Returns the merged token map for the requested brand (e.g. p31ca, phos, phosphorus31, willow, bonding).',
    inputSchema: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          enum: ['p31ca', 'phos', 'phosphorus31', 'willow', 'bonding'],
          description: 'Brand identifier',
        },
      },
      required: ['brand'],
    },
  },
  {
    name: 'generate_component',
    description: 'Generate a P31 component in the target framework. Returns fully commented source code. For webcomponent, produces a self-registering Shadow DOM custom element. For react/astro/html, produces framework-native output.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Component name, e.g. "GlassPanel"',
        },
        framework: {
          type: 'string',
          enum: ['react', 'astro', 'html', 'webcomponent'],
          description: 'Target framework',
        },
        options: {
          type: 'object',
          description: 'Optional generation options (e.g. { strong: true })',
        },
      },
      required: ['name', 'framework'],
    },
  },
  {
    name: 'list_recipes',
    description: 'List all CSS recipe classes available in the P31 design system. Recipes are framework-agnostic CSS classes usable in any HTML/React/Astro context. Returns category taxonomy when no filter is applied.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          default: 'all',
          description: 'Filter recipes by CSS section header (e.g. "Glass Morphism Tiers", "Buttons", "Bottom Navigation"). Omit or use "all" to list all recipes and the full category taxonomy.',
        },
      },
    },
  },
  {
    name: 'get_recipe',
    description: 'Get the CSS source code for a specific recipe class, e.g. get_recipe("glass-panel") returns the exact CSS rules.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Recipe class name, e.g. "glass-panel", "topbar", "spoon-dial"',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'convert_component',
    description: 'Convert a component between frameworks. Supports react ↔ astro ↔ html round-tripping. Preserves CSS classes and validates visual parity.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['react', 'astro', 'html'],
          description: 'Source framework',
        },
        target: {
          type: 'string',
          enum: ['react', 'astro', 'html'],
          description: 'Target framework',
        },
        code: {
          type: 'string',
          description: 'Source component code to convert',
        },
        componentName: {
          type: 'string',
          description: 'Component name for generated output',
        },
      },
      required: ['source', 'target', 'code', 'componentName'],
    },
  },
  {
    name: 'audit_css',
    description: 'Audit CSS/HTML content for P31 design system compliance. Flags hardcoded values, missing token usage, and accessibility issues.',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'CSS/HTML content to audit',
        },
        strict: {
          type: 'boolean',
          default: false,
          description: 'If true, fail on every hardcoded value. If false, only warn.',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'validate_parity',
    description: 'Validate that two components (e.g. React and Astro versions) use the same design tokens and CSS classes. Returns a parity report.',
    inputSchema: {
      type: 'object',
      properties: {
        sourceContent: {
          type: 'string',
          description: 'Source component code',
        },
        targetContent: {
          type: 'string',
          description: 'Target component code',
        },
      },
      required: ['sourceContent', 'targetContent'],
    },
  },
  {
    name: 'get_ui_principles',
    description: 'Get the P31 UI/UX design principles that govern all component decisions (glassmorphism, spoon-aware motion, crisis mode, single accent).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_review_rules',
    description: 'Get the automated review rules for checking design system compliance in generated code.',
    inputSchema: { type: 'object', properties: {} },
  },
];
