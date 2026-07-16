# Federation Bridge — Design Vision

## Identity

- **Name:** P31 Care Mesh (Federation Bridge)
- **URL:** `federation.p31ca.org`
- **Tagline:** "ActivityPub federation for care attestations"
- **Audience:** Federated network participants (Mastodon, Pleroma, etc.), other P31 services
- **Purpose:** ActivityPub federation — care attestation federation, SD-JWT VC credentialing, EUDI alignment
- **Tech:** Hono framework, Cloudflare Worker, D1 database, Ed25519 + ML-DSA-65 signatures
- **UI:** API-only (JSON endpoints) — NO user-facing HTML

---

## API Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/` | Redirect to `/actor` (301) | None |
| GET | `/actor` | ActivityPub actor document | None |
| GET | `/inbox` | Actor inbox | None |
| GET | `/outbox` | Actor outbox | None |
| GET | `/followers` | Follower collection | None |
| GET | `/following` | Following collection | None |
| POST | `/inbox` | Receive activities | HTTP Signatures |
| GET | `/.well-known/did.json` | DID document (did:web) | None |
| GET | `/nodeinfo` | NodeInfo 2.1 document | None |
| POST | `/credential/issue` | Issue SD-JWT VC | None |
| POST | `/credential/verify` | Verify SD-JWT VC | None |
| GET | `/credential/search` | Search credentials | None |
| POST | `/credential/revoke/:id` | Revoke credential | None |
| GET | `/credential/revocation/:id` | Check revocation status | None |
| GET | `/credential/revocation/list` | Status List 2021 bitstring | None |
| GET | `/pilot/:did/status` | Pilot self-service portal | None |

---

## Response Format

All endpoints return JSON with `Content-Type: application/json` and `Access-Control-Allow-Origin: *`.

### Actor Document
```json
{
  "@context": ["https://www.w3.org/ns/activitystreams", ...],
  "id": "https://federation.p31ca.org/actor",
  "type": "Application",
  "name": "P31 Care Mesh",
  "summary": "Open-source assistive technology — care attestation federation",
  "preferredUsername": "p31-care",
  "inbox": "https://federation.p31ca.org/inbox",
  "outbox": "https://federation.p31ca.org/outbox",
  "publicKey": { "id": "...#main-key", "owner": "...", "publicKeyPem": "..." },
  "verificationMethod": [...]
}
```

### DID Document
```json
{
  "@context": ["https://www.w3.org/ns/did/v1", ...],
  "id": "did:web:federation.p31ca.org",
  "verificationMethod": [...],
  "authentication": ["..."],
  "assertionMethod": ["..."],
  "service": [
    { "id": "...#credential-issuer", "type": "CredentialIssuer", ... },
    { "id": "...#credential-verifier", "type": "CredentialVerifier", ... }
  ]
}
```

### NodeInfo
```json
{
  "version": "2.1",
  "software": { "name": "p31-federation-bridge", "version": "..." },
  "protocols": ["activitypub"],
  "services": { "inbound": [], "outbound": [] },
  "openRegistrations": false
}
```

---

## Visual Language (API Documentation)

Since Federation Bridge has no UI, the "design vision" describes how API responses should be structured:

- **Consistent JSON structure** across all endpoints
- **CORS enabled** on all responses (`Access-Control-Allow-Origin: *`)
- **Error responses:** `{ "error": "message", "status": 404 }` format
- **Success responses:** `{ "results": [...] }` or `{ "credential": {...} }` format
- **HTTP Status Codes:** 200 (success), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

---

## Cryptographic Primitives

| Algorithm | Purpose | Key Type |
|-----------|---------|----------|
| Ed25519 | ActivityPub HTTP Signatures, FEP-8b32 | PEM private/public |
| ML-DSA-65 | Post-quantum co-signature | Base64 (3309 bytes) |
| SHA-256 | Hash chain integrity | N/A |
| SD-JWT VC | Selective Disclosure JWTs | Ed25519-signed |

---

## Standards Compliance

- **ActivityStreams 2.0** (W3C)
- **HTTP Signatures** (RFC 9421)
- **Object Integrity Proofs** (FEP-8b32)
- **NodeInfo 2.1**
- **DID Core v1.1** (W3C Candidate Recommendation)
- **SD-JWT VC** (draft-ietf-oauth-sd-jwt-vc-17)
- **Status List 2021** (W3C Verifiable Credentials)
- **EUDI Wallet alignment** (ESSIF/EBSI credential types)

---

## Gemini Prompt Notes

- Federation Bridge is an **API-only service** — no HTML templates to generate
- The design vision describes JSON response formats, not visual layouts
- Include the full endpoint table in any documentation
- The DID document serves `application/did+json` content type
- Status List 2021 bitstring is served as gzip+base64url
- All responses include CORS headers for cross-origin access
- The actor document is the primary discovery endpoint
- FEP-8b32 signatures are verified before accepting inbound activities
