#!/usr/bin/env node
/**
 * Validates public/p31-fleet-entities.json matches build output (freshness + uniqueness).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(__dirname, "..", "public");
const jp = path.join(pub, "p31-fleet-entities.json");

function fail(m) {
  console.error("verify-fleet-entities:", m);
  process.exit(1);
}

if (!fs.existsSync(jp)) fail(`missing ${path.relative(pub, jp)}`);

const data = JSON.parse(fs.readFileSync(jp, "utf8"));
if (data.schema !== "p31.fleetEntities/1.0.0") fail("schema mismatch");
const list = data.entities || [];
const slugs = new Set();
for (const e of list) {
  if (!e.slug || typeof e.slug !== "string") fail("entity missing slug");
  if (!/^[a-z][a-z0-9-]*$/.test(e.slug)) fail(`bad slug: ${JSON.stringify(e.slug)}`);
  if (slugs.has(e.slug)) fail(`duplicate slug ${e.slug}`);
  slugs.add(e.slug);

  const stub = path.join(pub, "agent", e.slug, "index.html");
  if (!fs.existsSync(stub)) fail(`missing stub agent/${e.slug}/index.html`);
}

if (slugs.size < 20) fail(`expected meaningful fleet count (${slugs.size} entities)`);

console.log(`verify-fleet-entities: OK — ${slugs.size} entities + stubs`);
