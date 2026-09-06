import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import {
  verifyP31IngressSignature,
  verifyGitHubSignature,
  verifyStripeWebhookSignature,
  StripeEventDedup,
} from "../services/webhookSecurity";

describe("verifyP31IngressSignature", () => {
  it("accepts matching HMAC", () => {
    const secret = "test-secret";
    const body = '{"type":"checkout.session.completed","id":"evt_1"}';
    const hex = createHmac("sha256", secret).update(body, "utf8").digest("hex");
    expect(verifyP31IngressSignature(body, `sha256=${hex}`, secret)).toBe(true);
    expect(verifyP31IngressSignature(body, "sha256=" + "0".repeat(64), secret)).toBe(
      false,
    );
  });

  it("rejects wrong header shape", () => {
    expect(verifyP31IngressSignature("{}", "nope", "s")).toBe(false);
  });
});

describe("verifyGitHubSignature", () => {
  it("verifies sha256 body", () => {
    const secret = "ghsecret";
    const body = Buffer.from('{"action":"opened"}', "utf8");
    const expected =
      "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyGitHubSignature(body, expected, secret)).toBe(true);
    expect(verifyGitHubSignature(body, "sha256=" + "a".repeat(64), secret)).toBe(false);
  });
});

describe("verifyStripeWebhookSignature", () => {
  it("accepts valid v1 signature", () => {
    const secret = "whsec_test";
    const payload = '{"id":"evt_x"}';
    const ts = Math.floor(Date.now() / 1000).toString();
    const signed = `${ts}.${payload}`;
    const v1 = createHmac("sha256", secret).update(signed, "utf8").digest("hex");
    const header = `t=${ts},v1=${v1}`;
    expect(verifyStripeWebhookSignature(payload, header, secret)).toBe(true);
  });
});

describe("StripeEventDedup", () => {
  it("flags second identical id", () => {
    const d = new StripeEventDedup(100);
    expect(d.isDuplicate("a")).toBe(false);
    expect(d.isDuplicate("a")).toBe(true);
  });
});
