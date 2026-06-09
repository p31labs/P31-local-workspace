// src/engine/factLookup.ts
// Tier-based fun fact lookup for elements and molecules.
// Mode mapping: seed -> simple, sprout -> intermediate, sapling -> scientific.

import type { DifficultyId } from '../data/modes';
import { elementFacts } from './elementFacts';
import { expandedCheckpoints } from './expandedCheckpoints';
import type { ExpandedCheckpoint } from './expandedCheckpoints';
import { displayFormula } from './chemistry';

type FactTier = 'simple' | 'intermediate' | 'scientific';

function getTier(mode: DifficultyId): FactTier {
  switch (mode) {
    case 'seed': return 'simple';
    case 'sprout': return 'intermediate';
    case 'sapling': return 'scientific';
  }
}

// Lazy-built lookup: conventional displayFormula -> checkpoint
let _checkpointMap: Map<string, ExpandedCheckpoint> | null = null;
function getCheckpointMap(): Map<string, ExpandedCheckpoint> {
  if (!_checkpointMap) {
    _checkpointMap = new Map();
    for (const cp of expandedCheckpoints) {
      _checkpointMap.set(cp.displayFormula, cp);
    }
  }
  return _checkpointMap;
}

/** Get a tier-appropriate element fun fact. */
export function getElementFact(symbol: string, mode: DifficultyId): string | null {
  const el = elementFacts.find(e => e.symbol === symbol);
  if (!el) return null;
  return el.facts[getTier(mode)];
}

/** Get a tier-appropriate molecule fun fact. */
export function getMoleculeFact(
  hillFormula: string,
  mode: DifficultyId,
): { fact: string; name: string } | null {
  const dispF = displayFormula(hillFormula);
  const map = getCheckpointMap();
  const cp = map.get(dispF);
  if (!cp) return null;
  return {
    fact: cp.funFacts[getTier(mode)],
    name: cp.displayName,
  };
}
