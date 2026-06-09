#!/usr/bin/env node
/**
 * Ensures hub imports p31.missionTrio JSON and static mission EBC regions match JSON after sync.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MISSION_EBC_SYNC_TARGETS,
  extractMissionEbcInnerFromConnectHtml,
  missionEbcHtmlFromData,
} from "./sync-connect-mission-ebc.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const jsonPath = path.join(root, "src", "data", "p31-mission-trio.json");
const indexPath = path.join(root, "src", "pages", "index.astro");

const EXPECTED_PILL_ORDER = ["build", "create", "connect"];
const VERB_SET = new Set(["build", "create", "connect"]);

/** @param {unknown} data */
function assertMissionTrioShape(data) {
  if (!data || typeof data !== "object") {
    throw new Error("verify-mission-trio: invalid JSON root");
  }
  const d = /** @type {Record<string, unknown>} */ (data);
  if (d.schema !== "p31.missionTrio/1.0.0") {
    console.error("verify-mission-trio: bad schema", d.schema);
    process.exit(1);
  }
  if (typeof d.ariaLabel !== "string" || !d.ariaLabel.trim()) {
    console.error("verify-mission-trio: ariaLabel must be non-empty string");
    process.exit(1);
  }
  if (!Array.isArray(d.hubSubtitle) || d.hubSubtitle.length === 0) {
    console.error("verify-mission-trio: hubSubtitle must be non-empty array");
    process.exit(1);
  }
  for (const chunk of d.hubSubtitle) {
    if (!chunk || typeof chunk !== "object" || typeof chunk.text !== "string") {
      console.error("verify-mission-trio: hubSubtitle chunks need { text: string, verb? }");
      process.exit(1);
    }
    if ("verb" in chunk && chunk.verb != null) {
      if (!VERB_SET.has(/** @type {string} */ (chunk.verb))) {
        console.error("verify-mission-trio: hubSubtitle verb must be build|create|connect");
        process.exit(1);
      }
    }
  }
  if (!d.pills || typeof d.pills !== "object") {
    console.error("verify-mission-trio: pills object required");
    process.exit(1);
  }
  const pills = /** @type {Record<string, { href?: string; label?: string; title?: string }>} */ (
    d.pills
  );
  for (const k of EXPECTED_PILL_ORDER) {
    const pill = pills[k];
    if (!pill || typeof pill.href !== "string" || !pill.href.startsWith("/")) {
      console.error(`verify-mission-trio: pills.${k} needs href starting with /`);
      process.exit(1);
    }
    if (typeof pill.label !== "string" || !pill.label.trim()) {
      console.error(`verify-mission-trio: pills.${k}.label required`);
      process.exit(1);
    }
    if (typeof pill.title !== "string" || !pill.title.trim()) {
      console.error(`verify-mission-trio: pills.${k}.title required`);
      process.exit(1);
    }
  }
  if (!Array.isArray(d.pillOrder)) {
    console.error("verify-mission-trio: pillOrder must be an array");
    process.exit(1);
  }
  if (JSON.stringify(d.pillOrder) !== JSON.stringify(EXPECTED_PILL_ORDER)) {
    console.error(
      "verify-mission-trio: pillOrder must be",
      EXPECTED_PILL_ORDER.join(", "),
      "got",
      d.pillOrder,
    );
    process.exit(1);
  }
  if (!d.ebc || typeof d.ebc !== "object") {
    console.error("verify-mission-trio: ebc object required");
    process.exit(1);
  }
  const ebc = /** @type {Record<string, unknown>} */ (d.ebc);
  for (const k of ["build", "create", "connectLead", "connect"]) {
    if (typeof ebc[k] !== "string") {
      console.error(`verify-mission-trio: ebc.${k} must be string`);
      process.exit(1);
    }
  }
}

const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
try {
  assertMissionTrioShape(raw);
} catch (e) {
  console.error(String(e));
  process.exit(1);
}
const data = raw;

const indexSrc = fs.readFileSync(indexPath, "utf8");
if (!indexSrc.includes("p31-mission-trio.json")) {
  console.error("verify-mission-trio: index.astro must import p31-mission-trio.json");
  process.exit(1);
}
if (!indexSrc.includes("missionTrio.pillOrder")) {
  console.error("verify-mission-trio: index.astro must render mission rail via missionTrio.pillOrder");
  process.exit(1);
}

for (const t of MISSION_EBC_SYNC_TARGETS) {
  const pagePath = path.join(root, t.rel);
  const pageHtml = fs.readFileSync(pagePath, "utf8");
  if (!pageHtml.includes("p31-mission-trio--ebc")) {
    console.error(`verify-mission-trio: ${t.rel} must use .p31-mission-trio--ebc`);
    process.exit(1);
  }
  const inner = extractMissionEbcInnerFromConnectHtml(pageHtml);
  let expected;
  try {
    expected = missionEbcHtmlFromData(data, { currentKey: t.currentKey });
  } catch (e) {
    console.error(`verify-mission-trio (${t.rel}):`, String(e));
    process.exit(1);
  }
  if (inner == null) {
    console.error(
      `verify-mission-trio: ${t.rel} missing P31:mission-ebc markers; run node scripts/sync-connect-mission-ebc.mjs`,
    );
    process.exit(1);
  }
  if (inner !== expected) {
    console.error(
      `verify-mission-trio: ${t.rel} EBC HTML does not match p31-mission-trio.json. Run: node scripts/sync-connect-mission-ebc.mjs`,
    );
    process.exit(1);
  }
}

const cssPath = path.join(root, "public", "p31-style.css");
const css = fs.readFileSync(cssPath, "utf8");
if (!css.includes(".p31-mission-trio--ebc")) {
  console.error("verify-mission-trio: run npm run apply:p31-style — mission CSS missing from p31-style.css");
  process.exit(1);
}

console.log("verify-mission-trio: OK");
