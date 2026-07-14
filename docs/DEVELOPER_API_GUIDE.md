# Developer API Guide

*For external integrators building on the P31 platform.*

All P31 Workers are Cloudflare Workers. This guide lists the public endpoints,
auth schemes, and integration patterns. Base hostnames:

| Worker | Host |
|---|---|
| love-ledger | `love-ledger.p31ca.org` |
| mcp-x402-gateway | `mcp-x402-gateway.trimtab-signal.workers.dev` |
| agent-runtime | `agent-runtime.trimtab-signal.workers.dev` |
| care-mesh | `care-mesh.trimtab-signal.workers.dev` |
| p31-mcp-server | `p31-mcp-server.trimtab-signal.workers.dev` |
| intent-resolver | `intent-resolver.trimtab-signal.workers.dev` |
| ledger-bridge | `ledger-bridge.trimtab-signal.workers.dev` |

---

## 1. LOVE ledger (accounts, care score, pilot registry)

### Auth
Write paths require a signed request. Approved write paths:
`/transfer`, `/stake`, `/care-score`, `/withdraw`, `/family/onboard`,
`/family/status`, `/llm/reserve`, `/llm/settle`, `/contract/*`.

### Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/care-score?did=` | Care score for a `did` |
| GET | `/balance?did=` | LOVE balance / staking / reputation |
| GET | `/chain` | Court-admissible SHA-256 hash chain |
| GET | `/export` | Export signed ledger records |
| POST | `/family/onboard` | Register a pilot family |
| PATCH | `/family/<did>/status` | Set status `pending`/`active`/`completed` |

**Onboard a family:**
```
curl -X POST https://love-ledger.p31ca.org/family/onboard \
  -H 'Content-Type: application/json' \
  -d '{"did":"<did>","family_name":"Example Family","nodes":["n1"]}'
# → {"success":true,"did":"<did>","status":"pending"}
```

---

## 2. agent-runtime (built-in tools)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/tool/send_notification` | Notification (`{did, message, channel?, chat_id?}`) — `telegram` or `discord` |
| POST | `/tool/generate_care_report` | Care report (`{did, date_range?, format?}`) |

`send_notification` requires the worker to have `TELEGRAM_BOT_TOKEN` configured;
otherwise it returns a graceful `500`. `generate_care_report` calls love-ledger
internally (no caller auth beyond the request).

---

## 3. care-mesh (privacy-preserving care data)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/submit` | Ed25519-signed care record |
| GET | `/aggregates?family_did=` | Own raw records |
| GET | `/mesh?family_did=` | Peer records with Laplace DP noise |

**Submit a signed record:**
```
canonical="<family_did>|<period_start>|<period_end>|<avg_spoons>|<care_event_count>|<care_score>"
signature=$(printf '%s' "$canonical" | openssl pkeyutl -sign -inkey key.pem -rawin | xxd -p)
pubkey=$(openssl pkey -pubin -in pub.pem -outform DER | tail -c 32 | xxd -p)

curl -X POST https://care-mesh.trimtab-signal.workers.dev/submit \
  -H 'Content-Type: application/json' \
  -d '{"family_did":"<did>","period_start":1,"period_end":2,"avg_spoons":3,
       "care_event_count":10,"care_score":0.7,
       "signature":"'"$signature"'","pubkey":"'"$pubkey"'"}'
# → {"ok":true}
```
The signature is an Ed25519 signature over the canonical string using the raw
32-byte public key (hex). `avg_spoons` in `/mesh` is perturbed with Laplace noise
(ε = 0.5, sensitivity = 5) and clamped to `[0,5]`.

---

## 4. mcp-x402-gateway (orchestrator + LOVE settlement)

| Method | Path | Purpose |
|---|---|---|
| POST | `/agent/run` | Natural-language intent → plan → tool execution |
| POST | `/mcp` | MCP front door to the L3.4 tool bridge |

**`/agent/run` (LOVE-path auth):** requires an HMAC-SHA256 proof over
`love:<timestamp>` using `LOVE_AUTH_SECRET`, with a 60s TTL. Timestamps are in
**milliseconds**.
```
SECRET=<LOVE_AUTH_SECRET>
TS=$(date +%s%3N)
MAC=$(printf 'love:%s' "$TS" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')
curl -X POST https://mcp-x402-gateway.trimtab-signal.workers.dev/agent/run \
  -H 'Content-Type: application/json' -H "X-DID: <did>" \
  -H "X-Love-Timestamp: $TS" -H "X-Love-Auth-MAC: $MAC" \
  -d '{"query":"generate a care report for <did>"}'
# → {"classifier":"glm","plan":[{"tool":"generate_care_report",...}],"ok":true,"contract_id":"..."}
```

---

## 5. p31-mcp-server (native MCP front door)

Exposes the 9 P31 tools via MCP Streamable HTTP:
`oasis_execute, phos_adopt, jitterbug_run, phos_learn, phos_deploy, phos_watch,
healer_remediate, bus_emit, phos_rollback`.

Point any MCP client at:
```
https://p31-mcp-server.trimtab-signal.workers.dev/mcp
```
Each `tools/call` is forwarded to the `mcp-x402-gateway` bridge, so the same
tools the orchestrator uses are available to external MCP clients.

**Raw MCP probe:**
```
curl -X POST https://p31-mcp-server.trimtab-signal.workers.dev/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"x","version":"1"}}}'
curl -X POST https://p31-mcp-server.trimtab-signal.workers.dev/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

---

## 6. intent-resolver (edge intent classification)

| Method | Path | Purpose |
|---|---|---|
| POST | `/intent` | Parse intent → Creation Quote |
| POST | `/classify` | Classify a prompt against a tool list (needle-rs) |
| GET | `/health` | Liveness |

---

## 7. Spike Land MCP (external, optional)

P31's `agent-runtime` can optionally federate with Spike Land's hosted MCP
registry (`https://mcp.spike.land/mcp`, Streamable HTTP, `Bearer` auth). This is
feature-flagged and **off by default**; it requires a Spike Land API key
(`sk_...`). See `software/workers/agent-runtime/RUNBOOK.md` for enablement.

---

## 8. Sovereign identity registry & care attestation (CWP-2026-025/026)

`love-ledger` holds a self-sovereign **`identity_registry`** (D1) binding a `did:key`
(Ed25519) to an Ethereum address, with an optional **ML-DSA-65** public key. Registration is
**self-signed** — the client proves control of the DID by signing the payload; no server secret.

### Endpoints (love-ledger)
| Method | Path | Purpose |
|---|---|---|
| POST | `/identity/register` | Bind `did` → `eth_address` (self-signed) |
| GET | `/identity/lookup?did=` | Resolve a DID's `eth_address` + `mldsa65_pub` |
| POST | `/identity/verify` | Verify an Ed25519 (or ML-DSA-65) signature over a message |

**Register:**
```
# canonical message the client signs:
#   <did>|<ed25519_pub_b64>|<mldsa65_pub_b64>|<eth_address>
#   (mldsa65_pub_b64 is "" if absent)
curl -X POST https://love-ledger.p31ca.org/identity/register \
  -H 'Content-Type: application/json' \
  -d '{"did":"did:key:z<base64url(rawEd25519Pub)>",
       "ed25519_pub":"<base64 raw 32B pub>",
       "mldsa65_pub":"",
       "eth_address":"0x…","signature":"<base64 Ed25519 sig>"}'
# → {"ok":true,"did":"…","eth_address":"0x…"}
```

### Quantum-safe DID — `did:jwk` (ML-DSA-65)
PHOS also issues a **`did:jwk`** from the ML-DSA-65 public key, encoded per IANA JOSE (RFC 9964)
as key type **`AKP`** (not `crv`):
```
did:jwk:<base64url( JSON{ "kty":"AKP", "alg":"ML-DSA-65", "pub":"<base64url raw 1952B pk>" } )>
```
This is the recommended quantum-safe identifier; `did:key` (Ed25519) remains the primary key used
for on-chain care proofs. Generated in the PHOS **PQC Keys** surface (`/pqc-keys`).

### Secure care-proof relay (ledger-bridge)
`POST /care-proof` is a **signed, DID-gated relay** (open minting removed). The bridge resolves
the DID's ETH binding, verifies the Ed25519 signature, and requires `users[0] === registered
eth_address`, then relays `ProofOfCare.submitCareProofs(...)` on-chain (Base Sepolia) and dual-anchors
an off-chain `care_proofs` row in the shared LOVE ledger D1.

```
# canonical signed message (client + bridge must match exactly):
#   proof|<did>|<users>|<tProx>|<qRes>|<tasks>|<entropyRoots>   (arrays joined with ",")
# tProx/qRes/tasks are STRINGS (1e18-scaled; exceed Number.MAX_SAFE_INTEGER)
curl -X POST https://ledger-bridge.trimtab-signal.workers.dev/care-proof \
  -H 'Content-Type: application/json' \
  -d '{"did":"did:key:z…","signature":"<base64 Ed25519 sig>",
       "users":["0x…"],"tProx":["1000000000000000000"],
       "qRes":["2000000000000000000"],"tasks":["2"],
       "entropyRoots":["0x<64-hex>"]}'
# → {"ok":true,"txHash":"0x…","did":"…","ethAddress":"0x…"}
```

#### Optional post-quantum co-signature (CWP-2026-027 A — ML-DSA-65)
A care proof MAY carry an **ML-DSA-65** (NIST FIPS 204, quantum-safe) co-signature. The bridge
verifies it against `identity_registry.mldsa65_pub` (self-signed at `/identity/register`). If the
DID has no ML-DSA-65 public key on file, the bridge ignores `mldsa65_sig` and falls back to the
Ed25519 proof. If a public key IS on file, the co-signature is **required and verified** — a
tampered or missing signature rejects with `400`.

- `mldsa65_sig` is the **standard base64** (not url-safe) of the 3309-byte ML-DSA-65 signature
  over the **same canonical `proof|…` message** the Ed25519 signature covers.
- The bridge uses `@noble/post-quantum` `ml_dsa65.verify(sig, msg, pub)`.

```
curl -X POST https://ledger-bridge.trimtab-signal.workers.dev/care-proof \
  -H 'Content-Type: application/json' \
  -d '{"did":"did:key:z…","signature":"<base64 Ed25519 sig>",
       "mldsa65_sig":"<base64 ML-DSA-65 sig>",
       "users":["0x…"],"tProx":["1000000000000000000"],
       "qRes":["2000000000000000000"],"tasks":["2"],
       "entropyRoots":["0x<64-hex>"]}'
```
In PHOS, the **Care SBT Mint** surface offers a "Post-Quantum Co-Signature" toggle: enabling it
unlocks the PQC vault (passphrase), signs with the stored ML-DSA-65 secret key, and (re-)registers
the DID's `mldsa65_pub` so the bridge can verify it.

---

## 9. SD-JWT care credentials (CWP-2026-027 B — RFC 9901 + VC-17)

`ledger-bridge` can issue and verify **Selective Disclosure JWTs** (SD-JWT, RFC 9901), pinned to
**draft-ietf-oauth-sd-jwt-vc-17** (typ header `dc+sd-jwt`, `_sd_alg` `sha-256`). Issuance is
Ed25519-signed (Web Crypto); disclosures are salted (`base64url([salt, claimName, claimValue])`)
and hashed with SHA-256 (`@noble/hashes`) into the payload `_sd` array. The holder reveals a subset
of claims by keeping only the corresponding `~disclosure` segments when presenting.

| Method | Path | Purpose |
|---|---|---|
| POST | `/credential/issue` | Issue an SD-JWT over a DID's claims (requires `identity_registry` entry) |
| POST | `/credential/verify` | Verify an SD-JWT and return the disclosed claims |

**Issue** (the DID must already be registered in `identity_registry`):
```
curl -X POST https://ledger-bridge.trimtab-signal.workers.dev/credential/issue \
  -H 'Content-Type: application/json' \
  -d '{"did":"did:key:z…","claims":{"careScore":85,"careEvents":12,"family":"Smith"}}'
# → {"ok":true,
#     "sdjwt":"<jws>~<disc1>~<disc2>~<disc3>",
#     "issuerPubB64":"<base64url raw Ed25519 issuer pub>",
#     "note":"Reveal selected claims with /credential/verify …"}
```
Each issuance also records a `credential_issuance` row (for the pilot dashboard "Active SD-JWTs"
KPI). The dashboard's `pilots.credentials` count joins this table.

**Verify / selectively disclose:**
```
# 1) keep only the claims you want to reveal (Node/TS helper selectDisclosures):
#    const selective = await selectDisclosures(sdjwt, ["careScore","family"]);
# 2) present the selective SD-JWT:
curl -X POST https://ledger-bridge.trimtab-signal.workers.dev/credential/verify \
  -H 'Content-Type: application/json' \
  -d '{"sdjwt":"<jws>~<disc1>~<disc3>"}'
# → {"valid":true,"disclosed":{"careScore":85,"family":"Smith"}}
#    (careEvents stays hidden — not included in the presented disclosures)
```
Verification accepts both VC-17 (`dc+sd-jwt`) and legacy (`vc+sd-jwt`) `typ` headers, requires
`_sd_alg:"sha-256"`, checks the Ed25519 JWS signature, and confirms every presented disclosure's
SHA-256 hash is bound to the payload `_sd` array. A tampered or unbound disclosure → `valid:false`.

---

## Integration patterns

- **Want a care report?** Call `agent-runtime /tool/generate_care_report` (or
  `mcp-x402-gateway /agent/run` with a natural-language query).
- **Want to run a P31 tool from your own agent?** Connect an MCP client to
  `p31-mcp-server.trimtab-signal.workers.dev/mcp`.
- **Want privacy-preserving cross-family care signal?** Submit signed records to
  `care-mesh` and read the noised `/mesh` view.
- **All calls are plain HTTPS** — no SDK required, though MCP clients work
  natively against `p31-mcp-server`.
