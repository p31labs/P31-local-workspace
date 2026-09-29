## Consensus

All three briefs converge on the same core architecture and threat model:

- **Reject non-cryptographic PRNGs for identity derivation.** Brief 1 establishes that xorshift128+/splitmix64/mulberry32 are linear over GF(2) and state-recoverable; Briefs 2 and 3 implicitly accept this by building on keyed hashing instead.
- **HMAC-SHA256 is the mandated derivation function.** All briefs agree naive `Hash(salt || seed)` is unsafe due to Merkle-Damgård length-extension, and that HMAC is the proven PRF (with FIPS/NIST standing).
- **The salt/key is a Root of Trust.** All identify key compromise as the dominant residual risk, converting the system into a verifiable lookup table (Brief 2's "dictionary/verification attack" = Brief 3's "Verification/Linkage Attack"). All recommend HSM/secret-manager storage (AWS KMS, HashiCorp Vault).
- **Modulo bias is real and must be handled.** Briefs 2 and 3 both give the same mitigation: rejection sampling for provable uniformity, with the power-of-two vocabulary as an engineering shortcut (Brief 2).
- **Low-entropy seeds are an attack multiplier.** Brief 1 (timestamp brute-force) and Brief 3 (rainbow-table enumeration) agree: require high-entropy seeds such as UUIDv4.
- **Performance is a non-issue.** Brief 1 asserts microsecond-scale costs; Brief 2 notes BLAKE3 parallelism. Cryptographic derivation overhead is negligible in registration/session contexts.
- **Shared open gaps:** all research was truncated before a complete reference implementation, and none empirically validates collision/bias behavior at deployment scale.

## Divergence

- **HMAC-SHA256 vs. keyed BLAKE3.** Brief 1 and 3 default to HMAC-SHA256; Brief 2 elevates BLAKE3 as faster (native keyed mode, SIMD, length-extension-immune) but flags its weaker standardization vs. FIPS compliance. Trade-off: throughput vs. auditability/regulatory acceptance.
- **Rotation semantics.** Brief 2 treats salt rotation as a rare but legitimate breaking migration event. Brief 3 frames rotation as a fundamental dilemma — it breaks the stable-alias invariant and per-user salts destroy cross-service derivability. Brief 3 is more pessimistic about any rotation path.
- **Bias materiality.** Brief 3 asks for a quantified threshold of when modulo bias becomes material and notes compounding with birthday collisions; Brief 2 treats rejection sampling as mandatory regardless of cost, while flagging its throughput overhead as an open question. No brief resolves when the shortcut (`V` = power of two) is acceptable vs. lazy.
- **Scope of attack surface.** Brief 1 emphasizes PRNG state recovery and related-seed correlation (BaseSeed + UserID patterns leaking user relationships); Briefs 2–3 focus entirely on post-HMAC key-compromise and bias risks. Brief 1's related-seed claim is unproven and unaddressed by the others.
- **Unresolved specifics:** salt size guidance beyond "≥32 bytes" (Brief 2), post-compromise recovery strategy (Brief 2), insider-threat access to the pepper (Brief 3), and empirical attack-complexity measurements (Brief 1).

## Synthesis

The three briefs are complementary layers of one design rather than competing proposals. The unified architecture:

1. **Derivation pipeline:** `Alias = HMAC-SHA256(K, Seed)` (or keyed BLAKE3 where FIPS is not required and batch throughput matters), with 128-bit digest slices, high-entropy seeds (UUIDv4), and **no** shared base-seed or per-user derived seeds — each seed independently random to kill Brief 1's correlation concern.
2. **Key management:** treat K as a pepper in an HSM/KMS; accept Brief 3's stricter framing that rotation fundamentally breaks alias stability, so design for *non-rotation* and instead plan a versioned re-derivation migration (alias_v1, alias_v2 with a lookup mapping) if compromise ever occurs — this bridges Brief 2's "rotation as migration" and Brief 3's "determinism dilemma."
3. **Index mapping:** rejection sampling as the default; power-of-two vocabulary as an accepted shortcut when word-list curation permits, resolving Brief 2/3's bias-cost tension.
4. **Carry forward:** the GF(2) linearity argument (Brief 1) as the definitive justification for excluding fast PRNGs; the length-extension analysis and modulo-bias math (Briefs 2–3) as the canonical pitfall documentation.
5. **Deprioritize:** BLAKE3 adoption unless throughput benchmarks justify departing from FIPS-blessed HMAC; per-user salts (destroy derivability); any further investment in "fixing" non-crypto PRNGs.
6. **Priority validation work:** complete the truncated reference implementation, benchmark rejection-sampling overhead, empirically measure collision rates at family scale (tens of thousands of aliases), and formally bound the related-seed correlation claim before treating it as a hard requirement.