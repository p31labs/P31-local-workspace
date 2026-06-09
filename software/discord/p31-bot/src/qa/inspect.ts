import { createBotRegistry } from "../boot/registerCommands";
import {
  TRIVIA_DECK,
  MESHWORD_LEXICON,
  PARADOX_CARDS,
  ANAGRAM_PUZZLES,
  RIDDLES,
  WOULD_YOU_RATHER,
  FORTUNES,
} from "../lib/p31-amusement-data";
import { VERTEX_LABELS, EDGE_VOICES, SEAL_CLOSURES } from "../lib/tetra-seal-data";
import { P31_LARMOR_HZ, TRIM_HZ_MIN } from "../lib/p31-quantum-clock-constants";
import { createStandardDeck } from "../lib/quantum-deck-local";

export type InspectResult = { ok: boolean; issues: string[] };

/** Static gates: registry integrity + amusement invariants (no network). */
export function runInspect(): InspectResult {
  const issues: string[] = [];
  const registry = createBotRegistry();
  const cmds = registry.getAll();
  const primaryNames = new Set<string>();

  for (const c of cmds) {
    if (!c.name?.trim()) issues.push("command: empty name");
    if (!c.description?.trim()) issues.push(`command ${c.name}: empty description`);
    if (!c.usage?.trim()) issues.push(`command ${c.name}: empty usage`);
    if (primaryNames.has(c.name)) issues.push(`duplicate primary name: ${c.name}`);
    primaryNames.add(c.name);

    for (const al of c.aliases ?? []) {
      const resolved = registry.get(al);
      if (!resolved) issues.push(`alias "${al}" on ${c.name} does not resolve`);
      else if (resolved !== c) {
        issues.push(`alias "${al}" on ${c.name} maps to ${resolved.name}`);
      }
    }
  }

  for (const w of MESHWORD_LEXICON) {
    if (w.length !== 5 || !/^[A-Z]+$/.test(w)) {
      issues.push(`MESHWORD_LEXICON invalid token: ${w}`);
    }
  }

  for (let i = 0; i < TRIVIA_DECK.length; i++) {
    const card = TRIVIA_DECK[i]!;
    if (card.correct < 0 || card.correct > 3) {
      issues.push(`TRIVIA_DECK[${i}]: correct out of range`);
    }
    if (card.choices.length !== 4) issues.push(`TRIVIA_DECK[${i}]: need 4 choices`);
  }

  for (let i = 0; i < PARADOX_CARDS.length; i++) {
    const p = PARADOX_CARDS[i]!;
    if (p.truths.length !== 2) issues.push(`PARADOX_CARDS[${i}]: need 2 truths`);
    if (!p.lie?.trim() || !p.explain?.trim()) issues.push(`PARADOX_CARDS[${i}]: incomplete`);
  }

  if (VERTEX_LABELS.length !== 4) issues.push("VERTEX_LABELS must have length 4");
  if (EDGE_VOICES.length < 6) issues.push("tetra EDGE_VOICES too small for K₄ ritual");
  if (SEAL_CLOSURES.length < 1) issues.push("SEAL_CLOSURES empty");

  if (RIDDLES.length < 1) issues.push("RIDDLES empty");
  if (WOULD_YOU_RATHER.length < 1) issues.push("WOULD_YOU_RATHER empty");
  if (ANAGRAM_PUZZLES.length < 1) issues.push("ANAGRAM_PUZZLES empty");
  if (FORTUNES.length < 1) issues.push("FORTUNES empty");

  if (P31_LARMOR_HZ !== 863) issues.push("P31_LARMOR_HZ must stay 863 (dome / p31-constants)");
  if (TRIM_HZ_MIN !== 0.86) issues.push("TRIM_HZ_MIN must stay 0.86 (p31-dome-constants)");
  if (createStandardDeck().length !== 52) issues.push("quantum-deck-local: standard deck must be 52");

  return { ok: issues.length === 0, issues };
}
