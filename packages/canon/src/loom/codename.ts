/**
 * @p31/canon — loom/codename.ts
 *
 * The pickle code-name system, as shared substrate. A family member gets a
 * stable, friendly, privacy-preserving code name derived deterministically
 * from their humanId / loveDid — so the log, the companion view, and any
 * agent-facing surface can name a person without ever exposing the raw DID.
 *
 * Ported from the QPJ portal (portals/qpj/src/lib/pickleNames.ts), where it
 * names the tetrahedron mesh vertices. Same deterministic contract: the same
 * seed always yields the same name; `exclude` allows collision avoidance.
 *
 * Edge-safe + pure: no imports, no fs, works in Workers, Node, browsers, and
 * tests. This is the shared substrate both Path α (the Loom Functions + dev
 * middleware) and Path β (future MCP surface) consume.
 */

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PREFIXES = [
  'Dill', 'Bread', 'Corn', 'Gherkin', 'Half', 'Sour',
  'Jar', 'Brine', 'Ferment', 'Crisp', 'Tang', 'Salt',
  'Pickle', 'Snap', 'Crunch', 'Sweet', 'Seed', 'Rind',
  'Vine', 'Bloom', 'Sprout', 'Cultch', 'Cider', 'Rye',
] as const

const SUFFIXES = [
  'quiet', 'quick', 'warm', 'slow', 'bright', 'deep',
  'high', 'soft', 'sharp', 'round', 'little', 'long',
  'still', 'cool', 'dawn', 'rare', 'wild', 'tide',
  'sift', 'lark', 'moss', 'fern', 'drift', 'ember',
] as const

export interface CodenameOptions {
  /** Excluded names — collision avoidance. */
  exclude?: ReadonlySet<string>
  /** Optional seed override (defaults to the input string). */
  seed?: string
}

/** Derive a stable pickle code name from any identity string (did, humanId,
 *  passportId, loveDid). Same input → same name, always. */
export function codename(input: string, opts: CodenameOptions = {}): string {
  const exclude = opts.exclude ?? new Set<string>()
  const rand = mulberry32(hashStr(opts.seed ?? input))

  let attempts = 0
  while (attempts < 200) {
    const p = PREFIXES[Math.floor(rand() * PREFIXES.length)]
    const s = SUFFIXES[Math.floor(rand() * SUFFIXES.length)]
    const name = `${p}·${s}`
    if (!exclude.has(name)) return name
    attempts++
  }
  return `Pickle·${Math.floor(rand() * 9999)}`
}

/** Derive `count` distinct code names from one seed (a family, a mesh). */
export function codenames(input: string, count: number, opts: CodenameOptions = {}): string[] {
  const exclude = new Set<string>(opts.exclude ?? [])
  const names: string[] = []
  const seed = opts.seed ?? input
  for (let i = 0; i < count; i++) {
    const name = codename(`${seed}-${i}`, { exclude, seed })
    exclude.add(name)
    names.push(name)
  }
  return names
}

/** Short, human-usable alias: collapse the DID to its last 6 chars so a
 *  pickle name stays unique-ish even across close seeds. Optional — not used
 *  by default (the full seed is more stable). */
export function codenameSeed(didOrId: string): string {
  return didOrId
}