# Node Zero firmware contract (Phase 4)

**Status:** Draft v0.1.0 (`p31.nodeZero.contract/0.1.0`)  
**Scope:** Firmware repository + `p31ca` Workers (`p31-passkey`) HTTPS surface  
**Audience:** Operators, firmware authors, edge integrators  

Node Zero defines the **hardware boundary**: no browser, no biometric WebAuthn. Pairing uses **machine-to-machine (M2M) HTTPS POSTs** to Cloudflare Workers only — **no** AWS IoT Core, GCP IoT, MQTT broker, or third-party telemetry clouds.

All machine-readable shapes live next to this doc:

| Artifact | Path |
|----------|------|
| JSON Schema bundle | `workers/passkey/schemas/p31-node-zero.bundle.v0.json` |
| TypeScript adapters | `workers/passkey/src/node-zero.ts` |

Code and payloads in examples use **conceptual monospace** formatting (implement with `JetBrains Mono` in tooling).

---

## 1. Principles

| Rule | Requirement |
|------|----------------|
| **Zero-trust pairing** | The device **never** stores the operator Passkey credential. It generates a local **Ed25519** signing keypair; operator approval binds **`ed25519_public_key_b64url`** to **`p31_subject_id`** (opaque, from WebAuthn-side derivation in the browser — see `lib/p31-subject-id.js`). |
| **Ephemeral hardware identity** | If firmware is reflashed or hardware is rotated, revoke the pairing in **`k4-personal`** (DO policy) — edge D1 row `hardware_pairings.revoked_at` mirrors revoke intent in v0. |
| **Transport** | HTTPS only to **`/api/hardware/*`** on `p31ca.org`. |
| **Secrets** | Device signing material stays in secure element / flash provisioning, not committed in Git. |

---

## 2. Pairing sequence

### 2.1 Firmware — `POST /api/hardware/challenge`

1. Generate **Ed25519** keypair on-device (`crypto_sign_keypair`).
2. `POST` JSON body **`p31.nodeZero.pairChallenge/0.1.0`** with **`ed25519_public_key_b64url`** encoding the raw 32-byte public key (`base64url`, no PEM).
3. Worker stores a KV record **`hw_pair:{code}`** (10-minute TTL), returns **`pairing_code`** (six decimal digits).

```json
{
  "schema": "p31.nodeZero.pairChallenge/0.1.0",
  "ed25519_public_key_b64url": "_replace_with_b64url_32-byte_pubkey_",
  "device_label": "node-zero-alpha"
}
```

**Response:**

```json
{
  "schema": "p31.nodeZero.pairChallengeResponse/0.1.0",
  "pairing_code": "482901",
  "expires_in_sec": 600,
  "device_label_ack": "node-zero-alpha"
}
```

### 2.2 Human — Operator gate (`connect.html`)

On a device that completed WebAuthn (`localStorage.p31_subject_id` present):

1. Read **`pairing_code`** and **`ed25519_public_key_b64url`** from the firmware UI (seven-segment display, serial log, QR payload, etc.).
2. Submit **Authorize Node Zero** → `POST /api/hardware/pair` with **`p31.nodeZero.pairApprove/0.1.0`**.

### 2.3 Operator approval — `POST /api/hardware/pair`

Worker verifies:

- KV entry exists for `pairing_code`
- Caller-supplied **`ed25519_public_key_b64url`** matches KV
- **`subject_id`** passes opaque format checks (`u_*` or `guest_*`)

On success:

- **`INSERT`** into **`hardware_pairings`** (D1)
- KV entry **deleted**
- Response carries a **`m2m_bearer_stub`** (v0 random preview string — **not** a JWT; future versions mint signed Bearer tokens keyed per pairing)

```json
{
  "schema": "p31.nodeZero.pairApprove/0.1.0",
  "pairing_code": "482901",
  "subject_id": "u_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "ed25519_public_key_b64url": "_same_32-byte_pubkey_as_device_"
}
```

### 2.4 Downstream mesh — `k4-personal`

**Out of Worker v0.** After HTTP success, the operator toolchain should register the hardware id and pubkey in **`k4-personal`** Durable Object policy (blocked calls, revocation list). Contract v0 persists **edge pairing** only in D1; DO sync is a **separate handshake** referenced in operator runbooks.

---

## 3. Telemetry — `POST /api/hardware/telemetry`

Minimal heartbeat for firmware bring-up (**v0 acknowledgement only** — Worker validates JSON shape, does **not** persist KV/D1 telemetry yet):

```json
{
  "schema": "p31.nodeZero.telemetry/0.1.0",
  "device_id": "opaque-device-serial-or-hw_-id",
  "uptime_sec": 86442,
  "sensor_state": "nominal",
  "larmor_hz": 1.714,
  "ts_ms": 1714300000123
}
```

| Field | Type | Notes |
|-------|------|--------|
| `sensor_state` | string | **`nominal` \| `warn` \| `fault` \| `unknown`** |
| `larmor_hz` | number | Larmor telemetry channel where applicable |

---

## 4. Bearer token (planned)

Production M2M will use **`Authorization: Bearer <JWT>`** or **`p31.hw.<opaque>`** session tokens rotated per device. **`m2m_bearer_stub`** in v0 is **debug-only** placeholder text returned once per successful pair.

---

## 5. Operational checklist

| Step | Owner |
|------|-------|
| `wrangler d1 execute … --file=workers/passkey/schema.sql` applies `hardware_pairings` | Operator |
| `wrangler deploy --env production` from `workers/passkey/` ships routes `p31ca.org/api/hardware/*` | Operator |

---

## 6. References

- `workers/passkey/src/index.ts`, `workers/passkey/src/node-zero.ts`
- Ground truth: **`nodeZeroHardwareApi`** under `ground-truth/p31.ground-truth.json`
- `public/connect.html` — hardware provisioning strip
