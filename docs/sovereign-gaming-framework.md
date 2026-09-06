# Sovereign Gaming Framework — Specification v0.1

**Status:** Draft  
**Date:** 2026-07-22  
**Author:** P31 Labs

---

## 1. Purpose

The Sovereign Gaming Framework defines the API contract that any game must implement to participate in the P31 LOVE economy. Games that conform to this framework can:

- Award LOVE credits for cooperative play via attested receipts
- Apply DRRP (Diminishing Returns on Repeated Pairings) to prevent collusion
- Report spoon‑aware game state (difficulty adaptation)
- Register in the arcade catalog for discovery

## 2. Game Categories

Games are classified by their LOVE‑earning mechanism:

| Category | Mechanism | Example | Attestation |
|----------|-----------|---------|-------------|
| **Cooperative** | Players help each other complete tasks | Bonding (molecule co‑build) | Required (giver + receiver sign) |
| **Competitive with assist** | Team play where assists earn LOVE | Bashball (pass before score) | Required (teammate signs) |
| **Ambient** | Passive engagement regenerates spoons | Arcade (starfield) | None (self‑care, no mint) |
| **Resource‑sharing** | Players share spoons/inventory | (Planned) | Required (giver + receiver sign) |
| **Learning** | Educational completion | (Planned) | Optional (self‑attestation) |

## 3. API Contract

### 3.1 Required: Game Manifest

Every game must expose a manifest at a known URL (e.g., embedded in the game's HTML or served as JSON):

```typescript
interface GameManifest {
  id: string;              // Unique game identifier (e.g., "bashball")
  name: string;            // Display name (e.g., "BASHBALL")
  description: string;     // Short description
  category: GameCategory;  // One of the five categories
  version: string;         // Semver
  author: string;          // Creator DID
  rewards: RewardDef[];    // Reward definitions
  minSpoons: number;       // Minimum spoons required to play (default 1)
  maxPlayers: number;      // Maximum simultaneous players
  attestationRequired: boolean; // Whether cooperative actions require attestation
  endpoints: {
    attest: string;        // POST endpoint for LOVE attestations
    state: string;         // GET endpoint for game state (optional)
  };
  deployUrl: string;       // Where the game is hosted
}
```

### 3.2 Required: LOVE Attestation Endpoint

When a cooperative action occurs, the game posts to the attestation endpoint:

```
POST https://federation.p31ca.org/love/attest
Content-Type: application/json

{
  "giver_did": "did:key:z6Alice",
  "receiver_did": "did:key:z6Bob",
  "action": "bonding_complete",
  "game_id": "bonding",
  "metadata": {
    "molecule": "H2O",
    "moves": 7,
    "time_spent_seconds": 45
  }
}
```

**Response:**
```json
{
  "ok": true,
  "pair_id": "did:key:z6alice:did:key:z6bob",
  "action": "bonding_complete",
  "base_reward": 25,
  "multiplier": 0.63,
  "reward": 16,
  "interaction_count": 4
}
```

### 3.3 Required: Reward Definitions

```typescript
interface RewardDef {
  action: string;       // Action identifier (matches POST body)
  label: string;        // Human-readable description
  baseReward: number;   // Base LOVE amount (before DRRP)
  attestationType: 'mutual' | 'giver_only' | 'none';
  maxPerSession: number; // Maximum times this reward can be claimed per game session
}
```

### 3.4 Recommended: Spoon‑Aware State

Games should report their spoon‑aware adaptation:

```typescript
interface GameState {
  spoons: number;             // Player's current spoon level
  difficultyMultiplier: number; // How difficulty scales with spoons
  sessionDuration: number;     // Seconds since session start
  achievements: Achievement[]; // Earned achievements
}
```

Games can read the current spoon level from:
- `document.documentElement.getAttribute('data-spoons')`  
- `localStorage.getItem('p31:spoons')`

### 3.5 Optional: Self‑Care (Spoon Regeneration)

Ambient games do not mint LOVE. Instead, after 30 seconds of engagement, they regenerate 1 spoon (up to cap of 5) by updating:

```javascript
const el = document.documentElement;
const current = parseInt(el.getAttribute('data-spoons') || '3', 10);
if (current < 5) {
  el.setAttribute('data-spoons', String(current + 1));
  localStorage.setItem('p31:spoons', String(current + 1));
}
```

No API call is made. The update is client‑side only. This preserves privacy for self‑care.

## 4. Registration Flow

A game registers in the P31 ecosystem:

1. **Author deploys game** — static HTML on Cloudflare Pages, Vercel, Netlify, or IPFS.
2. **Author creates manifest** — JSON file at the game root or embedded in HTML.
3. **Author submits to arcade catalog** — adds entry to `apps/arcade/functions/api`'s games list.
4. **P31 verifies** — checks manifest validity, tests attestation endpoint.
5. **Game appears in catalog** — `GET /api/games` returns the updated list.

## 5. Reward Tables

### 5.1 Standard Rewards

| Game | Action | Base LOVE | Attestation | Max/Session |
|------|--------|-----------|-------------|-------------|
| Bonding | `bonding_complete` | 25 | Mutual | 10 |
| Bonding | `bonding_assist` | 10 | Mutual | 20 |
| Bashball | `bashball_assist` | 15 | Mutual | 20 |
| Bashball | `bashball_teamwork` | 10 | Mutual | 15 |
| Generic | `cooperative_complete` | 20 | Mutual | 10 |
| Generic | `peer_assist` | 8 | Mutual | 25 |
| Arcade | `ambient_engagement` | 0 (regenerates spoons) | None | ∞ |

### 5.2 Custom Rewards

Game authors can define their own reward actions. New actions must be registered with the federation-bridge before they can be attested. Custom rewards follow the same DRRP formula:

```
R_n = R_base / (1 + log2(1 + n))
```

## 6. Integration Checklist

For a new game to participate in the LOVE economy:

- [ ] Game manifest published at known URL or embedded in HTML
- [ ] Player identity available (DID from localStorage `p31:did`)
- [ ] Cooperative actions call `POST https://federation.p31ca.org/love/attest`
- [ ] Attestation includes `giver_did`, `receiver_did`, and `action`
- [ ] Reward definitions registered (if custom actions)
- [ ] Spoon‑aware difficulty (reads `data-spoons` attribute)
- [ ] Ambient games use spoon regeneration (no mint)
- [ ] Game registered in arcade catalog

## 7. Example: Adding a New Game

```typescript
// my-game.ts
import { attestLOVE } from './love'; // from arcade or bonding love module

async function onCooperativeAction(giverDid: string, receiverDid: string) {
  const result = await attestLOVE(giverDid, receiverDid, 'cooperative_complete');
  if (result.ok) {
    console.log(`Earned ${result.reward} LOVE (multiplier: ${result.multiplier})`);
  }
}

// Read spoon level for difficulty
function getSpoons(): number {
  return parseInt(document.documentElement.getAttribute('data-spoons') || '3', 10);
}

// Adapt difficulty based on spoons
function getDifficulty(): number {
  const spoons = getSpoons();
  // Lower spoons = easier game
  return Math.max(0.3, spoons / 5);
}
```

## 8. Governance

Game reward definitions and categories are governed by the P31 design system governance (`p31 release`). Adding a new reward action requires:

1. Proposal in the `cli/tokens/` repository (update BASE_REWARDS)
2. Review for alignment with PoL framework (cooperative, non‑extractive)
3. Deploy to federation-bridge
4. Announce in arcade catalog

## 9. References

- Proof of Love v2.1 Paper (`docs/proof-of-love-v2.1.md`)
- LOVE Federation Protocol (`docs/love-federation-protocol.md`)
- Arcade API (`apps/arcade/functions/api/[[path]].ts`)
- Federation Bridge (`workers/federation-bridge/src/index.ts`)
- Bashball Integration (`apps/arcade/src/games/Bashball.tsx`)
- Bonding Integration (`apps/bonding/src/lib/love.ts`)
