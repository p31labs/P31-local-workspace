#!/usr/bin/env node
/**
 * Human-readable design token reference from p31-universal-canon.json.
 * Run: node generate-reference.mjs  (or npm run generate:design-token-docs from P31 home)
 * Coupled: p31ca apply-p31-style, verify-p31-style (regenerated / checked in sync)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const canonPath = path.join(__dirname, "p31-universal-canon.json");
const outPath = path.join(__dirname, "DESIGN-TOKENS-REFERENCE.md");

function rowEsc(cells) {
  return `| ${cells.map((c) => String(c).replace(/\|/g, "\\|").replace(/\n/g, " ")).join(" | ")} |`;
}

function table(headers, rows) {
  const h = rowEsc(headers);
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  return [h, sep, ...rows.map((r) => rowEsc(r))].join("\n");
}

/**
 * @param {object} doc parsed p31.universalCanon/1.0.0
 * @param {{ generatedAt?: string }} opts
 * @returns {string}
 */
export function buildDesignTokenReferenceMd(doc, opts = {}) {
  if (doc.schema !== "p31.universalCanon/1.0.0") {
    throw new Error(`expected p31.universalCanon/1.0.0, got ${doc.schema}`);
  }
  const when = opts.generatedAt ?? new Date().toISOString();
  const lines = [];
  lines.push("# P31 design tokens — full reference");
  lines.push("");
  lines.push("<!-- AUTO-GENERATED — do not hand-edit. Source: p31-universal-canon.json -->");
  lines.push("");
  lines.push(
    `**Schema:** \`${doc.schema}\` · **Canon version:** \`${doc.version}\` · **Generated:** \`${when}\``,
  );
  lines.push("");
  if (doc.title) lines.push(`*${doc.title}*`);
  if (doc.description) lines.push("");
  if (doc.description) lines.push(doc.description);
  lines.push("");
  lines.push("**Regenerate:** from P31 home repo root, `npm run apply:p31-style` (keeps this file in sync) or `npm run generate:design-token-docs`.");

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Rings");
  lines.push("");
  if (doc.rings) {
    const rrows = Object.entries(doc.rings).map(([k, v]) => [
      k,
      (v.hosts && v.hosts.join(", ")) || "—",
      v.defaultAppearance || "—",
      (v.notes && String(v.notes).replace(/\n/g, " ")) || "—",
    ]);
    lines.push(table(["Ring", "Hosts (sample)", "Default `appearance`", "Notes"], rrows));
  }
  lines.push("");

  lines.push("## Brand palette (shared across appearances)");
  lines.push("");
  const pal = doc.palette || {};
  const pRows = Object.entries(pal)
    .filter(([k]) => k !== "comment")
    .map(([k, v]) => {
      return [k, "`" + v + "`", "`--p31-" + k + "` (in :root)"];
    });
  if (doc.palette?.comment) {
    lines.push(`*${doc.palette.comment}*`);
    lines.push("");
  }
  lines.push(table(["Token", "Hex (canonical)", "CSS variable"], pRows));

  lines.push("");
  lines.push("## Typography");
  lines.push("");
  const tf = doc.typography?.fontFamilies;
  if (tf) {
    lines.push("### Font stacks");
    lines.push("");
    lines.push(
      table(["Role", "Families (JSON order)", "CSS variable"], [
        [
          "sans",
          (tf.sans && tf.sans.join(", ")) || "—",
          "`--p31-font-sans`",
        ],
        [
          "mono",
          (tf.mono && tf.mono.join(", ")) || "—",
          "`--p31-font-mono`",
        ],
      ]),
    );
    lines.push("");
  }
  const scale = doc.typography?.scaleRem;
  if (scale) {
    lines.push("### Type scale (rem)");
    lines.push("");
    const srows = Object.entries(scale).map(([k, v]) => [k, v, `--p31-text-${k}`]);
    lines.push(table(["Key", "Value", "CSS variable"], srows));
    lines.push("");
  }
  const lh = doc.typography?.lineHeight;
  if (lh) {
    lines.push("### Line height");
    lines.push("");
    lines.push(
      table(
        ["Key", "Value", "CSS variable"],
        Object.entries(lh).map(([k, v]) => [k, v, `--p31-leading-${k}`]),
      ),
    );
    lines.push("");
  }
  const tr = doc.typography?.letterSpacing;
  if (tr) {
    lines.push("### Letter spacing");
    lines.push("");
    lines.push(
      table(
        ["Key", "Value", "CSS variable"],
        Object.entries(tr).map(([k, v]) => [k, v, `--p31-tracking-${k}`]),
      ),
    );
    lines.push("");
  }

  lines.push("## Spacing");
  lines.push("");
  const sp = doc.space || {};
  lines.push(
    table(
      ["Key", "Value", "CSS variable"],
      Object.entries(sp).map(([k, v]) => [k, v, `--p31-space-${k}`]),
    ),
  );
  lines.push("");

  lines.push("## Radius, shadow, motion, z-index, focus");
  lines.push("");

  const rad = doc.radius;
  if (rad) {
    lines.push("### Border radius");
    lines.push("");
    lines.push(
      table(
        ["Key", "Value", "CSS variable"],
        Object.entries(rad).map(([k, v]) => [k, v, `--p31-radius-${k}`]),
      ),
    );
    lines.push("");
  }
  const sh = doc.shadow;
  if (sh) {
    lines.push("### Shadow");
    lines.push("");
    lines.push(
      table(
        ["Key", "Value", "CSS variable"],
        Object.entries(sh).map(([k, v]) => [k, v, `--p31-shadow-${k}`]),
      ),
    );
    lines.push("");
  }
  const mo = doc.motion;
  if (mo) {
    if (mo.durationMs) {
      lines.push("### Motion — duration (ms in CSS, emitted with `ms` suffix in file)");
      lines.push("");
      lines.push(
        table(
          ["Key", "Value (ms)", "CSS variable"],
          Object.entries(mo.durationMs).map(([k, v]) => [k, v, `--p31-duration-${k}`]),
        ),
      );
      lines.push("");
    }
    if (mo.easing) {
      lines.push("### Motion — easing");
      lines.push("");
      lines.push(
        table(
          ["Key", "Easing", "CSS variable"],
          Object.entries(mo.easing).map(([k, v]) => [k, `\`${v}\``, `--p31-ease-${k}`]),
        ),
      );
      lines.push("");
    }
  }
  const z = doc.zIndex;
  if (z) {
    lines.push("### z-index");
    lines.push("");
    lines.push(
      table(
        ["Key", "Value", "CSS variable"],
        Object.entries(z).map(([k, v]) => [k, v, `--p31-z-${k}`]),
      ),
    );
    lines.push("");
  }
  const fo = doc.focus;
  if (fo) {
    lines.push("### Focus ring");
    lines.push("");
    lines.push(
      table(
        ["Key", "Value", "CSS variable / note"],
        [
          ["ringWidth", fo.ringWidth, "`--p31-focus-ring`"],
          ["ringOffset", fo.ringOffset, "`--p31-focus-offset`"],
          ["hubRingColor", fo.hubRingColor, "`--p31-focus-color-hub`"],
          ["orgRingColor", fo.orgRingColor, "`--p31-focus-color-org`"],
        ],
      ),
    );
    lines.push("");
  }

  lines.push("## Appearances (hub vs org)");
  lines.push("");
  lines.push("Brand accents must match the palette above; neutrals differ. Hub is default; org uses `data-p31-appearance=\"org\"` on a root (usually `<html>`).");
  lines.push("");

  for (const apName of Object.keys(doc.appearances || {})) {
    const a = doc.appearances[apName];
    lines.push(`### \`${apName}\``);
    lines.push("");
    lines.push(
      table(["Field", "Value"], [
        ["`colorScheme`", a.colorScheme || "—"],
        ["`themeColor`", a.themeColor || "—"],
      ]),
    );
    lines.push("");
    if (a.comment) {
      lines.push(`*${a.comment}*`);
      lines.push("");
    }
    if (a.colors) {
      lines.push("**Surface colors (same keys as --p31-*)**");
      lines.push("");
      const crows = Object.entries(a.colors).map(([k, v]) => [k, v, `--p31-${k}`]);
      lines.push(table(["Role", "Hex", "CSS variable"], crows));
      lines.push("");
    }
    if (a.semantic) {
      lines.push("**Semantic**");
      lines.push("");
      lines.push(
        table(
          ["Key", "Value", "CSS variable"],
          [
            [
              "borderSubtle",
              a.semantic.borderSubtle,
              "--p31-border-subtle (appearance block)",
            ],
          ],
        ),
      );
      lines.push("");
    }
    if (a.glass) {
      lines.push("**Glass**");
      lines.push("");
      lines.push(
        table(
          ["Key", "Value", "CSS variable"],
          [
            ["border", a.glass.border, "--p31-glass-border"],
            ["surface", a.glass.surface, "--p31-glass-surface"],
          ],
        ),
      );
      lines.push("");
    }
  }

  lines.push("## Tailwind CDN bridge (hub)");
  lines.push("");
  lines.push("`p31ca/public/p31-tailwind-extend.js` sets `window.P31_TAILWIND_EXTEND` with `fontFamily` and `colors` (Tailwind v3 `theme.extend` shape). **Color values** in JS are `var(--p31-<name>)` for each key under `appearances.hub.colors`.");
  lines.push("");

  lines.push("## See also");
  lines.push("");
  lines.push("- [`README.md`](./README.md) — how to change tokens");
  lines.push("- [`PHOSPHORUS31-RING.md`](./PHOSPHORUS31-RING.md) — org / light skin on phosphorus31.org");
  lines.push("- Home repo `docs/ETHICAL-STYLE-MAP.md` — voice, motion ethics, and psychology (complements this file)");
  lines.push("");

  return lines.join("\n");
}

function main() {
  if (!fs.existsSync(canonPath)) {
    console.error("generate-reference: missing", canonPath);
    process.exit(1);
  }
  const doc = JSON.parse(fs.readFileSync(canonPath, "utf8"));
  const md = buildDesignTokenReferenceMd(doc, { generatedAt: new Date().toISOString() });
  fs.writeFileSync(outPath, md, "utf8");
  console.log("generate-reference: wrote", outPath);
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
