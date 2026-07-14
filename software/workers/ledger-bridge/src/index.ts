/**
 * ledger-bridge — off-chain → on-chain attestation relay (Path A).
 *
 * Closes the gap identified in the on-chain bridging review: no Worker currently
 * calls the deployed P31 sovereign-chain contracts. This Worker anchors LOVE
 * ledger events on-chain for court-admissible proof:
 *
 *   - POST /anchor  + /anchor-batch  → P31TransparencyAnchor.anchor(entry_hash, uri)
 *   - POST /care-proof              → ProofOfCare.submitCareProofs(...) as the relay
 *
 * Scoped to ATTESTATION ANCHORING only. The fungible LOVE ERC-20 path was
 * retired (software/workers/test/retired-contracts.test.ts) — this bridge never
 * mints/burns a LOVE token.
 *
 * Dry-run by default: it encodes calldata and returns it WITHOUT broadcasting,
 * so it is safe to deploy and inspect before any secrets exist. Set
 * DRY_RUN="false" + BRIDGE_PRIVATE_KEY to broadcast.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  encodeFunctionData,
  isAddress,
  zeroAddress,
  type Hex,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { P31TransparencyAnchorAbi, ProofOfCareAbi } from "./abis";
import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";
import { issueSDJWT, verifySDJWT, getIssuer } from "./sdjwt";

interface Env {
  RPC_URL: string;
  PROOF_OF_CARE_ADDR: string;
  ANCHOR_ADDR: string;
  DRY_RUN?: string;
  BRIDGE_PRIVATE_KEY?: string;
  LOVE_DB: any; // shared love-ledger D1 (identity_registry + care_proofs)
}

const BYTES32 = /^0x[0-9a-fA-F]{64}$/;

function isDryRun(env: Env): boolean {
  return env.DRY_RUN === "true" || !env.BRIDGE_PRIVATE_KEY;
}

function getClients(env: Env) {
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(env.RPC_URL) });
  if (!env.BRIDGE_PRIVATE_KEY) return { publicClient, walletClient: null, account: null };
  const account = privateKeyToAccount(env.BRIDGE_PRIVATE_KEY as Hex);
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(env.RPC_URL),
  });
  return { publicClient, walletClient, account };
}

/**
 * Encode + broadcast, or return the calldata in dry-run mode.
 */
async function relay(
  env: Env,
  to: string,
  data: Hex,
  label: string,
): Promise<Response> {
  if (isDryRun(env)) {
    return Response.json({
      dryRun: true,
      label,
      to,
      data,
      note: "Set BRIDGE_PRIVATE_KEY + DRY_RUN=false to broadcast a real transaction.",
    });
  }
  const { publicClient, walletClient, account } = getClients(env);
  if (!walletClient || !account) return Response.json({ error: "no signer configured" }, { status: 500 });

  try {
    const txHash = await walletClient.sendTransaction({
      to: to as Hex,
      data,
      account,
      chain: baseSepolia,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    return Response.json({ ok: true, label, txHash, status: receipt.status });
  } catch (e: any) {
    return Response.json({ ok: false, label, error: String(e?.message ?? e) }, { status: 502 });
  }
}

function json(body: any, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Sovereign identity verification (CWP-2026-025) ──────────────────────
// did:key encoding matches apps/phos/src/lib/crypto.ts:
//   did = `did:key:z${base64url(standardBase64(rawEd25519Pubkey))}`
function b64UrlDecodeBytes(s: string): Uint8Array {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function didToEd25519Pub(did: string): Uint8Array | null {
  if (!did.startsWith("did:key:z")) return null;
  try {
    return b64UrlDecodeBytes(did.slice("did:key:z".length));
  } catch {
    return null;
  }
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Verify an Ed25519 signature over a UTF-8 message using Web Crypto.
async function verifyDidSignature(
  message: string,
  sigB64: string,
  pubBytes: Uint8Array,
): Promise<boolean> {
  if (pubBytes.byteLength !== 32) return false;
  try {
    const key = await crypto.subtle.importKey("raw", pubBytes, "Ed25519", false, ["verify"]);
    return await crypto.subtle.verify("Ed25519", key, b64ToBytes(sigB64), new TextEncoder().encode(message));
  } catch {
    return false;
  }
}

// Verify an ML-DSA-65 (FIPS 204, NIST cat-3) signature over a UTF-8 message.
// Pure-JS via @noble/post-quantum (no WASM). Used as the post-quantum
// DID-control proof path (CWP-2026-027 A): the caller signs the canonical
// proof message with their ML-DSA-65 key registered in identity_registry.mldsa65_pub.
function verifyMLDSA65(
  message: string,
  sigB64: string,
  pubB64: string,
): boolean {
  try {
    return ml_dsa65.verify(b64ToBytes(sigB64), new TextEncoder().encode(message), b64ToBytes(pubB64));
  } catch {
    return false;
  }
}

// Canonical signed payload — PHOS client (Phase 3) must sign this exact string.
function buildProofMessage(
  did: string,
  users: string[],
  tProx: any[],
  qRes: any[],
  tasks: any[],
  entropyRoots: string[],
): string {
  const j = (a: any[]) => a.map((v) => String(v)).join(",");
  return `proof|${did}|${j(users)}|${j(tProx)}|${j(qRes)}|${j(tasks)}|${j(entropyRoots)}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        status: "ok",
        service: "ledger-bridge",
        dryRun: isDryRun(env),
        chain: "base-sepolia",
        proofOfCare: env.PROOF_OF_CARE_ADDR,
        anchor: env.ANCHOR_ADDR,
        anchorDeployed: env.ANCHOR_ADDR !== zeroAddress,
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed. Use POST /anchor, /anchor-batch, /care-proof." }, 405);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    // ── P31TransparencyAnchor.anchor(entry_hash, uri) ───────────────────
    if (url.pathname === "/anchor") {
      if (env.ANCHOR_ADDR === zeroAddress) {
        return json({ error: "ANCHOR_ADDR not set (deploy P31TransparencyAnchor first)" }, 400);
      }
      const entryHash: string = body?.entryHash;
      const uri: string = body?.uri;
      if (!entryHash || !BYTES32.test(entryHash)) {
        return json({ error: "entryHash must be a 0x-prefixed 32-byte hex string" }, 400);
      }
      if (!uri || typeof uri !== "string" || uri.length === 0) {
        return json({ error: "uri is required (https:// or ipfs:// manifest location)" }, 400);
      }
      const data = encodeFunctionData({
        abi: P31TransparencyAnchorAbi,
        functionName: "anchor",
        args: [entryHash as Hex, uri],
      });
      return relay(env, env.ANCHOR_ADDR, data, "anchor");
    }

    // ── Batch anchor ────────────────────────────────────────────────────
    if (url.pathname === "/anchor-batch") {
      if (env.ANCHOR_ADDR === zeroAddress) {
        return json({ error: "ANCHOR_ADDR not set (deploy P31TransparencyAnchor first)" }, 400);
      }
      const entries: Array<{ entryHash: string; uri: string }> = body?.entries;
      if (!Array.isArray(entries) || entries.length === 0) {
        return json({ error: "entries must be a non-empty array of {entryHash, uri}" }, 400);
      }
      const calls = entries.map((e) => {
        if (!e?.entryHash || !BYTES32.test(e.entryHash)) {
          throw new Error(`invalid entryHash: ${e?.entryHash}`);
        }
        if (!e?.uri) throw new Error(`missing uri for ${e.entryHash}`);
        return encodeFunctionData({
          abi: P31TransparencyAnchorAbi,
          functionName: "anchor",
          args: [e.entryHash as Hex, e.uri],
        });
      });
      // Dry-run returns all calldata; live sends sequentially.
      if (isDryRun(env)) {
        return json({ dryRun: true, label: "anchor-batch", to: env.ANCHOR_ADDR, calls });
      }
      const results = [];
      for (const data of calls) {
        const r = await relay(env, env.ANCHOR_ADDR, data, "anchor");
        results.push(await r.json());
      }
      return json({ ok: true, results });
    }

    // ── ProofOfCare.submitCareProofs(...) — sovereign, signed relay ──────
    // CWP-2026-025: the caller must prove control of a registered DID (Ed25519
    // sig over the payload) and the SBT recipient (users[0]) must equal the
    // ETH address bound to that DID. Open minting is REMOVED.
    if (url.pathname === "/care-proof") {
      const did: string = body?.did;
      const signature: string | undefined = body?.signature;
      const mldsa65Sig: string | undefined = body?.mldsa65_sig;
      const users: string[] = body?.users;
      const tProx: any[] = body?.tProx;
      const qRes: any[] = body?.qRes;
      const tasks: any[] = body?.tasks;
      const entropyRoots: string[] = body?.entropyRoots;

      if (!did) {
        return json({ error: "did is required (sovereign mint)" }, 400);
      }
      if (!signature && !mldsa65Sig) {
        return json(
          { error: "signature (Ed25519) or mldsa65_sig (ML-DSA-65) is required" },
          400,
        );
      }
      if (!Array.isArray(users) || users.length === 0 || !users.every((u) => isAddress(u))) {
        return json({ error: "users must be a non-empty array of valid addresses" }, 400);
      }
      const arrays = [tProx, qRes, tasks, entropyRoots];
      if (arrays.some((a) => !Array.isArray(a) || a.length !== users.length)) {
        return json({ error: "tProx, qRes, tasks, entropyRoots must be arrays of length = users.length" }, 400);
      }
      if (!entropyRoots.every((r) => BYTES32.test(r))) {
        return json({ error: "entropyRoots must be 0x-prefixed 32-byte hex strings" }, 400);
      }

      // 1) Resolve the DID's registered binding.
      const row = (await env.LOVE_DB.prepare(
        "SELECT ed25519_pub, mldsa65_pub, eth_address FROM identity_registry WHERE did = ?",
      ).bind(did).first()) as
        | { ed25519_pub: string; mldsa65_pub: string | null; eth_address: string }
        | null;
      if (!row) {
        return json({ error: "Unknown DID — register at love-ledger /identity/register first" }, 401);
      }

      // 2) Prove DID control — EITHER Ed25519 (classical) OR ML-DSA-65
      //    (post-quantum, CWP-2026-027 A) when mldsa65_pub is registered.
      const message = buildProofMessage(did, users, tProx, qRes, tasks, entropyRoots);
      let controlProven = false;
      if (mldsa65Sig && row.mldsa65_pub) {
        controlProven = verifyMLDSA65(message, mldsa65Sig, row.mldsa65_pub);
      }
      if (!controlProven && signature) {
        const pubBytes = didToEd25519Pub(did);
        controlProven = !!pubBytes && (await verifyDidSignature(message, signature, pubBytes));
      }
      if (!controlProven) {
        return json(
          { error: "Invalid signature — DID control not proven (Ed25519 or ML-DSA-65)" },
          401,
        );
      }

      // 3) The SBT recipient MUST be the address bound to this DID.
      if (users[0].toLowerCase() !== row.eth_address.toLowerCase()) {
        return json(
          { error: "users[0] must equal the ETH address registered to this DID" },
          403,
        );
      }

      // 4) Encode + relay on-chain as the oracle/relay signer.
      const data = encodeFunctionData({
        abi: ProofOfCareAbi,
        functionName: "submitCareProofs",
        args: [
          users as `0x${string}`[],
          tProx.map((v) => BigInt(v)),
          qRes.map((v) => BigInt(v)),
          tasks.map((v) => BigInt(v)),
          entropyRoots as Hex[],
        ],
      });

      // 5) Dual-anchor: keep an off-chain court-admissible record (CWP-2026-025).
      let txHash: string | null = null;
      if (!isDryRun(env)) {
        const res = await relay(env, env.PROOF_OF_CARE_ADDR, data, "submitCareProofs");
        const payload = (await res.json()) as { ok?: boolean; txHash?: string };
        if (!payload?.ok) return json(payload, 502);
        txHash = payload.txHash ?? null;
        await env.LOVE_DB.prepare(
          `INSERT INTO care_proofs (did, eth_address, t_prox, q_res, tasks, entropy_root, tx_hash, anchored_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          did,
          row.eth_address,
          JSON.stringify(tProx),
          JSON.stringify(qRes),
          JSON.stringify(tasks),
          JSON.stringify(entropyRoots),
          txHash,
          Date.now(),
        ).run();
        return json({ ok: true, txHash, did, ethAddress: row.eth_address });
      }

      // Dry-run: return calldata, record with null txHash.
      const dry = relay(env, env.PROOF_OF_CARE_ADDR, data, "submitCareProofs");
      await env.LOVE_DB.prepare(
        `INSERT INTO care_proofs (did, eth_address, t_prox, q_res, tasks, entropy_root, tx_hash, anchored_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        did,
        row.eth_address,
        JSON.stringify(tProx),
        JSON.stringify(qRes),
        JSON.stringify(tasks),
        JSON.stringify(entropyRoots),
        null,
        Date.now(),
      ).run();
      return dry;
    }

    // ── SD-JWT issue (CWP-2026-027 B, RFC 9901 / VC-17) ─────
    // Issues a selectively-disclosable care credential over the DID's
    // registered claims. The holder later reveals a subset via
    // selectDisclosures + /credential/verify.
    if (url.pathname === "/credential/issue") {
      const did: string = body?.did;
      const claims: Record<string, unknown> | undefined = body?.claims;
      if (!did || typeof claims !== "object" || Array.isArray(claims) ||
          Object.keys(claims).length === 0) {
        return json({ error: "did and a non-empty claims object are required" }, 400);
      }
      const reg = (await env.LOVE_DB.prepare(
        "SELECT did FROM identity_registry WHERE did = ?",
      ).bind(did).first()) as { did: string } | null;
      if (!reg) {
        return json({ error: "Unknown DID — register at love-ledger /identity/register first" }, 401);
      }
      const cred = await issueSDJWT(claims);
      // Idempotent: ensure the issuance table exists, then count.
      await env.LOVE_DB.prepare(
        `CREATE TABLE IF NOT EXISTS credential_issuance (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           did TEXT NOT NULL,
           vct TEXT NOT NULL DEFAULT 'p31.care',
           issued_at INTEGER NOT NULL
         )`,
      ).run();
      await env.LOVE_DB.prepare(
        "INSERT INTO credential_issuance (did, issued_at) VALUES (?, ?)",
      ).bind(did, Date.now()).run();
      return json({
        ok: true,
        sdjwt: cred.sdjwt,
        issuerPubB64: cred.issuerPubB64,
        note: "Reveal selected claims with /credential/verify (send only the ~disclosure segments you choose).",
      });
    }

    // ── SD-JWT verify ──────────────────────────────────────────────
    if (url.pathname === "/credential/verify") {
      const sdjwt: string = body?.sdjwt;
      if (!sdjwt || typeof sdjwt !== "string") {
        return json({ error: "sdjwt (compact SD-JWT string) is required" }, 400);
      }
      const issuer = await getIssuer();
      const result = await verifySDJWT(sdjwt, issuer.pub);
      if (!result.valid) return json({ valid: false, disclosed: {} }, 422);
      return json({ valid: true, disclosed: result.disclosed });
    }

    return json({ error: `Unknown route: ${url.pathname}` }, 404);
  },
};
