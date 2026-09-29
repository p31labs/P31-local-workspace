/**
 * pickle-names — the privacy-preserving identity naming system.
 *
 * "The street never shows a human name — pickle labels only." A real person is
 * represented by a deterministic pickle name derived from a seed, so their
 * identity never leaks. Same seed → same name, forever.
 *
 * This is the extracted, governed form of the QPJ "Quantum Pickle Jar" naming
 * system. The vocabularies are byte-identical to the QPJ source so every
 * existing pickle name is preserved.
 */
export function cyrb128(str: string): () => number {
  let h1 = 1779033703 ^ str.length;
  let h2 = 3144134277 ^ str.length;
  let h3 = 1013904242 ^ str.length;
  let h4 = 2773480762 ^ str.length;

  for (let i = 0, k = 0; i < str.length; i++, k = i % 16) {
    const ch = str.charCodeAt(i);
    if (k === 0) { h1 = h2 ^ Math.imul(h1 ^ ch, 597399067); }
    else if (k === 1) { h2 = h3 ^ Math.imul(h2 ^ ch, 2869860233); }
    else if (k === 2) { h3 = h4 ^ Math.imul(h3 ^ ch, 951274213); }
    else { h4 = h1 ^ Math.imul(h4 ^ ch, 2716044179); }
    h1 = h1 ^ (h4 >>> 18);
    h2 = h2 ^ (h1 >>> 22);
    h3 = h3 ^ (h2 >>> 17);
    h4 = h4 ^ (h3 >>> 19);
  }

  return () => {
    h1 = h2 ^ Math.imul(h1 ^ (h1 >>> 18), 2246822507);
    h2 = h3 ^ Math.imul(h2 ^ (h2 >>> 22), 3266489909);
    h3 = h4 ^ Math.imul(h3 ^ (h3 >>> 17), 3266489909);
    h4 = h1 ^ Math.imul(h4 ^ (h4 >>> 19), 2246822507);
    let t = h1 ^ (h1 >>> 10);
    t = t ^ Math.imul(t, 69069);
    t = t ^ (t >>> 25);
    return ((t >>> 0) / 4294967296);
  };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return h >>> 0;
}

export interface PickleNameOptions {
  seed?: string;
  exclude?: Set<string>;
}

export const PICKLE_PREFIXES = [
  'Dill', 'Bread', 'Corn', 'Gherkin', 'Half', 'Sour',
  'Jar', 'Brine', 'Ferment', 'Crisp', 'Tang', 'Salt',
  'Pickle', 'Snap', 'Crunch', 'Dill', 'Sweet', 'Sour',
  'Seed', 'Rind', 'Vine', 'Bloom', 'Sprout', 'Cultch',
];

export const PICKLE_SUFFIXES = [
  'quiet', 'quick', 'warm', 'slow', 'bright', 'deep',
  'high', 'soft', 'sharp', 'round', 'little', 'long',
  'still', 'bright', 'cool', 'dawn', 'rare', 'wild',
  'tide', 'sift', 'lark', 'moss', 'fern', 'drift',
];

export function generatePickleName(input: string, opts?: PickleNameOptions): string {
  const exclude = opts?.exclude ?? new Set<string>();
  const rand = mulberry32(hashStr(input));

  let attempts = 0;
  while (attempts < 200) {
    const p = PICKLE_PREFIXES[Math.floor(rand() * PICKLE_PREFIXES.length)];
    const s = PICKLE_SUFFIXES[Math.floor(rand() * PICKLE_SUFFIXES.length)];
    const name = `${p}·${s}`;
    if (!exclude.has(name)) return name;
    attempts++;
  }

  // Fallback: must still respect the exclusion set, else batch generation
  // can return a name the caller already holds (a real collision).
  for (let i = 0; i < 200; i++) {
    const name = `Pickle·${Math.floor(rand() * 9999)}`;
    if (!exclude.has(name)) return name;
  }
  return `Pickle·${Date.now() % 9999}`;
}

export function generatePickleNames(input: string, count: number, opts?: PickleNameOptions): string[] {
  const exclude = opts?.exclude ?? new Set<string>();
  const existing = new Set<string>(exclude);
  const names: string[] = [];
  const seed = opts?.seed ?? input;

  for (let i = 0; i < count; i++) {
    const candidate = generatePickleName(`${seed}-${i}`, { exclude: existing, seed });
    existing.add(candidate);
    names.push(candidate);
  }

  return names;
}

/**
 * Invariant checks — the naming system's guarantees, made checkable.
 * Used by the family-domain gate and tests. A name that leaks a real
 * identity, or a generation that isn't deterministic, is a violation.
 */
export function pickleInvariants(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  // Determinism: same seed → same name.
  const a = generatePickleName('seed-alpha');
  const b = generatePickleName('seed-alpha');
  if (a !== b) failures.push('non-deterministic: same seed produced different names');

  // Vocabulary-closed: generated names come only from the published sets.
  for (let i = 0; i < 50; i++) {
    const name = generatePickleName(`inv-${i}`);
    const [p, s] = name.split('·');
    if (!PICKLE_PREFIXES.includes(p) || !PICKLE_SUFFIXES.includes(s)) {
      failures.push(`name outside vocabulary: ${name}`);
      break;
    }
  }

  // Batch collision-free.
  const batch = generatePickleNames('batch', 40);
  if (new Set(batch).size !== batch.length) {
    failures.push('batch generation produced a duplicate name');
  }

  return { ok: failures.length === 0, failures };
}