# @p31/game-engine

**Geodesic building game for the P31 assistive technology platform.**

Build structures from Platonic solids. Every structure is validated against Maxwell's rigidity criterion. The economy runs on [@p31/love-ledger](https://www.npmjs.com/package/@p31/love-ledger). Identity and bonds come from [@p31/node-zero](https://www.npmjs.com/package/@p31/node-zero).

This is not a metaphor. The tetrahedron is the minimum stable system in 3D because it's the only polyhedron where every vertex connects to every other vertex. The game teaches this through building.

Built by [P31 Labs](https://phosphorus31.org), a Georgia 501(c)(3) nonprofit developing open-source assistive technology.

## Install

```bash
npm install @p31/game-engine
```

## What It Does

**Geometry** — Five primitive building pieces: tetrahedron (V=4, E=6), octahedron (V=6, E=12), icosahedron (V=12, E=30), strut, and hub. Every structure is analyzed with Maxwell's rigidity criterion (E ≥ 3V − 6). The coherence metric — E / (3V − 6) — tells you if your structure is under-constrained (mechanism), exactly rigid, or over-constrained (redundant).

**Structures** — Place pieces, snap connections, undo. Every mutation recomputes rigidity. The genesis dome is a single tetrahedron: 4 vertices, 6 edges, coherence = 1.000, perfectly rigid.

**Challenges** — 7 seed challenges from Genesis Resonance through Geodesic Dome. Each teaches a Buckminster Fuller principle. Each has prerequisites, tier requirements, and LOVE/XP rewards.

**Player Progression** — XP → Level (√(xp/10)) → Tier (seedling → sprout → sapling → oak → sequoia). Build streaks reward consistency. Daily quests provide achievable goals.

**Adapter Pattern** — The engine doesn't import node-zero or love-ledger. It accepts a `LedgerAdapter` interface so it can mint LOVE without a hard dependency. Each package works standalone; all three work together.

## Quick Start

```typescript
import { GameEngine, vec3, SEED_CHALLENGES } from "@p31/game-engine";

// Boot with optional ledger adapter
const game = new GameEngine("my-node-id", {
  domeName: "Crystal Dome",
  domeColor: "#31ffa3",
  ledger: {
    blockPlaced: (meta) => console.log("Block placed:", meta),
    challengeComplete: (id, love) => console.log(`Challenge ${id}: +${love} LOVE`),
  },
});

// Genesis dome exists immediately
console.log(game.dome.rigidity);
// { vertices: 4, edges: 6, coherence: 1.0, isRigid: true, ... }

// Build
game.place(game.dome.id, "tetrahedron", vec3(2, 0, 0));
game.place(game.dome.id, "octahedron", vec3(4, 0, 0));

// Challenges
game.startChallenge("genesis_resonance");
game.completeActiveChallenge(); // Awards 25 LOVE + 50 XP + badge

// Events
game.on("PIECE_PLACED", (e) => console.log(`Coherence: ${e.rigidity.coherence}`));
game.on("CHALLENGE_COMPLETE", (e) => console.log(`${e.challenge.title}: +${e.rewardLove} LOVE`));
game.on("TIER_PROMOTED", (e) => console.log(`${e.previousTier} → ${e.newTier}`));

// Snapshot for vault persistence
const snap = game.export();
// Later: game.import(snap);
```

## Wiring to the Full Stack

```typescript
import { GameEngine } from "@p31/game-engine";
import { LedgerEngine } from "@p31/love-ledger";
import { NodeZero } from "@p31/node-zero";

const ledger = new LedgerEngine(nodeId);
const game = new GameEngine(nodeId, {
  domeName: "My Dome",
  ledger: {
    blockPlaced: (meta) => ledger.blockPlaced(meta),
    challengeComplete: (id, love) => ledger.donate(love, { challengeId: id }),
  },
});

// Node events → Ledger
node.on("BOND_FORMED", (e) => {
  ledger.ingest("BOND_FORMED", e);
  game.bondFormed(e.peerId);
});
```

## Maxwell's Rigidity Criterion

```
E ≥ 3V − 6

E = edges (bars)
V = vertices (joints)

Coherence = E / (3V − 6)
  < 1.0  under-constrained (mechanism, can deform)
  = 1.0  exactly rigid (minimum stable)
  > 1.0  over-constrained (redundant members)
```

| Primitive | V | E | 3V−6 | Coherence | Rigid |
|-----------|---|---|------|-----------|-------|
| Tetrahedron | 4 | 6 | 6 | 1.000 | ✓ |
| Octahedron | 6 | 12 | 12 | 1.000 | ✓ |
| Icosahedron | 12 | 30 | 30 | 1.000 | ✓ |
| Geodesic (freq-2) | 42 | 120 | 120 | 1.000 | ✓ |

## The 7 Seed Challenges

| # | Challenge | Tier | LOVE | Fuller Principle |
|---|-----------|------|------|-----------------|
| 0 | The Resonance | seedling | 25 | Unity is plural and at minimum two. |
| 1 | The Minimum System | seedling | 15 | The tetrahedron is the minimum structural system of Universe. |
| 2 | The Double Bond | seedling | 20 | Synergy means behavior of whole systems unpredicted by their parts. |
| 3 | The Octet Truss | sprout | 30 | Nature always uses the most economical means. |
| 4 | The Posner Cluster | sapling | 40 | There is nothing in a caterpillar that tells you it's going to be a butterfly. |
| 5 | The Entanglement | oak | 50 | Love is omni-inclusive, progressively exquisite. |
| 6 | The Geodesic Dome | sequoia | 100 | Dare to be naïve. |

## Player Tiers

| Tier | XP Required | Unlocks |
|------|------------|---------|
| Seedling | 0 | Tetrahedra |
| Sprout | 100 | Octahedra |
| Sapling | 500 | Icosahedra |
| Oak | 2,000 | Cooperative building |
| Sequoia | 10,000 | Geodesic domes |

## API

### `GameEngine`

```typescript
new GameEngine(nodeId: string, config?: Partial<GameEngineConfig>)

// Building
game.place(structureId, type, position, rotation?, scale?, color?): PlacedPiece | null
game.undo(structureId): PlacedPiece | null
game.newStructure(name, color?): Structure

// Challenges
game.startChallenge(id): boolean
game.completeActiveChallenge(): boolean
game.availableChallenges: readonly Challenge[]

// Protocol integration
game.bondFormed(peerId): void
game.loveEarned(amount): void

// State
game.player: PlayerProgress
game.structures: readonly Structure[]
game.dome: Structure                    // Structure[0]
game.activeChallenge: Challenge | null

// Persistence
game.export(): GameSnapshot
game.import(snapshot): void

// Events
game.on("PIECE_PLACED", handler)
game.on("STRUCTURE_RIGID", handler)
game.on("CHALLENGE_COMPLETE", handler)
game.on("TIER_PROMOTED", handler)
game.on("STREAK_UPDATED", handler)
game.on("QUEST_COMPLETE", handler)
game.on("XP_EARNED", handler)
game.on("LEVEL_UP", handler)
```

### `maxwellAnalysis`

```typescript
import { maxwellAnalysis } from "@p31/game-engine/geometry";

maxwellAnalysis(vertices: number, edges: number): RigidityAnalysis
// { vertices, edges, maxwellThreshold, coherence, isRigid, degreesOfFreedom, isOverConstrained }
```

## Stats

- **104 tests** passing across 4 test files
- **21.2 kB** packed
- **0** runtime dependencies
- **ES2022** module output
- **Adapter pattern** — no hard dependency on sibling packages

## Related Packages

- [@p31/node-zero](https://www.npmjs.com/package/@p31/node-zero) — Protocol layer. Identity, bonds, vault, state.
- [@p31/love-ledger](https://www.npmjs.com/package/@p31/love-ledger) — Economic layer. LOVE transactions, wallet, vesting.

## License

MIT — P31 Labs, a Georgia 501(c)(3) nonprofit.
