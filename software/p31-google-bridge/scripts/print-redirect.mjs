import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const t = fs.readFileSync(path.join(root, "wrangler.toml"), "utf8");
const m = t.match(/REDIRECT_URL\s*=\s*"([^"]+)"/);
const r = m ? m[1] : null;
if (!r) {
  console.error("REDIRECT_URL not found in wrangler.toml");
  process.exit(1);
}
const base = r.replace("/oauth/google/callback", "");
console.log("Google Cloud Console → Client → Authorized redirect URIs (exact match):\n");
console.log(" ", r);
console.log("\nJavaScript origin (if needed for browser):");
console.log(" ", new URL(r).origin);
console.log("\nQuick start:");
console.log(" ", base + "/auth");
console.log(" ", base + "/setup");
