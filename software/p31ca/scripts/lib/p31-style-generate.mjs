/**
 * Build CSS, Tailwind CDN bridge, and Astro extend from p31.universalCanon/1.0.0
 * Coupled sinks: p31-alignment.json derivation "canon-to-style-css" (passport + p31ca public)
 */
function assertPaletteAligned(canon) {
  const p = canon.palette;
  const h = canon.appearances.hub.colors;
  for (const k of Object.keys(p)) {
    if (k === "comment") continue;
    if (h[k] !== p[k]) {
      throw new Error(`universal canon: appearances.hub.colors.${k} must equal palette.${k} (${h[k]} vs ${p[k]})`);
    }
  }
  const o = canon.appearances.org.colors;
  for (const k of Object.keys(p)) {
    if (k === "comment") continue;
    if (o[k] !== p[k]) {
      throw new Error(`universal canon: appearances.org.colors.${k} must equal palette.${k} (${o[k]} vs ${p[k]})`);
    }
  }
}

function fontStack(arr) {
  return arr.map((s) => (s.includes(" ") ? `"${s}"` : s)).join(", ");
}

function emitColorAliases(lines, prefix = "") {
  const keys = ["void", "surface", "surface2", "coral", "teal", "cyan", "phosphorus", "cloud", "muted", "amber"];
  for (const name of keys) {
    lines.push(`  ${prefix}--${name}: var(--p31-${name});`);
  }
  lines.push(`  ${prefix}--border: var(--p31-border-subtle);`);
}

function emitAppearanceBlock(lines, appearance, selector) {
  const { colors, semantic, glass, colorScheme, themeColor } = appearance;
  lines.push(`${selector} {`);
  lines.push(`  color-scheme: ${colorScheme};`);
  lines.push(`  --p31-theme-color: ${themeColor};`);
  for (const [name, hex] of Object.entries(colors)) {
    lines.push(`  --p31-${name}: ${hex};`);
  }
  lines.push(`  --p31-border-subtle: ${semantic.borderSubtle};`);
  lines.push(`  --p31-glass-border: ${glass.border};`);
  lines.push(`  --p31-glass-surface: ${glass.surface};`);
  lines.push("");
  emitColorAliases(lines, "");
  lines.push("}");
}

function emitUniversalScale(lines, canon) {
  const { typography, space, radius, shadow, motion, zIndex, focus } = canon;
  const sans = fontStack(typography.fontFamilies.sans);
  const mono = fontStack(typography.fontFamilies.mono);
  lines.push(`  --p31-font-sans: ${sans};`);
  lines.push(`  --p31-font-mono: ${mono};`);
  for (const [k, v] of Object.entries(typography.scaleRem)) {
    lines.push(`  --p31-text-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(typography.lineHeight)) {
    lines.push(`  --p31-leading-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(typography.letterSpacing)) {
    lines.push(`  --p31-tracking-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(space)) {
    lines.push(`  --p31-space-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(radius)) {
    lines.push(`  --p31-radius-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(shadow)) {
    lines.push(`  --p31-shadow-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(motion.durationMs)) {
    lines.push(`  --p31-duration-${k}: ${v}ms;`);
  }
  for (const [k, v] of Object.entries(motion.easing)) {
    lines.push(`  --p31-ease-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(zIndex)) {
    lines.push(`  --p31-z-${k}: ${v};`);
  }
  lines.push(`  --p31-focus-ring: ${focus.ringWidth};`);
  lines.push(`  --p31-focus-offset: ${focus.ringOffset};`);
  lines.push(`  --p31-focus-color-hub: ${focus.hubRingColor};`);
  lines.push(`  --p31-focus-color-org: ${focus.orgRingColor};`);
}

/**
 * @param {object} canon parsed p31.universalCanon
 * @returns {{ css: string, js: string }}
 */
export function buildStyleArtifacts(canon) {
  if (canon.schema !== "p31.universalCanon/1.0.0") {
    throw new Error(`expected p31.universalCanon/1.0.0, got ${canon.schema}`);
  }
  assertPaletteAligned(canon);

  const hub = canon.appearances.hub;
  const org = canon.appearances.org;

  const cssLines = [
    "/* AUTO-GENERATED from andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json */",
    "/* Hub (p31ca): default. Org (phosphorus31.org): set <html data-p31-appearance=\"org\"> */",
    ":root {",
    '  --p31-appearance: hub;',
  ];

  emitUniversalScale(cssLines, canon);
  cssLines.push("");
  for (const [name, hex] of Object.entries(hub.colors)) {
    cssLines.push(`  --p31-${name}: ${hex};`);
  }
  cssLines.push(`  --p31-border-subtle: ${hub.semantic.borderSubtle};`);
  cssLines.push(`  --p31-glass-border: ${hub.glass.border};`);
  cssLines.push(`  --p31-glass-surface: ${hub.glass.surface};`);
  cssLines.push(`  --p31-theme-color: ${hub.themeColor};`);
  cssLines.push("");
  emitColorAliases(cssLines, "");
  cssLines.push("}");

  cssLines.push("");
  emitAppearanceBlock(cssLines, org, '[data-p31-appearance="org"]');
  cssLines.push("");
  cssLines.push(
    "/* Prefer org when user wants light system UI on org host only (optional; set on <html>) */",
  );
  cssLines.push("@media (prefers-color-scheme: light) {");
  cssLines.push('  html[data-p31-appearance="auto"] {');
  cssLines.push("    color-scheme: light;");
  for (const [name, hex] of Object.entries(org.colors)) {
    cssLines.push(`    --p31-${name}: ${hex};`);
  }
  cssLines.push(`    --p31-border-subtle: ${org.semantic.borderSubtle};`);
  cssLines.push(`    --p31-glass-border: ${org.glass.border};`);
  cssLines.push(`    --p31-glass-surface: ${org.glass.surface};`);
  cssLines.push(`    --p31-theme-color: ${org.themeColor};`);
  emitColorAliases(cssLines, "  ");
  cssLines.push("  }");
  cssLines.push("}");

  cssLines.push("");
  cssLines.push("html { color-scheme: dark; }");
  cssLines.push('[data-p31-appearance="org"] { color-scheme: light; }');
  cssLines.push("");

  const hubColors = hub.colors;
  const twColors = {};
  for (const name of Object.keys(hubColors)) {
    twColors[name] = `var(--p31-${name})`;
  }

  const q = canon.quantum;
  const twTone = {};
  const twElevTone = {};
  const twElevShadow = {};
  const twShape = {};
  const twQMotion = {};
  if (q) {
    const anchors = Array.isArray(q.tonalAnchors) ? q.tonalAnchors : [];
    const steps = Array.isArray(q.tonalSteps) ? q.tonalSteps : [];
    for (const a of anchors) {
      twTone[a] = {};
      steps.forEach((_pct, i) => {
        twTone[a][i] = `var(--p31-tone-${a}-${i})`;
      });
    }
    for (const lvl of Object.keys(q.elevation || {})) {
      twElevTone[lvl] = `var(--p31-elev-${lvl}-tone)`;
      twElevShadow[lvl] = `var(--p31-elev-${lvl}-shadow)`;
    }
    for (const k of Object.keys(q.shape || {})) {
      twShape[k] = `var(--p31-shape-${k})`;
    }
    for (const k of Object.keys(q.motionBudget || {})) {
      twQMotion[`q-${k}`] = `var(--p31-q-motion-${k})`;
    }
  }

  /** @type {Record<string, unknown>} */
  const extendObj = {
    fontFamily: {
      sans: [`"${canon.typography.fontFamilies.sans[0]}"`, ...canon.typography.fontFamilies.sans.slice(1)],
      mono: [`"${canon.typography.fontFamilies.mono[0]}"`, ...canon.typography.fontFamilies.mono.slice(1)],
    },
    colors: q ? { ...twColors, tone: twTone, elev: twElevTone } : twColors,
    boxShadow: q ? twElevShadow : undefined,
    borderRadius: q ? twShape : undefined,
    transitionDuration: q ? twQMotion : undefined,
  };
  if (q) {
    extendObj.p31Quantum = {
      schema: "p31.universalCanon/1.0.0",
      version: q.version || "1.0.0",
      anchors: Array.isArray(q.tonalAnchors) ? q.tonalAnchors : [],
      steps: Array.isArray(q.tonalSteps) ? q.tonalSteps : [],
      stateLayer: q.stateLayer || {},
    };
  } else {
    delete extendObj.boxShadow;
    delete extendObj.borderRadius;
    delete extendObj.transitionDuration;
  }

  const js =
    `/* AUTO-GENERATED — hub Tailwind CDN preset (dark vars). Org: rely on CSS variables + data-p31-appearance. */\n(function () {\n  window.P31_TAILWIND_EXTEND = ${JSON.stringify(extendObj, null, 2)};\n})();\n`;

  emitMissionTrioBlock(cssLines);
  emitDesignDoctrineBlock(cssLines);
  emitSkyRibbonAndStarfieldBlock(cssLines, canon);
  emitQuantumMaterialUBlock(cssLines, canon);

  return { css: cssLines.join("\n"), js };
}

/** One sky spine + Layer 1.5 starfield tokens — docs/P31-UNIVERSAL-UI-VISION.md */
function emitSkyRibbonAndStarfieldBlock(lines, canon) {
  lines.push("");
  lines.push("/* P31 universal UI — return ribbon + starfield manifest (canon.starfield / returnRibbon) */");

  const sf = canon.starfield || {};
  lines.push(":root {");
  lines.push(`  --p31-sf-layer: ${JSON.stringify(sf.layer || "1.5")};`);
  lines.push(`  --p31-sf-off-key: ${JSON.stringify(sf.globalOffStorageKey || "p31.starfield.off")};`);
  const presets = sf.presets || {};
  for (const key of Object.keys(presets)) {
    const p = presets[key];
    const px = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    if (p.baseAlphaCap != null) {
      lines.push(`  --p31-sf-preset-${px}-base-alpha-cap: ${p.baseAlphaCap};`);
    }
    if (p.maxFps != null) {
      lines.push(`  --p31-sf-preset-${px}-max-fps: ${p.maxFps};`);
    }
    if (p.dotCount != null) {
      lines.push(`  --p31-sf-preset-${px}-dot-count: ${p.dotCount};`);
    }
    if (p.motion != null) {
      lines.push(`  --p31-sf-preset-${px}-motion: ${JSON.stringify(p.motion)};`);
    }
  }
  lines.push("}");

  lines.push("");
  lines.push(".p31-host-mind {");
  lines.push("  margin: 0 0 var(--p31-space-3) 0;");
  lines.push("  font-family: var(--p31-font-sans);");
  lines.push("  font-size: var(--p31-text-sm);");
  lines.push("  font-weight: 500;");
  lines.push("  line-height: var(--p31-leading-snug);");
  lines.push("  color: var(--p31-muted);");
  lines.push("  max-width: 42rem;");
  lines.push("}");
  lines.push("");
  lines.push(".p31-return-ribbon {");
  lines.push("  position: fixed;");
  lines.push("  bottom: 0;");
  lines.push("  left: 0;");
  lines.push("  right: 0;");
  lines.push("  z-index: 105;");
  lines.push("  display: flex;");
  lines.push("  flex-wrap: wrap;");
  lines.push("  align-items: center;");
  lines.push("  justify-content: center;");
  lines.push("  gap: 0.35rem 0.55rem;");
  lines.push("  padding: 0.5rem var(--p31-space-4);");
  lines.push("  font-family: var(--p31-font-mono);");
  lines.push("  font-size: 11px;");
  lines.push("  line-height: 1.35;");
  lines.push("  letter-spacing: 0.02em;");
  lines.push("  color: var(--p31-muted);");
  lines.push("  background: color-mix(in srgb, var(--p31-void) 92%, transparent);");
  lines.push("  border-top: 1px solid var(--p31-border-subtle);");
  lines.push("  backdrop-filter: blur(12px);");
  lines.push("  -webkit-backdrop-filter: blur(12px);");
  lines.push("}");
  lines.push(".p31-return-ribbon a {");
  lines.push("  color: inherit;");
  lines.push("  text-decoration: none;");
  lines.push("  opacity: 0.88;");
  lines.push("}");
  lines.push(".p31-return-ribbon a:hover,");
  lines.push(".p31-return-ribbon a:focus-visible {");
  lines.push("  color: var(--p31-cyan);");
  lines.push("  opacity: 1;");
  lines.push("  outline: none;");
  lines.push("}");
  lines.push(".p31-return-ribbon__sep { opacity: 0.4; user-select: none; }");
  lines.push("body.p31-has-return-ribbon { padding-bottom: 2.75rem; }");
  lines.push("");
  lines.push(".p31-translate-bridge {");
  lines.push("  display: inline-flex;");
  lines.push("  align-items: center;");
  lines.push("  gap: var(--p31-space-2);");
  lines.push("  margin-top: var(--p31-space-3);");
  lines.push("  font-family: var(--p31-font-mono);");
  lines.push("  font-size: var(--p31-text-xs);");
  lines.push("}");
  lines.push(".p31-translate-bridge a { color: var(--p31-cyan); text-decoration: none; }");
  lines.push(".p31-translate-bridge a:hover { text-decoration: underline; }");
}

/** Mission trio EBC + hub rail — used by static pages, verify-mission-trio, Playwright e2e */
function emitMissionTrioBlock(lines) {
  lines.push("");
  lines.push("/* p31.missionTrio — Build / Create / Connect (EBC + hub index rail) */");
  lines.push(".p31-mission-trio--ebc {");
  lines.push("  position: fixed;");
  lines.push("  bottom: 0;");
  lines.push("  left: 0;");
  lines.push("  right: 0;");
  lines.push("  z-index: 50;");
  lines.push("  display: flex;");
  lines.push("  align-items: stretch;");
  lines.push("  height: 2.25rem;");
  lines.push("  border-top: 1px solid var(--p31-glass-border);");
  lines.push("  background: var(--p31-glass-surface);");
  lines.push("  backdrop-filter: blur(12px);");
  lines.push("  -webkit-backdrop-filter: blur(12px);");
  lines.push("}");
  lines.push(".p31-mission-trio--hub {");
  lines.push("  display: flex;");
  lines.push("  flex-wrap: wrap;");
  lines.push("  align-items: center;");
  lines.push("  justify-content: center;");
  lines.push("  gap: var(--p31-space-3);");
  lines.push("}");
  lines.push(".p31-mission-trio__link {");
  lines.push("  flex: 1;");
  lines.push("  display: flex;");
  lines.push("  align-items: center;");
  lines.push("  justify-content: center;");
  lines.push("  gap: 0.4rem;");
  lines.push("  text-decoration: none;");
  lines.push("  color: inherit;");
  lines.push("  border-right: 1px solid rgba(255, 255, 255, 0.06);");
  lines.push("  padding: 0 var(--p31-space-3);");
  lines.push("  min-width: 0;");
  lines.push("  transition: background var(--p31-duration-base, 200ms) var(--p31-ease-out, ease);");
  lines.push("}");
  lines.push(".p31-mission-trio--ebc .p31-mission-trio__desc { display: none; }");
  lines.push(".p31-mission-trio--ebc .p31-mission-trio__link:last-child { border-right: none; }");
  lines.push('.p31-mission-trio__link[aria-current="page"] {');
  lines.push("  background: rgba(77, 184, 168, 0.1);");
  lines.push("  cursor: default;");
  lines.push("}");
  lines.push(".p31-mission-trio__head {");
  lines.push("  display: flex;");
  lines.push("  align-items: center;");
  lines.push("  gap: 0.35rem;");
  lines.push("  margin-bottom: 0;");
  lines.push("}");
  lines.push(".p31-mission-trio__dot {");
  lines.push("  width: 0.35rem;");
  lines.push("  height: 0.35rem;");
  lines.push("  border-radius: 999px;");
  lines.push("  background: var(--p31-teal);");
  lines.push("  flex-shrink: 0;");
  lines.push("}");
  lines.push(".p31-mission-trio__link--build .p31-mission-trio__dot { background: var(--p31-phosphorus); }");
  lines.push(".p31-mission-trio__link--create .p31-mission-trio__dot { background: var(--p31-amber); }");
  lines.push(".p31-mission-trio__link--connect .p31-mission-trio__dot { background: var(--p31-coral); }");
  lines.push(".p31-mission-trio__verb {");
  lines.push("  font-family: var(--p31-font-mono);");
  lines.push("  font-size: var(--p31-text-2xs, 0.6rem);");
  lines.push("  font-weight: 700;");
  lines.push("  letter-spacing: 0.12em;");
  lines.push("  text-transform: uppercase;");
  lines.push("  color: var(--p31-cloud);");
  lines.push("}");
  lines.push(".p31-mission-trio__desc {");
  lines.push("  display: block;");
  lines.push("  font-size: var(--p31-text-xs, 0.7rem);");
  lines.push("  line-height: 1.45;");
  lines.push("  color: var(--p31-muted);");
  lines.push("}");
  lines.push(".p31-mission-trio__now { font-weight: 600; color: var(--p31-cyan); margin-right: 0.15em; }");
  lines.push(".p31-mission-trio__link--build { }");
  lines.push(".p31-mission-trio__link--create { }");
  lines.push(".p31-mission-trio__link--connect { }");
  lines.push("@media (prefers-reduced-motion: reduce) {");
  lines.push("  .p31-mission-trio, .p31-mission-trio * {");
  lines.push("    transition-duration: 0.01ms !important;");
  lines.push("    animation-duration: 0.01ms !important;");
  lines.push("  }");
  lines.push("}");
}

/** Design doctrine — Gray Rock → Alive component patterns (p31.designDoctrine/1.0.0) */
function emitDesignDoctrineBlock(lines) {
  lines.push("");
  lines.push("/* p31.designDoctrine — Gray Rock → Alive */");
  lines.push("");

  lines.push("/* Gray Rock: default state for all surfaces */");
  lines.push(".p31-gray-rock {");
  lines.push("  color: var(--p31-cloud);");
  lines.push("  background: var(--p31-void);");
  lines.push("  font-family: var(--p31-font-sans);");
  lines.push("  font-size: var(--p31-text-md);");
  lines.push("  line-height: var(--p31-leading-normal);");
  lines.push("  letter-spacing: var(--p31-tracking-normal);");
  lines.push("}");
  lines.push("");

  lines.push("/* Layout: Focus (single column, centered) */");
  lines.push(".p31-layout-focus {");
  lines.push("  max-width: 42rem;");
  lines.push("  margin-inline: auto;");
  lines.push("  padding-inline: var(--p31-space-5);");
  lines.push("  padding-block: var(--p31-space-8);");
  lines.push("}");
  lines.push("");

  lines.push("/* Layout: Workshop (sidebar + main) */");
  lines.push(".p31-layout-workshop {");
  lines.push("  display: flex;");
  lines.push("  gap: var(--p31-space-6);");
  lines.push("  padding: var(--p31-space-6);");
  lines.push("  min-height: 100dvh;");
  lines.push("}");
  lines.push(".p31-layout-workshop__sidebar {");
  lines.push("  flex: 0 0 14rem;");
  lines.push("  position: sticky;");
  lines.push("  top: var(--p31-space-6);");
  lines.push("  align-self: flex-start;");
  lines.push("  max-height: calc(100dvh - var(--p31-space-12));");
  lines.push("  overflow-y: auto;");
  lines.push("}");
  lines.push(".p31-layout-workshop__main {");
  lines.push("  flex: 1 1 0%;");
  lines.push("  min-width: 0;");
  lines.push("}");
  lines.push("@media (max-width: 639px) {");
  lines.push("  .p31-layout-workshop {");
  lines.push("    flex-direction: column;");
  lines.push("  }");
  lines.push("  .p31-layout-workshop__main {");
  lines.push("    order: 1;");
  lines.push("  }");
  lines.push("  .p31-layout-workshop__sidebar {");
  lines.push("    position: static;");
  lines.push("    flex: none;");
  lines.push("    max-height: none;");
  lines.push("    order: 2;");
  lines.push("  }");
  lines.push("}");
  lines.push("");

  lines.push("/* Layout: Gallery (grid, progressive reveal) */");
  lines.push(".p31-layout-gallery {");
  lines.push("  display: grid;");
  lines.push("  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));");
  lines.push("  gap: var(--p31-space-6);");
  lines.push("  padding: var(--p31-space-6);");
  lines.push("}");
  lines.push("");

  lines.push("/* Glass panel (one per viewport section) */");
  lines.push(".p31-glass {");
  lines.push("  background: var(--p31-glass-surface);");
  lines.push("  border: 1px solid var(--p31-glass-border);");
  lines.push("  border-radius: var(--p31-radius-lg);");
  lines.push("  padding: var(--p31-space-6);");
  lines.push("}");
  lines.push("");

  lines.push("/* Card (gallery item — Gray Rock default, Alive on hover) */");
  lines.push(".p31-card {");
  lines.push("  border: 1px solid var(--p31-border-subtle);");
  lines.push("  border-radius: var(--p31-radius-lg);");
  lines.push("  padding: var(--p31-space-5);");
  lines.push("  transition: border-color var(--p31-duration-fast) var(--p31-ease-standard),");
  lines.push("              background var(--p31-duration-fast) var(--p31-ease-standard);");
  lines.push("}");
  lines.push(".p31-card:hover,");
  lines.push(".p31-card:focus-within {");
  lines.push("  border-color: var(--p31-teal);");
  lines.push("  background: var(--p31-glass-surface);");
  lines.push("}");
  lines.push("@media (prefers-reduced-motion: reduce) {");
  lines.push("  .p31-card { transition: none; }");
  lines.push("}");
  lines.push("");

  lines.push(".p31-card__title {");
  lines.push("  font-size: var(--p31-text-lg);");
  lines.push("  font-weight: 700;");
  lines.push("  line-height: var(--p31-leading-tight);");
  lines.push("  color: var(--p31-cloud);");
  lines.push("  margin: 0 0 var(--p31-space-2) 0;");
  lines.push("}");
  lines.push(".p31-card__desc {");
  lines.push("  font-size: var(--p31-text-sm);");
  lines.push("  color: var(--p31-muted);");
  lines.push("  line-height: var(--p31-leading-normal);");
  lines.push("  margin: 0;");
  lines.push("}");
  lines.push("");

  lines.push("/* Status badge (pill) */");
  lines.push(".p31-badge {");
  lines.push("  display: inline-block;");
  lines.push("  font-size: var(--p31-text-xs);");
  lines.push("  font-weight: 600;");
  lines.push("  letter-spacing: var(--p31-tracking-caps);");
  lines.push("  text-transform: uppercase;");
  lines.push("  padding: 0.125rem var(--p31-space-3);");
  lines.push("  border-radius: var(--p31-radius-full);");
  lines.push("  background: var(--p31-surface2);");
  lines.push("  color: var(--p31-muted);");
  lines.push("}");
  lines.push(
    ".p31-badge--live { background: color-mix(in srgb, var(--p31-phosphorus) 15%, transparent); color: var(--p31-phosphorus); }",
  );
  lines.push(
    ".p31-badge--research { background: color-mix(in srgb, var(--p31-lavender) 15%, transparent); color: var(--p31-lavender); }",
  );
  lines.push(
    ".p31-badge--prototype { background: color-mix(in srgb, var(--p31-amber) 15%, transparent); color: var(--p31-amber); }",
  );
  lines.push(".p31-badge--pending { background: var(--p31-surface2); color: var(--p31-muted); }");
  lines.push("");

  lines.push("/* Buttons */");
  lines.push(".p31-btn {");
  lines.push("  display: inline-flex;");
  lines.push("  align-items: center;");
  lines.push("  justify-content: center;");
  lines.push("  min-height: 48px;");
  lines.push("  padding: var(--p31-space-3) var(--p31-space-5);");
  lines.push("  font-family: var(--p31-font-sans);");
  lines.push("  font-size: var(--p31-text-sm);");
  lines.push("  font-weight: 600;");
  lines.push("  line-height: 1;");
  lines.push("  border-radius: var(--p31-radius-md);");
  lines.push("  border: none;");
  lines.push("  cursor: pointer;");
  lines.push("  transition: background var(--p31-duration-fast) var(--p31-ease-standard),");
  lines.push("              color var(--p31-duration-fast) var(--p31-ease-standard),");
  lines.push("              border-color var(--p31-duration-fast) var(--p31-ease-standard);");
  lines.push("  text-decoration: none;");
  lines.push("}");
  lines.push(".p31-btn:focus-visible {");
  lines.push("  outline: var(--p31-focus-ring) solid var(--p31-focus-color-hub);");
  lines.push("  outline-offset: var(--p31-focus-offset);");
  lines.push("}");
  lines.push(".p31-btn--primary {");
  lines.push("  background: var(--p31-teal);");
  lines.push("  color: var(--p31-void);");
  lines.push("}");
  lines.push(".p31-btn--primary:hover { background: var(--p31-cyan); }");
  lines.push(".p31-btn--secondary {");
  lines.push("  background: transparent;");
  lines.push("  border: 1px solid var(--p31-border-subtle);");
  lines.push("  color: var(--p31-cloud);");
  lines.push("}");
  lines.push(".p31-btn--secondary:hover {");
  lines.push("  border-color: var(--p31-teal);");
  lines.push("  color: var(--p31-teal);");
  lines.push("}");
  lines.push("@media (prefers-reduced-motion: reduce) {");
  lines.push("  .p31-btn { transition: none; }");
  lines.push("}");
  lines.push("");

  lines.push("/* Heading hierarchy (doctrine) */");
  lines.push(".p31-h1 {");
  lines.push("  font-size: var(--p31-text-3xl);");
  lines.push("  font-weight: 700;");
  lines.push("  line-height: var(--p31-leading-tight);");
  lines.push("  letter-spacing: var(--p31-tracking-tight);");
  lines.push("  color: var(--p31-cloud);");
  lines.push("  margin: 0 0 var(--p31-space-4) 0;");
  lines.push("}");
  lines.push(".p31-h2 {");
  lines.push("  font-size: var(--p31-text-xl);");
  lines.push("  font-weight: 700;");
  lines.push("  line-height: var(--p31-leading-tight);");
  lines.push("  color: var(--p31-cloud);");
  lines.push("  margin: var(--p31-space-8) 0 var(--p31-space-3) 0;");
  lines.push("}");
  lines.push(".p31-h3 {");
  lines.push("  font-size: var(--p31-text-lg);");
  lines.push("  font-weight: 600;");
  lines.push("  line-height: var(--p31-leading-snug);");
  lines.push("  color: var(--p31-cloud);");
  lines.push("  margin: var(--p31-space-6) 0 var(--p31-space-2) 0;");
  lines.push("}");
  lines.push("");

  lines.push(".p31-caps {");
  lines.push("  font-size: var(--p31-text-xs);");
  lines.push("  font-weight: 600;");
  lines.push("  letter-spacing: var(--p31-tracking-caps);");
  lines.push("  text-transform: uppercase;");
  lines.push("  color: var(--p31-muted);");
  lines.push("}");
  lines.push("");

  lines.push("/* Section spacing (breathing room) */");
  lines.push(".p31-section {");
  lines.push("  margin-block: var(--p31-space-8);");
  lines.push("}");
  lines.push(".p31-section + .p31-section {");
  lines.push("  padding-top: var(--p31-space-8);");
  lines.push("  border-top: 1px solid var(--p31-border-subtle);");
  lines.push("}");
  lines.push("");

  lines.push("/* User preference overrides (passport-driven) */");
  lines.push(':root[data-p31-density="compact"] {');
  lines.push("  --p31-space-section: var(--p31-space-4);");
  lines.push("  --p31-text-body: var(--p31-text-base);");
  lines.push("}");
  lines.push(':root[data-p31-density="spacious"] {');
  lines.push("  --p31-space-section: var(--p31-space-10);");
  lines.push("  --p31-text-body: var(--p31-text-lg);");
  lines.push("}");
  lines.push(':root[data-p31-contrast="high"] {');
  lines.push("  --p31-cloud: #ffffff;");
  lines.push("  --p31-muted: #9ca3af;");
  lines.push("  --p31-border-subtle: rgba(255, 255, 255, 0.15);");
  lines.push("}");
  lines.push(':root[data-p31-contrast="max"] {');
  lines.push("  --p31-void: #000000;");
  lines.push("  --p31-cloud: #ffffff;");
  lines.push("  --p31-muted: #d1d5db;");
  lines.push("  --p31-border-subtle: #ffffff;");
  lines.push("}");
  lines.push(":root[data-p31-motion='none'] *,");
  lines.push(":root[data-p31-motion='none'] *::before,");
  lines.push(":root[data-p31-motion='none'] *::after {");
  lines.push("  animation-duration: 0s !important;");
  lines.push("  transition-duration: 0s !important;");
  lines.push("}");
  lines.push("");

  lines.push("/* Progressive disclosure (show more) */");
  lines.push(".p31-reveal {");
  lines.push("  display: none;");
  lines.push("}");
  lines.push('.p31-reveal[data-revealed="true"] {');
  lines.push("  display: block;");
  lines.push("}");
  lines.push(".p31-reveal-trigger {");
  lines.push("  display: inline-flex;");
  lines.push("  align-items: center;");
  lines.push("  gap: var(--p31-space-2);");
  lines.push("  color: var(--p31-muted);");
  lines.push("  cursor: pointer;");
  lines.push("  border: none;");
  lines.push("  background: none;");
  lines.push("  font-family: var(--p31-font-sans);");
  lines.push("  font-size: var(--p31-text-sm);");
  lines.push("  padding: var(--p31-space-3) 0;");
  lines.push("}");
  lines.push(".p31-reveal-trigger:hover,");
  lines.push(".p31-reveal-trigger:focus-visible {");
  lines.push("  color: var(--p31-teal);");
  lines.push("}");
}

/**
 * P31 Extended Surface Styles — additive Material 3 grammar refracted through K\u2084 anchors.
 *
 * Emits ONLY tokens + opt-in `.p31-q-*` classes. Existing `.p31-card`, `.p31-btn`,
 * `.p31-glass`, `.p31-mission-trio*`, `.p31-return-ribbon` remain untouched.
 *
 * Hard guards (matched in this block):
 *  - Layer 1 (Gray Rock) untouched: tokens defined, classes opt-in.
 *  - No first-paint motion: transitions only on :hover / :focus-visible / :active.
 *  - prefers-reduced-motion: clamp transitions to 0.01ms.
 *  - Operator passport prefs (data-p31-{contrast,density,motion}) compose with classes.
 *
 * Spec: docs/P31-QUANTUM-MATERIAL-U.md  ·  Verifier: scripts/verify-quantum-material-u.mjs
 */
function emitQuantumMaterialUBlock(lines, canon) {
  const q = canon.quantum;
  if (!q) return;
  const anchors = Array.isArray(q.tonalAnchors) ? q.tonalAnchors : [];
  const steps = Array.isArray(q.tonalSteps) ? q.tonalSteps : [];
  const elev = q.elevation || {};
  const state = q.stateLayer || {};
  const shape = q.shape || {};
  const motion = q.motionBudget || {};

  lines.push("");
  lines.push("/* P31 Extended Surface Styles (additive, opt-in via .p31-q-*). */");

  lines.push(":root {");
  for (const a of anchors) {
    steps.forEach((pct, i) => {
      lines.push(`  --p31-tone-${a}-${i}: color-mix(in srgb, var(--p31-${a}) ${pct}%, var(--p31-void));`);
    });
  }
  for (const lvl of Object.keys(elev)) {
    const e = elev[lvl];
    if (e == null) continue;
    if (typeof e.tone === "number") {
      lines.push(
        `  --p31-elev-${lvl}-tone: color-mix(in srgb, var(--p31-cloud) ${e.tone}%, var(--p31-surface));`,
      );
    }
    if (typeof e.shadow === "string") {
      lines.push(`  --p31-elev-${lvl}-shadow: ${e.shadow};`);
    }
  }
  for (const k of Object.keys(state)) {
    lines.push(`  --p31-state-${k}: ${state[k]};`);
  }
  for (const k of Object.keys(shape)) {
    lines.push(`  --p31-shape-${k}: ${shape[k]};`);
  }
  for (const k of Object.keys(motion)) {
    lines.push(`  --p31-q-motion-${k}: ${motion[k]};`);
  }
  lines.push("}");

  lines.push('[data-p31-appearance="org"] {');
  for (const a of anchors) {
    steps.forEach((pct, i) => {
      lines.push(`  --p31-tone-${a}-${i}: color-mix(in srgb, var(--p31-${a}) ${pct}%, var(--p31-paper));`);
    });
  }
  for (const lvl of Object.keys(elev)) {
    const e = elev[lvl];
    if (e == null) continue;
    if (typeof e.tone === "number") {
      lines.push(
        `  --p31-elev-${lvl}-tone: color-mix(in srgb, var(--p31-ink) ${e.tone}%, var(--p31-paper));`,
      );
    }
    if (typeof e.shadow === "string") {
      const softer = e.shadow.replace(/rgba\(0,0,0,0\.(\d+)\)/g, (_m, n) => {
        const v = Math.max(0.04, parseFloat(`0.${n}`) * 0.4).toFixed(2);
        return `rgba(15, 23, 42, ${v})`;
      });
      lines.push(`  --p31-elev-${lvl}-shadow: ${softer};`);
    }
  }
  lines.push("}");

  lines.push("");
  lines.push("/* Surface — semantic elevation (data-p31-elev=\"0..5\"). Inherits Gray Rock when no attribute. */");
  lines.push(".p31-q-surface {");
  lines.push("  background: var(--p31-surface);");
  lines.push("  border: 1px solid var(--p31-border-subtle);");
  lines.push("  border-radius: var(--p31-shape-md);");
  lines.push("  color: var(--p31-cloud);");
  lines.push("  padding: var(--p31-space-5);");
  lines.push("}");
  for (let i = 0; i <= 5; i++) {
    lines.push(`.p31-q-surface[data-p31-elev="${i}"] {`);
    lines.push(`  background: var(--p31-elev-${i}-tone);`);
    lines.push(`  box-shadow: var(--p31-elev-${i}-shadow);`);
    lines.push("}");
  }

  lines.push("");
  lines.push("/* Card \u2014 Material 3 filled card adapted; tone, no chroma at rest. */");
  lines.push(".p31-q-card {");
  lines.push("  position: relative;");
  lines.push("  display: flex;");
  lines.push("  flex-direction: column;");
  lines.push("  gap: var(--p31-space-3);");
  lines.push("  padding: var(--p31-space-6);");
  lines.push("  background: var(--p31-elev-1-tone);");
  lines.push("  border: 1px solid var(--p31-border-subtle);");
  lines.push("  border-radius: var(--p31-shape-lg);");
  lines.push("  box-shadow: var(--p31-elev-1-shadow);");
  lines.push("  color: var(--p31-cloud);");
  lines.push("  transition: box-shadow var(--p31-q-motion-within) var(--p31-ease-standard),");
  lines.push("              transform var(--p31-q-motion-within) var(--p31-ease-standard),");
  lines.push("              border-color var(--p31-q-motion-within) var(--p31-ease-standard);");
  lines.push("  isolation: isolate;");
  lines.push("}");
  lines.push(".p31-q-card::after {");
  lines.push("  content: \"\";");
  lines.push("  position: absolute;");
  lines.push("  inset: 0;");
  lines.push("  border-radius: inherit;");
  lines.push("  background: var(--p31-cloud);");
  lines.push("  opacity: 0;");
  lines.push("  transition: opacity var(--p31-q-motion-within) var(--p31-ease-standard);");
  lines.push("  pointer-events: none;");
  lines.push("  z-index: 0;");
  lines.push("}");
  lines.push(".p31-q-card > * { position: relative; z-index: 1; }");
  lines.push(".p31-q-card:hover { box-shadow: var(--p31-elev-2-shadow); border-color: var(--p31-teal); }");
  lines.push(".p31-q-card:hover::after { opacity: var(--p31-state-hover); }");
  lines.push(".p31-q-card:focus-within { box-shadow: var(--p31-elev-2-shadow); border-color: var(--p31-cyan); }");
  lines.push(".p31-q-card:focus-within::after { opacity: var(--p31-state-focus); }");
  lines.push(".p31-q-card[data-p31-shape=\"asymmetric\"] { border-radius: var(--p31-shape-asymmetric); }");
  lines.push(".p31-q-card[data-p31-tone=\"teal\"] { border-color: var(--p31-tone-teal-1); }");
  lines.push(".p31-q-card[data-p31-tone=\"coral\"] { border-color: var(--p31-tone-coral-1); }");
  lines.push(".p31-q-card[data-p31-tone=\"phosphorus\"] { border-color: var(--p31-tone-phosphorus-1); }");
  lines.push(".p31-q-card[data-p31-tone=\"amber\"] { border-color: var(--p31-tone-amber-1); }");
  lines.push(".p31-q-card[data-p31-tone=\"lavender\"] { border-color: var(--p31-tone-lavender-1); }");
  lines.push("@media (prefers-reduced-motion: reduce) {");
  lines.push("  .p31-q-card,");
  lines.push("  .p31-q-card::after { transition: none; }");
  lines.push("}");

  lines.push("");
  lines.push("/* Buttons \u2014 filled / tonal / outlined / text + state-layer pseudo. */");
  lines.push(".p31-q-button {");
  lines.push("  position: relative;");
  lines.push("  display: inline-flex;");
  lines.push("  align-items: center;");
  lines.push("  justify-content: center;");
  lines.push("  gap: var(--p31-space-2);");
  lines.push("  min-height: 44px;");
  lines.push("  padding: var(--p31-space-3) var(--p31-space-5);");
  lines.push("  font-family: var(--p31-font-sans);");
  lines.push("  font-size: var(--p31-text-sm);");
  lines.push("  font-weight: 600;");
  lines.push("  line-height: 1;");
  lines.push("  border-radius: var(--p31-shape-full);");
  lines.push("  border: 1px solid transparent;");
  lines.push("  cursor: pointer;");
  lines.push("  text-decoration: none;");
  lines.push("  isolation: isolate;");
  lines.push("  transition: background var(--p31-q-motion-within) var(--p31-ease-standard),");
  lines.push("              color var(--p31-q-motion-within) var(--p31-ease-standard),");
  lines.push("              border-color var(--p31-q-motion-within) var(--p31-ease-standard),");
  lines.push("              box-shadow var(--p31-q-motion-within) var(--p31-ease-standard);");
  lines.push("}");
  lines.push(".p31-q-button::after {");
  lines.push("  content: \"\";");
  lines.push("  position: absolute;");
  lines.push("  inset: 0;");
  lines.push("  border-radius: inherit;");
  lines.push("  background: currentColor;");
  lines.push("  opacity: 0;");
  lines.push("  transition: opacity var(--p31-q-motion-within) var(--p31-ease-standard);");
  lines.push("  pointer-events: none;");
  lines.push("  z-index: 0;");
  lines.push("}");
  lines.push(".p31-q-button > * { position: relative; z-index: 1; }");
  lines.push(".p31-q-button:hover::after { opacity: var(--p31-state-hover); }");
  lines.push(".p31-q-button:focus-visible {");
  lines.push("  outline: var(--p31-focus-ring) solid var(--p31-focus-color-hub);");
  lines.push("  outline-offset: var(--p31-focus-offset);");
  lines.push("}");
  lines.push(".p31-q-button:focus-visible::after { opacity: var(--p31-state-focus); }");
  lines.push(".p31-q-button:active::after { opacity: var(--p31-state-pressed); }");
  lines.push(".p31-q-button[aria-disabled=\"true\"],");
  lines.push(".p31-q-button:disabled {");
  lines.push("  cursor: not-allowed;");
  lines.push("  opacity: var(--p31-state-disabled);");
  lines.push("}");
  lines.push(".p31-q-button--filled {");
  lines.push("  background: var(--p31-teal);");
  lines.push("  color: var(--p31-void);");
  lines.push("  box-shadow: var(--p31-elev-1-shadow);");
  lines.push("}");
  lines.push(".p31-q-button--filled:hover { box-shadow: var(--p31-elev-2-shadow); }");
  lines.push(".p31-q-button--tonal {");
  lines.push("  background: var(--p31-tone-teal-2);");
  lines.push("  color: var(--p31-cloud);");
  lines.push("}");
  lines.push(".p31-q-button--outlined {");
  lines.push("  background: transparent;");
  lines.push("  color: var(--p31-cloud);");
  lines.push("  border-color: var(--p31-border-subtle);");
  lines.push("}");
  lines.push(".p31-q-button--outlined:hover { border-color: var(--p31-teal); color: var(--p31-teal); }");
  lines.push(".p31-q-button--text {");
  lines.push("  background: transparent;");
  lines.push("  color: var(--p31-cyan);");
  lines.push("  padding: var(--p31-space-2) var(--p31-space-3);");
  lines.push("}");
  lines.push(".p31-q-button[data-p31-tone=\"coral\"].p31-q-button--filled { background: var(--p31-coral); }");
  lines.push(".p31-q-button[data-p31-tone=\"coral\"].p31-q-button--tonal { background: var(--p31-tone-coral-2); }");
  lines.push(".p31-q-button[data-p31-tone=\"coral\"].p31-q-button--text { color: var(--p31-coral); }");
  lines.push(".p31-q-button[data-p31-tone=\"phosphorus\"].p31-q-button--filled { background: var(--p31-phosphorus); }");
  lines.push(".p31-q-button[data-p31-tone=\"phosphorus\"].p31-q-button--tonal { background: var(--p31-tone-phosphorus-2); }");
  lines.push(".p31-q-button[data-p31-tone=\"phosphorus\"].p31-q-button--text { color: var(--p31-phosphorus); }");
  lines.push(".p31-q-button[data-p31-tone=\"amber\"].p31-q-button--filled { background: var(--p31-amber); color: var(--p31-ink); }");
  lines.push(".p31-q-button[data-p31-tone=\"amber\"].p31-q-button--tonal { background: var(--p31-tone-amber-2); }");
  lines.push(".p31-q-button[data-p31-tone=\"amber\"].p31-q-button--text { color: var(--p31-amber); }");
  lines.push(".p31-q-button[data-p31-tone=\"lavender\"].p31-q-button--filled { background: var(--p31-lavender); color: var(--p31-void); }");
  lines.push(".p31-q-button[data-p31-tone=\"lavender\"].p31-q-button--tonal { background: var(--p31-tone-lavender-2); }");
  lines.push(".p31-q-button[data-p31-tone=\"lavender\"].p31-q-button--text { color: var(--p31-lavender); }");
  lines.push("@media (prefers-reduced-motion: reduce) {");
  lines.push("  .p31-q-button,");
  lines.push("  .p31-q-button::after { transition: none; }");
  lines.push("}");

  lines.push("");
  lines.push("/* FAB \u2014 Floating Action Button. Operator-summoned only; never autoload chrome. */");
  lines.push(".p31-q-fab {");
  lines.push("  position: relative;");
  lines.push("  display: inline-flex;");
  lines.push("  align-items: center;");
  lines.push("  justify-content: center;");
  lines.push("  gap: var(--p31-space-2);");
  lines.push("  min-width: 56px;");
  lines.push("  min-height: 56px;");
  lines.push("  padding: 0 var(--p31-space-5);");
  lines.push("  border: none;");
  lines.push("  border-radius: var(--p31-shape-lg);");
  lines.push("  background: var(--p31-teal);");
  lines.push("  color: var(--p31-void);");
  lines.push("  font-family: var(--p31-font-sans);");
  lines.push("  font-size: var(--p31-text-sm);");
  lines.push("  font-weight: 600;");
  lines.push("  cursor: pointer;");
  lines.push("  box-shadow: var(--p31-elev-3-shadow);");
  lines.push("  isolation: isolate;");
  lines.push("  transition: box-shadow var(--p31-q-motion-within) var(--p31-ease-emphasized),");
  lines.push("              transform var(--p31-q-motion-within) var(--p31-ease-emphasized);");
  lines.push("}");
  lines.push(".p31-q-fab:hover { box-shadow: var(--p31-elev-4-shadow); }");
  lines.push(".p31-q-fab:active { box-shadow: var(--p31-elev-2-shadow); }");
  lines.push(".p31-q-fab:focus-visible {");
  lines.push("  outline: var(--p31-focus-ring) solid var(--p31-focus-color-hub);");
  lines.push("  outline-offset: var(--p31-focus-offset);");
  lines.push("}");
  lines.push(".p31-q-fab--small { min-width: 40px; min-height: 40px; padding: 0 var(--p31-space-3); border-radius: var(--p31-shape-md); }");
  lines.push(".p31-q-fab--large { min-width: 96px; min-height: 96px; padding: 0 var(--p31-space-6); border-radius: var(--p31-shape-xl); font-size: var(--p31-text-lg); }");
  lines.push("@media (prefers-reduced-motion: reduce) {");
  lines.push("  .p31-q-fab { transition: none; }");
  lines.push("}");

  lines.push("");
  lines.push("/* Chips \u2014 assist / filter / input / suggestion. */");
  lines.push(".p31-q-chip {");
  lines.push("  position: relative;");
  lines.push("  display: inline-flex;");
  lines.push("  align-items: center;");
  lines.push("  gap: var(--p31-space-2);");
  lines.push("  height: 32px;");
  lines.push("  padding: 0 var(--p31-space-4);");
  lines.push("  font-family: var(--p31-font-sans);");
  lines.push("  font-size: var(--p31-text-sm);");
  lines.push("  font-weight: 500;");
  lines.push("  line-height: 1;");
  lines.push("  color: var(--p31-cloud);");
  lines.push("  background: transparent;");
  lines.push("  border: 1px solid var(--p31-border-subtle);");
  lines.push("  border-radius: var(--p31-shape-sm);");
  lines.push("  cursor: pointer;");
  lines.push("  isolation: isolate;");
  lines.push("  transition: background var(--p31-q-motion-within) var(--p31-ease-standard),");
  lines.push("              border-color var(--p31-q-motion-within) var(--p31-ease-standard);");
  lines.push("}");
  lines.push(".p31-q-chip:hover { border-color: var(--p31-teal); background: var(--p31-tone-teal-0); }");
  lines.push(".p31-q-chip:focus-visible {");
  lines.push("  outline: var(--p31-focus-ring) solid var(--p31-focus-color-hub);");
  lines.push("  outline-offset: var(--p31-focus-offset);");
  lines.push("}");
  lines.push(".p31-q-chip[aria-pressed=\"true\"],");
  lines.push(".p31-q-chip[data-p31-selected=\"true\"] {");
  lines.push("  background: var(--p31-tone-teal-2);");
  lines.push("  border-color: var(--p31-teal);");
  lines.push("}");
  lines.push(".p31-q-chip--assist {}");
  lines.push(".p31-q-chip--filter[aria-pressed=\"true\"] { background: var(--p31-tone-phosphorus-2); border-color: var(--p31-phosphorus); }");
  lines.push(".p31-q-chip--input { background: var(--p31-elev-1-tone); }");
  lines.push(".p31-q-chip--suggestion { color: var(--p31-muted); }");
  lines.push(".p31-q-chip--suggestion:hover { color: var(--p31-cloud); }");
  lines.push("@media (prefers-reduced-motion: reduce) { .p31-q-chip { transition: none; } }");

  lines.push("");
  lines.push("/* Divider \u2014 hairline; quiet; honors focus-within for orientation. */");
  lines.push(".p31-q-divider {");
  lines.push("  display: block;");
  lines.push("  block-size: 1px;");
  lines.push("  border: none;");
  lines.push("  background: var(--p31-border-subtle);");
  lines.push("  margin: var(--p31-space-4) 0;");
  lines.push("}");
  lines.push(".p31-q-divider--inset { margin-inline: var(--p31-space-6); }");
  lines.push(".p31-q-divider[data-p31-orient=\"vertical\"] {");
  lines.push("  block-size: auto;");
  lines.push("  inline-size: 1px;");
  lines.push("  align-self: stretch;");
  lines.push("  margin: 0 var(--p31-space-4);");
  lines.push("}");

  lines.push("");
  lines.push("/* Quantum atmosphere \u2014 K\u2084 vertex glow rail; opt-in via [data-p31-q-atmosphere]. */");
  lines.push(".p31-q-atmosphere {");
  lines.push("  position: relative;");
  lines.push("}");
  lines.push(".p31-q-atmosphere::before {");
  lines.push("  content: \"\";");
  lines.push("  position: absolute;");
  lines.push("  inset: -1px;");
  lines.push("  border-radius: inherit;");
  lines.push("  background:");
  lines.push("    radial-gradient(circle at 0% 0%, var(--p31-tone-teal-1), transparent 55%),");
  lines.push("    radial-gradient(circle at 100% 0%, var(--p31-tone-coral-1), transparent 55%),");
  lines.push("    radial-gradient(circle at 0% 100%, var(--p31-tone-phosphorus-1), transparent 55%),");
  lines.push("    radial-gradient(circle at 100% 100%, var(--p31-tone-amber-1), transparent 55%);");
  lines.push("  opacity: 0;");
  lines.push("  pointer-events: none;");
  lines.push("  z-index: -1;");
  lines.push("  transition: opacity var(--p31-q-motion-enter) var(--p31-ease-emphasized);");
  lines.push("}");
  lines.push(".p31-q-atmosphere:hover::before,");
  lines.push(".p31-q-atmosphere:focus-within::before { opacity: 1; }");
  lines.push("@media (prefers-reduced-motion: reduce) { .p31-q-atmosphere::before { transition: none; } }");
  lines.push(":root[data-p31-motion=\"none\"] .p31-q-atmosphere::before { opacity: 0 !important; }");

  lines.push("");
  lines.push("/* Personalization composes with passport prefs (data-p31-density / contrast / motion). */");
  lines.push(":root[data-p31-density=\"compact\"] .p31-q-card { padding: var(--p31-space-4); }");
  lines.push(":root[data-p31-density=\"spacious\"] .p31-q-card { padding: var(--p31-space-8); }");
  lines.push(":root[data-p31-contrast=\"high\"] .p31-q-card,");
  lines.push(":root[data-p31-contrast=\"max\"] .p31-q-card { border-color: var(--p31-cloud); }");
}

/**
 * Tailwind theme.extend for Astro — hub appearance hex values (compile-time).
 * When canon.quantum is present, also exposes tone / elevation / shape / motion
 * as Tailwind-utility-friendly nested keys (`tone-teal-2`, `shadow-elev-3`,
 * `rounded-shape-asymmetric`, `duration-q-enter`).
 */
export function buildAstroTailwindThemeExtend(canon) {
  if (canon.schema !== "p31.universalCanon/1.0.0") {
    throw new Error(`expected p31.universalCanon/1.0.0, got ${canon.schema}`);
  }
  const hub = canon.appearances.hub;
  const { colors, glass } = hub;
  const q = canon.quantum;

  /** @type {Record<string, any>} */
  const colorExt = {
    ...colors,
    emerald: colors.phosphorus,
    amber: colors.amber,
    glass: {
      border: glass.border,
      surface: glass.surface,
    },
  };

  /** @type {Record<string, unknown>} */
  const out = {
    colors: colorExt,
    fontFamily: {
      sans: canon.typography.fontFamilies.sans,
      mono: canon.typography.fontFamilies.mono,
    },
    backdropBlur: {
      glass: "12px",
    },
  };

  if (q) {
    const anchors = Array.isArray(q.tonalAnchors) ? q.tonalAnchors : [];
    const steps = Array.isArray(q.tonalSteps) ? q.tonalSteps : [];
    /** @type {Record<string, Record<number, string>>} */
    const tone = {};
    for (const a of anchors) {
      tone[a] = {};
      steps.forEach((_pct, i) => {
        tone[a][i] = `var(--p31-tone-${a}-${i})`;
      });
    }
    /** @type {Record<string, string>} */
    const elev = {};
    /** @type {Record<string, string>} */
    const elevShadow = {};
    for (const lvl of Object.keys(q.elevation || {})) {
      elev[lvl] = `var(--p31-elev-${lvl}-tone)`;
      elevShadow[lvl] = `var(--p31-elev-${lvl}-shadow)`;
    }
    /** @type {Record<string, string>} */
    const shape = {};
    for (const k of Object.keys(q.shape || {})) {
      shape[k] = `var(--p31-shape-${k})`;
    }
    /** @type {Record<string, string>} */
    const motion = {};
    for (const k of Object.keys(q.motionBudget || {})) {
      motion[`q-${k}`] = `var(--p31-q-motion-${k})`;
    }
    colorExt.tone = tone;
    colorExt.elev = elev;
    out.boxShadow = elevShadow;
    out.borderRadius = shape;
    out.transitionDuration = motion;
  }

  return out;
}
