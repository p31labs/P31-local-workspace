# P31 Secret Vault + Agent Orchestrator — Agent Swarm Runbooks

**CWP:** 2026-014 · **Date:** 2026-07-12 · **Status:** Secrets Store live, Orchestrator GLM fallback live

This document is the operational handoff for the two parallel paths executed in this
session:

- **Path 1 — Orchestrator GLM fallback** (mcp-x402-gateway): `/agent/run` now plans
  via Workers AI GLM when needle-rs is cold/broken, then executes the plan through the
  L3.4 bridge and settles a PQC care contract in LOVE.
- **Path 2 — P31 Secret Vault** (Cloudflare Secrets Store): `LOVE_AUTH_SECRET` is
  centralised in one account-level store, bound to all three Workers that need it, and
  rotated by a dedicated cron Worker with a D1 audit trail.

Runbooks A–D below are written so a swarm agent (or human operator) can verify, extend,
or recover each path without re-deriving context.

---

## Reference facts (verified this session)

| Item | Value |
|------|-------|
| Cloudflare Account ID | `ee05f70c889cb6f876b9925257e3a2fa` |
| Secrets Store name | `p31-secrets` |
| Secrets Store ID | `33d48162fd6842869beeed3516e2909c` |
| `LOVE_AUTH_SECRET` secret UUID | `2dc63e6a05a945e8be2af584a1f10a49` |
| Canonical `LOVE_AUTH_SECRET` value | `43fa3d824b176cc0394d389344f867466c439aaeecc862f3e17266a968443ab7` |
| Bound Workers | `mcp-x402-gateway`, `love-ledger`, `spin-logistics` (logistics-do) |
| Audit D1 | `love-ledger` (`592e3e2e-3203-4e0a-8342-9e85215ec8a6`), table `secret_rotation_log` |
| wrangler version that supports `secrets_store_secrets` | **4.107.0+** (4.105.0 silently rejects the field) |

> **Migration drift caveat:** the `love-ledger` D1 remote has migrations 007–009 applied
> but its migration-tracking table is stale, so `wrangler d1 migrations apply` fails with
> `duplicate column name`. New schema (e.g. `011_secret_rotation_log.sql`) MUST be applied
> with `wrangler d1 execute love-ledger --remote --file=./migrations/011_*.sql`.

---

## Runbook A — Orchestrator GLM Fallback (Path 1)

**Goal:** `/agent/run` classifies → plans → executes → settles even when needle-rs is down.

**What was changed**
- `software/workers/mcp-x402-gateway/src/orchestrator.ts`: `planWithGlm()` now normalises
  every Workers-AI response shape — `response` as an array, `tool_calls`, or a JSON-array
  string — into `Step[]`. The earlier bug was that Workers AI returns
  `out.response` as an **array** (`[{tool, arguments}]`); `String([...])` produced
  `"[object Object]"` and the JSON parse failed, yielding an empty plan.
- `runAgent()` filters the plan to known `P31_TOOLS` and settles a care contract.

**Verify / redeploy**
```bash
cd software/workers/mcp-x402-gateway
npx wrangler deploy                      # 4.107.0+; gateway uses AI + NEEDLE bindings

SECRET="43fa3d824b176cc0394d389344f867466c439aaeecc862f3e17266a968443ab7"
GW="https://mcp-x402-gateway.trimtab-signal.workers.dev"
ts=$(date +%s%3N)                        # IMPORTANT: milliseconds, not seconds
MAC=$(TS="$ts" SECRET="$SECRET" node -e \
  "const c=require('crypto');process.stdout.write(c.createHmac('sha256',process.env.SECRET).update('love:'+process.env.TS).digest('hex'))")

curl -s -X POST "$GW/agent/run" \
  -H "Content-Type: application/json" \
  -H "X-DID: did:key:ztest" \
  -H "X-Love-Timestamp: $ts" \
  -H "X-Love-Auth-MAC: $MAC" \
  -d '{"query":"deploy the analytics surface to production"}'
```
**Expected:** `classifier:"glm"`, non-empty `plan`, `contract_id` set (e.g. `58294e42-…`),
`contract_error:null`. (A `530` on `phos_deploy` is the downstream bridge tool, not the
orchestrator — tracked separately.)

**Known gotcha:** the Axis-6 HMAC `verifyLoveHmac` compares `Date.now()` (ms) against the
header timestamp. Clients MUST send **millisecond** timestamps; `date +%s` (seconds) always
fails the 60 s TTL.

---

## Runbook B — Secret Vault Setup (Path 2 foundation)

**Goal:** one `LOVE_AUTH_SECRET`, one store, three Workers.

**As-built recipe (reproducible)**
```bash
# 1. Create the store (idempotent — skip if it exists)
npx wrangler secrets-store store create p31-secrets --remote
npx wrangler secrets-store store list --remote      # copy the store ID

# 2. Create the secret (--scopes workers is REQUIRED; the AI draft omitted it)
STORE_ID="33d48162fd6842869beeed3516e2909c"
npx wrangler secrets-store secret create "$STORE_ID" \
  --name LOVE_AUTH_SECRET \
  --value "43fa3d824b176cc0394d389344f867466c439aaeecc862f3e17266a968443ab7" \
  --scopes workers --remote

# 3. Bind to each Worker via wrangler.toml (array-of-tables syntax, NOT inline array):
#    [[secrets_store_secrets]]
#    binding = "LOVE_AUTH_SECRET"
#    store_id = "33d48162fd6842869beeed3516e2909c"
#    secret_name = "LOVE_AUTH_SECRET"
#    Then refactor code: const s = await env.LOVE_AUTH_SECRET.get()  (or resolve
#    helper that handles both string and binding).
```

**Workers already bound + verified**
- `mcp-x402-gateway` — `/agent/run` settles contract via `await env.LOVE_AUTH_SECRET.get()` (verified: `contract_id` returned).
- `love-ledger` — Bearer `Authorization` write gate resolves async (verified: `/contract/propose` 200 + id; unauth write → 401 fail-closed).
- `spin-logistics` (logistics-do) — mint path now resolves the secret (binding applied; code handles string + binding).

**Critical wrangler-version note:** `spin-logistics` resolved an older `npx wrangler`
(4.105.0) that prints `Unexpected fields found in top-level field: secrets_store_secrets`
and **drops the binding**. Redeploy with the working version:
```bash
cd software/spin-mesh/logistics-do && npx wrangler@4.107.0 deploy
```

**Legacy cleanup:** `love-ledger` previously held `LOVE_AUTH_SECRET` via
`wrangler secret put`. It is now superseded by the store binding (binding wins over a
same-named secret). Confirm no stale per-worker secret remains:
```bash
cd apps/phos/src/workers/love-ledger && npx wrangler secret list   # expect empty / no LOVE_AUTH_SECRET
```

---

## Runbook C — Rotation Worker Deployment (Path 2 rotation + audit)

**Goal:** rotate `LOVE_AUTH_SECRET` on a schedule and on demand, with an audit trail.

**Code:** `software/workers/secret-rotator/` (`src/index.ts`, `wrangler.toml`).
- Quarterly cron: `0 0 1 */3 *` (day 1 of every 3rd month).
- `POST /admin/rotate` — emergency "break-glass" rotation, guarded by `Bearer $ADMIN_TOKEN`.
- Rotation calls `PUT /accounts/{acct}/secrets_store/stores/{store}/secrets/{id}` with the
  new value, then writes `secret_rotation_log` (SHA-256 hash of new value only — never the
  value) to the shared `love-ledger` D1.

**Deploy**
```bash
cd software/workers/secret-rotator && npx wrangler deploy
# Set the two required secrets:
npx wrangler secret put ADMIN_TOKEN            # random 64-hex; already set this session
# CF_API_TOKEN needs the "Secrets Store Write" permission (see below)
```

**CF_API_TOKEN (manual step — cannot be created via CLI here):**
Create a Cloudflare API token with the **Secrets Store Write** permission (dash.cloudflare.com
→ My Profile → API Tokens → Create Custom Token → Account → Secrets Store → Edit). Then:
```bash
npx wrangler secret put CF_API_TOKEN
```
Without it, `/admin/rotate` and the cron will fail at the Cloudflare API call and log
`status:"failed"` to `secret_rotation_log`.

**Trigger an emergency rotation**
```bash
ADMIN=$(…)   # the ADMIN_TOKEN value
curl -s -X POST https://secret-rotator.trimtab-signal.workers.dev/admin/rotate \
  -H "Authorization: Bearer $ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"rotated_by":"incident-1234"}'
```
Because bound Workers read `LOVE_AUTH_SECRET` at runtime via `.get()`, the new value
propagates on next cold start — **no per-Worker redeploy required**.

**Read the audit trail**
```bash
npx wrangler d1 execute love-ledger --remote --command \
  "SELECT id,secret_name,rotated_by,rotated_at,status FROM secret_rotation_log ORDER BY rotated_at DESC LIMIT 20"
```

---

## Runbook D — Agent Swarm Dispatch & Extension

**Goal:** hand off remaining/deferred work to swarm agents without re-deriving context.

### D.1 Phase 2 needle-rs fine-tune — **ON HOLD** (user decision 2026-07-12)
Status: dataset + runbook ready; GPU training delegated to a local agent. When resumed,
the fine-tune fixes needle's malformed-JSON output so `/classify` and the orchestrator's
fast path return `needle_used:true` instead of falling back to GLM. Handoff recipe lives
in `cwp-2026-009-sierpinski-expansion/phase-2-finetune/`. Do **not** block Path 1/2 on it.

### D.2 Extend the vault to more secrets (swarm task)
`BLIND_ISSUER_PRIVATE_KEY`, `RECEIPT_SIGNER_PRIVATE_KEY`, `MLDSA_SIGNER_PRIVATE_KEY`, and
`PASSKEY_JWT_SECRET` are still per-Worker secrets. To bring them under the vault:
1. `wrangler secrets-store secret create <store-id> --name <NAME> --value <…> --scopes workers --remote`.
2. Add a `[[secrets_store_secrets]]` entry to each Worker's `wrangler.toml`.
3. Refactor each read site to `await env.<NAME>.get()` (or the `resolveSecret` helper pattern
   already in `love-ledger/index.ts` and `mcp-x402-gateway/src/love-auth.ts`).
4. Redeploy (use 4.107.0+ everywhere).

### D.3 Verification checklist (run after any vault change)
- [ ] `wrangler deploy` shows `env.LOVE_AUTH_SECRET (.../LOVE_AUTH_SECRET) Secrets Store Secret` for each Worker.
- [ ] `mcp-x402-gateway`: `/agent/run` returns `contract_id` set (proves `.get()` resolves).
- [ ] `love-ledger`: `/contract/propose` with `Bearer <canonical>` → 200 + id; without auth → 401.
- [ ] `secret-rotator`: `/health` → `{"status":"ok"}`; audit table exists in `love-ledger` D1.

### D.4 Rollback
If a rotation breaks auth: the Secrets Store retains prior versions during the grace window.
To revert: `wrangler secrets-store secret update <store-id> --secret-id <id> --value <prev> --remote`
(or the dashboard). Bound Workers pick up the previous value on next cold start.
