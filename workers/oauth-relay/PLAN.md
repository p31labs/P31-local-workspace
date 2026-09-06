# Phase 13, Track 2: DPoP Implementation Plan

## Current State
- OAuth relay with PKCE S256, Ed25519 did:key derivation
- Hono framework, Cloudflare Workers + D1
- Two endpoints to protect: `POST /oauth/token` (token exchange) and `GET /oauth/userinfo`
- DPoP should be optional initially (no DPoP header = allow without sender-constraint)

## Files to Modify

### 1. `src/crypto.ts` — Add DPoP functions

**New helper functions:**
- `base64urlEncode(buffer: Uint8Array): string` — base64url without padding
- `base64urlDecode(str: string): Uint8Array` — reverse
- `computeJwkThumbprint(jwk: JsonWebKey): string` — canonical JWK → SHA-256 → base64url thumbprint
- `parseJwt(token: string): { header: any; payload: any }` — split and decode compact JWT
- `generateNonce(): string` — 16 random bytes → base64url

**DPoP proof generation (client-side):**
```typescript
export async function generateDPoPProof(
  method: string,
  url: string,
  accessToken: string | undefined,
  privateKey: CryptoKey,
  publicKeyJwk: JsonWebKey,
): Promise<string>
```
- Header: `{ typ: 'dpop+jwt', alg: 'Ed25519', jwk: publicKeyJwk }`
- Payload: `{ jti: crypto.randomUUID(), htm: method, htu: url, iat: Math.floor(Date.now()/1000), ...(accessToken ? { ath: sha256(accessToken) } : {}) }`
- Sign with Ed25519, return compact JWT

**DPoP proof verification (server-side):**
```typescript
export async function verifyDPoPProof(
  proof: string,
  method: string,
  url: string,
  accessToken?: string,
): Promise<{ valid: boolean; jkt: string; error?: string }>
```
- Parse JWT, extract `header.jwk`
- Verify Ed25519 signature over `header.payload` using `header.jwk`
- Verify `htm` matches method
- Verify `htu` matches URL (exact match)
- Verify `iat` is within ±5 minutes of server time
- If `accessToken` provided, verify `ath === base64url(sha256(accessToken))`
- Compute and return `jkt = computeJwkThumbprint(header.jwk)`

### 2. `src/types.ts` — Update types

- Add `dpop_jkt: string | null` to `OAuthToken` interface

### 3. `src/index.ts` — Enforce DPoP

**CORS update:**
- Add `'DPoP'` to `allowHeaders`
- Add `'DPoP-Nonce'` to `allowHeaders`

**Token endpoint (`POST /oauth/token`):**
- Read `DPoP` header from request
- If DPoP proof present:
  - Verify it (htm=POST, htu=/oauth/token, no accessToken for token request)
  - On invalid: return 400 with `DPoP-Nonce` header
  - On valid: store `jkt` alongside the token
- Include `DPoP-Nonce` in response headers

**Userinfo endpoint (`GET /oauth/userinfo`):**
- Read `DPoP` header from request
- If DPoP proof present:
  - Verify it (htm=GET, htu=/oauth/userinfo, accessToken=token.access_token)
  - On invalid: return 400 with `DPoP-Nonce` header
  - If token has `dpop_jkt`, verify jkt matches (sender-constraint check)
- Include `DPoP-Nonce` in response headers

**Token storage:**
- Update INSERT to include `dpop_jkt` column
- Update SELECT to include `dpop_jkt`

### 4. `migrations/002_dpop.sql` — D1 migration

```sql
ALTER TABLE oauth_tokens ADD COLUMN dpop_jkt TEXT;
```

## Implementation Order
1. Add base64url helpers + nonce generator to `crypto.ts`
2. Add `parseJwt` + `computeJwkThumbprint` to `crypto.ts`
3. Add `generateDPoPProof` to `crypto.ts`
4. Add `verifyDPoPProof` to `crypto.ts`
5. Update `types.ts` with `dpop_jkt`
6. Create `migrations/002_dpop.sql`
7. Update `index.ts` CORS, token endpoint, userinfo endpoint
8. Run typecheck

## Key Constraints
- DPoP is OPTIONAL — if no `DPoP` header, allow without sender-constraint
- Do NOT break existing PKCE flow
- Web Crypto API only (no Node.js crypto)
- Ed25519 for DPoP signing (already used for did:key)
- Server uses Ed25519 PUBLIC key imported from JWK for verification
- URL matching must be exact (RFC 9449 §4.2)
- iat tolerance: ±5 minutes (RFC 9449 §4.2)
