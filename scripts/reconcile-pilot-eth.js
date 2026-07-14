#!/usr/bin/env node
// reconcile-pilot-eth.js — CWP-2026-027 C-0
//
// pilot_registry was backfilled from love_chain with STANDARD did:key:6Mk…
// (base58btc multibase), but identity_registry uses the custom P31 encoding
// did:key:z…  ( base64url(standardBase64(rawPub)) ). A naive JOIN ON did
// therefore never matches, so mints/attribution break.
//
// This script reconciles by the RAW 32-byte Ed25519 public key:
//   - identity.ed25519_pub  → atob(standardBase64) → raw
//   - pilot.did              → base58btc multibase (strip 0xed01) OR custom
//                              did:key:z base64url → raw
// and backfills pilot_registry.eth_address.
//
// DEFAULT = --dry-run (read-only: reports match counts, writes nothing).
// Pass --apply to ALTER + UPDATE the shared LOVE_DB. THIS MUTATES LIVE DATA.

import { execSync } from "child_process";

const APPLY = process.argv.includes("--apply");
const REMOTE = process.argv.includes("--remote") || APPLY;
// NOTE: `wrangler d1 execute love-ledger` (by NAME) resolves to a *different*
// empty database in this account. The real shared LOVE_DB is pinned by id in
// the love-ledger wrangler.toml. Always target it explicitly.
const DB = "592e3e2e-3203-4e0a-8342-9e85215ec8a6";

function query(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  const remoteFlag = REMOTE ? " --remote" : "";
  const out = execSync(
    `npx wrangler d1 execute ${DB}${remoteFlag} --command "${escaped}" --json`,
    { encoding: "utf8", cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] },
  );
  try {
    const parsed = JSON.parse(out);
    return parsed[0]?.results || [];
  } catch {
    return [];
  }
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const B58MAP = {};
B58.split("").forEach((c, i) => (B58MAP[c] = i));

function base58Decode(str) {
  let bytes = [0];
  for (const c of str) {
    if (!(c in B58MAP)) throw new Error("bad base58 char");
    let carry = B58MAP[c];
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let k = 0; k < str.length && str[k] === "1"; k++) bytes.unshift(0);
  return new Uint8Array(bytes.reverse());
}

function atobBytes(b64) {
  const bin = atob(b64);
  return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
}

function b64urlToBytes(s) {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return atobBytes(b64);
}

// Custom P31 encoding: ed25519_pub / did suffix = base64url(standardBase64(rawPub)).
// Decode → standardBase64 text → raw 32-byte pubkey.
function b64urlToRaw(b64u) {
  return atobBytes(
    b64u.replace(/-/g, "+").replace(/_/g, "/"),
  );
}

// Decode ANY P31 did:key variant to the raw 32-byte Ed25519 public key:
//   - standard:  did:key:z6Mk…  (multibase 'z' + base58btc of 0xed01||pub)
//   - bare:      did:key:6Mk…   (base58btc of 0xed01||pub, no multibase prefix)
//   - custom P31: did:key:z<b64url(rawPub)>  (NOT z6Mk)
function didToRawPub(did) {
  if (!did || !did.startsWith("did:key:")) return null;
  const body = did.slice("did:key:".length);

  // standard did:key (Ed25519) — multibase 'z' prefix + base58btc(0xed01||pub)
  if (body.startsWith("z6Mk")) {
    const bytes = base58Decode(body.slice(1));
    if (bytes.length >= 34 && bytes[0] === 0xed && bytes[1] === 0x01) {
      return bytes.slice(2);
    }
    return bytes;
  }
  // bare base58btc (no multibase prefix) — base58btc(0xed01||pub)
  if (body.startsWith("6Mk")) {
    const bytes = base58Decode(body);
    if (bytes.length >= 34 && bytes[0] === 0xed && bytes[1] === 0x01) {
      return bytes.slice(2);
    }
    return bytes;
  }
  // custom P31 did:key:z<b64url(rawPub)>
  if (body.startsWith("z")) {
    try { return b64urlToRaw(body.slice(1)); } catch {}
  }
  // last resort: try base58btc
  try {
    const bytes = base58Decode(body);
    if (bytes.length >= 34 && bytes[0] === 0xed && bytes[1] === 0x01) {
      return bytes.slice(2);
    }
    return bytes;
  } catch {
    return null;
  }
}

const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

console.log(`=== P31 Pilot ↔ Identity eth_address reconciliation ===`);
console.log(`mode: ${APPLY ? "APPLY (live mutation)" : "DRY-RUN (read-only)"}\n`);

// 1. column check
const cols = query("PRAGMA table_info(pilot_registry)");
const hasEth = cols.some((c) => c.name === "eth_address");
console.log(`pilot_registry.eth_address column exists: ${hasEth}`);

// 2. load data
const identities = query(
  "SELECT did, ed25519_pub, eth_address FROM identity_registry",
);
const pilots = query(
  "SELECT did, family_name, status FROM pilot_registry",
);
console.log(`identity_registry rows: ${identities.length}`);
console.log(`pilot_registry rows: ${pilots.length}\n`);

// 3. build raw-pubkey → eth_address map from identities
const byKey = new Map();
let identDecoded = 0;
for (const r of identities) {
  let raw = null;
  if (r.ed25519_pub) {
    try { raw = b64urlToRaw(r.ed25519_pub); } catch {}
    if (!raw) { try { raw = atobBytes(r.ed25519_pub); } catch {} }
  }
  if (!raw && r.did) {
    try { raw = didToRawPub(r.did); } catch {}
  }
  if (raw && r.eth_address && /^0x[0-9a-fA-F]{40}$/.test(r.eth_address)) {
    byKey.set(hex(raw), r.eth_address);
    identDecoded++;
  }
}
console.log(`identities with decodable raw pubkey + eth_address: ${identDecoded}\n`);

// 4. match pilots
let matched = 0;
let already = 0;
let unmatched = 0;
const updates = [];
const samples = [];
for (const p of pilots) {
  let raw = null;
  try { raw = didToRawPub(p.did); } catch {}
  if (!raw) { unmatched++; continue; }
  const eth = byKey.get(hex(raw));
  if (eth) {
    matched++;
    if (samples.length < 5) {
      samples.push({ family: p.family_name, did: p.did, eth_address: eth });
    }
    updates.push({ did: p.did, eth_address: eth });
  } else {
    unmatched++;
  }
}
console.log(`pilots matched to an identity eth_address: ${matched}`);
console.log(`pilots with NO matching identity:        ${unmatched}`);
console.log(`sample matches:`);
for (const s of samples) {
  console.log(`  ${s.family}\n    did: ${s.did}\n    eth: ${s.eth_address}`);
}

// 5. apply
if (!APPLY) {
  console.log(
    `\nDRY-RUN complete. Re-run with --apply to ALTER + backfill ${matched} row(s).`,
  );
  process.exit(0);
}

if (!hasEth) {
  query("ALTER TABLE pilot_registry ADD COLUMN eth_address TEXT");
  console.log("\nALTER TABLE pilot_registry ADD COLUMN eth_address TEXT — done");
}

let done = 0;
for (const u of updates) {
  const didEsc = u.did.replace(/"/g, '""');
  const res = query(
    `UPDATE pilot_registry SET eth_address = "${u.eth_address}" WHERE did = "${didEsc}"`,
  );
  done++;
}
console.log(`UPDATE pilot_registry — ${done} row(s) written.`);
