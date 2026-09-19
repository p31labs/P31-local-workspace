/**
 * @p31/canon — contracts/badge.contract.ts
 *
 * The Badge contract — the Loom's first artifact produced end-to-end by the
 * real contract agent (loom-contract-agent.mjs): the agent read registry.json
 * + src/css/recipes.css, found `.badge` + its four tone modifiers, and
 * proposed this contract; a human approved and landed it as this file.
 *
 * Honest tokenContract: the badge consumes `p31.radius-full` and
 * `p31.scale-xs` via var(). Its four status tones (success/warning/error/
 * info) are HARDCODED rgba in recipes.css, NOT consumed via tokens — that
 * is a real finding, recorded as a caveat below rather than papered over.
 * A contract that lies is forbidden; this one names the gap.
 */
import type { ComponentContract } from './schema';

export const badgeContract: ComponentContract = {
  name: 'Badge',

  layer: 'component',

  status: 'planned',

  intent: 'Display a compact status or category label. A small, non-interactive pill.',
  props: [
    {
      name: 'variant',
      type: 'enum',
      required: false,
      description: 'Semantic tone. success/warning/error/info map to the four status colours.',
      options: ['success', 'warning', 'error', 'info'],
      default: 'info',
    },
    {
      name: 'children',
      type: 'node',
      required: true,
      description: 'The label text.',
    },
  ],

  tokenContract: ['p31.radius-full', 'p31.scale-xs'],

  semanticParts: [
    { name: 'container', description: 'The pill element.' },
    { name: 'label', description: 'The text content.' },
  ],

  requiredAria: [
    { attribute: 'aria-live', required: false, description: 'Present for live status badges.' },
  ],

  interactionStates: {
    default: {
      description: 'Pill renders with the variant tone applied and label visible.',
      property: 'background-color',
      matcher: 'not-empty',
      trigger: 'none',
      fixture: { children: 'Active', variant: 'info' },
    },
  },

  caveats: [
    {
      field: 'tokenContract',
      reason:
        'The four status colours are hardcoded rgba in recipes.css (.badge-success/-warning/-error/-info), not consumed via p31.* tokens, so they are absent from tokenContract. p31.status-warning/error/info exist and should drive three of them; success has no p31.status-success sibling (p31.status-online is the closest). Migrate the tones to semantic tokens before flipping status to shipped.',
      since: '2026-09-19',
    },
  ],

  sources: [
    { kind: 'spec', path: 'src/contracts/schema.ts' },
    { kind: 'token', path: 'tokens/tokens.dtc.json' },
  ],

  importStatement: "import { Badge } from '@p31/canon-react';",

  antiExamples: [
    {
      label: 'variant="success" but a hardcoded rgba background',
      why: 'Bypasses the token contract — the tone must come from a semantic token.',
      useInstead: 'Consume p31.status-* via the variant prop once the tone is tokenized.',
    },
  ],
};
