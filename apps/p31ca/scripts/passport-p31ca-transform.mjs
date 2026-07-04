/**
 * Single source of truth for root → p31ca passport mirror transform.
 * Home `scripts/passport-p31ca-transform.mjs` re-exports from here.
 * Alignment: p31-alignment.json "passport-to-p31ca-mirror" + verify:passport
 */

export const HEADER_SOURCE = `      <p class="sub">
        Answer questions once; export a short summary when you need someone else to understand how your brain works. Free. No login. Stays in your browser.
      </p>
      <p class="sub-muted">
        If this tool uses AI to tidy wording or layout, it is organizing what <em>you</em> enter—not writing your history for you. Change anything that does not sound like you.
      </p>`;

export const HEADER_P31CA = `      <p class="sub">
        Answer questions once; export a short summary when you need someone else to understand how your brain works. Free. No login. Stays in your browser.
      </p>
      <p class="sub-muted">
        If this tool uses AI to tidy wording or layout, it is organizing what <em>you</em> enter—not writing your history for you. Change anything that does not sound like you.
      </p>`;

export const FOOTER_SOURCE = `    <footer>
      Built by P31 Labs — Georgia nonprofit. Free. Open source. No tracking. No ads.
      · <a href="https://github.com/p31labs/bonding-soup" target="_blank" rel="noopener noreferrer">Source code</a>
      · <a href="https://ko-fi.com/trimtab69420" target="_blank" rel="noopener noreferrer">Ko-fi</a>
      · <a href="../soup.html">C.A.R.S.</a>
      · <a href="../p31-sovereign-lab.html">Sovereign Lab</a>
      · <a href="../demos/index.html">Visual demos</a>
      · <a href="../glass-box.html">Glass box</a>
      · <a href="../andromeda/04_SOFTWARE/p31ca/public/vibe.html" title="Vibcoding (preview) — operator entry · CWP-P31-VIBE-2026-06">Vibcoding (preview)</a>
      · <a href="../docs/operator/BOOT-UP-AND-USE.md" title="Boot up & use — operator loop in 6 moves">Boot up</a>
      · <a href="../docs/P31-DEPLOY-CANON.md" title="npm run connection">CONNECTION</a>
      · Full human document: <a href="../P31%20COGNITIVE%20PASSPORT%20%E2%80%94%20v5.md">P31 Cognitive Passport v5</a> (not required for export).
    </footer>`;

export const FOOTER_P31CA = `    <footer>
      Built by P31 Labs — Georgia nonprofit. Free. Open source. No tracking. No ads.
      · <a href="https://github.com/p31labs/bonding-soup" target="_blank" rel="noopener noreferrer">Source code</a>
      · <a href="https://ko-fi.com/trimtab69420" target="_blank" rel="noopener noreferrer">Ko-fi</a>
      · <a href="https://bonding.p31ca.org/soup" target="_blank" rel="noopener noreferrer">C.A.R.S.</a>
      · <a href="https://p31ca.org/lab">Sovereign Lab</a>
      · <a href="https://p31ca.org/visuals">Visual demos</a>
      · <a href="https://p31ca.org/glass-box">Glass box</a>
      · <a href="/vibe" title="Vibcoding (preview) — operator entry · CWP-P31-VIBE-2026-06">Vibcoding (preview)</a>
      · <a href="https://github.com/p31labs/bonding-soup/blob/main/docs/operator/BOOT-UP-AND-USE.md" target="_blank" rel="noopener noreferrer" title="Boot up & use — operator loop in 6 moves">Boot up</a>
      · <a href="https://github.com/p31labs/bonding-soup/blob/main/docs/P31-DEPLOY-CANON.md" target="_blank" rel="noopener noreferrer" title="npm run connection">CONNECTION</a>
      · Full human document: <code>P31 COGNITIVE PASSPORT — v5.md</code> in the repo (not required for export).
    </footer>`;

/** Home demo uses bonding assets one level up; hub mirror serves from public/ roots. */
export const SOURCE_WEB_APP_ICONS = `  <link rel="manifest" href="../p31-bonding.webmanifest" crossorigin="anonymous" />
  <link rel="apple-touch-icon" href="../p31-bonding-icons/apple-touch-180.png" sizes="180x180" />`;

export const P31CA_WEB_APP_ICONS = `  <link rel="manifest" href="/p31-mesh.webmanifest" crossorigin="anonymous" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />`;

/** Home demo serves starfield main CSS under /design-assets/starfield/; hub mirrors it as /lib/p31-starfield.css. */
export const STARFIELD_MAIN_CSS_HREF_SOURCE = 'href="/design-assets/starfield/p31-starfield.css"';
export const STARFIELD_MAIN_CSS_HREF_P31CA = 'href="/lib/p31-starfield.css"';

/** Home demo links QMU tokens under /public/lib/; hub serves them from /lib/. */
export const QMU_TOKENS_HREF_SOURCE = 'href="/public/lib/p31-qmu-tokens.css"';
export const QMU_TOKENS_HREF_P31CA  = 'href="/lib/p31-qmu-tokens.css"';

/** Comment in source references the public/lib path; strip /public/ for hub mirror. */
export const COGPASS_READER_COMMENT_SOURCE = 'andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-reader.mjs';
export const COGPASS_READER_COMMENT_P31CA  = 'andromeda/04_SOFTWARE/p31ca/lib/p31-cogpass-reader.mjs';

/** Playfair Display is off-canon; replace with canon serif stack. */
export const PLAYFAIR_SOURCE = '"Playfair Display", Georgia, "Times New Roman", serif';
export const PLAYFAIR_P31CA  = 'Georgia, "Times New Roman", serif';

/**
 * Source body opening + skip link anchor — chrome is injected between body tag and skip link.
 * If this anchor changes in the source, update both SOURCE_BODY_ANCHOR and P31CA_BODY_WITH_CHROME.
 */
export const SOURCE_BODY_ANCHOR = `<body class="p31-mesh-m-first p31-responsive-surface p31-has-return-ribbon">
  <a class="cp-skip skip-link p31-doc-skip" href="#fill">Skip to passport form</a>`;

export const P31CA_BODY_WITH_CHROME = `<body class="p31-mesh-m-first p31-responsive-surface p31-has-return-ribbon">
<div class="ambient-radial-fixed" aria-hidden="true"></div>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-brand" title="P31 Labs hub">
      <span class="nav-mark" aria-hidden="true">P31</span>
      <span class="nav-brand-label">P31 Labs</span>
    </a>
    <div class="nav-links">
      <span class="nav-prompt" aria-hidden="true">..</span>
      <a href="/" class="nav-link">Hub</a>
      <a href="https://github.com/p31labs/andromeda" target="_blank" rel="noopener" class="nav-link">GitHub</a>
      <a href="/connect.html" class="nav-link">Connect</a>
    </div>
  </div>
</nav>

    <canvas id="p31-star-plate" width="4" height="4" aria-hidden="true" style="position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block"></canvas>
  <script type="module">
    const cv = document.getElementById("p31-star-plate");
    if (cv instanceof HTMLCanvasElement) {
      try {
        const mod = await import("/lib/p31-starfield-live.js");
        mod.initLiveStarfield(cv, { preset: "hub" });
      } catch (_e) { /* offline-friendly */ }
    }
  </script>
  <a class="cp-skip skip-link p31-doc-skip" href="#fill">Skip to passport form</a>`;

/**
 * Source tail: atmosphere hints client + old local return-ribbon.
 * Replace with canonical EBC footer + return-ribbon + molecular field.
 */
export const SOURCE_TAIL = `  <script type="module">
    const hub = ["p31ca.org", "www.p31ca.org"].includes(location.hostname) || /\\.pages\\.dev$/i.test(location.hostname);
    const { bootAtmosphereStarfieldCanvas } = await import(
      (hub ? "/lib/atmosphere/" : "/design-assets/atmosphere/") + "p31-atmosphere-hints-boot.js"
    );
    const cv = document.getElementById("passport-starfield");
    if (cv instanceof HTMLCanvasElement) void bootAtmosphereStarfieldCanvas("cognitive-passport", cv);
  </script>
  <script src="lib/p31-return-ribbon.js" data-local-soup="../soup.html" defer></script>
</body>
</html>`;

export const P31CA_TAIL = `<footer id="ebc" class="p31-mission-trio p31-mission-trio--ebc" role="contentinfo" aria-label="Mission — build, create, connect">
  <a class="p31-mission-trio__link p31-mission-trio__link--build p31-mesh-tap" id="ebc-build" href="/build" title="Initial Build — intake, subject scope, verify-gated bake">
    <span class="p31-mission-trio__head">
      <span class="p31-mission-trio__dot" aria-hidden="true"></span>
      <span class="p31-mission-trio__verb">Build</span>
    </span>
    <span class="p31-mission-trio__desc">Intake and bake on the same verify chain—not a decoupled mock.</span>
  </a>
  <a class="p31-mission-trio__link p31-mission-trio__link--create p31-mesh-tap" id="ebc-create" href="/geodesic.html" title="GEODESIC — snap grid, Maxwell rigidity, scene export">
    <span class="p31-mission-trio__head">
      <span class="p31-mission-trio__dot" aria-hidden="true"></span>
      <span class="p31-mission-trio__verb">Create</span>
    </span>
    <span class="p31-mission-trio__desc">One lab surface, honest rigidity—generate or prove; don't fork the same truth twice (ephemeralization).</span>
  </a>
  <a class="p31-mission-trio__link p31-mission-trio__link--connect p31-mesh-tap" id="ebc-connect" href="/mesh" title="Mesh navigator — K₄ cage and product graph">
    <span class="p31-mission-trio__head">
      <span class="p31-mission-trio__dot" aria-hidden="true"></span>
      <span class="p31-mission-trio__verb">Connect</span>
    </span>
    <span class="p31-mission-trio__desc"><span class="p31-mission-trio__now">Now</span> — live cage and edges: mesh, hubs, and money follow the same published contracts (ethical monetization).</span>
  </a>
</footer>
<!-- P31:mission-ebc:end -->
  <script src="/lib/p31-return-ribbon.js" defer></script>
  <script type="module" src="/lib/p31-molecular-field.js"></script>

</body>
</html>`;

/** @returns {string | null} error message, or null if OK */
export function validateSourceHtml(html) {
  if (!html.includes(HEADER_SOURCE)) {
    return "cognitive-passport/index.html: expected header block not found. Update p31ca/scripts/passport-p31ca-transform.mjs if markup changed.";
  }
  if (!html.includes(FOOTER_SOURCE)) {
    return "cognitive-passport/index.html: expected footer block not found. Update p31ca/scripts/passport-p31ca-transform.mjs if markup changed.";
  }
  if (!html.includes(SOURCE_WEB_APP_ICONS)) {
    return "cognitive-passport/index.html: expected manifest + apple-touch block not found. Update p31ca/scripts/passport-p31ca-transform.mjs if markup changed.";
  }
  return null;
}

/** @param {string} sourceHtml well-formed source from cognitive-passport/index.html */
export function toP31caMirror(sourceHtml) {
  const err = validateSourceHtml(sourceHtml);
  if (err) throw new Error(err);
  return sourceHtml
    .replace(HEADER_SOURCE, HEADER_P31CA)
    .replace(FOOTER_SOURCE, FOOTER_P31CA)
    .replace(SOURCE_WEB_APP_ICONS, P31CA_WEB_APP_ICONS)
    .replace(STARFIELD_MAIN_CSS_HREF_SOURCE, STARFIELD_MAIN_CSS_HREF_P31CA)
    .replace(QMU_TOKENS_HREF_SOURCE, QMU_TOKENS_HREF_P31CA)
    .replace(COGPASS_READER_COMMENT_SOURCE, COGPASS_READER_COMMENT_P31CA)
    .replace(PLAYFAIR_SOURCE, PLAYFAIR_P31CA)
    .replace(SOURCE_BODY_ANCHOR, P31CA_BODY_WITH_CHROME)
    .replace(SOURCE_TAIL, P31CA_TAIL);
}
