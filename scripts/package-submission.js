#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { join } from "node:path";

const GRANTS = "docs/grants";
const SUBS = ["NGI-TALER-SUBMISSION.md", "NGI-FEDIVERSITY-SUBMISSION.md"];
const PAYLOADS = join(GRANTS, "payloads");
const PORTALS = {
  TALER: "https://nlnet.nl/taler/",
  FEDIVERSITY: "https://nlnet.nl/fediversity/",
};
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const OUT_DIR = join("out", `ngi-submission-${stamp}`);

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (e) {
    return `ERR: ${e.stderr || e.message}`;
  }
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const readme = [
    "P31 Labs — NGI Submission Package",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Contents:",
    "  <proposal>.md / .html / .docx  — the two NGI proposals",
    "  payloads/                          — evidence bundle",
    "",
    "Upload to the NLnet portals:",
    `  TALER:        ${PORTALS.TALER}`,
    `  FEDIVERSITY:  ${PORTALS.FEDIVERSITY}`,
    "",
    "PDF not emitted: install a pandoc PDF engine (pdflatex / wkhtmltopdf)",
    "to also produce .pdf; HTML and DOCX are accepted by NLnet.",
  ];

  for (const f of SUBS) {
    const src = join(GRANTS, f);
    const base = f.replace(/\.md$/, "");
    fs.copyFileSync(src, join(OUT_DIR, f));
    const html = run("pandoc", [src, "-o", join(OUT_DIR, `${base}.html`), "--embed-resources", "--standalone"]);
    const docx = run("pandoc", [src, "-o", join(OUT_DIR, `${base}.docx`)]);
    console.log(`• ${f}: md copied; html=${html === "" ? "ok" : html}; docx=${docx === "" ? "ok" : docx}`);
  }

  if (fs.existsSync(PAYLOADS)) {
    fs.cpSync(PAYLOADS, join(OUT_DIR, "payloads"), { recursive: true });
    console.log("• payloads/ copied");
  } else {
    console.log("! payloads/ not found — skipped");
  }

  fs.writeFileSync(join(OUT_DIR, "README.txt"), readme.join("\n"));

  const zipName = `${OUT_DIR}.zip`;
  const zr = run("zip", ["-r", "-q", zipName, OUT_DIR]);
  console.log(`\nPackage: ${zipName}${zr ? " (" + zr + ")" : ""}`);
  console.log(`Portal TALER:       ${PORTALS.TALER}`);
  console.log(`Portal FEDIVERSITY: ${PORTALS.FEDIVERSITY}`);
}

main();
