/**
 * @p31/canon — contracts/schema.ts
 *
 * THE contract meta-schema. Every component contract validates against
 * this before it is allowed to ship.
 *
 * Research-converged shape (2026 field consensus):
 *   - Zod schema as the machine-readable contract (Gusto, throughline,
 *     agentic-spec, copilotkit a2ui-renderer all use this pattern).
 *   - Explicit named fields: intent, props, tokenContract, semanticParts,
 *     requiredAria, interactionStates, sources, importStatement
 *     (@forumone/throughline-design-contract + agentic-spec closed lists).
 *   - Closed vocabularies everywhere. A prop that is not in `props`
 *     does not exist. A token not in `tokenContract` must not be
 *     referenced. An aria attribute not in `requiredAria` must not be
 *     required.
 *
 * NOTE on .meta(): Zod v4's .meta() must be the LAST chained method or
 * the metadata is lost on the new instance. This schema does not chain
 * .meta() at all — the contract is a plain object validated against the
 * schema, and the MCP server serves the parsed object. No registry
 * indirection.
 */
import { z } from 'zod';

/**
 * A single prop definition inside a component contract.
 * Closed vocabulary — type is enumerated, not free-form.
 */
export const PropSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'enum', 'node', 'function']),
  required: z.boolean().default(false),
  description: z.string().min(1),
  /** Only present when type === 'enum'. Closed list of valid values. */
  options: z.array(z.string().min(1)).optional(),
  /** Default value as a serialized string, or undefined for none. */
  default: z.string().optional(),
}).refine(
  (p) => p.type !== 'enum' || Boolean(p.options && p.options.length > 0),
  { message: 'enum-typed props must declare a non-empty options array' },
);

/** An accessibility requirement. Enumerated attribute name, not prose. */
export const AriaRequirementSchema = z.object({
  attribute: z.string().regex(/^aria-/, 'must start with aria-'),
  required: z.boolean().default(true),
  description: z.string().min(1),
});

/** A named semantic part. Tokens target parts, not magic selectors. */
export const SemanticPartSchema = z.object({
  name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'lowerCamelCase part name'),
  description: z.string().min(1),
});

/** A single interaction state. Enumerated globally — a state not on the
 * list cannot be claimed by any contract. */
export const InteractionStateSchema = z.enum([
  'default',
  'hover',
  'focus-visible',
  'active',
  'disabled',
  'loading',
  'error',
  'success',
]);
export type InteractionState = z.infer<typeof InteractionStateSchema>;

/** How to interpret the observed value against the expected value. */
export const MatcherSchema = z.enum([
  'equals',       // observed === expected
  'not-equals',   // observed !== expected
  'truthy',       // observed is non-empty and not 'none'/'0'/'false'
  'not-empty',    // observed !== ''
  'contains',     // observed.includes(expected)
]);

/** How to put the rendered component into the state before reading. */
export const TriggerSchema = z.enum([
  'none',   // read as-rendered
  'hover',  // await locator.hover()
  'focus',  // await locator.focus()
  'press',  // page.mouse.down() over element, then read
]);

/**
 * An observable predicate. This is what the harness runs.
 *
 *   property  — CSS property (kebab-case) or aria-* attribute, read via
 *               getComputedStyle or getAttribute
 *   expected  — the value to match (optional for truthy/not-empty)
 *   matcher   — how to interpret expected against observed
 *   trigger   — how to put the component into the state
 *   fixture   — props to render the component in this state (the harness
 *               renders with these before applying the trigger)
 *
 * The harness reads this and generates a Playwright assertion. The agent
 * that wrote the component does not choose what to test — the contract does.
 * Neither does it choose what to render: the fixture lives in the contract,
 * not in the harness.
 */
export const ObservablePredicateSchema = z.object({
  /** Human-readable summary of what this predicate checks. */
  description: z.string().min(1),
  /** CSS property (kebab-case) or aria-/data- attribute. */
  property: z.string().min(1),
  /** The expected value. Required unless matcher is truthy or not-empty. */
  expected: z.string().optional(),
  /** How to interpret expected against observed. */
  matcher: MatcherSchema.default('equals'),
  /** How to put the component into the state before reading. */
  trigger: TriggerSchema.default('none'),
  /** Props to render the component in this state. The harness derives the
   *  render from the contract — a state without a fixture cannot be
   *  tested, so one is required. */
  fixture: z.record(z.string(), z.unknown()),
}).refine(
  (p) => p.matcher === 'truthy' || p.matcher === 'not-empty' || p.expected !== undefined,
  { message: 'expected is required unless matcher is truthy or not-empty' },
);

export type ObservablePredicate = z.infer<typeof ObservablePredicateSchema>;

/** The state map. Zod 4's z.record(z.enum(), value) is EXHAUSTIVE —
 *  it requires every enum value to be present. z.partialRecord allows a
 *  component to declare only the states it supports, while every declared
 *  state MUST carry a full observable predicate. Adding a state to the
 *  contract generates a Playwright test; a state that fails its predicate
 *  fails the build. */
export const InteractionStatesSchema = z.partialRecord(
  InteractionStateSchema,
  ObservablePredicateSchema,
);

export type InteractionStateSpec = z.infer<typeof InteractionStatesSchema>[keyof z.infer<typeof InteractionStatesSchema>];

/** A known limitation. The contract declares what it does not fully
 *  guarantee, so the MCP surface can warn an agent before it writes code
 *  against the field.
 *
 *  "prove or caveat, never fake" — a capability the harness cannot verify
 *  degrades to an honest caveat, not a fabricated pass. */
export const CaveatSchema = z.object({
  field: z.string().min(1),
  reason: z.string().min(1),
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type Caveat = z.infer<typeof CaveatSchema>;

/** Source pointer — where the real implementation / spec lives. The
 *  contract validator hard-resolves every pointer on disk; a pointer to
 *  a missing file is a hard build failure (a contract that lies). */
export const SourcePointerSchema = z.object({
  kind: z.enum(['implementation', 'story', 'token', 'spec']),
  path: z.string().min(1),
});
export type SourcePointer = z.infer<typeof SourcePointerSchema>;

/**
 * THE component contract. Every components *contract.ts file exports a
 * value satisfying this schema. validate-contracts.mjs hard-fails on
 * any violation.
 */
export const ComponentContractSchema = z.object({
  /** Component name — PascalCase, matches the exported React name. */
  name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/, 'PascalCase component name'),

  /** Layer in the canon's model. */
  layer: z.enum(['contract', 'primitive', 'semantic', 'component', 'composition']),

  /** One-sentence statement of what the component is FOR. */
  intent: z.string().min(10).max(240),

  /** Props. Closed shape — anything not declared here is a lint failure
   * in validate_spec. */
  props: z.array(PropSchema),

  /**
   * The closed list of tokens this component may consume. Any token
   * reference in the implementation that is not in this list is wrong.
   * Namespace is enforced here (p31.*) and full resolution against the
   * DTCG tree is enforced by validate-contracts (token ghost gate).
   */
  tokenContract: z.array(z.string().regex(/^p31(\.[a-z][a-z0-9-]*)+$/, 'p31.* namespaced token path')),

  /** Named regions a token may target. */
  semanticParts: z.array(SemanticPartSchema),

  /** ARIA attributes this component must render. Enumerated. */
  requiredAria: z.array(AriaRequirementSchema),

  /** Interaction states this component implements, mapped to their
   *  observable predicates. Assertions are derived from this field —
   *  adding a state generates a test; a state that fails its predicate
   *  fails the build. The agent does not choose what to test; the contract does. */
  interactionStates: InteractionStatesSchema,

  /** Known limitations. The MCP surface warns agents before they use
   *  a caveated field. */
  caveats: z.array(CaveatSchema).default([]),

  /** Where to find the real implementation / story / token definitions.
   * Every pointer must resolve on disk at build time. */
  sources: z.array(SourcePointerSchema).min(1),

  /** Exact import statement consumers should use. */
  importStatement: z.string().min(1),

  /**
   * Whether the component and its import target exist today.
   * - 'planned': a contract describing a component that will exist (unverified)
   * - 'shipped': the component exists at the importStatement path (gate-checked)
   *
   * DEFAULT IS 'planned' (pessimistic). A contract must opt INTO claiming
   * 'shipped'. The thesis of the canon is "contracts cannot lie" — so the
   * unverified, not-yet-built state must be the safe default. A contract
   * without a status field is presumed to be about a component that does
   * not exist yet, never the reverse. Flip to 'shipped' only when the
   * importStatement package is actually installed and the component exists.
   */
  status: z.enum(['planned', 'shipped']).default('planned'),

  /** Anti-examples — what NOT to do, with the reason and the fix. */
  antiExamples: z.array(z.object({
    label: z.string().min(1),
    why: z.string().min(1),
    useInstead: z.string().optional(),
  })).default([]),
}).superRefine((contract, ctx) => {
  // ── fixture ↔ props gate ─────────────────────────────────────
  // A fixture renders the component into its state. If it names a prop
  // the contract does not declare, or gives a declared prop a value of
  // the wrong shape, the harness renders the wrong thing and green-lights
  // it. That is a hollow pass. Every fixture key must resolve to a
  // declared prop with a matching value, and every required prop must be
  // present — a fixture of {} is a state no one has actually entered.
  if (!contract.interactionStates) return;
  const byName = new Map(contract.props.map((p) => [p.name, p]));
  const typeFields: Record<string, (v: unknown) => boolean> = {
    string: (v) => typeof v === 'string',
    number: (v) => typeof v === 'number' && Number.isFinite(v),
    boolean: (v) => typeof v === 'boolean',
    node: (v) =>
      typeof v === 'string' ||
      typeof v === 'number' ||
      v === null ||
      (Array.isArray(v) && v.every((e) => typeof e === 'string' || typeof e === 'number' || e === null)),
    function: (v) => typeof v === 'function',
  };
  for (const [state, spec] of Object.entries(contract.interactionStates)) {
    const fixture = spec?.fixture;
    if (!fixture || Array.isArray(fixture) || typeof fixture !== 'object') {
      ctx.addIssue({
        code: 'custom',
        path: ['interactionStates', state, 'fixture'],
        message: `${state}: fixture must be a plain object of props`,
      });
      continue;
    }
    for (const key of Object.keys(fixture)) {
      const prop = byName.get(key);
      if (!prop) {
        ctx.addIssue({
          code: 'custom',
          path: ['interactionStates', state, 'fixture', key],
          message: `${state}: "${key}" is not a declared prop of ${contract.name}`,
        });
        continue;
      }
      const value = fixture[key];
      let ok = false;
      if (prop.type === 'enum') {
        ok = typeof value === 'string' && Boolean(prop.options?.includes(value));
      } else {
        const check = typeFields[prop.type];
        ok = check ? check(value) : false;
      }
      if (!ok) {
        ctx.addIssue({
          code: 'custom',
          path: ['interactionStates', state, 'fixture', key],
          message: `${state}: fixture.${key} expects ${prop.type}${prop.type === 'enum' ? ` (one of ${prop.options?.join(', ')})` : ''}, got ${typeof value}`,
        });
      }
    }
    for (const p of contract.props) {
      if (p.required && !(p.name in fixture)) {
        ctx.addIssue({
          code: 'custom',
          path: ['interactionStates', state, 'fixture'],
          message: `${state}: fixture is missing required prop "${p.name}"`,
        });
      }
    }
  }
});

export type ComponentContract = z.infer<typeof ComponentContractSchema>;
export type Prop = z.infer<typeof PropSchema>;
export type AriaRequirement = z.infer<typeof AriaRequirementSchema>;
export type SemanticPart = z.infer<typeof SemanticPartSchema>;