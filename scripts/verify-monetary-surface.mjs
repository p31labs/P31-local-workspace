#!/usr/bin/env node
/**
 * CWP-P31-MAP-2026-01 (D-MAP-11) — static checks for the monetary pipeline:
 * - donate-api wrangler name
 * - donate page: publishable key only, API URL, no Stripe secret material in public trees
 * @see 04_SOFTWARE/docs/CONTROLLED-WORK-PACKAGE-MONETARY-PIPELINE.md
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const errors = [];

function err(msg) {
  errors.push(msg);
}

function read(p) {
  return readFileSync(join(ROOT, p), "utf8");
}

// --- 1) donate-api worker name ---
const wToml = "04_SOFTWARE/donate-api/wrangler.toml";
if (!existsSync(join(ROOT, wToml))) {
  err(`missing ${wToml}`);
} else {
  const t = read(wToml);
  if (!/^name\s*=\s*"donate-api"/m.test(t)) {
    err(`${wToml}: must declare name = "donate-api"`);
  }
  if (!/main\s*=\s*"src\/worker\.ts"/.test(t)) {
    err(`${wToml}: must point main to src/worker.ts`);
  }
  if (!t.includes("donate-api.phosphorus31.org") || !t.includes("donate-api.trimtab-signal.workers.dev")) {
    err(
      `${wToml}: comments must document custom domain donate-api.phosphorus31.org and workers.dev donate-api.trimtab-signal.workers.dev (fleet truth)`
    );
  }
}

// --- 1c) p31ca public surface lists donate-api hosts (machine index) ---
const pubSurface = "04_SOFTWARE/p31ca/public/p31-public-surface.json";
if (existsSync(join(ROOT, pubSurface))) {
  const s = read(pubSurface);
  if (!s.includes("donate-api.phosphorus31.org") || !s.includes("donate-api.trimtab-signal.workers.dev")) {
    err(
      `${pubSurface}: donateApi block must include custom domain + workers.dev (keep in sync with p31-constants payment.*)`
    );
  }
}

// --- 1b) p31ca donate.html — primary MAP surface (Stripe Payment Link; no Stripe.js)
const donateHtmlPrimary = "04_SOFTWARE/p31ca/public/donate.html";
if (existsSync(join(ROOT, donateHtmlPrimary))) {
  const dh = read(donateHtmlPrimary);
  const PAYMENT_LINK = "https://buy.stripe.com/5kQ14g827gmpcHFb0W8Ra00";
  if (!dh.includes(PAYMENT_LINK)) {
    err(`${donateHtmlPrimary}: must embed canonical Stripe Payment Link (MAP primary hub)`);
  }
  if (!dh.includes("client_reference_id")) {
    err(`${donateHtmlPrimary}: must bind MAP via client_reference_id query when subject id is valid`);
  }
  if (!dh.includes("github.com/sponsors/p31labs")) {
    err(`${donateHtmlPrimary}: must link GitHub Sponsors (canonical recurring path)`);
  }
  if (!dh.includes('id="stripe-link"')) {
    err(`${donateHtmlPrimary}: primary Stripe MAP anchor must use id stripe-link`);
  }
  if (!dh.includes('SUBJECT_BINDING:')) {
    err(`${donateHtmlPrimary}: telemetry must expose SUBJECT_BINDING line`);
  }
  if (dh.includes("js.stripe.com") || /\bredirectToCheckout\b/.test(dh)) {
    err(`${donateHtmlPrimary}: primary MAP hub must not load Stripe.js or redirectToCheckout (static Payment Link only)`);
  }
  if (!(dh.includes("^u_[0-9a-f]{32}$") && dh.includes("guest_[0-9a-f]{20}"))) {
    err(`${donateHtmlPrimary}: must validate p31_subject_id with u_/guest_ derivation regex`);
  }
}

// --- 1d) donate-api worker: MAP-required routes (static read; no network) ---
const workerTs = "04_SOFTWARE/donate-api/src/worker.ts";
if (existsSync(join(ROOT, workerTs))) {
  const w = read(workerTs);
  if (!w.includes("'/health'") && !w.includes('"/health"')) {
    err(`${workerTs}: must define GET /health (MAP liveness; see payment.donateApiHealthUrl)`);
  }
  if (!w.includes("'/create-checkout'") && !w.includes('"/create-checkout"')) {
    err(`${workerTs}: must define POST /create-checkout`);
  }
  if (!w.includes("metadata[p31_subject_id]")) {
    err(`${workerTs}: POST /create-checkout must attach Stripe metadata[p31_subject_id] when subject-bound (MAP Track C)`);
  }
  if (!w.includes("api.stripe.com")) {
    err(`${workerTs}: expected Stripe API call (api.stripe.com) for Checkout Sessions`);
  }
}

// --- 2) Phosphorus donate page contract ---
const donateAstro = "phosphorus31.org/planetary-planet/src/pages/donate.astro";
if (existsSync(join(ROOT, donateAstro))) {
  const a = read(donateAstro);
  if (!a.includes("https://donate-api.phosphorus31.org")) {
    err(`${donateAstro}: must use https://donate-api.phosphorus31.org (create-checkout base; MAP)`);
  }
  if (!a.includes("create-checkout")) {
    err(`${donateAstro}: must call create-checkout on donate-api`);
  }
  if (/\b(sk_live_|sk_test_)[A-Za-z0-9]+/.test(a)) {
    err(`${donateAstro}: must not contain Stripe secret keys (sk_*) in source`);
  }
  if (!/pk_live_|pk_test_/.test(a)) {
    err(`${donateAstro}: expected publishable Stripe key (pk_*) for Checkout`);
  }
}

// --- 3) No Stripe secret keys in public marketing / static trees (best-effort) ---
const scanDirs = [
  "phosphorus31.org/planetary-planet/src",
  "phosphorus31.org/planetary-planet/public",
  "04_SOFTWARE/p31ca/public",
  "04_SOFTWARE/p31ca/src",
];

const secretRe = /\b(sk_live_|sk_test_|rk_live_|rk_test_)[A-Za-z0-9_]+/g;

function walkScan(dir, relBase) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".turbo") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      walkScan(p, relBase);
    } else if (/\.(astro|html|js|ts|jsx|tsx|mjs|css|md|json)$/i.test(name)) {
      const text = readFileSync(p, "utf8");
      if (secretRe.test(text)) {
        const rel = relative(ROOT, p);
        err(`${rel}: possible Stripe/secret key material (sk_*/rk_*) — use publishable keys or env only`);
        secretRe.lastIndex = 0;
      }
    }
  }
}

for (const d of scanDirs) {
  walkScan(join(ROOT, d), d);
}

// --- 4) Optional: P31 home p31-constants.json (nested clone: .../p31/andromeda + .../p31/p31-constants.json) ---
const homeConstantsPath = join(ROOT, "..", "p31-constants.json");
if (existsSync(homeConstantsPath)) {
  try {
    const raw = readFileSync(homeConstantsPath, "utf8");
    const c = JSON.parse(raw);
    const pay = c.payment;
    if (pay && typeof pay === "object") {
      const wantDonate = "https://donate-api.phosphorus31.org/health";
      if (pay.donateApiHealthUrl && String(pay.donateApiHealthUrl) !== wantDonate) {
        err(
          `parent p31-constants.json: payment.donateApiHealthUrl must be ${wantDonate} for MAP (got ${String(pay.donateApiHealthUrl)})`
        );
      }
      const wantWd = "https://donate-api.trimtab-signal.workers.dev";
      if (
        pay.donateApiWorkersDevUrl &&
        String(pay.donateApiWorkersDevUrl).replace(/\/$/, "") !== wantWd
      ) {
        err(
          `parent p31-constants.json: payment.donateApiWorkersDevUrl must be ${wantWd} (got ${String(pay.donateApiWorkersDevUrl)})`
        );
      }
      const host = pay.stripeWorkerHost;
      const stripeH = pay.stripeApiHealthUrl;
      if (host && stripeH) {
        const expect = "https://" + String(host).replace(/\/$/, "") + "/health";
        const got = String(stripeH).replace(/\/$/, "");
        if (expect !== got) {
          err(
            `parent p31-constants.json: payment.stripeApiHealthUrl must be ${expect} (got ${got}) — align with payment.stripeWorkerHost`
          );
        }
      }
    }
  } catch (e) {
    err("parent p31-constants.json: " + (e && e.message ? e.message : e));
  }
}

if (errors.length) {
  console.error("verify-monetary-surface: FAILED\n");
  for (const e of errors) console.error("  -", e);
  process.exit(1);
}

console.log("verify-monetary-surface: OK (MAP pipeline static checks)");
