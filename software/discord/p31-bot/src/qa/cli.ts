#!/usr/bin/env node
/**
 * P31 Discord bot — QA suite CLI (inspect · manifest sync · simulation · upgrade report).
 * Run after build: node dist/qa/cli.js [all|inspect|sync|simulate|upgrade|sync-check]
 */
import * as path from "path";
import { runInspect } from "./inspect";
import { writeManifest, verifyManifest, packageRootFromDist } from "./syncManifest";
import { runSimulation } from "./simulate";
import { runUpgradeReport } from "./upgradeReport";

function printBanner(title: string): void {
  console.log(`\n=== ${title} ===\n`);
}

async function main(): Promise<void> {
  const mode = (process.argv[2] || "all").toLowerCase();
  const root = packageRootFromDist();

  if (mode === "inspect" || mode === "all") {
    printBanner("inspect");
    const r = runInspect();
    if (r.issues.length) {
      console.error(r.issues.join("\n"));
      process.exitCode = 1;
    } else {
      console.log("OK — registry + content invariants");
    }
    if (mode === "inspect") return;
  }

  if (mode === "sync" || mode === "all") {
    printBanner("sync manifest");
    const m = writeManifest(root);
    console.log(`Wrote ${path.relative(root, path.join(root, "generated", "p31-bot.manifest.json"))}`);
    console.log(`Fingerprint ${m.registryFingerprint} · ${m.commands.length} commands`);
    if (mode === "sync") return;
  }

  if (mode === "sync-check") {
    printBanner("sync-check");
    const v = verifyManifest(root);
    if (!v.ok) {
      console.error(
        v.found === undefined
          ? "No manifest — run: npm run sync:bot"
          : `Drift: expected ${v.expected} found ${v.found}`,
      );
      process.exit(1);
    }
    console.log("OK — manifest matches registry");
    return;
  }

  if (mode === "simulate" || mode === "all") {
    printBanner("simulate (offline commands)");
    const sim = await runSimulation(process.env.BOT_PREFIX || "p31");
    for (const s of sim.steps) {
      const mark = s.ok ? "✓" : "✗";
      console.log(`${mark} ${s.line}${s.detail ? ` — ${s.detail}` : ""}`);
    }
    if (!sim.ok) process.exitCode = 1;
    if (mode === "simulate") return;
  }

  if (mode === "upgrade" || mode === "all") {
    printBanner("upgrade report (npm outdated)");
    const u = runUpgradeReport(root);
    if (u.outdatedCount === 0) {
      console.log("No outdated packages (npm outdated).");
    } else {
      console.log(`${u.outdatedCount} outdated: ${u.packages.join(", ")}`);
      console.log("Run npm update / bump majors deliberately — not auto-applied.");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
