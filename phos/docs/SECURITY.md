# Security Model

## Core Principle

The system is **cryptographically sovereign**: all state mutations must be signed by the DID performing the action. No auth tokens, no sessions, no passwords.

## Signature Verification

### How It Works

1. User holds an Ed25519 private key (stored in `identityStore` as `CryptoKey`)
2. For each mutation, the frontend signs the JSON payload via `signedFetch`
3. The signature is sent in the `X-Signature` header
4. The Worker extracts the DID from the payload body
5. The Worker derives the public key bytes from the `did:key:` string
6. `crypto.subtle.verify()` validates the signature

### DID Key Extraction

```
did:key:z{base58btc(0xed01 + raw_public_key)}
              └─ 2-byte multicodec prefix
```

Supported multicodec prefixes:
- `0xed01` — Legacy Ed25519
- `0x23c` — Ed25519 Verification Key 2021

### Implementation

```typescript
// src/lib/edge/verify.ts
export async function verifyEd25519Signature(
  did: string,
  payload: string,
  signature: string
): Promise<boolean> {
  const publicKeyBytes = extractPublicKeyFromDID(did);
  const publicKey = await crypto.subtle.importKey(
    'raw', publicKeyBytes, { name: 'Ed25519' }, false, ['verify']
  );
  return await crypto.subtle.verify(
    'Ed25519', publicKey,
    Uint8Array.from(atob(signature), c => c.charCodeAt(0)),
    new TextEncoder().encode(payload)
  );
}
```

## Idempotency

All mutation endpoints accept `idempotencyKey` in the request body. The server checks `idempotency_keys` table before executing. Keys expire after 24 hours.

## Key Storage

- Private keys never leave the browser
- Stored in `identityStore` as `CryptoKey`
- Accessed via `getPrivateKey()` for signing
- Not persisted to any server or localStorage

## Endpoint Security Matrix

| Endpoint | DID Source | Signature Required |
|----------|-----------|-------------------|
| `GET /*` | N/A | ❌ No |
| `POST /transfer` | `from` | ✅ Yes |
| `POST /stake` | `did` | ✅ Yes |
| `POST /contract/initiate` | `partyADid` | ✅ Yes |
| `POST /contract/sign` | `partyId` | ✅ Yes |
| `POST /contract/activate` | `partyADid` | ✅ Yes |
| `POST /proposal` | `author` | ✅ Yes |
| `POST /vote` | `voterDid` | ✅ Yes |
| `POST /delegate` | `delegatorDid` | ✅ Yes |
| `POST /proposal/resolve` | `author` | ✅ Yes |
