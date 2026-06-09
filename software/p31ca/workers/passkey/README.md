# p31-passkey — WebAuthn Worker

Cloudflare Worker providing FIDO2 passkey registration and authentication for p31ca.org.

**v2:** Full CBOR decoding (no WASM), rpId hash verification via `crypto.subtle.digest`, SubtleCrypto signature verification (ES256 ECDSA P-256 + RS256 RSASSA-PKCS1-v1_5).

---

## Endpoints

### `POST /api/passkey/register-begin`

No body required.

Returns `PublicKeyCredentialCreationOptions`:

```json
{
  "challenge": "<base64url>",
  "rp": { "name": "P31 Labs", "id": "p31ca.org" },
  "user": {
    "id": "<base64url 16 random bytes>",
    "name": "mesh-member",
    "displayName": "Mesh Member"
  },
  "pubKeyCredParams": [
    { "type": "public-key", "alg": -7 },
    { "type": "public-key", "alg": -257 }
  ],
  "authenticatorSelection": {
    "residentKey": "preferred",
    "userVerification": "preferred"
  },
  "timeout": 60000
}
```

Challenge stored in KV under `reg:<challenge>` with 5-min TTL. UserId stored alongside it.

---

### `POST /api/passkey/register-finish`

Body (`application/json`):

```json
{
  "id": "<credential id base64url>",
  "response": {
    "clientDataJSON":    "<base64url>",
    "attestationObject": "<base64url>",
    "transports":        ["internal", "hybrid"]
  }
}
```

What the Worker does:
1. Decodes `clientDataJSON`, verifies `type === "webauthn.create"`, matches challenge against KV.
2. CBOR-decodes `attestationObject` → extracts `authData`.
3. Parses `authData`: verifies `rpIdHash === SHA-256(RP_ID)`, checks UP flag.
4. Extracts COSE public key from `authData`, imports via SubtleCrypto.
5. Stores credential in D1 as JWK JSON (not raw CBOR).

Returns: `{ "ok": true, "userId": "<base64url>" }` or `{ "error": "..." }`.

---

### `POST /api/passkey/auth-begin`

No body required.

Returns:

```json
{
  "challenge":        "<base64url>",
  "rpId":             "p31ca.org",
  "userVerification": "preferred",
  "timeout":          60000
}
```

Challenge stored in KV under `auth:<challenge>` with 5-min TTL.

---

### `POST /api/passkey/auth-finish`

Body:

```json
{
  "id": "<credential id base64url>",
  "response": {
    "clientDataJSON":    "<base64url>",
    "authenticatorData": "<base64url>",
    "signature":         "<base64url>",
    "userHandle":        "<base64url or null>"
  }
}
```

What the Worker does:
1. Decodes `clientDataJSON`, verifies `type === "webauthn.get"`, matches challenge against KV.
2. Loads stored credential (JWK + alg) from D1 by credential `id`.
3. Parses `authenticatorData`, verifies `rpIdHash`.
4. Builds signed data: `authenticatorData || SHA-256(clientDataJSON)`.
5. Imports JWK → CryptoKey, verifies signature with SubtleCrypto.
6. Replay protection: rejects if `signCount ≤ stored` (when non-zero).
7. Updates `sign_count` and `last_used_at`.

Returns: `{ "ok": true, "userId": "<base64url>" }` or `{ "error": "..." }`.

---

### `GET /api/education/progress/:subject_id`

**Opaque identifiers only.** `subject_id` must match **`p31_subject_id`** in browser storage — `u_<32 hex chars>` (passkey-derived) or **`guest_<20 hex>`** (`p31.subjectIdDerivation/0.1.0`). No emails, display names, or other PII.

Returns **`p31.educationProgress/0.1.0`** JSON. On first request for a given id, the Worker **inserts** a default row in D1 (`education_progress` table) so progress is stable per subject.

Production route: zone pattern **`p31ca.org/api/education/*`** → same Worker as passkey (`wrangler.toml`). Static hub page: `public/education/portal/index.html`.

Example:

```bash
# Replace SUBJECT_ID with a real opaque id from browser localStorage p31_subject_id (starts with u_ or guest_).
curl -s "https://p31ca.org/api/education/progress/u_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" | jq .
```

---

### Node Zero (Phase 4) — `/api/hardware/*`

Contract: **`docs/NODE-ZERO-FIRMWARE-CONTRACT.md`**. HTTPS POST only — firmware never holds operator Passkeys; device uses **Ed25519** pubkey + ephemeral six-digit KV challenge.

#### `POST /api/hardware/challenge`

Body **`p31.nodeZero.pairChallenge/0.1.0`** — stores `hw_pair:{code}` in KV (~10 min), returns **`pairing_code`**.

#### `POST /api/hardware/pair`

Body **`p31.nodeZero.pairApprove/0.1.0`** — operator binds **`subject_id`** + pubkey to **`hardware_pairings`** (D1), deletes KV.

#### `POST /api/hardware/telemetry`

Body **`p31.nodeZero.telemetry/0.1.0`** — shape-validated; v0 **`202 Accepted`** stub (no persistence).

Production route: **`p31ca.org/api/hardware/*`** → `p31-passkey`. Operator UI: **`public/connect.html`** (hardware strip).

---

## D1 schema

```sql
CREATE TABLE IF NOT EXISTS credentials (
  id            TEXT PRIMARY KEY,      -- base64url credential ID
  user_id       TEXT NOT NULL,         -- base64url random user ID (no PII)
  public_key    TEXT NOT NULL,         -- JSON: { alg: "ES256"|"RS256", jwk: {...} }
  alg           TEXT NOT NULL DEFAULT 'ES256',
  sign_count    INTEGER NOT NULL DEFAULT 0,
  aaguid        TEXT,
  transports    TEXT,                  -- JSON array e.g. ["internal","hybrid"]
  backed_up     INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,      -- Unix ms
  last_used_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id);

CREATE TABLE IF NOT EXISTS education_progress (
  subject_id    TEXT PRIMARY KEY,
  payload_json  TEXT NOT NULL,
  updated_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS hardware_pairings (
  id                      TEXT PRIMARY KEY,
  subject_id              TEXT NOT NULL,
  ed25519_pubkey_b64url   TEXT NOT NULL,
  device_label            TEXT,
  created_at              INTEGER NOT NULL,
  revoked_at              INTEGER
);

CREATE INDEX IF NOT EXISTS idx_hardware_pair_subject ON hardware_pairings(subject_id);
```

---

## Deploy recipe

### 1. Create the KV namespace

```bash
wrangler kv:namespace create CHALLENGES
```

Copy the `id` from the output. Open `wrangler.toml` and replace `REPLACE_WITH_KV_NAMESPACE_ID`:

```toml
[[kv_namespaces]]
binding = "CHALLENGES"
id      = "<your-kv-id>"
```

### 2. Create the D1 database

```bash
wrangler d1 create p31-passkey-db
```

Copy the `database_id` from the output. Update `wrangler.toml`:

```toml
[[d1_databases]]
binding       = "DB"
database_name = "p31-passkey-db"
database_id   = "<your-d1-id>"
```

### 3. Apply the schema

```bash
# Remote (production Cloudflare)
wrangler d1 execute p31-passkey-db --remote --file=schema.sql

# Local (dev)
wrangler d1 execute p31-passkey-db --local --file=schema.sql
```

### 4. Deploy

```bash
# Preview environment (RP_ID = p31ca.pages.dev)
wrangler deploy --env preview

# Production (RP_ID = p31ca.org)
wrangler deploy --env production
```

### 5. Verify

```bash
# register-begin — should return a challenge object
curl -s -X POST https://p31ca.org/api/passkey/register-begin \
  -H 'Content-Type: application/json' | jq .

# auth-begin — should return a challenge object
curl -s -X POST https://p31ca.org/api/passkey/auth-begin \
  -H 'Content-Type: application/json' | jq .

# 404 route — should return { "error": "Not found" }
curl -s https://p31ca.org/api/passkey/unknown | jq .
```

### 6. Production smoke (two devices)

After deploy: complete **planetary onboard Phase 5** on one profile (e.g. desktop), then open **`/auth`** on a second profile or device and verify **auth-begin → get → auth-finish** returns `ok`. RP_ID must match the page origin (`p31ca.org` in production).

---

## Local development

```bash
# Install deps (Worker has no package.json — uses wrangler's bundler directly)
# Run locally with miniflare
wrangler dev --local
```

Then test against `http://localhost:8787/api/passkey/register-begin`.

For local WebAuthn testing you need HTTPS or `localhost` (browsers restrict WebAuthn to secure origins). Use `wrangler dev --local` and open `planetary-onboard.html` served from `localhost:4321` (Astro dev) which talks to `localhost:8787`.

---

## Configuration

`wrangler.toml` vars:

| Var | Description |
|-----|-------------|
| `RP_NAME` | Human-readable relying party name — shown in the browser passkey dialog |
| `RP_ID` | Effective domain — `p31ca.org` (prod) or `p31ca.pages.dev` (preview). Must match the origin of the page calling `navigator.credentials` |

RP_ID must exactly match the registered origin's effective domain. A mismatch returns `rpId hash mismatch` (400).

---

## Error reference

| Status | Error | Cause |
|--------|-------|-------|
| 400 | `Missing fields` | Required body fields absent |
| 400 | `Wrong type` | `clientData.type` not `webauthn.create`/`webauthn.get` |
| 400 | `Challenge expired or invalid` | KV entry missing or TTL elapsed |
| 400 | `Invalid attestation object` | CBOR decode failed |
| 400 | `Missing authData` | Attestation object has no `authData` key |
| 400 | `rpId hash mismatch` | RP_ID env var doesn't match origin |
| 400 | `User not present` | UP flag not set in authData |
| 400 | `No credential data in authData` | AT flag set but no COSE key present |
| 400 | `Unsupported key: ...` | Algorithm not ES256 or RS256 |
| 401 | `Credential not found` | No D1 row for this credential id |
| 401 | `Signature verification failed` | SubtleCrypto verify returned false |
| 401 | `Sign count replay detected` | signCount ≤ stored (cloning attack) |
| 405 | `Method not allowed` | Non-POST, non-OPTIONS request |
| 404 | `Not found` | Unknown path |
