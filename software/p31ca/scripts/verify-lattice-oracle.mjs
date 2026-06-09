#!/usr/bin/env node
/**
 * Contract check for the Lattice Oracle (/oracle → /dome#oracle).
 * magic-crystal.html deleted Phase 2 housekeeping — Oracle is now a section of /dome.
 * Verifies: _redirects, ground-truth edgeRedirects, ground-truth routes.latticeOracle.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31ca = path.join(__dirname, "..");
const redirectsPath = path.join(p31ca, "public", "_redirects");
const gtPath = path.join(p31ca, "ground-truth", "p31.ground-truth.json");

function main() {
  const red = fs.readFileSync(redirectsPath, "utf8");
  if (!/\/oracle\s+\/dome#oracle/i.test(red)) {
    console.error("verify-lattice-oracle: public/_redirects must map /oracle -> /dome#oracle");
    process.exit(1);
  }

  const gt = JSON.parse(fs.readFileSync(gtPath, "utf8"));
  const r = gt.routes && gt.routes.latticeOracle;
  if (!r || r.path !== "/dome#oracle" || r.implementation !== "src/pages/dome.astro") {
    console.error("verify-lattice-oracle: ground-truth routes.latticeOracle path drift (expected /dome#oracle / src/pages/dome.astro)");
    process.exit(1);
  }
  const er = (gt.edgeRedirects || []).some(
    (e) => e.from === "/oracle" && e.to === "/dome#oracle" && e.status === 301
  );
  if (!er) {
    console.error("verify-lattice-oracle: ground-truth edgeRedirects missing /oracle -> /dome#oracle 301");
    process.exit(1);
  }

  console.log("verify-lattice-oracle: OK");
}

main();
