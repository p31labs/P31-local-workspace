/**
 * @p31/canon — loom/ingest.ts
 *
 * Design-system ingestion (Move 4). Turns a FOREIGN design system — arbitrary
 * CSS plus a token file — into a Loom-compatible registry shape, so the
 * coverage agent can run against a system the Loom did not grow up on.
 *
 * Honesty constraint: this extracts STRUCTURE. It does not invent tokens,
 * contracts, or intents. A class that consumes `#ff0000` instead of
 * `var(--p31-*)` is recorded as "no tokens consumed" — it is not silently
 * mapped to a canon token. Ingestion gets the shape onto the Loom; the
 * coverage agent then proposes a tokenization, and a human approves it.
 *
 * Node type-stripped — no enums, no parameter properties, plain interfaces.
 */

export interface IngestedClass {
  name: string;
  files: string[];
  tokens: string[];
}

export interface IngestedRegistry {
  generatedFrom: string[];
  counts: { tokens: number; components: number; cssClasses: number; themes: number };
  tokens: Array<{ name: string; value: string }>;
  components: Array<Record<string, unknown>>;
  cssClasses: IngestedClass[];
  themes: Array<Record<string, unknown>>;
}

/** Parse a CSS string into class -> { files, tokens }, the same walk
 *  gen-registry.mjs performs. A class with no var() consumption is omitted —
 *  it carries no token binding for the coverage agent to ground. */
export function parseCss(text: string, file = 'foreign.css'): IngestedClass[] {
  const classMap = new Map<string, { files: Set<string>; tokens: Set<string> }>();
  // Strip block comments first — otherwise `.class` names in prose (e.g.
  // "loom-ingest.mjs", "the .btn-danger is hardcoded") leak into the selector
  // capture and get bound to the wrong token set.
  const cleaned = text.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of cleaned.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = m[2];
    const used = [...new Set([...body.matchAll(/var\((--[a-zA-Z0-9-]+)/g)].map((x) => x[1]))];
    if (!used.length) continue;
    for (const c of m[1].matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) {
      const name = '.' + c[1];
      const e = classMap.get(name) ?? { files: new Set(), tokens: new Set() };
      e.files.add(file);
      used.forEach((t) => e.tokens.add(t));
      classMap.set(name, e);
    }
  }
  return [...classMap.entries()]
    .map(([name, e]) => ({ name, files: [...e.files].sort(), tokens: [...e.tokens].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Parse a token file into a set of token paths. Accepts two shapes:
 *  - a DTCG tree (nested objects with `$value` leaves), or
 *  - a flat custom-property block (`--p31-x: value;` per line).
 *  Returns a list of { name, value } where name is a DTCG dot-path or a
 *  `--p31-*` var name, preserved exactly — no mangling. */
export function parseTokens(text: string): Array<{ name: string; value: string }> {
  // Shape 1: flat `--name: value;` lines.
  const flat = [...text.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)];
  if (flat.length) {
    return flat.map((m) => ({ name: m[1], value: m[2].trim() }));
  }
  // Shape 2: DTCG JSON.
  try {
    const parsed = JSON.parse(text);
    const out: Array<{ name: string; value: string }> = [];
    const walk = (node: unknown, prefix: string[] = []) => {
      if (!node || typeof node !== 'object') return;
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (v && typeof v === 'object' && '$value' in v) {
          out.push({ name: [...prefix, k].join('.'), value: String((v as { $value: unknown }).$value) });
        } else if (v && typeof v === 'object') {
          walk(v, [...prefix, k]);
        }
      }
    };
    walk(parsed);
    return out.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

/** Assemble an ingested registry from parsed classes + tokens. Components and
 *  themes are empty — ingestion does not invent contracts; the coverage agent
 *  proposes them afterward. */
export function toRegistry(
  classes: IngestedClass[],
  tokens: Array<{ name: string; value: string }>,
  opts: { source?: string } = {},
): IngestedRegistry {
  return {
    generatedFrom: [opts.source ?? 'foreign design system'],
    counts: {
      tokens: tokens.length,
      components: 0,
      cssClasses: classes.length,
      themes: 0,
    },
    tokens: tokens.map((t) => ({ name: t.name, value: t.value })),
    components: [],
    cssClasses: classes,
    themes: [],
  };
}
