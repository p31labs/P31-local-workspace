// @p31/sovereign — Daubert-compliant SHA-256 hash chain
import type { TelemetryEntry } from "./types";
import { signData } from "./identity";

export async function appendToChain(
  entry: Omit<TelemetryEntry, "hash" | "signature" | "prevHash" | "signerDid">,
  prevHash: string,
  signerDid: string,
  signingKey: CryptoKey
): Promise<TelemetryEntry> {
  const hashInput = JSON.stringify({
    data: entry.data,
    prevHash,
    timestamp: entry.timestamp,
    type: entry.type,
    signerDid,
  });

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(hashInput)
  );
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const signature = await signData(signingKey, new TextEncoder().encode(hash));
  const sigHex = Array.from(signature)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { ...entry, prevHash, hash, signature: sigHex, signerDid };
}
