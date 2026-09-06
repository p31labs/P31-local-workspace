# @p31/shared Package Split Summary

## Overview
The `@p31/shared` package has been split into 5 focused packages to improve modularity, reduce dependency bloat, and enable better tree-shaking. The original package is marked as deprecated but remains functional for backward compatibility.

## New Packages

### 1. @p31/shared-core (Utilities + Base Types)
**Location:** `packages/shared-core/`
**Description:** Core utilities and base types for the P31 Labs ecosystem

**Exports:**
- `types` - System-wide event type extensions (NavStateChangeEvent, BufferIngestEvent, etc.)
- `events` - Typed pub/sub event bus (GameEventType, GameEventMap)
- `version` - Package version constants
- `merkle` - SHA-256 Merkle tree for SBT privacy layer
- `net` - fetchWithTimeout utility

**Dependencies:** None (minimal)

### 2. @p31/sovereign-primitives (Identity + Crypto)
**Location:** `packages/sovereign-primitives/`
**Description:** Identity and cryptographic primitives for the P31 Labs ecosystem

**Exports:**
- `crypto` - DID generation, telemetry hashing, ledger export
- `postQuantum` - Hybrid post-quantum cryptography (ML-KEM-768, ML-DSA-65)
- `trust` - EigenTrust algorithm and passport trust computation

**Dependencies:** `@noble/post-quantum`

### 3. @p31/cognitive-passport (Passport + Profiles)
**Location:** `packages/cognitive-passport/`
**Description:** Cognitive Passport schema, profiles, and scoring for the P31 Labs ecosystem

**Exports:**
- `schema` - Cognitive Passport schema constants
- `profiles` - Audience matrix and export rules
- `qfactor` - Q-Factor cognitive load modeling algorithm
- `scorer` - Buffer message scoring engine

**Dependencies:** `@p31/shared-core`

### 4. @p31/protocol-commons (Wire Protocols)
**Location:** `packages/protocol-commons/`
**Description:** Wire protocols and telemetry for the P31 Labs ecosystem

**Exports:**
- `cars-wire` - CARS WebSocket vocabulary
- `geodesic-room-wire` - GeodesicRoom WebSocket protocol
- `geodesic-build-snapshot` - Solo geodesic build snapshot
- `daubert-export` - Browser-side Daubert export

**Dependencies:** `@p31/shared-core`

### 5. @p31/geodesic-core (3D + Campaign)
**Location:** `packages/geodesic-core/`
**Description:** 3D geodesic and campaign systems for the P31 Labs ecosystem

**Exports:**
- `campaign` - Geodesic campaign data (5-track progressive coach)
- `room-wire` - GeodesicRoom WebSocket protocol (shared with protocol-commons)
- `build-snapshot` - Solo geodesic build snapshot (shared with protocol-commons)

**Dependencies:** `@p31/shared-core`, `three.js` (peer)

## Migration Path

### For New Code
Use the new packages directly:
```typescript
// Instead of @p31/shared
import { VERSION } from '@p31/shared-core';
import { generateDID } from '@p31/sovereign-primitives';
import { computeQFactor } from '@p31/cognitive-passport';
import { CARS_WIRE_SCHEMA } from '@p31/protocol-commons';
import { GEODESIC_CAMPAIGN } from '@p31/geodesic-core';
```

### For Existing Code
The original `@p31/shared` package remains functional. Update imports at your own pace:
```typescript
// Old (still works)
import { VERSION, generateDID, computeQFactor } from '@p31/shared';

// New (recommended)
import { VERSION } from '@p31/shared-core';
import { generateDID } from '@p31/sovereign-primitives';
import { computeQFactor } from '@p31/cognitive-passport';
```

## Package Structure

```
packages/
├── shared/                    # DEPRECATED (original)
├── shared-core/              # NEW - Utilities + base types
├── sovereign-primitives/     # NEW - Identity + crypto
├── cognitive-passport/       # NEW - Passport + profiles
├── protocol-commons/        # NEW - Wire protocols
└── geodesic-core/           # NEW - 3D + campaign
```

## Key Benefits

1. **Smaller Bundle Size** - Import only what you need
2. **Clearer Dependencies** - Each package has explicit, minimal dependencies
3. **Better Tree-Shaking** - Focused exports enable better dead code elimination
4. **Easier Maintenance** - Domain-specific packages are easier to understand and maintain
5. **Backward Compatibility** - Original package still works during migration

## Notes

- All new packages use the same TypeScript configuration as the original
- Source files have been copied (not moved) to maintain backward compatibility
- The original `@p31/shared` package is marked as deprecated in package.json
- Import paths in consuming packages have NOT been updated yet (separate step)
