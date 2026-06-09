#!/usr/bin/env node
/**
 * new-page — scaffold a new p31ca public HTML surface from the canonical template.
 *
 * Usage:
 *   npm run new:page <slug> [<Title>]
 *   npm run new:page donate "Donate"
 *   npm run new:page security-policy "Security Policy"
 *
 * Writes:  public/<slug>.html   (fails if already exists unless --force)
 * Skips:   hub registry, _redirects — operator adds those manually after reviewing the page.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31caRoot = path.join(__dirname, "..");

const args = process.argv.slice(2);
const force = args.includes("--force");
const clean = args.filter((a) => !a.startsWith("--"));

if (!clean.length) {
  console.error("new-page: usage: npm run new:page <slug> [Title Words]");
  console.error("  example: npm run new:page security-policy 'Security Policy'");
  process.exit(1);
}

const slug = clean[0].replace(/\.html$/, "").replace(/[^a-z0-9-]/g, "-").toLowerCase();
const rawTitle = clean.slice(1).join(" ") || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const title = rawTitle;
const description = `${title} — P31 Labs`;
const section = "P31 Labs";

const templatePath = path.join(p31caRoot, "templates", "p31-page.html");
const outputPath = path.join(p31caRoot, "public", `${slug}.html`);

if (!fs.existsSync(templatePath)) {
  console.error(`new-page: template not found at ${templatePath}`);
  process.exit(1);
}

if (fs.existsSync(outputPath) && !force) {
  console.error(`new-page: ${outputPath} already exists — pass --force to overwrite`);
  process.exit(1);
}

let html = fs.readFileSync(templatePath, "utf8");
html = html
  .replace(/\{\{SLUG\}\}/g, slug)
  .replace(/\{\{TITLE\}\}/g, title)
  .replace(/\{\{DESCRIPTION\}\}/g, description)
  .replace(/\{\{SECTION\}\}/g, section);

fs.writeFileSync(outputPath, html, "utf8");

console.log(`new-page: created public/${slug}.html`);
console.log(`new-page: canonical stack — qmu-tokens · p31-style · shared-surface · gray-rock ✓`);
console.log(`new-page: next → edit the page, then wire into hub registry.mjs + hub-app-ids.mjs`);
