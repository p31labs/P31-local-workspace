/**
 * K4-Personal — Per-user PersonalAgent with SQLite-backed state, reminders, energy.
 * DO-based for per-user sessions.
 */
import { DurableObject } from 'cloudflare:workers';
import {
  personalMesh,
  personalHealth,
  personalVertexGet,
  personalPresence,
  personalPing,
  personalRouteIndex,
  personalApiSnapshot,
} from '../../packages/k4-mesh-core/personal-handlers.js';
import { personalVizResponse } from '../../packages/k4-mesh-core/personal-viz.js';
import {
  normalizePersonalTetra,
  validatePersonalTetra,
} from './personal-tetra.js';
import { buildTetraHomePage } from './tetra-home-html.js';
import {
  DEFAULT_SOULSAFE_MODEL_ID,
  runSoulsafeTetra,
  SOULSAFE_TETRA_SCHEMA,
} from './soulsafe-tetra.js';
import {
  countSoulsafeRuns,
  parseSoulsafeRunsMaxAgeMs,
  parseSoulsafeRunsMaxRows,
  SOULSAFE_RETENTION_SCHEMA,
  trimSoulsafeRuns,
} from './soulsafe-retention.js';

/** Samson v0 — time-capped spoon replenishment (∆hours × rate, clamped to max) + fusion floor for SOULSAFE. */
const SAMSON_REGEN_SPOONS_PER_ELAPSED_HOUR = 1.5;
const SAMSON_MIN_SPOONS_FUSION = 3;

export class PersonalAgent extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        ts INTEGER NOT NULL,
        metadata TEXT DEFAULT '{}'
      );
      CREATE TABLE IF NOT EXISTS state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        label TEXT NOT NULL,
        schedule_ts INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS telemetry_pending (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        payload TEXT NOT NULL,
        ts INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS soulsafe_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        effects_json TEXT NOT NULL,
        reply TEXT NOT NULL,
        model_id TEXT NOT NULL
      );
    `);
    this.ctx.storage.getAlarm().then((existing) => {
      if (existing === null) {
        this.ctx.storage.setAlarm(
          Date.now() + parseInt(this.env.FLUSH_INTERVAL_MS || "30000", 10)
        );
      }
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;
    switch (url.pathname) {
      case "/chat":
        return method === "POST" ? this._chat(request) : new Response("Method not allowed", { status: 405 });
      case "/history":
        return method === "GET" ? this._history(url) : new Response("Method not allowed", { status: 405 });
      case "/state":
        return ["GET", "PUT"].includes(method) ? this._state(request) : new Response("Method not allowed", { status: 405 });
      case "/reminders":
        return ["GET", "POST"].includes(method) ? this._reminders(request) : new Response("Method not allowed", { status: 405 });
      case "/energy":
        return ["GET", "PUT"].includes(method) ? this._energy(request) : new Response("Method not allowed", { status: 405 });
      case "/bio":
        return method === "POST" ? this._bioIngest(request) : new Response("Method not allowed", { status: 405 });
      case "/health":
        return Response.json({ status: "ok", agent: "personal" });
      case "/tetra":
        return ["GET", "PUT"].includes(method) ? this._tetra(request) : new Response("Method not allowed", { status: 405 });
      case "/manifest":
        return method === "GET" ? this._manifest() : new Response("Method not allowed", { status: 405 });
      default:
        return new Response("Not found", { status: 404 });
    }
  }

  /**
   * Soft cap on `messages` rows (PA-2.4): trim oldest when over env `MESSAGES_MAX_ROWS` (default 2000).
   */
  /**
   * SOULSAFE audit rows (`soulsafe_runs`): env `SOULSAFE_RUNS_MAX_ROWS` + optional age floor.
   */
  _soulsafeRunsMaxRows() {
    return parseSoulsafeRunsMaxRows(this.env);
  }

  /** @returns {number | null} */
  _soulsafeRunsMaxAgeMs() {
    return parseSoulsafeRunsMaxAgeMs(this.env);
  }

  _trimSoulsafeRunsToCap() {
    trimSoulsafeRuns(
      this.ctx.storage.sql,
      this._soulsafeRunsMaxRows(),
      this._soulsafeRunsMaxAgeMs()
    );
  }

  _messagesMaxRows() {
    const n = parseInt(this.env.MESSAGES_MAX_ROWS || "2000", 10);
    if (Number.isNaN(n)) return 2000;
    return Math.max(100, Math.min(50_000, n));
  }

  _trimMessagesToCap() {
    const maxRows = this._messagesMaxRows();
    const countRows = this.ctx.storage.sql
      .exec("SELECT COUNT(*) as n FROM messages")
      .toArray();
    const n = countRows[0] && countRows[0].n != null ? Number(countRows[0].n) : 0;
    if (n <= maxRows) return;
    const toDelete = n - maxRows;
    this.ctx.storage.sql.exec(
      "DELETE FROM messages WHERE id IN (SELECT id FROM messages ORDER BY id ASC LIMIT ?)",
      toDelete
    );
  }

  async _chat(request) {
    const body = await request.json();
    const { message, scope, tools, soulsafe: soulsafeBody } = body;
    if (!message || typeof message !== "string" || message.length > 4000) {
      return Response.json({ error: "Invalid message" }, { status: 400 });
    }
    try {
    const prefs = this._getState("soulsafe_prefs") || {};
    const defaultOn = this.env.SOULSAFE_CHAT_DEFAULT === "1" || prefs.default === true;
    const wantSoulsafe = soulsafeBody === true || (soulsafeBody !== false && defaultOn);

    this.ctx.storage.sql.exec(
      "INSERT INTO messages (role, content, ts) VALUES (?, ?, ?)",
      "user", message, Date.now()
    );
    const historyRows = this.ctx.storage.sql.exec(
      "SELECT role, content FROM messages ORDER BY id DESC LIMIT 20"
    ).toArray();
    const history = historyRows.reverse().map((m) => ({ role: m.role, content: m.content }));
    const profile = this._getState("profile") || {};
    const energy = this._getState("energy") || { spoons: 10, max: 12 };
    const scrubRules = this._getState("scrub_rules") || [];
    const scrubbedMessage = this._scrubPII(message, scrubRules);
    const scrubbedHistory = history.map((m) => ({
      ...m,
      content: this._scrubPII(m.content, scrubRules)
    }));

    const spoons = Number(energy.spoons);
    const canSoulsafe = wantSoulsafe && !Number.isNaN(spoons) && spoons >= SAMSON_MIN_SPOONS_FUSION;

    if (canSoulsafe && this.env.AI) {
      const modelId = DEFAULT_SOULSAFE_MODEL_ID;
      const fused = await runSoulsafeTetra({
        ai: this.env.AI,
        modelId,
        profile,
        energy,
        scrubbedUserMessage: scrubbedMessage,
        scrubbedHistoryTail: scrubbedHistory,
        scope,
        tools,
      });
      const reply = fused.reply || "No response";
      const meta = JSON.stringify({
        schema: SOULSAFE_TETRA_SCHEMA,
        modelId: fused.modelId,
        effects: fused.effects,
      });
      this.ctx.storage.sql.exec(
        "INSERT INTO messages (role, content, ts, metadata) VALUES (?, ?, ?, ?)",
        "assistant",
        reply,
        Date.now(),
        meta
      );
      this.ctx.storage.sql.exec(
        "INSERT INTO soulsafe_runs (ts, effects_json, reply, model_id) VALUES (?, ?, ?, ?)",
        Date.now(),
        JSON.stringify(fused.effects),
        reply,
        fused.modelId
      );
      return Response.json({
        reply,
        energy,
        soulsafe: {
          schema: SOULSAFE_TETRA_SCHEMA,
          effects: fused.effects,
          modelId: fused.modelId,
        },
      });
    }

    const systemPrompt = [
      `You are a personal assistant for ${profile.name || "this user"}.`,
      `Role: ${profile.role || "mesh participant"}.`,
      `Current energy: ${energy.spoons}/${energy.max} spoons.`,
      `Scope: ${scope || "personal"}. Do not access data outside this scope.`,
      `Available tools: ${(tools || []).map((t) => t.name).join(", ") || "none"}.`,
      `Keep responses concise. This is a cognitive prosthetic, not a chatbot.`
    ].join(" ");
    const aiResponse = await this.env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct-fast",
      {
        messages: [
          { role: "system", content: systemPrompt },
          ...scrubbedHistory,
          { role: "user", content: scrubbedMessage }
        ],
        temperature: 0,
        max_tokens: 512
      }
    );
    const reply = aiResponse.response || "No response";
    this.ctx.storage.sql.exec(
      "INSERT INTO messages (role, content, ts) VALUES (?, ?, ?)",
      "assistant", reply, Date.now()
    );
    const out = { reply, energy };
    if (wantSoulsafe && !canSoulsafe) {
      out.soulsafeSkipped = { reason: "low_energy", minSpoons: SAMSON_MIN_SPOONS_FUSION };
    }
    return Response.json(out);
    } finally {
      this._trimMessagesToCap();
      this._trimSoulsafeRunsToCap();
    }
  }

  async _history(url) {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const rows = this.ctx.storage.sql.exec(
      "SELECT id, role, content, ts, metadata FROM messages ORDER BY id DESC LIMIT ?", limit
    ).toArray().reverse();
    return Response.json({ messages: rows });
  }

  async _state(request) {
    if (request.method === "GET") {
      const rows = this.ctx.storage.sql.exec("SELECT key, value FROM state").toArray();
      const obj = {};
      rows.forEach((r) => {
        try { obj[r.key] = JSON.parse(r.value); } catch { obj[r.key] = r.value; }
      });
      if (Object.prototype.hasOwnProperty.call(obj, "personalTetra")) {
        obj.personalTetra = normalizePersonalTetra(obj.personalTetra);
      }
      return Response.json(obj);
    }
    const updates = await request.json();
    for (const [key, value] of Object.entries(updates)) {
      if (key === "personalTetra") {
        const v = validatePersonalTetra(value);
        if (!v.ok) {
          return Response.json({ error: v.error }, { status: 400 });
        }
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO state (key, value, updated_at) VALUES (?, ?, ?)",
          key,
          JSON.stringify(v.value),
          Date.now()
        );
        continue;
      }
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO state (key, value, updated_at) VALUES (?, ?, ?)",
        key, JSON.stringify(value), Date.now()
      );
    }
    return Response.json({ ok: true });
  }

  async _tetra(request) {
    if (request.method === "GET") {
      const raw = this._getState("personalTetra");
      return Response.json(normalizePersonalTetra(raw));
    }
    const body = await request.json();
    const v = validatePersonalTetra(body);
    if (!v.ok) {
      return Response.json({ error: v.error }, { status: 400 });
    }
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO state (key, value, updated_at) VALUES (?, ?, ?)",
      "personalTetra",
      JSON.stringify(v.value),
      Date.now()
    );
    return Response.json(v.value);
  }

  async _manifest() {
    const personalTetra = normalizePersonalTetra(this._getState("personalTetra"));
    const profile = this._getState("profile") || {};
    const energy = this._getState("energy") || { spoons: 10, max: 12 };
    const soulsafePrefs = this._getState("soulsafe_prefs") || {};
    const soulsafeRunsCount = countSoulsafeRuns(this.ctx.storage.sql);
    const runsMaxAgeMs = this._soulsafeRunsMaxAgeMs();
    return Response.json({
      schema: "p31.personalAgentManifest/0.1.0",
      personalTetra,
      profile: { name: profile.name ?? null, role: profile.role ?? null },
      energy: { spoons: energy.spoons, max: energy.max },
      soulsafeTetra: {
        schema: SOULSAFE_TETRA_SCHEMA,
        chatDefault:
          this.env.SOULSAFE_CHAT_DEFAULT === "1" || soulsafePrefs.default === true,
        minSpoonsForFusion: SAMSON_MIN_SPOONS_FUSION,
        retention: {
          schema: SOULSAFE_RETENTION_SCHEMA,
          runsMaxRows: this._soulsafeRunsMaxRows(),
          runsMaxAgeMs: runsMaxAgeMs,
          currentRunCount: soulsafeRunsCount,
          strategy:
            runsMaxAgeMs != null
              ? "delete_older_than_age_then_oldest_over_cap"
              : "delete_oldest_over_cap",
        },
      },
      retention: {
        schema: "p31.agentRetention/0.1.0",
        chatMessagesMaxRows: this._messagesMaxRows(),
        strategy: "delete_oldest_over_cap",
      },
      spoonEconomy: {
        schema: "p31.spoonEconomyController/0.1.0",
        samsonV0: {
          regenSpoonsPerElapsedHour: SAMSON_REGEN_SPOONS_PER_ELAPSED_HOUR,
          minSpoonsForSoulsafeFusion: SAMSON_MIN_SPOONS_FUSION,
          integration:
            "floor(elapsed_hours) * regen capped at energy.max via GET /energy",
          spec: "See docs/SOULSAFE-TETRA-SPEC.md (home repo) · GET /manifest",
        },
      },
      service: { name: "k4-personal", durableObject: "PersonalAgent" },
    });
  }

  async _reminders(request) {
    if (request.method === "GET") {
      const rows = this.ctx.storage.sql.exec(
        "SELECT * FROM reminders WHERE completed = 0 ORDER BY schedule_ts ASC"
      ).toArray();
      return Response.json({ reminders: rows });
    }
    const { kind, label, schedule_ts } = await request.json();
    if (!kind || !label || !schedule_ts) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    this.ctx.storage.sql.exec(
      "INSERT INTO reminders (kind, label, schedule_ts, created_at) VALUES (?, ?, ?, ?)",
      kind, label, schedule_ts, Date.now()
    );
    return Response.json({ ok: true });
  }

  async _energy(request) {
    if (request.method === "GET") {
      const current = this._getState("energy") || { spoons: 10, max: 12, lastUpdate: Date.now() };
      const { spoons, max, lastUpdate } = current;
      const elapsedHours = (Date.now() - (lastUpdate || Date.now())) / 3600000;
      const regenned = Math.min(max, spoons + Math.floor(elapsedHours * SAMSON_REGEN_SPOONS_PER_ELAPSED_HOUR));
      return Response.json({ spoons: regenned, max, lastUpdate, regenned: elapsedHours > 0.5 && regenned > spoons });
    }
    if (request.method === "PUT") {
      const update = await request.json();
      const current = this._getState("energy") || { spoons: 10, max: 12 };
      let merged = { ...current, ...update, lastUpdate: Date.now() };
      merged.spoons = Math.max(0, Math.min(merged.spoons, merged.max));
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO state (key, value, updated_at) VALUES (?, ?, ?)",
        "energy",
        JSON.stringify(merged),
        Date.now()
      );
      return Response.json(merged);
    }
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  async _bioIngest(request) {
    const { type, value, unit, ts, source } = await request.json();
    const validTypes = [
      "calcium_serum", "heart_rate", "hrv_rmssd", "hrv_sdnn",
      "blood_pressure", "temperature", "medication_taken",
      "spoon_check", "sleep_hours", "hydration_oz"
    ];
    if (!validTypes.includes(type)) {
      return Response.json({ error: `Invalid type. Valid: ${validTypes.join(",")}` }, { status: 400 });
    }
    const record = {
      type,
      value: parseFloat(value) || 0,
      unit: unit || "",
      ts: ts || Date.now(),
      source: source || "manual",
      recorded_at: Date.now()
    };
    this.ctx.storage.sql.exec(
      "INSERT INTO telemetry_pending (kind, payload, ts) VALUES (?, ?, ?)",
      `bio:${type}`, JSON.stringify(record), record.ts
    );
    if (type === "calcium_serum") {
      const level = record.value;
      let alert = null;
      if (level < 7.6) {
        alert = { severity: "critical", message: `CRITICAL: Calcium at ${level} mg/dL. Seek immediate medical attention.`, timestamp: Date.now() };
      } else if (level < 7.8) {
        alert = { severity: "warning", message: `WARNING: Calcium at ${level} mg/dL — below symptomatic threshold. Take calcium now.`, timestamp: Date.now() };
      } else if (level < 8) {
        alert = { severity: "caution", message: `Calcium at ${level} mg/dL — approaching lower target. Monitor closely.`, timestamp: Date.now() };
      }
      if (alert) {
        this.ctx.storage.sql.exec(
          "INSERT INTO telemetry_pending (kind, payload, ts) VALUES (?, ?, ?)",
          "bio_alert", JSON.stringify(alert), Date.now()
        );
        return Response.json({ ok: true, record, alert });
      }
    }
    if (type === "medication_taken") {
      this.ctx.storage.sql.exec(
        `UPDATE reminders SET completed = 1
         WHERE kind = 'medication' AND completed = 0
         AND schedule_ts <= ? ORDER BY schedule_ts DESC LIMIT 1`,
        Date.now()
      );
    }
    return Response.json({ ok: true, record });
  }

  _getState(key) {
    const rows = this.ctx.storage.sql.exec(
      "SELECT value FROM state WHERE key = ?", key
    ).toArray();
    if (rows.length === 0) return null;
    try { return JSON.parse(rows[0].value); } catch { return rows[0].value; }
  }

  _scrubPII(text, rules) {
    if (!rules || rules.length === 0) return text;
    let result = text;
    for (const rule of rules) {
      const re = new RegExp(`\\b${rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      result = result.replace(re, rule.replacement);
    }
    return result;
  }

  async alarm(alarmInfo) {
    this._trimSoulsafeRunsToCap();
    const rows = this.ctx.storage.sql.exec(
      "SELECT id, kind, payload, ts FROM telemetry_pending ORDER BY id LIMIT 500"
    ).toArray();
    if (rows.length === 0) return;
    try {
      if (this.env.DB) {
        const stmts = rows.map((r) =>
          this.env.DB.prepare(
            "INSERT INTO telemetry (room_id, node_id, kind, payload, ts, flushed_at) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind("personal", "self", r.kind, r.payload, r.ts, Date.now())
        );
        await this.env.DB.batch(stmts);
      }
      const ids = rows.map((r) => r.id);
      this.ctx.storage.sql.exec(
        `DELETE FROM telemetry_pending WHERE id IN (${ids.map(() => "?").join(",")})`,
        ...ids
      );
      const remaining = this.ctx.storage.sql.exec(
        "SELECT COUNT(*) as c FROM telemetry_pending"
      ).toArray()[0];
      if (remaining && remaining.c > 0) {
        await this.ctx.storage.setAlarm(Date.now() + parseInt(this.env.FLUSH_INTERVAL_MS || "30000", 10));
      }
    } catch (err) {
      const retryCount = alarmInfo?.retryCount ?? 0;
      if (retryCount >= 5) {
        console.error(`[PersonalAgent] Flush exhausted retries, parking 5min: ${err.message}`);
        await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000);
        return;
      }
      throw err;
    }
  }
}

/** Browser callers: p31ca static pages, bonding, org site previews. */
function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = new Set([
    "https://p31ca.org",
    "https://www.p31ca.org",
    "https://bonding.p31ca.org",
    "https://phosphorus31.org",
    "https://www.phosphorus31.org",
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://localhost:4321",
    "http://127.0.0.1:4321",
  ]);
  if (origin.endsWith(".pages.dev")) allowed.add(origin);
  if (origin && /\.workers\.dev$/.test(new URL(origin).hostname || "")) {
    allowed.add(origin);
  }
  const allow = allowed.has(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(response, request) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request))) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Personal K₄ mesh (KV `k4s:personal:*`) — same API shape as tools/docs expect.
 */
function meshContext(request) {
  const requestId = request.headers.get("X-Request-ID") || undefined;
  return requestId ? { requestId } : {};
}

async function handlePersonalMeshApi(request, env) {
  const p = new URL(request.url).pathname;
  const method = request.method;
  const ctx = meshContext(request);

  if (p === "/api" && method === "GET") {
    return personalRouteIndex(ctx);
  }
  if (p === "/api/mesh" && method === "GET") {
    return personalMesh(env, request.url, ctx);
  }
  if (p === "/api/snapshot" && method === "GET") {
    return personalApiSnapshot(env, request.url, ctx);
  }
  if (p === "/api/health" && method === "GET") {
    return personalHealth(env, ctx);
  }
  const mVertex = p.match(/^\/api\/vertex\/([a-d])$/);
  if (mVertex && method === "GET") {
    return personalVertexGet(env, mVertex[1], ctx);
  }
  const mPres = p.match(/^\/api\/presence\/([a-d])$/);
  if (mPres && method === "POST") {
    return personalPresence(env, request, mPres[1], ctx);
  }
  const mPing = p.match(/^\/api\/ping\/([a-d])\/([a-d])$/);
  if (mPing && method === "POST") {
    return personalPing(env, request, mPing[1], mPing[2], ctx);
  }
  if (p === "/viz" && method === "GET") {
    return personalVizResponse();
  }
  return null;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    const url = new URL(request.url);
    const meshRes = await handlePersonalMeshApi(request, env);
    if (meshRes) {
      return withCors(meshRes, request);
    }
    const uHome = url.pathname.match(/^\/u\/([^/]+)\/home$/);
    if (uHome && request.method === "GET") {
      return withCors(
        new Response(buildTetraHomePage(uHome[1]), {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
          },
        }),
        request
      );
    }
    const agentMatch = url.pathname.match(/^\/agent\/([^/]+)(\/.*)?$/);
    if (agentMatch) {
      const userId = agentMatch[1];
      const subPath = agentMatch[2] || "/health";
      const id = env.PERSONAL_AGENT.idFromName(userId);
      const stub = env.PERSONAL_AGENT.get(id);
      const inner = await stub.fetch(new Request(new URL(subPath, request.url), request));
      return withCors(inner, request);
    }
    if (url.pathname === "/health") {
      return withCors(Response.json({ status: "ok", service: "k4-personal" }), request);
    }
    return withCors(new Response("k4-personal alive", { status: 200 }), request);
  },
};
