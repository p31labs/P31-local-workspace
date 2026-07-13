# ledger-bridge — RUNBOOK

**Service:** `ledger-bridge` (not yet deployed)
**Repo:** `software/workers/ledger-bridge`
**Stack:** Cloudflare Worker + `viem` (Sepolia / chain 11155111)
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

## Deployed contract addresses (Sepolia)

- `ProofOfCare` — `0x4384c856c0ccc9cb5a4adb148937ea557293543b` (live)
- `LOVESBT` — `0x8dd8041f7e78decb2f3bb078d68da2e2f36f5636` (live)
- `P31TransparencyAnchor` — **NOT deployed by `DeployAll.s.sol`**. Deploy it
  (forge script in `bonding-soup/packages/p31-sovereign-chain`) and set
  `ANCHOR_ADDR` in `wrangler.toml` before using `/anchor`. The Worker refuses to
  broadcast while `ANCHOR_ADDR` is the zero address.

## Dry-run (default, safe)

`DRY_RUN="true"` (default) → endpoints encode the calldata and return it as JSON
**without broadcasting**. Deploy and inspect with no secrets:

```
curl https://<worker>/health
curl -X POST https://<worker>/anchor -H 'Content-Type: application/json' \
  -d '{"entryHash":"0x<64-hex>","uri":"ipfs://love-chain/<id>"}'
# → {"dryRun":true,"label":"anchor","to":"0x...","data":"0x...", ...}
```

## Go live

1. Deploy `P31TransparencyAnchor` to Sepolia; set `ANCHOR_ADDR`.
2. Fund a Sepolia signer wallet.
3. Set the signer as a secret:
   ```
   cd software/workers/ledger-bridge
   wrangler secret put BRIDGE_PRIVATE_KEY   # 0x... private key
   ```
4. Point `ProofOfCare` at this Worker (one-time, by the **architect** key — the
   bridge cannot set its own relay):
   ```
   # off-chain, with the architect/deployer key:
   ProofOfCare.setRelay(<ledger-bridge deployed address>)
   ```
5. Flip dry-run off (set `DRY_RUN="false"` via `wrangler variable put`).
6. `npx wrangler deploy`.

## Integration (how LOVE ledger events reach here)

The LOVE ledger (`apps/phos/src/workers/love-ledger`, `love_chain` table) should,
after inserting a court-admissible entry, call `POST /anchor` with
`entryHash = entry_hash` and a `uri` to the manifest. This is the on-chain
court-admissible anchor. Wire it as a service binding or scheduled cron — left as
the integration step (the bridge is decoupled and callable over HTTP).

## Verify
```
curl https://<worker>/health   # shows dryRun, anchorDeployed, addresses
```
