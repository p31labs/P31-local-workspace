import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { createBotRegistry } from "../boot/registerCommands";
import {
  TRIVIA_DECK,
  MESHWORD_LEXICON,
  PARADOX_CARDS,
  JOKES,
  RIDDLES,
  WOULD_YOU_RATHER,
  FORTUNES,
  DEEP_FACTS,
  LORE_SNIPPETS,
  CHAIN_STARTERS,
} from "../lib/p31-amusement-data";
import { TETRA_SPARKS } from "../lib/tetra-seal-data";
import { P31_LARMOR_HZ } from "../lib/p31-quantum-clock-constants";
import { createStandardDeck } from "../lib/quantum-deck-local";

export type BotManifest = {
  schema: "p31.discordBot.manifest/1.0.0";
  packageVersion: string;
  registryFingerprint: string;
  commands: Array<{
    name: string;
    aliases: string[];
    description: string;
    usage: string;
  }>;
  contentStats: Record<string, number>;
};

export function packageRootFromDist(): string {
  return path.resolve(__dirname, "..", "..");
}

export function buildManifest(root: string): BotManifest {
  const registry = createBotRegistry();
  const cmds = registry.getAll().sort((a, b) => a.name.localeCompare(b.name));
  const commandRows = cmds.map((c) => ({
    name: c.name,
    aliases: [...(c.aliases ?? [])].sort(),
    description: c.description,
    usage: c.usage,
  }));
  const registryFingerprint = crypto
    .createHash("sha256")
    .update(JSON.stringify(commandRows))
    .digest("hex")
    .slice(0, 24);

  const pkgPath = path.join(root, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version: string };

  return {
    schema: "p31.discordBot.manifest/1.0.0",
    // No generatedAt: deterministic build for drift detection; git log is the audit trail.
    // (Same pattern as home repo scripts/build-phos-voice-json.mjs line 205.)
    packageVersion: pkg.version,
    registryFingerprint,
    commands: commandRows,
    contentStats: {
      commands: cmds.length,
      triviaCards: TRIVIA_DECK.length,
      meshwordLexicon: MESHWORD_LEXICON.length,
      paradoxCards: PARADOX_CARDS.length,
      jokesCombined: JOKES.length,
      riddles: RIDDLES.length,
      wouldYouRather: WOULD_YOU_RATHER.length,
      fortunes: FORTUNES.length,
      deepFacts: DEEP_FACTS.length,
      loreSnippets: LORE_SNIPPETS.length,
      chainStarters: CHAIN_STARTERS.length,
      tetraSparks: TETRA_SPARKS.length,
      quantumClockLarmorHz: P31_LARMOR_HZ,
      quantumDeckCards: createStandardDeck().length,
    },
  };
}

export function manifestPath(root: string): string {
  return path.join(root, "generated", "p31-bot.manifest.json");
}

export function writeManifest(root: string): BotManifest {
  const m = buildManifest(root);
  const dest = manifestPath(root);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, `${JSON.stringify(m, null, 2)}\n`, "utf8");
  return m;
}

/** Returns true if on-disk manifest matches live registry fingerprint. */
export function verifyManifest(root: string): { ok: boolean; expected?: string; found?: string } {
  const dest = manifestPath(root);
  if (!fs.existsSync(dest)) {
    return { ok: false, expected: buildManifest(root).registryFingerprint, found: undefined };
  }
  const live = buildManifest(root).registryFingerprint;
  const disk = JSON.parse(fs.readFileSync(dest, "utf8")) as BotManifest;
  return {
    ok: disk.registryFingerprint === live,
    expected: live,
    found: disk.registryFingerprint,
  };
}
