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
import { mintPrivateSBT } from "./privacy-sbt";
import {
  generateXWingKeyPair,
  encapsulateXWing,
  decapsulateXWing,
  bytesToB64,
  XWING_CT_LEN,
} from "./kem";

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

const TraceId = () => crypto.randomUUID().slice(0, 16);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const traceId = request.headers.get('x-trace-id') || TraceId();
    const spanStart = Date.now();
    const j = (body: any, status = 200) => Response.json(body, {
      status,
      headers: { "Content-Type": "application/json", "x-trace-id": traceId },
    });

    if (url.pathname === "/health") {
      const start = Date.now();
      const checks: Record<string, { ok: boolean; latency_ms?: number }> = {};
      let allOk = true;
      try {
        await env.LOVE_DB.prepare("SELECT 1").first();
        checks.d1 = { ok: true, latency_ms: Date.now() - start };
      } catch (e: any) {
        checks.d1 = { ok: false };
        allOk = false;
      }
      return j({
        ok: allOk,
        surface: "ledger-bridge",
        version: "0.0.1",
        timestamp: new Date().toISOString(),
        status: allOk ? "operational" : "degraded",
        checks,
      });
    }

    // ── X-Wing hybrid KEM (draft-ietf-lamp-xwing-00) ─────────────────────
    // Hybrid post-quantum key exchange: ML-KEM-768 + X25519.
    if (url.pathname === "/kem/xwing/public") {
      const kp = generateXWingKeyPair();
      return j({
        publicKey: bytesToB64(kp.publicKey),
        secretKey: bytesToB64(kp.secretKey),
        lengths: {
          publicKey: kp.publicKey.length,
          secretKey: kp.secretKey.length,
          ciphertext: XWING_CT_LEN,
        },
      });
    }

    if (url.pathname === "/kem/xwing/encapsulate") {
      if (request.method !== "POST") return j({ error: "POST required" }, 405);
      let body: any;
      try {
        body = await request.json();
      } catch {
        return j({ error: "Invalid JSON body" }, 400);
      }
      if (!body?.publicKey) return j({ error: "publicKey (base64) required" }, 400);
      try {
        const { ciphertext, sharedSecret } = encapsulateXWing(b64ToBytes(body.publicKey));
        return j({ ciphertext: bytesToB64(ciphertext), sharedSecret: bytesToB64(sharedSecret) });
      } catch (e: any) {
        return j({ error: e.message }, 400);
      }
    }

    if (url.pathname === "/kem/xwing/decapsulate") {
      if (request.method !== "POST") return j({ error: "POST required" }, 405);
      let body: any;
      try {
        body = await request.json();
      } catch {
        return j({ error: "Invalid JSON body" }, 400);
      }
      if (!body?.ciphertext || !body?.secretKey) {
        return j({ error: "ciphertext and secretKey (base64) required" }, 400);
      }
      try {
        const ss = decapsulateXWing(b64ToBytes(body.ciphertext), b64ToBytes(body.secretKey));
        return j({ sharedSecret: bytesToB64(ss) });
      } catch (e: any) {
        return j({ error: e.message }, 400);
      }
    }

    // ── Status List 2021 ──────────────────────────────────────
    // W3C VC Status List 2021 revocation list.
    if (url.pathname.startsWith("/status-list/")) {
      const id = url.pathname.slice("/status-list/".length);
      if (!id) return j({ error: "id is required" }, 400);
      await env.LOVE_DB.prepare(
        `CREATE TABLE IF NOT EXISTS credential_issuance (
           id INTEGER PRIMARY KEY AUTOINCREMENT, did TEXT NOT NULL,
           vct TEXT NOT NULL DEFAULT 'p31.care', issued_at INTEGER NOT NULL,
           algorithm TEXT DEFAULT 'ML-DSA-65'
         )`,
      ).run();
      const totalRow = await env.LOVE_DB.prepare(
        "SELECT COUNT(*) as total FROM credential_issuance",
      ).first() as { total: number } | null;
      const total = totalRow?.total ?? 0;
      let revoked = 0;
      try {
        const revokedRow = await env.LOVE_DB.prepare(
          "SELECT COUNT(*) as cnt FROM credential_issuance WHERE revoked = 1",
        ).first() as { cnt: number } | null;
        revoked = revokedRow?.cnt ?? 0;
      } catch {
        // revoked column may not exist — default to 0
      }
      const bitLen = Math.max(total, 1);
      const bits = new Uint8Array(Math.ceil(bitLen / 8));
      const cs = new CompressionStream("gzip");
      const writer = cs.writable.getWriter();
      writer.write(bits);
      writer.close();
      const chunks: Uint8Array[] = [];
      const reader = cs.readable.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const compressed = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
      let off = 0;
      for (const c of chunks) { compressed.set(c, off); off += c.length; }
      const encodedList = btoa(String.fromCharCode(...compressed))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      return j({
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://w3id.org/vc-status-list-2021/v1",
        ],
        type: ["VerifiableCredential", "StatusList2021Credential"],
        issuer: "did:web:federation.p31ca.org",
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `${url.origin}/status-list/${id}#list`,
          type: "StatusList2021",
          statusPurpose: "revocation",
          encodedList,
        },
      });
    }

    if (request.method !== "POST") {
      return j({ error: "Method not allowed. Use POST /anchor, /anchor-batch, /care-proof." }, 405);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return j({ error: "Invalid JSON body" }, 400);
    }

    // ── P31TransparencyAnchor.anchor(entry_hash, uri) ───────────────────
    if (url.pathname === "/anchor") {
      if (env.ANCHOR_ADDR === zeroAddress) {
        return j({ error: "ANCHOR_ADDR not set (deploy P31TransparencyAnchor first)" }, 400);
      }
      const entryHash: string = body?.entryHash;
      const uri: string = body?.uri;
      if (!entryHash || !BYTES32.test(entryHash)) {
        return j({ error: "entryHash must be a 0x-prefixed 32-byte hex string" }, 400);
      }
      if (!uri || typeof uri !== "string" || uri.length === 0) {
        return j({ error: "uri is required (https:// or ipfs:// manifest location)" }, 400);
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
        return j({ error: "ANCHOR_ADDR not set (deploy P31TransparencyAnchor first)" }, 400);
      }
      const entries: Array<{ entryHash: string; uri: string }> = body?.entries;
      if (!Array.isArray(entries) || entries.length === 0) {
        return j({ error: "entries must be a non-empty array of {entryHash, uri}" }, 400);
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
        return j({ dryRun: true, label: "anchor-batch", to: env.ANCHOR_ADDR, calls });
      }
      const results = [];
      for (const data of calls) {
        const r = await relay(env, env.ANCHOR_ADDR, data, "anchor");
        results.push(await r.json());
      }
      return j({ ok: true, results });
    }

    // ── ProofOfCare.submitCareProofs(...) — sovereign, signed relay ──────
    // CWP-2026-025: the caller must prove control of a registered DID (Ed25519
    // sig over the payload) and the SBT recipient (users[0]) must equal the
    // ETH address bound to that DID. Open minting is REMOVED.
    if (url.pathname === "/care-proof") {
      const did: string = body?.did;
      const signature: string | undefined = body?.signature;
      const mldsa65Sig: string | undefined = body?.mldsa65_sig;
      // CWP-2026-029 P4: composite signature (Ed25519 + ML-DSA-65, both must verify)
      const composite: { ed25519_sig?: string; mldsa65_sig?: string } | undefined = body?.composite;
      const users: string[] = body?.users;
      const tProx: any[] = body?.tProx;
      const qRes: any[] = body?.qRes;
      const tasks: any[] = body?.tasks;
      const entropyRoots: string[] = body?.entropyRoots;

      if (!did) {
        return j({ error: "did is required (sovereign mint)" }, 400);
      }
      if (!signature && !mldsa65Sig && !(composite?.ed25519_sig && composite?.mldsa65_sig)) {
        return j(
          { error: "signature (Ed25519), mldsa65_sig (ML-DSA-65), or composite {ed25519_sig, mldsa65_sig} required" },
          400,
        );
      }
      if (!Array.isArray(users) || users.length === 0 || !users.every((u) => isAddress(u))) {
        return j({ error: "users must be a non-empty array of valid addresses" }, 400);
      }
      const arrays = [tProx, qRes, tasks, entropyRoots];
      if (arrays.some((a) => !Array.isArray(a) || a.length !== users.length)) {
        return j({ error: "tProx, qRes, tasks, entropyRoots must be arrays of length = users.length" }, 400);
      }
      if (!entropyRoots.every((r) => BYTES32.test(r))) {
        return j({ error: "entropyRoots must be 0x-prefixed 32-byte hex strings" }, 400);
      }

      // 1) Resolve the DID's registered binding.
      const row = (await env.LOVE_DB.prepare(
        "SELECT ed25519_pub, mldsa65_pub, eth_address FROM identity_registry WHERE did = ?",
      ).bind(did).first()) as
        | { ed25519_pub: string; mldsa65_pub: string | null; eth_address: string }
        | null;
      if (!row) {
        return j({ error: "Unknown DID — register at love-ledger /identity/register first" }, 401);
      }

      // 2) Prove DID control — Ed25519 (classical), ML-DSA-65 (post-quantum),
      //    or composite (CWP-2026-029 P4: BOTH must verify).
      const message = buildProofMessage(did, users, tProx, qRes, tasks, entropyRoots);
      let controlProven = false;

      if (composite?.ed25519_sig && composite?.mldsa65_sig && row.mldsa65_pub) {
        // Composite: BOTH Ed25519 AND ML-DSA-65 must verify (defence-in-depth)
        const pubBytes = didToEd25519Pub(did);
        const edValid = !!pubBytes && (await verifyDidSignature(message, composite.ed25519_sig, pubBytes));
        const pqValid = verifyMLDSA65(message, composite.mldsa65_sig, row.mldsa65_pub);
        controlProven = edValid && pqValid;
      } else if (mldsa65Sig && row.mldsa65_pub) {
        controlProven = verifyMLDSA65(message, mldsa65Sig, row.mldsa65_pub);
      }
      if (!controlProven && signature) {
        const pubBytes = didToEd25519Pub(did);
        controlProven = !!pubBytes && (await verifyDidSignature(message, signature, pubBytes));
      }
      if (!controlProven) {
        return j(
          { error: "Invalid signature — DID control not proven (Ed25519, ML-DSA-65, or composite)" },
          401,
        );
      }

      // 3) The SBT recipient MUST be the address bound to this DID.
      if (users[0].toLowerCase() !== row.eth_address.toLowerCase()) {
        return j(
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
        if (!payload?.ok) return j(payload, 502);
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
        return j({ ok: true, txHash, did, ethAddress: row.eth_address });
      }

      // Dry-run: return relay response as streaming body (intentional — response IS the relay output).
      // The D1 INSERT below is fire-and-forget for audit trail.
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
    // CWP-2026-029 P6: add `post_quantum: true` + `pq_keypair` for ML-DSA-65.
    if (url.pathname === "/credential/issue") {
      const did: string = body?.did;
      const claims: Record<string, unknown> | undefined = body?.claims;
      const postQuantum: boolean = !!body?.post_quantum;
      if (!did || typeof claims !== "object" || Array.isArray(claims) ||
          Object.keys(claims).length === 0) {
        return j({ error: "did and a non-empty claims object are required" }, 400);
      }
      const reg = (await env.LOVE_DB.prepare(
        "SELECT did, ed25519_pub FROM identity_registry WHERE did = ?",
      ).bind(did).first()) as { did: string; ed25519_pub: string } | null;
      if (!reg) {
        return j({ error: "Unknown DID — register at love-ledger /identity/register first" }, 401);
      }
      if (postQuantum) {
        const { issueSDJWTPostQuantum } = await import("./sdjwt");
        const pqKeyPair = body?.pq_keypair;
        if (!pqKeyPair?.publicKey || !pqKeyPair?.secretKey) {
          return j({ error: "pq_keypair { publicKey, secretKey } required for post_quantum issuance" }, 400);
        }
        const cred = await issueSDJWTPostQuantum(claims, {
          publicKey: new Uint8Array(pqKeyPair.publicKey),
          secretKey: new Uint8Array(pqKeyPair.secretKey),
        });
        await env.LOVE_DB.prepare(
          `CREATE TABLE IF NOT EXISTS credential_issuance (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             did TEXT NOT NULL,
             vct TEXT NOT NULL DEFAULT 'p31.care',
             issued_at INTEGER NOT NULL,
             algorithm TEXT DEFAULT 'Ed25519'
           )`,
        ).run();
        await env.LOVE_DB.prepare(
          "INSERT INTO credential_issuance (did, issued_at, algorithm) VALUES (?, ?, ?)",
        ).bind(did, Date.now(), "ML-DSA-65").run();
        return j({
          ok: true,
          sdjwt: cred.sdjwt,
          issuerPubB64: cred.issuerPubB64,
          algorithm: cred.algorithm,
          note: "Post-quantum SD-JWT VC (ML-DSA-65). Reveal selected claims with /credential/verify.",
        });
      }
      const holderPubB64 = reg.ed25519_pub;
      const cred = await issueSDJWT(claims, holderPubB64);
      // Idempotent: ensure the issuance table exists, then count.
      await env.LOVE_DB.prepare(
        `CREATE TABLE IF NOT EXISTS credential_issuance (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           did TEXT NOT NULL,
           vct TEXT NOT NULL DEFAULT 'p31.care',
           issued_at INTEGER NOT NULL,
           algorithm TEXT DEFAULT 'Ed25519'
         )`,
      ).run();
      await env.LOVE_DB.prepare(
        "INSERT INTO credential_issuance (did, issued_at) VALUES (?, ?)",
      ).bind(did, Date.now()).run();
      return j({
        ok: true,
        sdjwt: cred.sdjwt,
        issuerPubB64: cred.issuerPubB64,
        algorithm: "Ed25519",
        note: "Reveal selected claims with /credential/verify (send only the ~disclosure segments you choose).",
      });
    }

    // ── SD-JWT verify ──────────────────────────────────────────────
    if (url.pathname === "/credential/verify") {
      const sdjwt: string = body?.sdjwt;
      if (!sdjwt || typeof sdjwt !== "string") {
        return j({ error: "sdjwt (compact SD-JWT string) is required" }, 400);
      }
      const issuer = await getIssuer();
      const result = await verifySDJWT(sdjwt, issuer.pub);
      if (!result.valid) return j({ valid: false, disclosed: {} }, 422);
      return j({ valid: true, disclosed: result.disclosed });
    }

    // ── PQC Credential Issue (Phase 1) ────────────────────────────
    // Issues a simple W3C Wrapped Verifiable Credential signed with the
    // caller's ML-DSA-65 key. Does NOT use SD-JWT — plain VC for direct
    // PQC proof-of-possession.
    if (url.pathname === "/credential/issue-pqc") {
      const did: string = body?.did;
      const publicKey: number[] | undefined = body?.publicKey;
      const secretKey: number[] | undefined = body?.secretKey;
      const claims: Record<string, unknown> | undefined = body?.claims;
      if (!did || !publicKey || !secretKey) {
        return j({ error: "did, publicKey, and secretKey (number arrays) are required" }, 400);
      }
      const pk = new Uint8Array(publicKey);
      const sk = new Uint8Array(secretKey);
      const sig = ml_dsa65.sign(sk, new TextEncoder().encode(JSON.stringify({
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "P31PQCIdentityCredential"],
        issuer: did,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: did, ...(claims || {}) },
      })));
      const credential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "P31PQCIdentityCredential"],
        issuer: did,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: did, ...(claims || {}) },
        proof: {
          type: "MLDSA65Proof2026",
          created: new Date().toISOString(),
          proofPurpose: "assertionMethod",
          verificationMethod: `${did}#ml-dsa-65`,
          proofValue: btoa(String.fromCharCode(...sig)),
        },
      };
      await env.LOVE_DB.prepare(
        `CREATE TABLE IF NOT EXISTS credential_issuance (
           id INTEGER PRIMARY KEY AUTOINCREMENT, did TEXT NOT NULL,
           vct TEXT NOT NULL DEFAULT 'p31.pqc', issued_at INTEGER NOT NULL,
           algorithm TEXT DEFAULT 'ML-DSA-65'
         )`,
      ).run();
      await env.LOVE_DB.prepare(
        "INSERT INTO credential_issuance (did, issued_at, algorithm) VALUES (?, ?, ?)",
      ).bind(did, Date.now(), "ML-DSA-65").run();
      return j({ ok: true, credential });
    }

    // ── PQC Credential Verify (CWP-2026-066 C.1: composite) ─────
    // Verifies a W3C VC signed with ML-DSA-65 (or composite Ed25519 + ML-DSA-65).
    if (url.pathname === "/credential/verify-pqc") {
      const credential: any = body?.credential;
      const publicKey: number[] | undefined = body?.publicKey;
      const ed25519PubKey: number[] | undefined = body?.ed25519PublicKey;
      const ed25519Sig: string | undefined = body?.ed25519Signature;
      if (!credential) {
        return j({ error: "credential is required" }, 400);
      }
      if (!publicKey && !(ed25519PubKey && ed25519Sig)) {
        return j({ error: "publicKey (ML-DSA-65) or ed25519PublicKey+ed25519Signature required" }, 400);
      }
      const credCopy = JSON.parse(JSON.stringify(credential));
      const sig = credential.proof?.proofValue ? b64ToBytes(credential.proof.proofValue) : null;
      delete credCopy.proof?.proofValue;
      const msg = new TextEncoder().encode(JSON.stringify(credCopy));
      let mlDsa65Valid = true;
      let ed25519Valid = true;
      if (publicKey && sig) {
        try {
          mlDsa65Valid = ml_dsa65.verify(sig, msg, new Uint8Array(publicKey));
        } catch { mlDsa65Valid = false; }
      }
      if (ed25519PubKey && ed25519Sig) {
        try {
          const key = await crypto.subtle.importKey("raw", new Uint8Array(ed25519PubKey), "Ed25519", false, ["verify"]);
          ed25519Valid = await crypto.subtle.verify("Ed25519", key, b64ToBytes(ed25519Sig), msg);
        } catch { ed25519Valid = false; }
      }
      const composite = !!publicKey && !!ed25519PubKey;
      const valid = composite ? (mlDsa65Valid && ed25519Valid) : (publicKey ? mlDsa65Valid : ed25519Valid);
      return j({
        valid,
        composite,
        algorithms: composite ? ["ML-DSA-65", "Ed25519"] : publicKey ? ["ML-DSA-65"] : ["Ed25519"],
        mlDsa65: mlDsa65Valid,
        ed25519: ed25519Valid,
        credentialSubject: credential.credentialSubject,
      });
    }

    // ── SBT Mint (Phase 4) ───────────────────────────────────────
    // Calls LOVESBT.mintSBT() via viem relay. Dry-run by default.
    if (url.pathname === "/sbt/mint") {
      const did: string = body?.did;
      const ethAddress: string = body?.ethAddress;
      if (!did || !ethAddress) {
        return j({ error: "did and ethAddress are required" }, 400);
      }
      const reg = (await env.LOVE_DB.prepare(
        "SELECT eth_address FROM identity_registry WHERE did = ?",
      ).bind(did).first()) as { eth_address: string } | null;
      if (!reg) return j({ error: "Unknown DID — register first" }, 401);
      if (reg.eth_address.toLowerCase() !== ethAddress.toLowerCase()) {
        return j({ error: "ethAddress does not match registered address" }, 403);
      }
      const data = encodeFunctionData({
        abi: ProofOfCareAbi,
        functionName: "submitCareProofs",
        args: [[ethAddress as `0x${string}`], [1n], [1n], [1n], ["0x0000000000000000000000000000000000000000000000000000000000000001" as Hex]],
      });
      return relay(env, env.PROOF_OF_CARE_ADDR, data, "sbt-mint");
    }

    // ── SBT Mint — Privacy-Enabled (CWP-2026-067) ──────────────────
    // Issues SD-JWT VC with selective disclosure, builds Merkle tree,
    // stores root as commitment (D1), and mints on-chain via relay.
    if (url.pathname === "/sbt/mint-private") {
      const did: string = body?.did;
      const ethAddress: string = body?.ethAddress;
      const careScore: number | undefined = body?.careScore;
      const trustTier: string | undefined = body?.trustTier;
      const privacy = body?.privacy || {};
      const holderPubB64: string | undefined = body?.holderPubB64;

      if (!did || !ethAddress) {
        return j({ error: "did and ethAddress are required" }, 400);
      }

      const reg = (await env.LOVE_DB.prepare(
        "SELECT eth_address FROM identity_registry WHERE did = ?",
      ).bind(did).first()) as { eth_address: string } | null;
      if (!reg) return j({ error: "Unknown DID — register first" }, 401);
      if (reg.eth_address.toLowerCase() !== ethAddress.toLowerCase()) {
        return j({ error: "ethAddress does not match registered address" }, 403);
      }

      const result = await mintPrivateSBT({
        did,
        ethAddress,
        careScore,
        trustTier,
        privacy: {
          hideCareScore: privacy.hideCareScore || false,
          hideTrustTier: privacy.hideTrustTier || false,
          hideTokenId: privacy.hideTokenId || false,
          secretHex: privacy.secretHex,
        },
      }, holderPubB64);

      await env.LOVE_DB.prepare(
        `CREATE TABLE IF NOT EXISTS sbt_privacy_roots (
           did TEXT PRIMARY KEY, merkle_root TEXT NOT NULL, nullifier TEXT NOT NULL,
           created_at INTEGER NOT NULL
         )`,
      ).run();

      await env.LOVE_DB.prepare(
        `INSERT OR REPLACE INTO sbt_privacy_roots (did, merkle_root, nullifier, created_at)
         VALUES (?, ?, ?, ?)`
      ).bind(did, result.merkleRoot, result.nullifier, Date.now()).run();

      const onChainData = encodeFunctionData({
        abi: ProofOfCareAbi,
        functionName: "submitCareProofs",
        args: [[ethAddress as `0x${string}`], [1n], [1n], [1n],
          [(`0x${result.merkleRoot}`) as Hex]],
      });

      const relayResult = await relay(env, env.PROOF_OF_CARE_ADDR, onChainData, "sbt-mint-private");

      return j({
        ok: true,
        did,
        ethAddress,
        sdjwt: result.sdjwt,
        issuerPubB64: result.issuerPubB64,
        merkleRoot: result.merkleRoot,
        nullifier: result.nullifier,
        disclosedClaims: result.disclosedClaims,
        hiddenClaims: result.hiddenClaims,
        relayResult,
        note: "Merkle root committed on-chain via ProofOfCare. Use /credential/verify to validate SD-JWT.",
      });
    }

    // ── PQC Credential Revoke (CWP-2026-066 C.2) ──────────────
    if (url.pathname === "/credential/revoke") {
      const did: string = body?.did;
      if (!did) return j({ error: "did is required" }, 400);
      await env.LOVE_DB.prepare(
        `CREATE TABLE IF NOT EXISTS credential_issuance (
           id INTEGER PRIMARY KEY AUTOINCREMENT, did TEXT NOT NULL,
           vct TEXT NOT NULL DEFAULT 'p31.care', issued_at INTEGER NOT NULL,
           algorithm TEXT DEFAULT 'ML-DSA-65'
         )`,
      ).run();
      try {
        await env.LOVE_DB.prepare("ALTER TABLE credential_issuance ADD COLUMN revoked INTEGER DEFAULT 0").run();
      } catch {}
      try {
        await env.LOVE_DB.prepare("ALTER TABLE credential_issuance ADD COLUMN revoked_at INTEGER").run();
      } catch {}
      await env.LOVE_DB.prepare(
        "UPDATE credential_issuance SET revoked = 1, revoked_at = ? WHERE did = ?",
      ).bind(Date.now(), did).run();
      return j({ ok: true, did, revoked: true });
    }

    // ── PQC Credential Renew (CWP-2026-066 C.3) ──────────────
    // Accepts an expiring/expired PQC credential and re-issues with fresh dates.
    if (url.pathname === "/credential/renew-pqc") {
      const credential: any = body?.credential;
      const publicKey: number[] | undefined = body?.publicKey;
      const secretKey: number[] | undefined = body?.secretKey;
      if (!credential || !publicKey || !secretKey) {
        return j({ error: "credential, publicKey, and secretKey (number arrays) are required" }, 400);
      }
      const renewedProofMsg = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "P31PQCIdentityCredential"],
        issuer: credential.issuer || credential.credentialSubject?.id,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { ...credential.credentialSubject, renewedAt: new Date().toISOString() },
      };
      const renewedSig = ml_dsa65.sign(new Uint8Array(secretKey), new TextEncoder().encode(JSON.stringify(renewedProofMsg)));
      const renewed = {
        ...renewedProofMsg,
        proof: {
          type: "MLDSA65Proof2026",
          created: new Date().toISOString(),
          proofPurpose: "assertionMethod",
          verificationMethod: `${credential.issuer || credential.credentialSubject?.id}#ml-dsa-65-renewed`,
          proofValue: btoa(String.fromCharCode(...renewedSig)),
        },
      };
      await env.LOVE_DB.prepare(
        "INSERT INTO credential_issuance (did, issued_at, algorithm) VALUES (?, ?, ?)",
      ).bind(renewed.issuer, Date.now(), "ML-DSA-65-renewed").run();
      return j({ ok: true, credential: renewed, note: "PQC credential renewed. Previous credential should be revoked." });
    }

    // Log span for observability dashboard
    const spanDuration = Date.now() - spanStart;
    console.log(JSON.stringify({
      level: 'trace',
      traceId,
      method: request.method,
      path: url.pathname,
      duration_ms: spanDuration,
      timestamp: new Date().toISOString(),
    }));

    return j({ error: `Unknown route: ${url.pathname}` }, 404);
  },
};
