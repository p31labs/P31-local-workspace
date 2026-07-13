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
import { sepolia } from "viem/chains";
import { P31TransparencyAnchorAbi, ProofOfCareAbi } from "./abis";

interface Env {
  RPC_URL: string;
  PROOF_OF_CARE_ADDR: string;
  ANCHOR_ADDR: string;
  DRY_RUN?: string;
  BRIDGE_PRIVATE_KEY?: string;
}

const BYTES32 = /^0x[0-9a-fA-F]{64}$/;

function isDryRun(env: Env): boolean {
  return env.DRY_RUN === "true" || !env.BRIDGE_PRIVATE_KEY;
}

function getClients(env: Env): {
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: WalletClient | null;
} {
  const publicClient = createPublicClient({ chain: sepolia, transport: http(env.RPC_URL) });
  if (!env.BRIDGE_PRIVATE_KEY) return { publicClient, walletClient: null };
  const account = privateKeyToAccount(env.BRIDGE_PRIVATE_KEY as Hex);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(env.RPC_URL),
  });
  return { publicClient, walletClient };
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
  const { publicClient, walletClient } = getClients(env);
  if (!walletClient) return Response.json({ error: "no signer configured" }, { status: 500 });

  try {
    const txHash = await walletClient.sendTransaction({
      to: to as Hex,
      data,
      chain: sepolia,
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        status: "ok",
        service: "ledger-bridge",
        dryRun: isDryRun(env),
        chain: "sepolia",
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

    // ── ProofOfCare.submitCareProofs(...) — requires relay authority ─────
    if (url.pathname === "/care-proof") {
      const users: string[] = body?.users;
      const tProx: any[] = body?.tProx;
      const qRes: any[] = body?.qRes;
      const tasks: any[] = body?.tasks;
      const entropyRoots: string[] = body?.entropyRoots;

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
      return relay(env, env.PROOF_OF_CARE_ADDR, data, "submitCareProofs");
    }

    return json({ error: `Unknown route: ${url.pathname}` }, 404);
  },
};
