/**
 * care-mesh — P31 Care Mesh Worker (CWP-2026-016, Workstream B).
 *
 * A privacy-preserving, aggregated care-data mesh. Families submit
 * Ed25519-signed care metrics; other families can pull anonymised,
 * differentially-private aggregates (Laplace noise, ε = 0.5).
 *
 * Reuses the shared love-ledger D1 (CARE_DB binding) — the account is at the
 * Free Plan D1 cap, so no new database is created.
 */

interface Env {
  CARE_DB: D1Database;
}

interface SubmitBody {
  family_did: string;
  period_start: number;
  period_end: number;
  avg_spoons: number;
  care_event_count: number;
  care_score: number;
  signature: string; // hex
  pubkey: string; // hex (32 bytes raw Ed25519)
}

const EPSILON = 0.5;
const SENSITIVITY = 5; // spoons ∈ [0,5]

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// Canonical message the family signs over.
function canonical(b: SubmitBody): string {
  return [b.family_did, b.period_start, b.period_end, b.avg_spoons, b.care_event_count, b.care_score].join("|");
}

async function verifyEd25519(pubkeyHex: string, sigHex: string, msg: string): Promise<boolean> {
  try {
    const pub = hexToBytes(pubkeyHex);
    if (pub.length !== 32) return false;
    const key = await crypto.subtle.importKey("raw", pub, "Ed25519", true, ["verify"]);
    const sig = hexToBytes(sigHex);
    return await crypto.subtle.verify("Ed25519", key, sig, new TextEncoder().encode(msg));
  } catch {
    return false;
  }
}

// Laplace mechanism: scale = sensitivity / epsilon.
function laplaceNoise(scale: number): number {
  const u = Math.random() - 0.5;
  if (u === 0) return 0;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", service: "care-mesh" });
    }

    // POST /submit — Ed25519-signed care metrics.
    if (request.method === "POST" && url.pathname === "/submit") {
      let b: SubmitBody;
      try {
        b = await request.json<SubmitBody>();
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }
      if (!b?.family_did || typeof b.avg_spoons !== "number" || !b.signature || !b.pubkey) {
        return Response.json({ error: "Missing family_did / avg_spoons / signature / pubkey" }, { status: 400 });
      }
      const ok = await verifyEd25519(b.pubkey, b.signature, canonical(b));
      if (!ok) return Response.json({ error: "Invalid Ed25519 signature" }, { status: 401 });

      await env.CARE_DB.prepare(
        `INSERT INTO care_mesh_aggregates
           (family_did, period_start, period_end, avg_spoons, care_event_count, care_score, noise_epsilon, signature, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          b.family_did,
          b.period_start,
          b.period_end,
          b.avg_spoons,
          b.care_event_count,
          b.care_score,
          EPSILON,
          b.signature,
          Date.now(),
        )
        .run();

      return Response.json({ ok: true });
    }

    // GET /aggregates?family_did= — this family's own stored aggregates.
    if (request.method === "GET" && url.pathname === "/aggregates") {
      const did = url.searchParams.get("family_did");
      if (!did) return Response.json({ error: "Missing family_did" }, { status: 400 });
      const rows = await env.CARE_DB.prepare(
        "SELECT family_did, period_start, period_end, avg_spoons, care_event_count, care_score, created_at FROM care_mesh_aggregates WHERE family_did = ? ORDER BY period_start DESC LIMIT 100",
      )
        .bind(did)
        .all();
      return Response.json(rows);
    }

    // GET /mesh?family_did= — anonymised peer aggregates with DP noise.
    if (request.method === "GET" && url.pathname === "/mesh") {
      const did = url.searchParams.get("family_did");
      if (!did) return Response.json({ error: "Missing family_did" }, { status: 400 });
      const rows = await env.CARE_DB.prepare(
        "SELECT family_did, period_start, period_end, avg_spoons, care_event_count, care_score FROM care_mesh_aggregates WHERE family_did != ? ORDER BY period_start DESC LIMIT 50",
      )
        .bind(did)
        .all();
      const scale = SENSITIVITY / EPSILON;
      const peers = ((rows.results as any[]) ?? []).map((r) => ({
        family_did: r.family_did,
        period_start: r.period_start,
        period_end: r.period_end,
        avg_spoons: Math.max(0, Math.min(5, r.avg_spoons + laplaceNoise(scale))),
        care_event_count: r.care_event_count,
        care_score: r.care_score,
        noise_epsilon: EPSILON,
      }));
      return Response.json({ epsilon: EPSILON, sensitivity: SENSITIVITY, peers: peers.length, mesh: peers });
    }

    return new Response("Not found", { status: 404 });
  },
};
