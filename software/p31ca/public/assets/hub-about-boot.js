/**
 * ABOUT pages: hub nav polish + live fleet/worker strip from command-center API.
 */
const STATUS_API = "https://command-center.trimtab-signal.workers.dev/api/status";
const TIMEOUT_MS = 6000;

function ensureAmbient() {
  if (document.querySelector(".hub-about-ambient")) return;
  const el = document.createElement("div");
  el.className = "hub-about-ambient";
  el.setAttribute("aria-hidden", "true");
  document.body.insertBefore(el, document.body.firstChild);
}

function replaceNavLogo() {
  const brand = document.querySelector(".nav-brand");
  if (!brand || brand.querySelector(".hub-brand-mark")) return;
  const svg = brand.querySelector("svg");
  if (svg) {
    const mark = document.createElement("span");
    mark.className = "hub-brand-mark";
    mark.setAttribute("aria-hidden", "true");
    svg.replaceWith(mark);
  }
}

function injectNavExtras() {
  const links = document.querySelector(".nav-links");
  if (!links || links.querySelector("[data-hub-injected]")) return;
  const portal = document.createElement("a");
  portal.href = "https://phosphorus31.org";
  portal.className = "nav-link";
  portal.target = "_blank";
  portal.rel = "noopener noreferrer";
  portal.setAttribute("data-hub-injected", "");
  portal.textContent = "Portal";
  const donate = document.createElement("a");
  donate.href = "https://phosphorus31.org/donate";
  donate.className = "hub-btn-donate";
  donate.target = "_blank";
  donate.rel = "noopener noreferrer";
  donate.setAttribute("data-hub-injected", "");
  donate.textContent = "Donate";
  const hubLink =
    links.querySelector('a[href="index.html"]') ||
    links.querySelector("a.nav-link[href^='https://p31ca.org']");
  if (hubLink && hubLink.nextSibling) {
    hubLink.after(portal);
    portal.after(donate);
  } else {
    links.prepend(portal);
    portal.after(donate);
  }
}

function ensureFleetMount() {
  const nav = document.querySelector("nav.nav");
  if (!nav || document.getElementById("about-fleet-wrap")) return;
  const sec = document.createElement("section");
  sec.className = "about-fleet-wrap";
  sec.id = "about-fleet-wrap";
  sec.innerHTML = `
    <div class="about-fleet-inner">
      <div class="about-fleet-head">
        <div class="about-fleet-title-wrap">
          <span class="about-fleet-dot" id="about-fleet-indicator"></span>
          <span class="about-fleet-title">Fleet status</span>
        </div>
        <span class="about-fleet-ts" id="about-fleet-ts">Checking…</span>
      </div>
      <div class="about-fleet-grid" id="about-fleet-grid"></div>
    </div>`;
  nav.after(sec);
}

function setIndicator(el, ok, partial) {
  if (!el) return;
  el.className = "about-fleet-dot" + (partial ? " warn" : ok ? " ok" : "");
}

function workerUp(w) {
  const s = (w.status || "").toLowerCase();
  return s === "up" || s === "ok" || s === "online";
}

async function loadFleet() {
  const grid = document.getElementById("about-fleet-grid");
  const ts = document.getElementById("about-fleet-ts");
  const indicator = document.getElementById("about-fleet-indicator");
  if (!grid) return;

  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(STATUS_API, { signal: ac.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const workers = Array.isArray(data.workers) ? data.workers : [];
    grid.innerHTML = "";

    let up = 0;
    workers.forEach((w) => {
      const ok = workerUp(w);
      if (ok) up++;
      const a = document.createElement("a");
      a.className = "about-fleet-chip";
      a.href = w.url || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `<div class="about-fleet-chip-name">${escapeHtml(w.name || "—")}</div><div class="about-fleet-chip-dot ${ok ? "up" : "down"}"></div>`;
      grid.appendChild(a);
    });

    const allUp = workers.length > 0 && up === workers.length;
    const someUp = up > 0;
    setIndicator(indicator, allUp, !allUp && someUp);
    if (ts) {
      ts.textContent = `Last checked: ${new Date().toLocaleTimeString()}`;
    }
  } catch {
    if (ts) ts.textContent = "Fleet status unavailable";
    setIndicator(indicator, false, false);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function boot() {
  if (!document.body.classList.contains("hub-about-page")) return;
  ensureAmbient();
  replaceNavLogo();
  injectNavExtras();
  ensureFleetMount();
  loadFleet();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
