# EUDI Wallet Sandbox Access — How to Obtain

**Created:** 2026-08-17
**Status:** Research complete; access requires manual application

---

## Overview

The EUDI Wallet Reference Implementation (RHI) is provided by the European Commission's DG CONNECT. It allows developers to test VC import/export, credential verification, and wallet integration before the December 2026 deadline.

---

## Access Process

### Step 1: Register on EU Digital Identity Building Blocks

1. Go to: `https://ec.europa.eu/digital-building-blocks/wallet/`
2. Click "Register" or "Sign In" (uses EU Login / EIDAS)
3. Complete organization registration (P31 Labs)

### Step 2: Request Sandbox Access

1. Navigate to the "Sandbox" or "Development" section
2. Request access to the EUDI Wallet Reference Implementation
3. Provide:
   - Organization name: P31 Labs
   - Use case: Testing VC 2.1 credential import/export for sovereign identity
   - Expected volume: Low (development/testing only)

### Step 3: Receive Credentials

Once approved, you'll receive:

- **Sandbox API endpoints** — For VC issuance and verification
- **Test credentials** — Pre-issued VCs for import testing
- **Documentation** — API specs and integration guides
- **Wallet app** — Reference wallet for testing (iOS/Android)

### Step 4: Test P31 Credentials

1. Export a VC from spaceship-earth: `GET /eudi/session`
2. Import the VC into the EUDI wallet sandbox
3. Verify the credential is accepted and displayed correctly
4. Document any compatibility issues

---

## Alternative: EUDI Wallet Test Suites

If direct sandbox access is not available, you can test against the EUDI test suites:

### EBSI Conformance Testing

- **URL:** `https://ebsi.eu/developers/`
- **Purpose:** Test VC issuance and verification against EBSI standards
- **Access:** Register on the EBSI Developer Portal

### W3C VC Test Suite

- **URL:** `https://w3c-ccg.github.io/vc-test-suite/`
- **Purpose:** Validate VC 2.0/2.1 compliance
- **Access:** Open source, run locally

---

## P31 Credential Format

P31 credentials are structured for EUDI compatibility:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/v2"
  ],
  "type": ["VerifiableCredential", "SpaceshipSessionCredential"],
  "issuer": "did:key:z6Mk...",
  "credentialSubject": {
    "id": "did:key:z6Mk...",
    "spoons": 4,
    "coherence": 0.8
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "jws": "..."
  }
}
```

### Key Fields for EUDI

| Field | Requirement | P31 Status |
|-------|-------------|------------|
| `@context` | Must include v1 | ✅ Includes v1 + v2 |
| `type` | Must include `VerifiableCredential` | ✅ Present |
| `issuer` | Must be a DID | ✅ `did:key:z6Mk...` |
| `credentialSubject.id` | Must be a DID | ✅ `did:key:z6Mk...` |
| `proof` | Must include JWS | ✅ Ed25519 JWS |

---

## Timeline

| Milestone | Date | Status |
|-----------|------|--------|
| EUDI Sandbox launch | January 2026 | ✅ Live |
| P31 VC export | August 2026 | ✅ Complete |
| Sandbox access application | August 2026 | ⏳ Pending |
| Compatibility testing | September 2026 | ⏳ Pending |
| EUDI Wallet deadline | December 2026 | ⏳ Approaching |

---

## Notes

- The EUDI Wallet framework requires **every EU member state** to offer at least one wallet by December 2026
- Fewer than one third of member states currently meet the readiness benchmark
- Germany has scheduled its state wallet for early January 2027
- France plans public testing in the second half of 2026

---

## Resources

- **EUDI Wallet Portal:** `https://ec.europa.eu/digital-building-blocks/wallet/`
- **EBSI Developer Portal:** `https://ebsi.eu/developers/`
- **W3C VC Test Suite:** `https://w3c-ccg.github.io/vc-test-suite/`
- **P31 EUDI Readiness:** [EUDI-READINESS.md](./EUDI-READINESS.md)
