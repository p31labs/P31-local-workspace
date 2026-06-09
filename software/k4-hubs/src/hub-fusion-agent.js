/**
 * HubFusionAgent — one DO per hub_id. Holds a 4-member roster (tetra vertices)
 * and computes symmetric "fusion" reads from k4-personal (energy only in v1).
 * Response shape: p31.hubFusion/1.0.0
 */
import { DurableObject } from "cloudflare:workers";

export const HUB_FUSION_SCHEMA = "p31.hubFusion/1.0.0";

export class HubFusionAgent extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS hub_state (
        k TEXT PRIMARY KEY,
        v TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  /** @param {string} k */
  _get(k) {
    const rows = this.ctx.storage.sql.exec("SELECT v FROM hub_state WHERE k = ?", k).toArray();
    return rows[0]?.v ?? null;
  }

  /** @param {string} k @param {string} v */
  _set(k, v) {
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO hub_state (k, v, updated_at) VALUES (?, ?, ?)",
      k,
      v,
      Date.now()
    );
  }

  /** @param {Request} request */
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health") {
      return Response.json({ status: "ok", agent: "hub-fusion" });
    }
    if (path === "/roster") {
      if (request.method === "GET") return this._rosterGet();
      if (request.method === "PUT") return this._rosterPut(request);
      return new Response("Method not allowed", { status: 405 });
    }
    if (path === "/fusion" && request.method === "GET") {
      return this._fusionGet();
    }
    return new Response("Not found", { status: 404 });
  }

  _rosterGet() {
    const raw = this._get("roster");
    if (!raw) {
      return Response.json({
        schema: HUB_FUSION_SCHEMA,
        hubLabel: null,
        subjectIds: [],
        updatedAt: null,
      });
    }
    try {
      const { label, subjectIds, updatedAt } = JSON.parse(raw);
      return Response.json({
        schema: HUB_FUSION_SCHEMA,
        hubLabel: label ?? null,
        subjectIds: Array.isArray(subjectIds) ? subjectIds : [],
        updatedAt: updatedAt ?? null,
      });
    } catch {
      return Response.json({ error: "Corrupt roster" }, { status: 500 });
    }
  }

  async _rosterPut(request) {
    const token = this.env.HUBS_WRITE_TOKEN;
    if (token && request.headers.get("X-P31-Hub-Token") !== token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const ids = body.subjectIds;
    if (!Array.isArray(ids) || ids.length !== 4) {
      return Response.json(
        { error: "subjectIds must be an array of exactly four vertex agents" },
        { status: 400 }
      );
    }
    const subjectIds = [];
    const seen = new Set();
    for (const id of ids) {
      if (typeof id !== "string" || id.length < 2 || id.length > 256) {
        return Response.json({ error: "Invalid subject id" }, { status: 400 });
      }
      if (seen.has(id)) {
        return Response.json({ error: "subjectIds must be unique" }, { status: 400 });
      }
      seen.add(id);
      subjectIds.push(id);
    }
    const label = typeof body.label === "string" && body.label.length <= 120 ? body.label : "Hub";
    const payload = JSON.stringify({
      label,
      subjectIds,
      updatedAt: Date.now(),
    });
    this._set("roster", payload);
    return Response.json({
      schema: HUB_FUSION_SCHEMA,
      hubLabel: label,
      subjectIds,
      updatedAt: JSON.parse(payload).updatedAt,
    });
  }

  async _fusionGet() {
    const raw = this._get("roster");
    if (!raw) {
      return Response.json(
        { error: "No roster configured — PUT /hub/{id}/roster first", code: "EMPTY_ROSTER" },
        { status: 404 }
      );
    }
    let roster;
    try {
      roster = JSON.parse(raw);
    } catch {
      return Response.json({ error: "Corrupt roster" }, { status: 500 });
    }
    const subjectIds = roster.subjectIds;
    if (!Array.isArray(subjectIds) || subjectIds.length !== 4) {
      return Response.json({ error: "Roster must list four members" }, { status: 400 });
    }

    const weight = 1 / 4;
    const channels = [];
    const spoonsList = [];

    for (const subjectId of subjectIds) {
      try {
        const res = await this.env.K4_PERSONAL.fetch(
          new Request(`https://k4-personal.internal/agent/${encodeURIComponent(subjectId)}/energy`)
        );
        const energy = res.ok ? await res.json() : { spoons: null, max: null };
        const spoons = typeof energy.spoons === "number" ? energy.spoons : null;
        const max = typeof energy.max === "number" ? energy.max : null;
        if (spoons != null) spoonsList.push(spoons);
        channels.push({
          subjectId,
          energy: { spoons, max },
          weight,
        });
      } catch (e) {
        channels.push({
          subjectId,
          energy: { spoons: null, max: null, error: String(e.message || e) },
          weight,
        });
      }
    }

    const valid = spoonsList.filter((s) => typeof s === "number");
    const meanSpoons =
      valid.length === 0 ? null : valid.reduce((a, b) => a + b, 0) / valid.length;
    const minSpoons = valid.length ? Math.min(...valid) : null;
    const maxSpoons = valid.length ? Math.max(...valid) : null;
    let spread = null;
    if (valid.length > 1 && meanSpoons != null) {
      const variance =
        valid.reduce((acc, s) => acc + (s - meanSpoons) ** 2, 0) / valid.length;
      spread = Math.sqrt(variance);
    }
    /** High when group energy is even; low when someone is far from the mean */
    const coherence =
      meanSpoons != null && meanSpoons > 0 && spread != null
        ? Math.max(0, Math.min(1, 1 - spread / (meanSpoons + 1)))
        : valid.length === 1
          ? 1
          : null;

    return Response.json({
      schema: HUB_FUSION_SCHEMA,
      version: "1.0.0",
      hubLabel: roster.label ?? null,
      members: subjectIds,
      channels,
      aggregate: {
        meanSpoons,
        minSpoons,
        maxSpoons,
        spread,
        coherence,
        sampleCount: valid.length,
      },
      sicPovmNote:
        "Symmetric four-channel read (equal weights). Hub stores roster only — no vertex chat or profile.",
    });
  }
}
