# SpIn Mesh Demo — Three‑Node Simulation

This demo runs three local PGLite nodes (Alice, Bob, Carol) connected via the matchmaking DO. It demonstrates a Top Trading Cycle where:

- Alice has *Zelda* (GBA cartridge) & wants *Elden Ring*  
- Bob has *Raspberry Pi 400* & wants *Zelda*  
- Carol has *Elden Ring* & wants *Raspberry Pi 400*

Cycle forms, resources lock, hand‑off coordinates generated, Joy Attestation decrypted by new owners, L.O.V.E. token minted.

---

## Run the demo

```bash
# Install dependencies (root)
npm install

# Start node A (Alice)
PGLITE_PORT=3001 node demo/nodeA.mjs &

# Start node B (Bob)
PGLITE_PORT=3002 node demo/nodeB.mjs &

# Start node C (Carol)
PGLITE_PORT=3003 node demo/nodeC.mjs &

# Wait a minute — the matchmaking DO detects cycle, locks items, prints coords
```

Each node reads/writes its local PGLite file (`spin-*.db`) and syncs with the DO.

---

## Files

- `nodeA.mjs` — Alice intent
- `nodeB.mjs` — Bob intent
- `nodeC.mjs` — Carol intent
- `sample-resources.json` — example SpInResource JSON‑LD docs used as starting inventory.

---

**Note:** This demo requires the matchmaking DO to be published (`npm run do:publish`). The DO endpoint URL must be set in `demo/config.mjs`.
