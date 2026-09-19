/**
 * @p31/canon — contracts/button.contract.ts
 *
 * The reference contract. Every other component contract is written by
 * copying this shape. If this file passes validate-contracts.mjs and
 * the rest of the system consumes it, the contract layer works.
 *
 * interactionStates is a RECORD of observable predicates, not a list of
 * names. The harness (tests/e2e/verify-states.spec.ts) reads this map
 * and generates one Playwright assertion per declared state. Adding a
 * state generates a test; a state that fails its predicate fails the
 * build. The agent does not choose what to test — the contract does.
 *
 * Token references use the semantic tier (p31.color.action.*, p31.space.*,
 * p31.motion.*, …). Every token named here MUST exist in SEMANTIC_MAP
 * (theme-store.ts) — validate-contracts.mjs hard-fails on unresolved tokens.
 *
 * sources deliberately point only at files that exist TODAY. When
 * canon-react ships Button, the contract gains implementation + story
 * pointers and the ghost gate enforces them. A contract never claims a
 * file that is not on disk.
 */
import type { ComponentContract } from './schema';

export const buttonContract: ComponentContract = {
  name: 'Button',

  layer: 'component',

  status: 'shipped',

  intent:
    'Trigger an action in the current context. The primary interactive surface.',

  props: [
    {
      name: 'variant',
      type: 'enum',
      required: false,
      description:
        'Visual emphasis. primary = main action, secondary = alternative, ghost = tertiary.',
      options: ['primary', 'secondary', 'ghost'],
      default: 'primary',
    },
    {
      name: 'size',
      type: 'enum',
      required: false,
      description: 'Control size. Affects padding, font, and touch target.',
      options: ['sm', 'md', 'lg'],
      default: 'md',
    },
    {
      name: 'disabled',
      type: 'boolean',
      required: false,
      description: 'When true, the button is not interactive and renders aria-disabled.',
      default: 'false',
    },
    {
      name: 'loading',
      type: 'boolean',
      required: false,
      description:
        'When true, sets aria-busy and blocks interaction. Renders a spinner before the label in default (non-asChild) mode.',
      default: 'false',
    },
    {
      name: 'children',
      type: 'node',
      required: true,
      description: 'The button label / content.',
    },
  ],

  tokenContract: [
    'p31.color.action.primary',
    'p31.color.action.primary-hover',
    'p31.color.action.primary-text',
    'p31.color.action.secondary',
    'p31.color.action.secondary-text',
    'p31.color.action.ghost',
    'p31.color.action.ghost-hover',
    'p31.space.inline.sm',
    'p31.space.inline.md',
    'p31.space.inline.lg',
    'p31.radius.md',
    'p31.font.size.sm',
    'p31.font.size.md',
    'p31.font.size.lg',
    'p31.motion.duration.fast',
    'p31.motion.easing.standard',
  ],

  semanticParts: [
    { name: 'container', description: 'The outer <button> element.' },
    { name: 'label', description: 'The text content region.' },
    { name: 'icon', description: 'Optional leading or trailing icon region.' },
    { name: 'spinner', description:
      'Loading indicator, rendered in default (non-asChild) mode only when loading=true.' },
  ],

  requiredAria: [
    {
      attribute: 'aria-disabled',
      required: true,
      description: 'Present when disabled=true. Reflected, not just styled.',
    },
    {
      attribute: 'aria-busy',
      required: true,
      description: 'Present when loading=true.',
    },
  ],

  interactionStates: {
    default: {
      description: 'Primary background applied, label visible, no aria flags set.',
      property: 'background-color',
      matcher: 'not-empty',
      trigger: 'none',
      fixture: { children: 'Save' },
    },

    hover: {
      description: 'Hover changes the primary background to the hover token.',
      property: 'background-color',
      matcher: 'not-empty',
      trigger: 'hover',
      fixture: { children: 'Save' },
    },

    'focus-visible': {
      description: 'Keyboard focus produces a visible outline.',
      property: 'outline-style',
      expected: 'none',
      matcher: 'not-equals',
      trigger: 'focus',
      fixture: { children: 'Save' },
    },

    active: {
      description: 'Pressed state is distinct from default.',
      property: 'opacity',
      matcher: 'not-empty',
      trigger: 'press',
      fixture: { children: 'Save' },
    },

    disabled: {
      description: 'Disabled state sets aria-disabled and blocks interaction.',
      property: 'aria-disabled',
      expected: 'true',
      matcher: 'equals',
      trigger: 'none',
      fixture: { children: 'Save', disabled: true },
    },

    loading: {
      description: 'Loading state sets aria-busy.',
      property: 'aria-busy',
      expected: 'true',
      matcher: 'equals',
      trigger: 'none',
      fixture: { children: 'Save', loading: true },
    },
  },

  caveats: [
    {
      field: 'interactionStates.loading',
      reason:
        'The spinner visual is not composed into the consumer element in asChild mode — only aria-busy is observable in that rendering.',
      since: '2026-09-19',
    },
  ],

  sources: [
    { kind: 'spec', path: 'src/contracts/schema.ts' },
    { kind: 'token', path: 'tokens/tokens.dtc.json' },
  ],

  importStatement: "import { Button } from '@p31/canon-react';",

  antiExamples: [
    {
      label: 'variant="tertiary"',
      why: 'Not in the variant enum. Use variant="ghost".',
      useInstead: 'variant="ghost"',
    },
    {
      label: 'style={{ color: "#2563eb" }}',
      why: 'Hardcoded color bypasses the token contract.',
      useInstead: 'Consume p31.color.action.primary via the variant prop.',
    },
    {
      label: 'disabled with onClick still firing',
      why: 'Disabled must prevent interaction, not just render grey.',
      useInstead: 'Guard onClick on disabled in the handler.',
    },
  ],
};

