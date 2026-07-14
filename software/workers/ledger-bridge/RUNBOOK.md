# ledger-bridge — RUNBOOK

**Service:** `ledger-bridge` (LIVE — https://ledger-bridge.trimtab-signal.workers.dev)
**Repo:** `software/workers/ledger-bridge`
**Stack:** Cloudflare Worker + `viem` (Base Sepolia / chain 84532)
**Purpose:** Off-chain → on-chain attestation relay. Closes the gap where no
Worker calls the deployed P31 sovereign-chain contracts.

## Scope

Attestation anchoring only. **Does NOT mint/burn a fungible LOVE token** — the
LOVEToken ERC-20 path was retired (`software/workers/test/retired-contracts.test.ts`).
Two on-chain actions are supported:

| Endpoint | On-chain call | Contract |
|---|---|---|
| `POST /anchor` | `anchor(entry_hash, uri)` | `P31TransparencyAnchor` |
| `POST /anchor-batch` | `anchor(...)` × N | `P31TransparencyAnchor` |
| `POST /care-proof` | `submitCareProofs(...)` | `ProofOfCare` (as relay) |

## Deployed contract addresses (Base Sepolia, 84532)

> Unified in **CWP-2026-023 Phase 0** (2026-07-13). The earlier `0x4384…` /
> `0x8dd8…` addresses are RETIRED.

- `ProofOfCare` — `0x08263FdD50196F229C9C2ccD650056067b884538` (oracle + relay)
- `LOVESBT` — `0x521cAD1b54CDDB2B6B53a30EBe050C429F9c6C55` (soulbound care SBT)
- `P31TransparencyAnchor` — `0xd930Fc4d429BbE6B8CEcca9e4C77386dB528e267` (anchor)
- Full set: see `apps/p31ca/public/p31-chain-anchor.json`

## Live mode (current)

`DRY_RUN="false"` (set 2026-07-13) → endpoints broadcast real transactions to
Base Sepolia. `BRIDGE_PRIVATE_KEY` is set as a Cloudflare secret.

```
curl https://ledger-bridge.trimtab-signal.workers.dev/health
# → {"status":"ok","dryRun":false,"chain":"base-sepolia","anchorDeployed":true,...}

curl -X POST https://ledger-bridge.trimtab-signal.workers.dev/anchor \
  -H 'Content-Type: application/json' \
  -d '{"entryHash":"0x<64-hex>","uri":"https://love-ledger.p31ca.org/chain?did=<did>"}'
# → {"ok":true,"label":"anchor","txHash":"0x...","status":"success"}
```

## Go live (DONE — 2026-07-13)

1. ✅ Deployed `P31TransparencyAnchor` to Base Sepolia; set `ANCHOR_ADDR`.
2. ✅ Funded dedicated relay signer `0x6B31cF8E72483D70Eee4C3e5970B5C95774FC8Ca`
   (~0.02 ETH; distinct from the deployer key) and set it as `BRIDGE_PRIVATE_KEY`.
3. ✅ `ProofOfCare.setOracle(loveLedger/ProofOfCare)` + `setRelay(0x6B31cF8E…)` called
   by the architect key during `DeployMint` (CWP-2026-023). `/care-proof` relay path live.
4. ✅ Flipped `DRY_RUN="false"`.
5. ✅ `wrangler deploy` — live.

## Sovereign care-proof flow (CWP-2026-025)

`POST /care-proof` is a **signed, DID-gated relay** — open minting was removed.

Request body:
```json
{
  "did": "did:key:z<base64url(rawEd25519Pub)>",
  "signature": "<base64 Ed25519 sig over canonical message>",
  "users": ["0x<ethAddress>"],
  "tProx":  ["<1e18-scaled string>"],
  "qRes":   ["<1e18-scaled string>"],
  "tasks":  ["<int string>"],
  "entropyRoots": ["0x<64-hex>"]
}
```
- `tProx`/`qRes`/`tasks` are **strings** (1e18-scaled; exceed `Number.MAX_SAFE_INTEGER`).
- Canonical signed message (client + bridge must match exactly):
  `proof|<did>|<users>|<tProx>|<qRes>|<tasks>|<entropyRoots>` (each array joined with `,`).
- The bridge resolves `identity_registry` (shared `love-ledger` D1) for the DID,
  verifies the Ed25519 sig, and requires `users[0] === registered eth_address`.
- On success it relays `submitCareProofs(...)` on-chain **and** writes a dual-anchor
  row to `care_proofs` in the same D1 (off-chain court-admissible record).

Register a DID first: `POST https://love-ledger.p31ca.org/identity/register`
(self-signed: `signature` over `<did>|<ed25519_pub_b64>||<eth_address>`).

PHOS UI: `apps/phos/src/surfaces/MintSurface.tsx` (surface `MINT`, route `/mint`).

## Integration (how LOVE ledger events reach here)

The LOVE ledger (`apps/phos/src/workers/love-ledger`, `love_chain` table) now
anchors every court-admissible entry on-chain. After each `INSERT` into
`love_chain` (in `/transfer` and `/withdraw`), the Worker calls `POST /anchor`
via `ctx.waitUntil(anchorOnChain(entryHash, did, env.BRIDGE_URL))` — fire-and-forget,
non-blocking. The `entry_hash` (64-hex, no prefix) is `0x`-prefixed to match
`P31TransparencyAnchor.anchor()`'s `bytes32` arg. The `uri` points at the
verifiable hash-chain manifest for that DID:

```
https://love-ledger.p31ca.org/chain?did=<did>
```

Agents can anchor arbitrary entries via the `love_anchor` MCP tool
(`cli/love-registry.js`).

## Verify
```
curl https://<worker>/health   # shows dryRun, anchorDeployed, addresses
```
