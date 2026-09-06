import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SicPovmSwarmManager,
  SicPovmSwarmFactory,
  QuantumServiceManager,
  QuantumSystemMonitor,
  MLKEM,
  MLDSA,
  HybridPQCScheme,
  generateQuantumSafeHash,
  generateShake256Hash,
  generateQuantumSafeSeed,
  generateQuantumSafeHMAC,
  generateQuantumSafeCID,
  verifyQuantumSafeIntegrity,
  CalciumHomeostasisCost,
  RecoveryTimeCost,
} from "../src/index";

// ═══════════════════════════════════════════════════════════════
// PQC PRIMITIVES
// ═══════════════════════════════════════════════════════════════

describe("PQC Primitives", () => {
  it("generateQuantumSafeHash returns SHA-512 (128 hex chars)", () => {
    const hash = generateQuantumSafeHash("test");
    expect(hash).toHaveLength(128);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("generateQuantumSafeHash is deterministic", () => {
    const h1 = generateQuantumSafeHash("same input");
    const h2 = generateQuantumSafeHash("same input");
    expect(h1).toBe(h2);
  });

  it("generateQuantumSafeHash produces different hashes for different inputs", () => {
    const h1 = generateQuantumSafeHash("input A");
    const h2 = generateQuantumSafeHash("input B");
    expect(h1).not.toBe(h2);
  });

  it("generateShake256Hash produces variable-length output", () => {
    const short = generateShake256Hash("test", 16);
    const long = generateShake256Hash("test", 128);
    expect(short).toHaveLength(32); // 16 bytes = 32 hex
    expect(long).toHaveLength(256); // 128 bytes = 256 hex
  });

  it("generateQuantumSafeSeed returns 128 hex chars (512 bits)", () => {
    const seed = generateQuantumSafeSeed();
    expect(seed).toHaveLength(128);
  });

  it("generateQuantumSafeSeed produces unique values", () => {
    const s1 = generateQuantumSafeSeed();
    const s2 = generateQuantumSafeSeed();
    expect(s1).not.toBe(s2);
  });

  it("generateQuantumSafeHMAC produces consistent output", () => {
    const mac1 = generateQuantumSafeHMAC("secret", "data");
    const mac2 = generateQuantumSafeHMAC("secret", "data");
    expect(mac1).toBe(mac2);
    expect(mac1).toHaveLength(128);
  });

  it("generateQuantumSafeHMAC produces different output for different keys", () => {
    const mac1 = generateQuantumSafeHMAC("key1", "data");
    const mac2 = generateQuantumSafeHMAC("key2", "data");
    expect(mac1).not.toBe(mac2);
  });

  it("generateQuantumSafeCID produces IPFS-compatible CID", () => {
    const cid = generateQuantumSafeCID("test content");
    expect(cid).toMatch(/^bafybeih/);
    expect(cid).toHaveLength(60); // prefix(8) + hash(52)
  });

  it("verifyQuantumSafeIntegrity passes for valid data", () => {
    const data = "integrity test";
    const hash = generateQuantumSafeHash(data);
    expect(verifyQuantumSafeIntegrity(data, hash)).toBe(true);
  });

  it("verifyQuantumSafeIntegrity fails for tampered data", () => {
    const data = "integrity test";
    const hash = generateQuantumSafeHash(data);
    expect(verifyQuantumSafeIntegrity("tampered", hash)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// ML-KEM (FIPS 203)
// ═══════════════════════════════════════════════════════════════

// FIPS 203 Table 3 byte sizes
const KEM_SIZES = {
  1: { ek: 800,  dk: 1632, ct: 768,  ss: 32 },
  3: { ek: 1184, dk: 2400, ct: 1088, ss: 32 },
  5: { ek: 1568, dk: 3168, ct: 1568, ss: 32 },
} as const;

describe("ML-KEM (FIPS 203)", () => {
  it("ML-KEM-768: key pair matches FIPS 203 Table 3 byte sizes", () => {
    const kem = new MLKEM({ securityLevel: 3 });
    const keys = kem.keygen();
    expect(keys.publicKey.length).toBe(KEM_SIZES[3].ek);
    expect(keys.secretKey.length).toBe(KEM_SIZES[3].dk);
    expect(keys.encapsulationKey).toBe(keys.publicKey);
  });

  it("ML-KEM-768: encapsulate returns FIPS 203 Table 3 ct + 32-byte ss", () => {
    const kem = new MLKEM({ securityLevel: 3 });
    const { publicKey } = kem.keygen();
    const { cipherText, sharedSecret } = kem.encapsulate(publicKey);
    expect(cipherText.length).toBe(KEM_SIZES[3].ct);
    expect(sharedSecret.length).toBe(KEM_SIZES[3].ss);
  });

  it("KEM round-trip: decapsulate recovers the same shared secret", () => {
    const kem = new MLKEM({ securityLevel: 3 });
    const keys = kem.keygen();
    const { cipherText, sharedSecret: ss1 } = kem.encapsulate(keys.publicKey);
    const ss2 = kem.decapsulate(cipherText, keys.secretKey);
    expect(Buffer.from(ss1).equals(Buffer.from(ss2))).toBe(true);
  });

  it("two encapsulations to the same key yield different ciphertexts", () => {
    const kem = new MLKEM({ securityLevel: 3 });
    const { publicKey } = kem.keygen();
    const r1 = kem.encapsulate(publicKey);
    const r2 = kem.encapsulate(publicKey);
    expect(Buffer.from(r1.cipherText).equals(Buffer.from(r2.cipherText))).toBe(false);
  });

  it("decapsulate with wrong secret key returns implicit-reject (different secret)", () => {
    const kem = new MLKEM({ securityLevel: 3 });
    const k1 = kem.keygen();
    const k2 = kem.keygen();
    const { cipherText, sharedSecret } = kem.encapsulate(k1.publicKey);
    const badSS = kem.decapsulate(cipherText, k2.secretKey);
    expect(Buffer.from(sharedSecret).equals(Buffer.from(badSS))).toBe(false);
  });

  it("each security level produces FIPS 203 Table 3 byte sizes", () => {
    for (const level of [1, 3, 5] as const) {
      const kem = new MLKEM({ securityLevel: level });
      const keys = kem.keygen();
      const { cipherText, sharedSecret } = kem.encapsulate(keys.publicKey);
      expect(keys.publicKey.length).toBe(KEM_SIZES[level].ek);
      expect(keys.secretKey.length).toBe(KEM_SIZES[level].dk);
      expect(cipherText.length).toBe(KEM_SIZES[level].ct);
      expect(sharedSecret.length).toBe(KEM_SIZES[level].ss);
    }
  });

  it("generateKeyPair() is a backward-compat alias for keygen()", () => {
    const kem = new MLKEM();
    const keys = kem.generateKeyPair();
    expect(keys.publicKey.length).toBe(KEM_SIZES[3].ek);
  });
});

// ═══════════════════════════════════════════════════════════════
// ML-DSA (FIPS 204)
// ═══════════════════════════════════════════════════════════════

// FIPS 204 byte sizes (verified against @noble/post-quantum 0.6.x)
const DSA_SIZES = {
  1: { pk: 1312, sk: 2560, sig: 2420 },
  3: { pk: 1952, sk: 4032, sig: 3309 },
  5: { pk: 2592, sk: 4896, sig: 4627 },
} as const;

describe("ML-DSA (FIPS 204)", () => {
  it("ML-DSA-65: key pair matches FIPS 204 byte sizes", () => {
    const dsa = new MLDSA({ securityLevel: 3 });
    const keys = dsa.keygen();
    expect(keys.publicKey.length).toBe(DSA_SIZES[3].pk);
    expect(keys.secretKey.length).toBe(DSA_SIZES[3].sk);
    expect(keys.privateKey).toBe(keys.secretKey);
  });

  it("ML-DSA-65: sign produces FIPS 204 signature of correct byte length", () => {
    const dsa = new MLDSA({ securityLevel: 3 });
    const keys = dsa.keygen();
    const sig = dsa.sign(Buffer.from("test message"), keys.secretKey);
    // ML-DSA-65 max signature length is 3309 bytes; randomized so ≤ not =
    expect(sig.length).toBeLessThanOrEqual(DSA_SIZES[3].sig);
    expect(sig.length).toBeGreaterThan(0);
  });

  it("DSA round-trip: sign → verify returns true", () => {
    const dsa = new MLDSA({ securityLevel: 3 });
    const keys = dsa.keygen();
    const msg = Buffer.from("mesh member verified");
    const sig = dsa.sign(msg, keys.secretKey);
    expect(dsa.verify(msg, sig, keys.publicKey)).toBe(true);
  });

  it("verify returns false for tampered message", () => {
    const dsa = new MLDSA({ securityLevel: 3 });
    const keys = dsa.keygen();
    const sig = dsa.sign(Buffer.from("authentic"), keys.secretKey);
    expect(dsa.verify(Buffer.from("tampered"), sig, keys.publicKey)).toBe(false);
  });

  it("verify returns false for signature from wrong key", () => {
    const dsa = new MLDSA({ securityLevel: 3 });
    const k1 = dsa.keygen();
    const k2 = dsa.keygen();
    const msg = Buffer.from("test");
    const sig = dsa.sign(msg, k1.secretKey);
    expect(dsa.verify(msg, sig, k2.publicKey)).toBe(false);
  });

  it("verify returns false for mutated signature byte", () => {
    const dsa = new MLDSA({ securityLevel: 3 });
    const keys = dsa.keygen();
    const msg = Buffer.from("test");
    const sig = dsa.sign(msg, keys.secretKey);
    const corrupted = new Uint8Array(sig);
    corrupted[0] ^= 0xff;
    expect(dsa.verify(msg, corrupted, keys.publicKey)).toBe(false);
  });

  it("same message signed twice produces different signatures (randomized)", () => {
    const dsa = new MLDSA({ securityLevel: 3 });
    const keys = dsa.keygen();
    const msg = Buffer.from("test");
    const s1 = dsa.sign(msg, keys.secretKey);
    const s2 = dsa.sign(msg, keys.secretKey);
    expect(Buffer.from(s1).equals(Buffer.from(s2))).toBe(false);
  });

  it("each security level produces FIPS 204 byte sizes and valid round-trip", () => {
    for (const level of [1, 3, 5] as const) {
      const dsa = new MLDSA({ securityLevel: level });
      const keys = dsa.keygen();
      expect(keys.publicKey.length).toBe(DSA_SIZES[level].pk);
      expect(keys.secretKey.length).toBe(DSA_SIZES[level].sk);
      const msg = Buffer.from("level test");
      const sig = dsa.sign(msg, keys.secretKey);
      expect(dsa.verify(msg, sig, keys.publicKey)).toBe(true);
    }
  });

  it("generateKeyPair() is a backward-compat alias for keygen()", () => {
    const dsa = new MLDSA();
    const keys = dsa.generateKeyPair();
    expect(keys.publicKey.length).toBe(DSA_SIZES[3].pk);
  });
});

// ═══════════════════════════════════════════════════════════════
// HYBRID PQC SCHEME
// ═══════════════════════════════════════════════════════════════

describe("HybridPQCScheme", () => {
  it("generateHybridKeyPair: KEM and DSA keys have correct FIPS sizes", () => {
    const scheme = new HybridPQCScheme(3);
    const { mlkemKeys, mldsaKeys } = scheme.generateHybridKeyPair();
    expect(mlkemKeys.publicKey.length).toBe(KEM_SIZES[3].ek);
    expect(mldsaKeys.publicKey.length).toBe(DSA_SIZES[3].pk);
  });

  it("signAndEncapsulate + decapsulateAndVerify: full round-trip", () => {
    const scheme = new HybridPQCScheme(3);
    const { mlkemKeys, mldsaKeys } = scheme.generateHybridKeyPair();
    const message = Buffer.from("p31 mesh token");

    const { kemCipherText, sharedSecret: ss1, signature } =
      scheme.signAndEncapsulate(message, mldsaKeys.secretKey, mlkemKeys.publicKey);

    const { sharedSecret: ss2, isValid } =
      scheme.decapsulateAndVerify(kemCipherText, mlkemKeys.secretKey, message, signature, mldsaKeys.publicKey);

    expect(isValid).toBe(true);
    expect(Buffer.from(ss1).equals(Buffer.from(ss2))).toBe(true);
  });

  it("decapsulateAndVerify: isValid=false for tampered message", () => {
    const scheme = new HybridPQCScheme(3);
    const { mlkemKeys, mldsaKeys } = scheme.generateHybridKeyPair();
    const message = Buffer.from("authentic");
    const { kemCipherText, signature } =
      scheme.signAndEncapsulate(message, mldsaKeys.secretKey, mlkemKeys.publicKey);

    const { isValid } = scheme.decapsulateAndVerify(
      kemCipherText, mlkemKeys.secretKey,
      Buffer.from("tampered"), signature, mldsaKeys.publicKey,
    );
    expect(isValid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// SIC-POVM SWARM
// ═══════════════════════════════════════════════════════════════

describe("SIC-POVM Swarm Manager", () => {
  it("initializes d² agents for dimension d", () => {
    const swarm = new SicPovmSwarmManager({ dimension: 2 });
    expect(swarm.getAgentCount()).toBe(4);
    expect(swarm.getConfig().dimension).toBe(2);
  });

  it("agent overlap equals 1/(d+1)", () => {
    const swarm = new SicPovmSwarmManager({ dimension: 2 });
    expect(swarm.getAgentOverlap()).toBeCloseTo(1 / 3, 5);
  });

  it("executes biological tomography and returns health payload", async () => {
    const swarm = new SicPovmSwarmManager({ dimension: 2 });
    const state = new Float32Array([0.8, 0.5, 0.3, 0.7]);
    const result = await swarm.executeBiologicalTomography(state);
    expect(["OPTIMAL", "ATTENTION", "CRASH_WARNING"]).toContain(result.status);
    expect(result.pqcSecured).toBe(true);
    expect(result.primaryMetric).toBeGreaterThan(0);
  });

  it("detects crash state for low calcium", async () => {
    const swarm = new SicPovmSwarmManager({ dimension: 2 });
    const crashState = new Float32Array([0.1, 0.1, 0.9, 0.5]);
    const result = await swarm.executeBiologicalTomography(crashState);
    expect(result.status).toBe("CRASH_WARNING");
    expect(result.actionableAdvice).toContain("Calcium");
  });

  it("detects optimal state for high values", async () => {
    const swarm = new SicPovmSwarmManager({ dimension: 2 });
    const optimalState = new Float32Array([0.9, 0.8, 0.85, 0.9]);
    const result = await swarm.executeBiologicalTomography(optimalState);
    expect(result.status).toBe("OPTIMAL");
  });

  it("tracks state history", async () => {
    const swarm = new SicPovmSwarmManager({ dimension: 2 });
    const state = new Float32Array([0.8, 0.5, 0.3, 0.7]);
    await swarm.executeBiologicalTomography(state);
    expect(swarm.getStateHistory().length).toBe(1);
  });

  it("factory creates HypoPT swarm (d=2)", () => {
    const swarm = SicPovmSwarmFactory.createHypoPTswarm();
    expect(swarm.getAgentCount()).toBe(4);
  });

  it("factory creates full panel swarm (d=3)", () => {
    const swarm = SicPovmSwarmFactory.createFullPanelSwarm();
    expect(swarm.getAgentCount()).toBe(9);
  });

  it("factory creates calcium-only swarm (d=1)", () => {
    const swarm = SicPovmSwarmFactory.createCalciumOnlySwarm();
    expect(swarm.getAgentCount()).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// QUANTUM SERVICE MANAGER
// ═══════════════════════════════════════════════════════════════

describe("Quantum Service Manager", () => {
  let manager: QuantumServiceManager;

  beforeEach(() => {
    manager = new QuantumServiceManager();
  });

  it("registers services successfully", () => {
    manager.registerService({
      name: "test-sim",
      endpoint: "https://test.p31labs.org",
      maxConcurrency: 10,
      healthCheckInterval: 60000,
      timeout: 300000,
      retryAttempts: 3,
      weight: 1,
    });
    const stats = manager.getServiceStats();
    expect(stats["test-sim"]).toBeDefined();
    expect(stats["test-sim"].status).toBe("HEALTHY");
  });

  it("returns load balancing metrics", () => {
    const metrics = manager.getLoadBalancingMetrics();
    expect(metrics.totalServices).toBe(0);
    expect(metrics.loadBalancerStrategy).toBe("response-time");
  });
});

// ═══════════════════════════════════════════════════════════════
// QAOA COST FUNCTIONS
// ═══════════════════════════════════════════════════════════════

describe("QAOA Cost Functions", () => {
  it("CalciumHomeostasisCost evaluates deviation", () => {
    const cost = new CalciumHomeostasisCost();
    expect(cost.evaluate([8.5], 8.5)).toBe(0);
    expect(cost.evaluate([7.0], 8.5)).toBeGreaterThan(0);
  });

  it("CalciumHomeostasisCost computes gradient", () => {
    const cost = new CalciumHomeostasisCost();
    const grad = cost.gradient([8.0], 8.5);
    expect(grad[0]).toBeCloseTo(-1.0, 5);
  });

  it("RecoveryTimeCost returns 0 when calcium is at target", () => {
    const cost = new RecoveryTimeCost();
    expect(cost.evaluate([8.5, 0.25, 1.0], 8.5)).toBe(0);
  });

  it("RecoveryTimeCost returns positive cost when below target", () => {
    const cost = new RecoveryTimeCost();
    expect(cost.evaluate([7.0, 0.25, 1.0], 8.5)).toBeGreaterThan(0);
  });
});
