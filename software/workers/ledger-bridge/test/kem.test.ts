import { describe, it, expect } from "vitest";
import {
  generateXWingKeyPair,
  encapsulateXWing,
  decapsulateXWing,
  bytesToB64,
  b64ToBytes,
  XWING_PK_LEN,
  XWING_SK_LEN,
  XWING_CT_LEN,
} from "../src/kem";
import worker from "../src/index";

const b64eq = (a: Uint8Array, b: Uint8Array) => {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) expect(a[i]).toBe(b[i]);
};

describe("X-Wing hybrid KEM (unit)", () => {
  it("keygen produces correctly-sized keys", () => {
    const kp = generateXWingKeyPair();
    expect(kp.publicKey.length).toBe(XWING_PK_LEN);
    expect(kp.secretKey.length).toBe(XWING_SK_LEN);
  });

  it("encapsulate/decapsulate round-trips to the same shared secret", () => {
    const kp = generateXWingKeyPair();
    const { ciphertext, sharedSecret } = encapsulateXWing(kp.publicKey);
    expect(ciphertext.length).toBe(XWING_CT_LEN);
    expect(sharedSecret.length).toBe(32);
    const recovered = decapsulateXWing(ciphertext, kp.secretKey);
    b64eq(recovered, sharedSecret);
  });

  it("produces a different shared secret per encapsulation ( fresh X25519 ephemeral)", () => {
    const kp = generateXWingKeyPair();
    const a = encapsulateXWing(kp.publicKey);
    const b = encapsulateXWing(kp.publicKey);
    expect(bytesToB64(a.ciphertext)).not.toBe(bytesToB64(b.ciphertext));
    b64eq(decapsulateXWing(a.ciphertext, kp.secretKey), a.sharedSecret);
    b64eq(decapsulateXWing(b.ciphertext, kp.secretKey), b.sharedSecret);
  });

  it("rejects malformed lengths", () => {
    expect(() => encapsulateXWing(new Uint8Array(10))).toThrow();
    expect(() => decapsulateXWing(new Uint8Array(10), new Uint8Array(XWING_SK_LEN))).toThrow();
  });

  it("base64 helpers are inverse", () => {
    const kp = generateXWingKeyPair();
    b64eq(b64ToBytes(bytesToB64(kp.publicKey)), kp.publicKey);
  });
});

describe("X-Wing endpoints (via worker fetch)", () => {
  const env = {} as any;
  const POST = (path: string, body: unknown) =>
    worker.fetch(new Request(`https://x.test${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }), env);
  const GET = (path: string) =>
    worker.fetch(new Request(`https://x.test${path}`), env);

  it("GET /kem/xwing/public returns base64 keys", async () => {
    const res = await GET("/kem/xwing/public");
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(b64ToBytes(j.publicKey).length).toBe(XWING_PK_LEN);
    expect(b64ToBytes(j.secretKey).length).toBe(XWING_SK_LEN);
    expect(j.lengths.ciphertext).toBe(XWING_CT_LEN);
  });

  it("full HTTP round-trip yields matching shared secrets", async () => {
    const pub = await (await GET("/kem/xwing/public")).json();
    const enc = await (await POST("/kem/xwing/encapsulate", { publicKey: pub.publicKey })).json();
    expect(enc.sharedSecret).toBeTruthy();
    const dec = await (await POST("/kem/xwing/decapsulate", {
      ciphertext: enc.ciphertext,
      secretKey: pub.secretKey,
    })).json();
    expect(dec.sharedSecret).toBe(enc.sharedSecret);
  });

  it("encapsulate rejects missing publicKey", async () => {
    const res = await POST("/kem/xwing/encapsulate", {});
    expect(res.status).toBe(400);
  });
});
