# CWP-077: Phase 2 Validation & Next Work Package
**Date:** July 2, 2026
**Status:** Ready for local coding agent execution
**Operator:** William R. Johnson
**Agent:** Opus (Architect) — QA, gate-checking, strategic build

---

## 1. Scope & Context

Phase 2 (DID Auth + PHOS Co-parenting Integration) has been written to
filesystem. The agent must now validate the implementation, fix the
remaining issues discovered in review, and prepare for production deploy.

### Files Implemented (from Phase 2)

| Path | Purpose |
|------|---------|
| `software/sovereign-justice/src/auth.ts` | Shared DID auth middleware |
| `software/sovereign-justice/src/hex.ts` | hexToBytes/bytesToHex utilities |
| `software/sovereign-justice/scripts/generate-auth-token.mjs` | Ed25519 test harness |
| `software/sovereign-justice/src/escrow-engine.ts` | Refactored — auth gated |
| `software/sovereign-justice/src/evidence-vault.ts` | Refactored — auth gated on POST/PATCH |
| `phos/src/surfaces/DisputeSurface.tsx` | Fixes build gap (was missing) |
| `phos/src/surfaces/SanctuarySurface.tsx` | Secure co-parenting messaging surface |

### Files Updated (from Phase 2)

| Path | Change |
|------|--------|
| `phos/src/components/SurfaceContent.tsx` | Added SANCTUARY case |
| `phos/src/lib/IntentEngine.ts` | Added co-parenting + dispute keyword routes |

---

## 2. Issues Discovered in Review

### Issue 1 — KNOWN_KEYS Duplicated Across 3 Files (HIGH)
`auth.ts`, `escrow-engine.ts`, and `evidence-vault.ts` each define their own
`KNOWN_KEYS` map with placeholder values. This creates drift risk.

**Fix:** Move to a single D1-backed registry.
```sql
CREATE TABLE IF NOT EXISTS auth_registry (
  did TEXT PRIMARY KEY,
  public_key_hex TEXT NOT NULL,
  label TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```
Modify `auth.ts` to accept an `Env` parameter and query the registry at
runtime. Export a helper `getKnownKeys(env)` that both workers import.

### Issue 2 — Frontend Signing Not Wired (HIGH)
`getAuthToken()` in the React surfaces is a placeholder returning `''`.
The surfaces send unsigned requests that the backend auth middleware will
reject.

**Fix:** Create `phos/src/lib/did-auth.ts` with `signPayload()` and
`generateAuthToken()` using the Web Crypto API (`crypto.subtle.sign` with
Ed25519). Wire into `SanctuarySurface.tsx` and `DisputeSurface.tsx`.

### Issue 3 — Nonce Cache Not Implemented (MEDIUM)
`auth.ts` defines the `nonceCache` interface but no concrete implementation.
Replay protection is disabled.

**Fix:** Implement a Durable Object-based nonce cache:
```typescript
export class NonceCacheDO implements DurableObject {
  async has(nonce: string): Promise<boolean> { ... }
  async set(nonce: string, ttl: number): Promise<void> { ... }
}
```
Register in `wrangler.toml`, wire into `AuthConfig`.

### Issue 4 — DisputeSurface Lacks Spoon Awareness (MEDIUM)
SanctuarySurface degrades at spoons ≤ 1 (hides messages, shows emergency
contact). DisputeSurface has no such logic — all content is always visible.

**Fix:** Import `spoons` prop and add the same low-spoon emergency mode.

### Issue 5 — SanctuarySurface Uses HTTP Polling (LOW)
SanctuarySurface fetches messages every 5s. For production, use WebSocket
via Durable Objects for real-time delivery without polling overhead.

**Fix:** Implement a DO-based WebSocket endpoint at `/api/sanctuary/ws` and
connect from the surface. Defer to a follow-up CWP if scope is too large.

### Issue 6 — `_setEmergencyContact` Unused (LOW)
SanctuarySurface destructures `_setEmergencyContact` but never calls it.
The emergency contact is hardcoded to 911.

**Fix:** Remove the unused destructuring, or wire it to a configurable
source (env var, KV, or surface-level settings).

---

## 3. Research Synthesis (Deep Web, July 2026)

### Ed25519 on Cloudflare Workers
- Confirmed fully supported via `crypto.subtle.generateKey` / `sign` / `verify`
- Implementation in `auth.ts` matches both the MDN reference and the
  Cloudflare Workers Web Crypto docs exactly
- Production reference: RFC 3161 Timestamp Authority on Workers (GitHub:
  `infinitum-nihil/cloudflare-rfc3161-tsa`) uses the same pattern

### WebAuthn + Passkey Integration
- `@passwordless-id/webauthn` package works on Cloudflare Workers (pure
  Web Crypto, no Node.js deps)
- `worker-tools/webauthn-example` repo shows a complete Workers-based
  WebAuthn flow with KV-backed sessions
- 2026 pattern: Passkeys (WebAuthn) for authentication, DIDs for identity
  layer — your architecture aligns with this standard
- Strategic recommendation: Add WebAuthn as a frontend auth option in a
  future phase. The `@passkeykit/server` package provides stateless
  verification.

### NGI TALER 14th Open Call — Deadline Aug 1, 2026
- Funding: €5K–€50K per proposal
- Scoring: Technical merit 30%, Strategic relevance 40%, Value for money 30%
- Proposal format: max 2 pages equivalent in the submission form
- Key requirement: Proposals must have a clear R&D component and contribute
  to "a more open, secure, interoperable internet"
- LOVE-Ledger fits perfectly: privacy-preserving payments, PQC compliance,
  offline-first, open source
- Integration Community Hub at `ich.taler.net` offers proposal support
- Submit at `https://nlnet.nl/propose`

### Co-Parenting App Market
- Market: $1.71B (2025), projected $1.93B (2026), CAGR 17%
- Dominant players: OurFamilyWizard (1M+ users, court-ordered in 50 states),
  TalkingParents (870K+ families)
- Key differentiator your competitors lack: sovereign offline-first
  architecture, court-admissible cryptographic chain-of-custody,
  spoon-aware accessibility — this is a genuine moat
- Market insight: "Strategic partnerships with family law professionals"
  is the primary adoption driver
- Data privacy (GDPR/CCPA) is the #1 user concern — your architecture is
  ahead of the industry here

---

## 4. Execution Tasks

### Task 1: Validate Phase 2 Implementation (P0 — ~40 min)

```
[ ] 1.1 Run `node scripts/generate-auth-token.mjs did:test:alice`
    - Copy the public key hex output
    - Add to KNOWN_KEYS in auth.ts, escrow-engine.ts, evidence-vault.ts
    - Re-run to generate a token with the now-registered key
[ ] 1.2 Run the cURL example against the local dev worker
    - Start with `npx wrangler dev` in sovereign-justice/
    - Send the token in Authorization: Bearer header
    - Confirm 200 on valid token, 401 on invalid
[ ] 1.3 Run `npm run build` in phos/
    - Must exit 0 — confirms DisputeSurface build gap is fixed
[ ] 1.4 Run `npx wrangler deploy --dry-run` in sovereign-justice/
    - Must show no errors for escrow-engine and evidence-vault
```

### Task 2: Unify KNOWN_KEYS Registry (P1 — ~1.5 hrs)

```
[ ] 2.1 Add D1 migration: CREATE TABLE IF NOT EXISTS auth_registry
    - Schema: did TEXT PK, public_key_hex TEXT, label TEXT, active INT, created_at TEXT
[ ] 2.2 Modify auth.ts to accept Env and query registry at runtime
    - Export: `getKnownKeys(env: Env): Promise<Record<string, string>>`
    - Cache in module-level variable with TTL to avoid D1 query per request
[ ] 2.3 Update escrow-engine.ts: remove local KNOWN_KEYS, import auth helper
[ ] 2.4 Update evidence-vault.ts: same
[ ] 2.5 Seed the registry with at least one test keypair
```

### Task 3: Wire Frontend Signing (P1 — ~2 hrs)

```
[ ] 3.1 Create `phos/src/lib/did-auth.ts`
    - `signPayload(privateKeyHex: string, data: string): Promise<string>`
    - `generateAuthToken(did: string, privateKeyHex: string, payload: string, nonce?: string): Promise<string>`
    - `base64url(buf: Uint8Array): string`
    - Uses Web Crypto API (crypto.subtle.sign with Ed25519)
[ ] 3.2 Update SanctuarySurface.tsx
    - On sendMessage: generate auth token and include in Authorization header
[ ] 3.3 Update DisputeSurface.tsx
    - On fetchDisputes: generate auth token and include
[ ] 3.4 Test end-to-end: frontend can authenticate and fetch data
```

### Task 4: Nonce Cache (P2 — ~1 hr, optional for v1)

```
[ ] 4.1 Add NonceCacheDO class to auth.ts (or separate file)
[ ] 4.2 Register in wrangler.toml: `durable_objects.bindings = [{ name: "NONCE_CACHE", class_name: "NonceCacheDO" }]`
[ ] 4.3 Wire into AUTH_CONFIG: `nonceCache: env.NONCE_CACHE`
[ ] 4.4 Set `requireNonce: true` only in production config
```

### Task 5: NGI TALER Proposal — Final Review & Submit (P1 — ~1.5 hrs)

```
[ ] 5.1 Read existing proposal at:
    andromeda/docs/grants/payloads/ngi-taler-proposal.md
[ ] 5.2 Add PQC compliance statement
[ ] 5.3 Add WCAG / accessibility compliance section
[ ] 5.4 Add open source licensing section (MIT/AGPL)
[ ] 5.5 Verify proposal fits ≤2 page equivalent
[ ] 5.6 Submit via https://nlnet.nl/propose
    Deadline: August 1, 2026, 12:00 CEST
```

### Task 6: Production Deploy (P1 — ~30 min)

```
[ ] 6.1 Deploy escrow-engine: `npx wrangler deploy` in sovereign-justice/
[ ] 6.2 Deploy evidence-vault: same
[ ] 6.3 Verify health endpoints:
    curl https://k4-core.trimtab-signal.workers.dev/api/health
    curl https://evidence-vault.trimtab-signal.workers.dev/api/health
[ ] 6.4 Deploy PHOS: `npm run build && npx wrangler pages deploy dist --project-name phos`
[ ] 6.5 Verify PHOS build:
    curl https://phos.p31ca.org (should 200)
```

---

## 5. File Reference Matrix

| Task | Files to Create | Files to Modify | Test Command |
|------|----------------|-----------------|-------------|
| 1.1 | — | `auth.ts`, `escrow-engine.ts`, `evidence-vault.ts` | `node scripts/generate-auth-token.mjs did:test:alice` |
| 1.3 | — | — | `cd phos && npm run build` |
| 2.1 | — | Migration file or `schema.sql` | `npx wrangler d1 execute JUSTICE_D1 --file=migrations/001_auth_registry.sql` |
| 2.2 | — | `auth.ts` | `npx wrangler dev` + cURL |
| 3.1 | `phos/src/lib/did-auth.ts` | — | `npm run build` in phos/ |
| 3.2 | — | `SanctuarySurface.tsx` | Manual test in browser |
| 3.3 | — | `DisputeSurface.tsx` | Manual test in browser |
| 4.1 | `auth.ts` (append) | `wrangler.toml` | `npx wrangler dev` |
| 5.1-6 | — | `ngi-taler-proposal.md` | — |

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| D1 migration conflicts with existing production data | Low | High | Test on staging D1 first. Use IF NOT EXISTS. |
| Web Crypto API differences between Node test harness and Workers runtime | Low | Medium | Test auth locally with `npx wrangler dev` before deploy. |
| PHOS build fails due to TS errors in new surfaces | Medium | High | Run `npx tsc --noEmit` before `npm run build`. |
| NGI TALER proposal exceeds 2-page limit | Medium | Medium | Review and trim. Submit early (July, not Aug 1). |
| Stimpunks grant draft overlaps with ATS accelerator deliverables if accepted | Low | Low | Scope Phoenix Navigator as separate from PHOS software. |

---

## 7. Success Criteria

- [ ] `npm run build` in phos/ exits 0
- [ ] `npx wrangler deploy --dry-run` in sovereign-justice/ passes
- [ ] Auth token generated by test harness is accepted by both workers
- [ ] Frontend can sign and send authenticated requests
- [ ] NGI TALER proposal submitted before August 1, 2026
- [ ] Both workers deployed and health endpoints return 200

---

## 8. Quick-Start Commands

```bash
# 1. Test auth middleware
cd ~/P31-local-workspace/software/sovereign-justice
node scripts/generate-auth-token.mjs did:test:alice
# Copy output public key hex, add to KNOWN_KEYS in all 3 files, re-run for token

# 2. Build PHOS
cd ~/P31-local-workspace/phos
npm run build

# 3. Create auth_registry table
npx wrangler d1 execute JUSTICE_D1 --command="CREATE TABLE IF NOT EXISTS auth_registry (did TEXT PRIMARY KEY, public_key_hex TEXT NOT NULL, label TEXT, active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));"

# 4. Deploy workers
cd ~/P31-local-workspace/software/sovereign-justice
npx wrangler deploy

# 5. Deploy PHOS
cd ~/P31-local-workspace/phos
npx wrangler pages deploy dist --project-name phos
```

---

*Ca₉(PO₄)₆*
