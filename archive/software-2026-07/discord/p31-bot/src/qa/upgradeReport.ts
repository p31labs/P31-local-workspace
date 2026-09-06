import { spawnSync } from "child_process";
import * as path from "path";

export type OutdatedRow = {
  current?: string;
  wanted?: string;
  latest?: string;
  dependent?: string;
};

export type UpgradeReport = {
  ok: boolean;
  outdatedCount: number;
  packages: string[];
  raw: Record<string, OutdatedRow>;
};

/** `npm outdated --json` — exit code may be 1 when anything is stale; stdout still parses. */
export function runUpgradeReport(pkgRoot: string): UpgradeReport {
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["outdated", "--json"], {
    cwd: path.resolve(pkgRoot),
    encoding: "utf8",
    shell: false,
  });
  let raw: Record<string, OutdatedRow> = {};
  try {
    raw = JSON.parse((r.stdout || "{}").trim() || "{}") as Record<string, OutdatedRow>;
  } catch {
    raw = {};
  }
  const packages = Object.keys(raw).sort();
  return {
    ok: true,
    outdatedCount: packages.length,
    packages,
    raw,
  };
}
