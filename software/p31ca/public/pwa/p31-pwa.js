/* P31 PWA drop-in: registers the local service worker + surfaces a
   non-intrusive install button when the browser fires beforeinstallprompt.
   Source of truth: pwa/p31-pwa.js. Mirrored to each PWA-installable surface
   by scripts/build-pwa.mjs. Verified by scripts/verify-pwa.mjs.

   Add to a surface with one line in <head>:
     <script src="./p31-pwa.js" defer></script>
   (paired with a <link rel="manifest" ...> and a theme-color meta).

   Behavior is operator-summoned only. The install button appears in the
   bottom-right corner with low opacity; tap-and-hold to dismiss for the
   session. No telemetry. No analytics. P31 Labs · CC-BY 4.0.
*/
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  if (window.__P31_PWA_LOADED__) return;
  window.__P31_PWA_LOADED__ = true;

  /* Register the SW from the same directory this script lives in. */
  const here = new URL(document.currentScript ? document.currentScript.src : "./", document.baseURI);
  const swUrl = new URL("./sw.js", here).href;
  const scope = here.pathname.replace(/[^/]*$/, "");

  navigator.serviceWorker
    .register(swUrl, { scope })
    .catch(() => { /* fail silently — PWA is opt-in for the user, not required */ });

  /* Install prompt — defer until the browser hands us the event. */
  let deferred = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    showBadge();
  });

  /* Quietly remove the badge after install. */
  window.addEventListener("appinstalled", () => {
    deferred = null;
    const el = document.getElementById("p31-pwa-install");
    if (el) el.remove();
  });

  function showBadge() {
    if (document.getElementById("p31-pwa-install")) return;
    if (sessionStorage.getItem("p31-pwa-dismissed") === "1") return;

    /* Wrap a small relative-positioned container so the X dismiss can sit
       inside the button's bounding box without overlapping the install
       label. The X is the PRIMARY accommodation (any age, any device);
       long-press / right-click are SECONDARY power-user shortcuts.
       Per peer review (Opus 4.6, 2026-05-02): a non-obvious gesture
       like long-press is fine as a shortcut but cannot be the only way
       out, especially on surfaces a child (W.J., S.J.) might use. */
    const wrap = document.createElement("div");
    wrap.id = "p31-pwa-install";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Install this P31 surface to your home screen");
    Object.assign(wrap.style, {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      zIndex: "9999",
      display: "inline-flex",
      alignItems: "stretch",
      background: "rgba(15, 17, 21, 0.92)",
      color: "#5DCAA5",
      border: "1px solid rgba(37, 137, 125, 0.4)",
      borderRadius: "8px",
      font: "600 12px/1 ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
      letterSpacing: "0.06em",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
      opacity: "0.85",
      transition: "opacity 0.2s ease, border-color 0.2s ease",
      overflow: "hidden",
    });
    wrap.onmouseenter = () => { wrap.style.opacity = "1"; };
    wrap.onmouseleave = () => { wrap.style.opacity = "0.85"; };

    /* PRIMARY action — install button (taps the deferred prompt). */
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = "Install \u00b7 adds this page to your home screen for offline access";
    btn.innerHTML = "<span aria-hidden=\"true\" style=\"font-size:14px;line-height:1\">\u25cd</span>\u00a0install";
    Object.assign(btn.style, {
      padding: "8px 12px 8px 14px",
      background: "transparent",
      color: "inherit",
      border: "0",
      borderRight: "1px solid rgba(37, 137, 125, 0.25)",
      cursor: "pointer",
      font: "inherit",
    });
    btn.onclick = async () => {
      if (!deferred) { wrap.remove(); return; }
      try {
        deferred.prompt();
        await deferred.userChoice;
      } finally {
        deferred = null;
        wrap.remove();
      }
    };

    /* PRIMARY dismiss \u2014 visible X. Discoverable by any user, any device. */
    const x = document.createElement("button");
    x.type = "button";
    x.setAttribute("aria-label", "Dismiss the install prompt for this session");
    x.title = "Dismiss for this session";
    x.textContent = "\u00d7";
    Object.assign(x.style, {
      width: "26px",
      padding: "0 6px",
      background: "transparent",
      color: "rgba(216, 214, 208, 0.6)",
      border: "0",
      cursor: "pointer",
      font: "600 16px/1 ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
      transition: "color 0.15s ease",
    });
    x.onmouseenter = () => { x.style.color = "rgba(216, 214, 208, 1)"; };
    x.onmouseleave = () => { x.style.color = "rgba(216, 214, 208, 0.6)"; };
    x.onclick = (e) => { e.stopPropagation(); dismiss(); };

    /* SECONDARY dismiss \u2014 long-press / right-click. Power-user shortcut. */
    let pressTimer = null;
    wrap.addEventListener("contextmenu", (e) => { e.preventDefault(); dismiss(); });
    wrap.addEventListener("touchstart", () => {
      pressTimer = setTimeout(dismiss, 700);
    });
    wrap.addEventListener("touchend", () => { if (pressTimer) clearTimeout(pressTimer); });

    function dismiss() {
      sessionStorage.setItem("p31-pwa-dismissed", "1");
      wrap.remove();
    }

    wrap.appendChild(btn);
    wrap.appendChild(x);
    document.body.appendChild(wrap);
  }
})();
