#!/usr/bin/env node
/**
 * Wires public/*.html Tailwind CDN pages to canonical p31-style:
 * /p31-style.css, /p31-tailwind-extend.js, extend: { ...window.P31_TAILWIND_EXTEND, ... }.
 * Idempotent: skips pages already using P31_TAILWIND_EXTEND.
 * Invoked by apply-p31-style; alignment: p31-alignment.json "canon-to-style-css" + verify:p31-style.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(__dirname, "..", "public");

const STYLE_LINK = '<link rel="stylesheet" href="/p31-style.css">';
const CDN = '<script src="https://cdn.tailwindcss.com"></script>';
const EXT_SCRIPT = '<script src="/p31-tailwind-extend.js"></script>';

/** Remove first top-level `key: { ... }` from JS object literal body */
function removeKeyBlock(body, key) {
  const re = new RegExp(`\\b${key}\\s*:\\s*\\{`);
  const m = re.exec(body);
  if (!m) return body;
  const start = m.index;
  const brace0 = body.indexOf("{", start);
  let d = 0;
  for (let i = brace0; i < body.length; i++) {
    if (body[i] === "{") d++;
    else if (body[i] === "}") {
      d--;
      if (d === 0) {
        const end = i + 1;
        const before = body.slice(0, start).replace(/,\s*$/u, "");
        const after = body.slice(end).replace(/^\s*,\s*/u, "");
        return `${before}${before && after ? ", " : ""}${after}`.trim();
      }
    }
  }
  return body;
}

function transformHtml(html) {
  if (!html.includes("cdn.tailwindcss.com")) return { html, changed: false };
  if (!html.includes("tailwind.config")) return { html, changed: false };

  let out = html;
  let changed = false;

  if (!out.includes("P31_TAILWIND_EXTEND")) {
    if (!out.includes("/p31-style.css")) {
      if (!out.includes(CDN)) return { html, changed: false };
      out = out.replace(CDN, `${STYLE_LINK}\n    ${CDN}`);
      changed = true;
    }

    if (!out.includes("/p31-tailwind-extend.js")) {
      out = out.replace(CDN, `${CDN}\n    ${EXT_SCRIPT}`);
      changed = true;
    }
  } else {
    if (!out.includes("/p31-style.css") && out.includes(CDN)) {
      out = out.replace(CDN, `${STYLE_LINK}\n    ${CDN}`);
      changed = true;
    }
    if (!out.includes("/p31-tailwind-extend.js") && out.includes(CDN)) {
      out = out.replace(CDN, `${CDN}\n    ${EXT_SCRIPT}`);
      changed = true;
    }
  }

  if (out.includes("P31_TAILWIND_EXTEND")) {
    return { html: out, changed };
  }

  const cfgIdx = out.indexOf("tailwind.config");
  if (cfgIdx === -1) return { html: out, changed };

  const extLabel = out.indexOf("extend:", cfgIdx);
  if (extLabel === -1) return { html: out, changed };

  const openBrace = out.indexOf("{", extLabel);
  if (openBrace === -1) return { html: out, changed };

  let depth = 0;
  let closeIdx = -1;
  for (let i = openBrace; i < out.length; i++) {
    const c = out[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        closeIdx = i;
        break;
      }
    }
  }
  if (closeIdx === -1) return { html: out, changed };

  const inner = out.slice(openBrace + 1, closeIdx);
  let rest = removeKeyBlock(inner, "fontFamily");
  rest = removeKeyBlock(rest, "colors");
  rest = rest.replace(/^,\s*/u, "").replace(/,\s*$/u, "").trim();

  const insertBlock =
    rest.length > 0
      ? `{\n                    ...window.P31_TAILWIND_EXTEND,\n                    ${rest}\n                }`
      : `{\n                    ...window.P31_TAILWIND_EXTEND\n                }`;

  out = out.slice(0, openBrace) + insertBlock + out.slice(closeIdx + 1);
  changed = true;

  return { html: out, changed };
}

let n = 0;
for (const name of fs.readdirSync(pub)) {
  if (!name.endsWith(".html")) continue;
  const fp = path.join(pub, name);
  const raw = fs.readFileSync(fp, "utf8");
  const { html, changed } = transformHtml(raw);
  if (changed) {
    fs.writeFileSync(fp, html, "utf8");
    console.log("sync-tailwind-cdn:", name);
    n++;
  }
}
console.log(`sync-tailwind-cdn-pages: updated ${n} file(s)`);
