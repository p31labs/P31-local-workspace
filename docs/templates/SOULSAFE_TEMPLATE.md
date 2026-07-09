# SOULSAFE Certificate

**Entity:** `entity_name`  
**Type:** `mesh` | `node` | `pod` | `individual`  
**Issued:** YYYY-MM-DD  
**Valid Until:** YYYY-MM-DD (or `permanent`)  
**Issuer:** P31 Labs / `did:key:...`

---

## 1. Attestation

This certifies that the entity named above has successfully anchored its identity within a K₄ geometric trust structure, meeting the cryptographic and social requirements for participation in the P31 Digital Commonwealth.

## 2. Cryptographic Anchors

- **DID:** `did:key:z...`
- **Genesis Hash:** `0x...`
- **Attestation EAS UID:** `0x...` (if on‑chain)

## 3. K₄ Mesh Details

- **Pod ID:** `pod-xxxx`
- **Trusted Nodes:** 
  - `did:key:z...` (Node 1)
  - `did:key:z...` (Node 2)
  - `did:key:z...` (Node 3)

## 4. Signatures

| Signer | Role | Signature |
|--------|------|-----------|
| `did:key:z...` | Guardian | `0x...` |
| `did:key:z...` | Guardian | `0x...` |
| `did:key:z...` | Guardian | `0x...` |

## 5. Verification Instructions

```bash
# Verify the SOULSAFE attestation
p31-passport verify --cert docs/certs/SOULSAFE_ENTITY_NAME.md
```

---

**This certificate is a living document and may be updated as the K₄ mesh evolves.**
