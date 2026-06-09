#!/usr/bin/env node
/**
 * Builds public/p31-fleet-entities.json — Workers (live-fleet verified + allowlist),
 * supplemental bots & sub-agents, and thin /agent/:slug/index.html stubs that
 * deep-link into /fleet-agents.html#slug.
 *
 * Alignment: derivation `live-fleet-to-fleet-entities-hub` in P31 home `p31-alignment.json`.
 *
 * Sources: public/p31-live-fleet.json (mirror P31 home p31-live-fleet.json; polish copies home → public).
 *   npm run build:fleet-entities   (run from package p31ca/)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31ca = path.join(__dirname, "..");
const publicDir = path.join(p31ca, "public");

const STUB_HTML = (slug, title, kind) =>
  `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0; url=/fleet-agents.html#${encodeURIComponent(slug)}">
<link rel="canonical" href="/fleet-agents.html#${encodeURIComponent(slug)}">
<title>${esc(title)} — ${esc(kind)} · P31 fleet agents</title>
<style>body{font-family:system-ui;background:#0f1115;color:#d8d6d0;margin:2rem;line-height:1.5}a{color:#4db8a8}</style>
</head><body><p>Open <a href="/fleet-agents.html#${encodeURIComponent(slug)}">interactive agent room · ${esc(
    title
  )}</a>.</p></body></html>`;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

/** Non-Worker personas (Discord bot, Cortex DO sub-agents). */
const SUPPLEMENT_ENTITIES = [
  {
    slug: "discord-bot",
    kind: "bot",
    title: "p31-bot",
    subtitle: "Community Command Plane · Discord slash commands + ledger",
    registryId: "discord-bot",
    hubPagePath: "/discord-bot.html",
    deployHints: ["Discord.js · Railway deploy", "KV-backed state"],
    probeUrls: [],
  },
  ...[
    ["cortex-benefits", "Benefits", "/api/agent/benefits", "Enrollment + subsidy flows"],
    ["cortex-finance", "Finance", "/api/agent/finance", "Cashflow projections + receipts"],
    ["cortex-grant", "Grant", "/api/agent/grant", "Grant timelines + dossiers"],
    ["cortex-legal", "Legal", "/api/agent/legal", "Citation-safe drafts + timelines"],
    ["cortex-content", "Content", "/api/agent/content", "Publishing + canon alignment"],
    ["cortex-kofi", "Ko-fi relay", "/api/agent/kofi", "Supporter pings + payouts"],
  ].map(([slug, label, probePath /* ignored for browser */, subtitle]) => ({
    slug,
    kind: "agent",
    title: `Cortex agent — ${label}`,
    subtitle,
    parentWorkerSlug: "p31-cortex",
    registryId: "cortex",
    hubPagePath: "/cortex.html",
    deployHints: [`Durable Object in p31-cortex`, probePath !== "/api/agent/kofi" ? `POST ${probePath}/task queues work` : "Ko-fi channel"],
    probeUrls: [],
  })),
];

function safeSlug(slug) {
  const s = String(slug || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!s || !/^[a-z][a-z0-9-]*$/.test(s)) throw new Error(`invalid slug ${JSON.stringify(slug)}`);
  return s;
}

function main() {
  const fleetPath = path.join(publicDir, "p31-live-fleet.json");
  if (!fs.existsSync(fleetPath)) throw new Error("missing public/p31-live-fleet.json");
  const fleet = JSON.parse(fs.readFileSync(fleetPath, "utf8"));

  const verified = fleet.workersVerified || [];
  const allowed = fleet.workersAllowlisted || [];

  const bySlug = new Map();

  for (const row of verified) {
    const slug = safeSlug(row.id);
    bySlug.set(slug, {
      slug,
      kind: "worker",
      title: row.id,
      subtitle: row.note || row.deploy || "",
      tier: "verified",
      workersDevUrl: row.workersDev || "",
      prodUrl: row.sameOriginOnHub || row.customDomain || "",
      healthPaths: row.healthPaths || (row.statusPath ? [row.statusPath] : []),
      meshPaths: row.meshPaths || [],
      constantsKey: row.constantsKey || null,
      deployHints: row.deploy ? [String(row.deploy)] : [],
      probeUrls: buildProbeCandidates(row),
      hubPagePath: null,
      registryId: null,
    });
  }

  for (const row of allowed) {
    const slug = safeSlug(row.id);
    if (!bySlug.has(slug)) {
      bySlug.set(slug, {
        slug,
        kind: "worker",
        title: row.id,
        subtitle: row.note || row.codePath || "",
        tier: "allowlisted",
        workersDevUrl: row.defaultWorkersDev || "",
        prodUrl: "",
        healthPaths: ["/health", "/api/health"],
        meshPaths: [],
        constantsKey: null,
        deployHints: row.codePath ? [String(row.codePath)] : [],
        probeUrls: probeFromBase(row.defaultWorkersDev),
        hubPagePath: null,
        registryId: null,
      });
    } else {
      const prev = bySlug.get(slug);
      if ((!prev.workersDevUrl || prev.workersDevUrl === "") && row.defaultWorkersDev) {
        prev.workersDevUrl = row.defaultWorkersDev;
        const vrow = verified.find((v) => v.id === slug);
        prev.probeUrls = buildProbeCandidates({ ...(vrow || {}), id: slug, workersDev: row.defaultWorkersDev });
      }
      prev.tier = "verified_allowlisted";
    }
  }

  for (const s of SUPPLEMENT_ENTITIES) {
    const slug = safeSlug(s.slug);
    if (bySlug.has(slug))
      console.warn(`build-fleet-entities: supplement slug ${slug} collides — skipping duplicate`);
    else bySlug.set(slug, { ...s, slug, tier: "supplement" });
  }

  let entities = Array.from(bySlug.values()).sort((a, b) => a.slug.localeCompare(b.slug));

  const cortex = bySlug.get("p31-cortex");
  if (cortex && cortex.probeUrls && cortex.probeUrls.length) {
    entities = entities.map((e) => {
      if (e.kind === "agent" && e.parentWorkerSlug === "p31-cortex" && !(e.probeUrls || []).length) {
        return { ...e, probeUrls: cortex.probeUrls.slice(0, 4) };
      }
      return e;
    });
  }

  const out = {
    schema: "p31.fleetEntities/1.0.0",
    updated: fleet.updated ? String(fleet.updated) : new Date().toISOString().slice(0, 10),
    sourceNotes:
      "Merged from published p31-live-fleet.json (verified + allowlisted Workers) plus static bot/cortex-agents roster. Probe GETs may be CORS-blocked from the hub origin.",
    entities,
  };

  fs.writeFileSync(path.join(publicDir, "p31-fleet-entities.json"), JSON.stringify(out, null, 2), "utf8");

  fs.rmSync(path.join(publicDir, "agent"), { recursive: true, force: true });

  /** Small HTML stubs: /agent/k4-personal/ → redirects to SPA hash URL */
  const agentRoot = path.join(publicDir, "agent");
  for (const e of entities) {
    const slugDir = path.join(agentRoot, e.slug);
    fs.mkdirSync(slugDir, { recursive: true });
    fs.writeFileSync(path.join(slugDir, "index.html"), STUB_HTML(e.slug, e.title, e.kind || "worker"), "utf8");
  }

  console.log(
    `build-fleet-entities: wrote ${path.relative(p31ca, path.join(publicDir, "p31-fleet-entities.json"))} (${entities.length} entities) + ${entities.length} agent stubs under public/agent/*/`
  );
}

/**
 * @param {any} row
 */
function buildProbeCandidates(row) {
  const urls = [];
  const base = row.workersDev;
  const paths = [...(row.healthPaths || []).filter(Boolean)];
  if (row.statusPath) paths.push(row.statusPath);
  if (!paths.length) paths.push("/api/health", "/health");

  if (row.sameOriginOnHub && typeof row.sameOriginOnHub === "string") {
    try {
      const o = new URL(row.sameOriginOnHub.replace(/\/$/, ""));
      urls.push(`${o.origin}/api/health`);
    } catch {
      /* keep */
    }
  }

  if (typeof base !== "string" || !/^https?:\/\//i.test(base)) return urls.slice(0, 8);

  const uniq = new Set(urls.filter(Boolean));
  const baseTrim = base.replace(/\/$/, "");

  for (let p of paths) {
    if (!p.startsWith("/")) p = `/${p}`;
    const u = `${baseTrim}${p}`;
    if (!uniq.has(u)) {
      uniq.add(u);
      urls.push(u);
    }
  }
  return [...uniq].slice(0, 8);
}

function probeFromBase(dev) {
  if (typeof dev !== "string" || !/^https?:\/\//i.test(dev)) return [];
  const b = dev.replace(/\/$/, "");
  return [`${b}/api/health`, `${b}/health`];
}

main();
