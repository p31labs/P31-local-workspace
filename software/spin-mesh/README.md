# SpIn Barter Mesh (K₄ Extension)

**Local-first, zero-fiat, neuro-affirmative media swap system.**

This MVP implements the SpIn (Special Interest) Barter Mesh — a Cloudflare Workers + PGLite application enabling physical media (games, cartridges, hobby tools) to be bartered without money, using Top Trading Cycles (TTC) and Joy Attestations to protect neurodivergent joy.

See `docs/cwp-convergence/CWP-SpIn-01-Barter-Mesh-Scaffold.md` for the full specification.

---

## Quickstart (Local Development)

```bash
# Install dependencies
npm install

# Start local PGLite + UI dev server (Vite)
npm run dev
# → UI available at http://localhost:5173

# In another terminal, publish the Matchmaking DO to Cloudflare (requires wrangler login)
cd matchmaking-do
npx wrangler publish
# Note the resulting URL, e.g. https://spin-matchmaking.<your-subdomain>.workers.dev
# Set it as the DO_URL in demo/config.mjs for the demo nodes.

# Run the three-node demo in separate terminals:
node demo/nodeA.mjs &
node demo/nodeB.mjs &
node demo/nodeC.mjs
# After ~10s, cycle should lock and logs print cycle IDs.
```

---

## Directory Structure

```
spin-mesh/
├── pglite-schema/
│   └── schema.sql               # SQLite tables: resources, attestations, intents, cycle_locks, handovers, love_tokens
├── crypto/
│   ├── crypto.ts                # HKDF-SHA256 key derivation + AES-256-GCM encrypt/decrypt
│   └── crypto.test.ts           # Vitest suite
├── matchmaking-do/
│   ├── index.ts                 # Durable Object: intent ingestion, TTC (Tarjan SCC), cycle lock, WebSocket push
│   ├── wrangler.toml            # DO deployment config (binds LOGISTICS)
├── logistics-do/
│   ├── index.ts                 # Handover coordination: ephemeral key exchange, venue suggestion, L.O.V.E. mint
│   └── wrangler.toml
├── logistics/
│   ├── geohash.ts               # base32 geohash encode/decode
│   └── geohash-midpoint.ts      # spherical midpoint + Overpass venue query
├── phos-ui/
│   ├── App.jsx                  # Intent search, resource cards, release button
│   ├── joy-attestation-modal.jsx
│   └── p31-theme.css            # P31 calming tokens (void, teal, cloud)
├── demo/
│   ├── nodeA.mjs, nodeB.mjs, nodeC.mjs
│   ├── config.mjs               # DO URL & user/resource IDs
│   └── README.md
├── spin-context.jsonld          # JSON-LD context for SpInResource
├── phos-intent-catalog.json     # Neuro-intent taxonomy for search
├── package.json
├── vitest.config.ts
└── README.md
```

---

## Design Tokens (P31 Universal)

```css
:root {
  --p31-void: #0D1117;    /* deep grounding */
  --p31-cloud: #161B22;   /* secondary surface */
  --p31-teal: #58A6FF;    /* safe primary action */
  --p31-accent: #7A27FF;  /* quantum violet — accents only */
  --p31-text: #E6EDF3;    /* high‑contrast text */
}
```

**No red notification dots, no countdown timers, no FOMO metrics.**

---

## Data Model (PGLite)

### SpInResource (JSON‑LD)

```json
{
  "@context": "https://p31.network/spin-context.jsonld",
  "id": "urn:uuid:8f3c-4b9a-112e-...",
  "type": "SpInResource",
  "physical_format": "Cartridge_GBA",
  "title": "Golden Sun",
  "neuro_metadata": {
    "monotropic_potential": 0.95,
    "executive_function_requirement": "low",
    "multiplayer_anxiety_index": 0.0,
    "stimulation_profile": ["ambient_audio", "turn_based_pacing", "high_visual_saturation"]
  },
  "custody_state": "available_for_mesh_swap"
}
```

SQLite schema in `pglite-schema/schema.sql`.

---

## Core Work Packages (Sub‑CWP)

| Sub‑CWP | Deliverable | Status |
|---------|-------------|--------|
| SpIn‑01‑01 | Ontology & Crypto (PGLite schema, Web Crypto pipeline, Vitest) | ✅ Complete |
| SpIn‑01‑03 | Matchmaking DO (TTC detection, iterative Tarjan, WebSocket) | ✅ Complete |
| SpIn‑01‑04 | Logistics DO (handover coordination, X3DH key exchange, venue suggestion, L.O.V.E. mint) | ✅ Complete (stub venue) |
| SpIn‑01‑05 | PHOS UI (React + Vite, calm theme, intent search, Joy Attestation modal) | ✅ Complete (UI scaffold) |
| SpIn‑01‑02 | TinyBase state sync between PGLite instance and DO | ⏳ Planned |
| SpIn‑01‑06 | End‑to‑end demo (three nodes, full cycle → handover) | ⏳ Partial — cycle lock works; handover pending |

---

## Acceptance Tests (MVP)

- [x] `npm test` passes (crypto round‑trip)
- [x] Schema loads in PGLite
- [x] Matchmaking DO: two nodes post intents, cycle detected and locked within ~60 s
- [ ] Logistics DO: handover init, key exchange, venue suggestion, completion destruction
- [ ] UI renders calming tokens only; FOMO‑free
- [ ] Intent search by `stimulation_profile` returns matching items

---

## Deployment

### Matchmaking DO

```bash
cd matchmaking-do
npx wrangler publish
# Bindings: MATCHMAKING (self), LOGISTICS (to logistics-do)
```

### Logistics DO

```bash
cd logistics-do
npx wrangler publish
```

### PHOS UI

```bash
npm run build
# Deploy static build to any static host (Cloudflare Pages, Netlify, etc.)
# Set DO_URL environment variable to the published Matchmaking DO endpoint.
```

---

## Next Steps (Post‑MVP)

1. **PGLite ↔ DO sync** — implement TinyBase listener to push local intents to Matchmaking DO automatically.
2. **Ephemeral chat** — WebSocket room created by Logistics DO; messages encrypted with group secret; auto‑delete on completion.
3. **L.O.V.E. ledger** — mint soulbound token on a dedicated DO or D1; integrate EigenTrust weighting.
4. **User profiles & location** — store (lat,lon) securely; compute true midpoints.
5. **Multi‑party cycles** (N > 2) — upgrade Tarjan to accept larger SCCs and adapt handover to ring protocol.
6. **Carrier eSIM provisioning** — integrate CWP‑047 to enable cellular mesh fallback.

---

## License

Same as P31 Labs monorepo — see ../LICENSE.

---

**Auth:** Architect (Opus) · Sonnet/CC execution · Neuro‑affirmative, anti‑extractive, joy‑first.
