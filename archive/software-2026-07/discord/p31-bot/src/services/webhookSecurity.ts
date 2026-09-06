/**
 * Verification + guardrails for inbound HTTP webhooks (Discord ingress, GitHub, optional Stripe direct).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Parse X-P31-Ingress-Signature: sha256=<hex> */
export function verifyP31IngressSignature(
  rawBodyUtf8: string,
  header: string | undefined,
  secret: string,
): boolean {
  if (!header || !secret) return false;
  const m = /^sha256=([a-f0-9]{64})$/i.exec(header.trim());
  if (!m) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBodyUtf8, "utf8")
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(m[1], "hex"));
  } catch {
    return false;
  }
}

/** GitHub X-Hub-Signature-256: sha256=<hex> over raw body bytes */
export function verifyGitHubSignature(
  rawBody: Buffer,
  header: string | undefined,
  secret: string,
): boolean {
  if (!header || !secret) return false;
  const m = /^sha256=([a-f0-9]{64})$/i.exec(String(header).trim());
  if (!m) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(m[1], "hex"));
  } catch {
    return false;
  }
}

/** Stripe webhook signature (t=, v1=) — same contract as donate-api Worker */
export function verifyStripeWebhookSignature(
  payload: string,
  sigHeader: string,
  secret: string,
  toleranceSec = 300,
): boolean {
  try {
    const parts = Object.fromEntries(
      sigHeader.split(",").map((p) => p.split("=") as [string, string]),
    );
    const timestamp = parts["t"];
    const v1 = parts["v1"];
    if (!timestamp || !v1) return false;
    const tsNum = parseInt(timestamp, 10);
    if (Number.isNaN(tsNum)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - tsNum) > toleranceSec) return false;
    const signedPayload = `${timestamp}.${payload}`;
    const expected = createHmac("sha256", secret)
      .update(signedPayload, "utf8")
      .digest("hex");
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
  } catch {
    return false;
  }
}

/** Ring-buffer idempotency for Stripe event ids (replay / double POST) */
export class StripeEventDedup {
  private readonly q: string[] = [];
  private readonly seen = new Set<string>();

  constructor(private readonly max = 4000) {}

  /** @returns true if this id was already recorded (duplicate) */
  isDuplicate(eventId: string): boolean {
    if (this.seen.has(eventId)) return true;
    this.seen.add(eventId);
    this.q.push(eventId);
    while (this.q.length > this.max) {
      const old = this.q.shift();
      if (old) this.seen.delete(old);
    }
    return false;
  }
}

/**
 * Optional shared secret for BONDING / Node One JSON webhooks.
 * When INTERNAL_WEBHOOK_SECRET is unset, routes stay open (legacy).
 */
export function assertInternalWebhookSecret(
  req: { headers: Record<string, unknown> },
  secret: string | undefined,
): boolean {
  if (!secret) return true;
  const auth = req.headers["authorization"];
  const bearer =
    typeof auth === "string" && auth.startsWith("Bearer ")
      ? auth.slice(7).trim()
      : "";
  const xh = req.headers["x-p31-webhook-secret"];
  const headerSecret = typeof xh === "string" ? xh.trim() : "";
  const got = bearer || headerSecret;
  if (!got) return false;
  try {
    return timingSafeEqual(
      Buffer.from(got, "utf8"),
      Buffer.from(secret, "utf8"),
    );
  } catch {
    return false;
  }
}
