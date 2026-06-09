#!/usr/bin/env node
/**
 * src/data/p31-mission-trio.json → static pages with <!-- P31:mission-ebc:start --> … <!-- P31:mission-ebc:end -->.
 * Run from prebuild before verify-mission-trio.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const MARK_START = "<!-- P31:mission-ebc:start";
const MARK_END = "<!-- P31:mission-ebc:end -->";

/** @type {{ rel: string; currentKey: "build" | "create" | "connect" | null }[]} */
export const MISSION_EBC_SYNC_TARGETS = [
  { rel: "public/connect.html", currentKey: "connect" },
  { rel: "public/initial-build.html", currentKey: "build" },
  { rel: "public/mesh-start.html", currentKey: null },
  { rel: "public/delta.html", currentKey: null },
  { rel: "public/planetary-onboard.html", currentKey: null },
  { rel: "public/geodesic.html", currentKey: "create" },
  { rel: "public/demo-labs.html", currentKey: null },
  { rel: "public/k4market.html", currentKey: null },
  { rel: "public/p31-super-centaur-starter.html", currentKey: null },
  { rel: "public/tomography.html", currentKey: null },
];

/** @param {string} s */
function escAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param {string} s */
function escText(s) {
  return escAttr(s);
}

function readMissionTrio(raw) {
  if (raw.schema !== "p31.missionTrio/1.0.0") {
    throw new Error(`sync-connect-mission-ebc: bad schema ${raw.schema}`);
  }
  return raw;
}

/** @param {string} key @param {Record<string, string>} e */
function descLine(key, e) {
  if (key === "connect") {
    return `        <span class="p31-mission-trio__desc"><span class="p31-mission-trio__now">${escText(e.connectLead)}</span>${escText(e.connect)}</span>`;
  }
  return `        <span class="p31-mission-trio__desc">${escText(e[key])}</span>`;
}

/**
 * Footer markup only (no marker comments). `pillOrder` drives column order.
 * @param {Record<string, unknown>} data
 * @param {{ currentKey?: "build" | "create" | "connect" | null }} [opts]
 *   `currentKey` null = all pills are links. Default `"connect"` = mesh page (current column).
 */
export function missionEbcHtmlFromData(data, opts = {}) {
  const currentKey = opts.currentKey === undefined ? "connect" : opts.currentKey;
  const p = data.pills;
  const e = /** @type {Record<string, string>} */ (data.ebc);
  const order = data.pillOrder;
  if (!Array.isArray(order) || order.length === 0) {
    throw new Error("sync-connect-mission-ebc: pillOrder must be a non-empty array");
  }
  if (currentKey !== null && !order.includes(currentKey)) {
    throw new Error(`sync-connect-mission-ebc: currentKey ${currentKey} not in pillOrder`);
  }

  const lines = [
    `<footer id="ebc" class="p31-mission-trio p31-mission-trio--ebc" role="contentinfo" aria-label="${escAttr(data.ariaLabel)}">`,
  ];

  for (const key of order) {
    const pill = p[key];
    if (!pill) {
      throw new Error(`sync-connect-mission-ebc: pills.${key} missing`);
    }
    if (!pill.href) {
      throw new Error(`sync-connect-mission-ebc: pills.${key}.href missing`);
    }
    const isCurrent = currentKey !== null && key === currentKey;

    if (isCurrent) {
      lines.push(
        `    <div class="p31-mission-trio__link p31-mission-trio__link--${key} p31-mission-trio__link--current p31-mesh-tap" id="ebc-${key}" aria-current="page" title="${escAttr(pill.title)}">`,
      );
    } else {
      lines.push(
        `    <a class="p31-mission-trio__link p31-mission-trio__link--${key} p31-mesh-tap" id="ebc-${key}" href="${escAttr(pill.href)}" title="${escAttr(pill.title)}">`,
      );
    }
    lines.push(`        <span class="p31-mission-trio__head">`);
    lines.push(`            <span class="p31-mission-trio__dot" aria-hidden="true"></span>`);
    lines.push(`            <span class="p31-mission-trio__verb">${escText(pill.label)}</span>`);
    lines.push(`        </span>`);
    lines.push(descLine(key, e));
    lines.push(isCurrent ? `    </div>` : `    </a>`);
  }

  lines.push(`</footer>`);
  return lines.join("\n");
}

/**
 * @param {string} absPath
 * @param {ReturnType<typeof readMissionTrio>} data
 * @param {{ currentKey: "build" | "create" | "connect" | null }} opts
 */
export function syncMissionEbcFile(absPath, data, opts) {
  const html = fs.readFileSync(absPath, "utf8");
  const startIdx = html.indexOf(MARK_START);
  const endIdx = html.indexOf(MARK_END);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error(
      "sync-connect-mission-ebc:",
      absPath,
      "must contain",
      MARK_START,
      "and",
      MARK_END,
    );
    process.exit(1);
  }

  const startLineEnd = html.indexOf("-->", startIdx);
  if (startLineEnd === -1 || startLineEnd > endIdx) {
    console.error("sync-connect-mission-ebc: malformed start marker (missing -->)", absPath);
    process.exit(1);
  }
  const afterStart = startLineEnd + 3;
  const inner = html.slice(afterStart, endIdx).trim();
  const next = missionEbcHtmlFromData(data, opts);
  if (inner === next) {
    console.log("sync-connect-mission-ebc: OK (unchanged)", path.relative(root, absPath));
    return;
  }

  const out = html.slice(0, afterStart) + "\n" + next + "\n" + html.slice(endIdx);
  fs.writeFileSync(absPath, out, "utf8");
  console.log("sync-connect-mission-ebc: updated", path.relative(root, absPath));
}

export function syncAllMissionEbcPages() {
  const jsonPath = path.join(root, "src", "data", "p31-mission-trio.json");
  const data = readMissionTrio(JSON.parse(fs.readFileSync(jsonPath, "utf8")));
  for (const t of MISSION_EBC_SYNC_TARGETS) {
    syncMissionEbcFile(path.join(root, t.rel), data, { currentKey: t.currentKey });
  }
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  syncAllMissionEbcPages();
}

/** @param {string} html */
export function extractMissionEbcInnerFromConnectHtml(html) {
  const startIdx = html.indexOf(MARK_START);
  const endIdx = html.indexOf(MARK_END);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
  const startLineEnd = html.indexOf("-->", startIdx);
  if (startLineEnd === -1 || startLineEnd > endIdx) return null;
  return html.slice(startLineEnd + 3, endIdx).trim();
}
