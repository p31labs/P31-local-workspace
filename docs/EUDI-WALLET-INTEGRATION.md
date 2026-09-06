# EUDI Wallet Integration

## Overview

P31 supports the European Digital Identity (EUDI) Wallet framework per eIDAS 2.0
(mandatory for EU Member States by end 2026). This document covers the integration
points between P31's cognitive passport and EUDI Wallet Reference Implementation (WRI).

## Export

The PassportSurface in PHOS provides an "Export EUDI Wallet" button that generates
a EUDI-compatible wallet document:

- **Format:** `EUDIWalletDocument` (JSON, signed with Ed25519)
- **Contains:** CognitivePassportCredential (DID, displayName, pronouns, cognition)
- **Proof:** Ed25519Signature2020 over the serialized wallet
- **Download:** Saved as `eudi-wallet-<timestamp>.json`

### Usage

```ts
import { exportEUDIWallet, serializeEUDIWallet } from '@p31/ui/passport/eudi';

const wallet = await exportEUDIWallet(passport, identity);
const json = serializeEUDIWallet(wallet);
// json is ready for import into an EUDI Wallet app
```

## Presentation

P31 generates OID4VP (OpenID for Verifiable Presentations) for wallet-based
verification flows:

```ts
import { generatePresentation, presentationToQRData } from '@p31/ui/passport/presentation';

const presentation = await generatePresentation(passport, identity);
const qrData = presentationToQRData(presentation);
// qrData contains an openid4vp:// URI for wallet scanning
```

### QR Display

The `QRDisplay` component renders OID4VP presentation URIs as QR codes:

```tsx
import { QRDisplay } from '@p31/ui/passport/QRDisplay';

<QRDisplay data={qrUri} size={200} label="Scan with EUDI Wallet" />
```

## Verification

The federation-bridge exposes an OID4VP verification endpoint:

```
POST https://federation.p31ca.org/credential/verify-presentation
Content-Type: application/json

{
  "payload": { ... },
  "signature": "base64-ed25519-sig"
}
```

Response:

```json
{ "verified": true }
```

The verifier:
1. Checks the presentation has not expired (`payload.exp`)
2. Validates the Ed25519 signature against the issuer's `did:key` public key
3. Returns `verified: true/false`

## Federation Bridge Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /credential/verify-presentation` | OID4VP presentation verification |
| `POST /credential/issue` | SD-JWT VC issuance (EUDI-aligned) |
| `POST /credential/verify` | SD-JWT VC verification |
| `GET /credential/revocation/list` | Status List 2021 (aggregated) |
| `GET /credential/revocation/:id` | Single credential revocation status |

## DID Document

The federation-bridge serves a `did:web` DID Document for EUDI discovery:

```
GET https://federation.p31ca.org/.well-known/did.json
Content-Type: application/did+json
```

Includes:
- Ed25519 verification method (`#main-key`)
- ML-DSA-65 post-quantum verification method (`#pq-key`)
- CredentialIssuer and CredentialVerifier service endpoints
- PresentationVerifier service endpoint

## Standards

- **eIDAS 2.0** — EUDI Wallet mandate (Q4 2026 enforcement)
- **OID4VP** — OpenID for Verifiable Presentations (QR + URI flow)
- **W3C VC Data Integrity 1.1** — Verifiable Credential format
- **Status List 2021** — Credential revocation status
- **did:web** — DID method for federation-bridge
- **did:key** — Client-side DID method for PHOS passports
- **Ed25519Signature2020** — Signature suite
- **ML-DSA-65 (FIPS 204)** — Post-quantum signature suite
