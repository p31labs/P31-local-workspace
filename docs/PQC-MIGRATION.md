# P31 Post-Quantum Cryptography Migration

## Executive Summary

P31 implements all three NIST FIPS post-quantum cryptography standards:

| Standard | Algorithm | NIST FIPS | P31 Status |
|----------|-----------|-----------|------------|
| ML-KEM-768 | Key Encapsulation | FIPS 203 | ✅ Production |
| ML-DSA-65 | Digital Signatures | FIPS 204 | ✅ Production |
| SLH-DSA-128s | Hash-Based Signatures | FIPS 205 | ✅ Production |

## Architecture

### Hybrid Mode
P31 uses **hybrid cryptography** — classical algorithms run alongside PQC algorithms during the transition period:

- **Key Exchange:** X25519 + ML-KEM-768
- **Signatures:** Ed25519 + ML-DSA-65 + SLH-DSA-128s
- **Symmetric:** AES-256-GCM

### Triple-Signature Credentials
Credentials are signed with all three signature algorithms:
1. **Ed25519** — classical, fast, widely supported
2. **ML-DSA-65** — lattice-based, NIST-standardized
3. **SLH-DSA-128s** — hash-based, conservative backup

## Migration Phases

### Phase 1: Classical Only
- Ed25519 signatures only
- X25519 key exchange only
- No PQC algorithms

### Phase 2: Hybrid (ML-KEM + ML-DSA)
- ML-KEM-768 added for key exchange
- ML-DSA-65 added for signatures
- Classical algorithms retained as fallback

### Phase 3: Full Hybrid (Current)
- SLH-DSA-128s added for hash-based signatures
- All three algorithms active
- Classical algorithms retained for compatibility

## Performance Characteristics

| Algorithm | Public Key | Secret Key | Signature | Speed | Use Case |
|-----------|-----------|-----------|-----------|-------|----------|
| Ed25519 | 32B | 32B | 64B | Fast | Default |
| ML-DSA-65 | 1,952B | 4,032B | 3,309B | Medium | Primary PQC |
| SLH-DSA-128s | 32B | 64B | 7,856B | Slow | Conservative backup |

## Security Properties

- **Quantum-Resistant:** All three algorithms resist Shor's algorithm and Grover's algorithm
- **Classical-Safe:** Classical algorithms retained for compatibility
- **Forward Secrecy:** X25519 + ML-KEM-768 provides forward secrecy
- **Replay Protection:** DPoP binds tokens to client keypairs

## Compliance

- **NIST FIPS 203/204/205:** All three standards are production-eligible
- **RFC 8446 (TLS 1.3):** Compatible with modern TLS
- **OAuth 2.1 + DPoP:** Sender-constrained tokens
- **W3C VC 2.0:** Verifiable credentials with triple signatures

## Implementation

### Key Generation
```typescript
import { generateMLDSA65KeyPair, generateSLHDSA128sKeyPair } from '@p31/sovereign-primitives';

// Generate ML-DSA-65 keypair
const mldsaKeypair = await generateMLDSA65KeyPair();

// Generate SLH-DSA-128s keypair
const slhdsaKeypair = await generateSLHDSA128sKeyPair();
```

### Signing
```typescript
import { hybridSign, hybridVerify } from '@p31/sovereign-primitives';

// Triple-sign a message
const signature = await hybridSign(message, ed25519PrivateKey, mldsaPrivateKey, slhdsaPrivateKey);

// Verify with any algorithm
const valid = await hybridVerify(message, signature, publicKey);
```

## References

- NIST FIPS 203: ML-KEM (https://csrc.nist.gov/publications/detail/fips/203/final)
- NIST FIPS 204: ML-DSA (https://csrc.nist.gov/publications/detail/fips/204/final)
- NIST FIPS 205: SLH-DSA (https://csrc.nist.gov/publications/detail/fips/205/final)
- RFC 8446: TLS 1.3
- RFC 9449: DPoP
- W3C VC Data Model 2.0