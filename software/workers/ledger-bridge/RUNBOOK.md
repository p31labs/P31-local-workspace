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

- `ProofOfCare` — `0x4384c856c0ccc9cb5a4adb148937ea557293543b` (live)
- `LOVESBT` — `0x8dd8041f7e78decb2f3bb078d68da2e2f36f5636` (live)
- `P31TransparencyAnchor` — `0xd930Fc4d429BbE6B8CEcca9e4C77386dB528e267` (**deployed 2026-07-13**, `ANCHOR_ADDR` set)
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
2. ✅ Funded signer wallet (deployer key, ~2 ETH on Base Sepolia).
3. ✅ Set `BRIDGE_PRIVATE_KEY` via `wrangler secret put`.
4. ⏳ `ProofOfCare.setRelay(<bridge address>)` — pending architect key; only
   needed for `/care-proof` (relay path). `/anchor` is permissionless.
5. ✅ Flipped `DRY_RUN="false"`.
6. ✅ `wrangler deploy` — live.

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
