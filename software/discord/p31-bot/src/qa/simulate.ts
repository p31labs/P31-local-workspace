import { createBotRegistry } from "../boot/registerCommands";
import { dispatchPrefixCommand, type CapturedReply } from "./dispatch";

export type SimulationResult = {
  ok: boolean;
  steps: Array<{ line: string; ok: boolean; detail?: string }>;
};

function replyDigest(replies: CapturedReply[]): string {
  return replies
    .map((r) => {
      const bits = [r.content ?? ""];
      if (r.embeds?.length) bits.push(`[${r.embeds.length} embed(s)]`);
      return bits.join(" ");
    })
    .join(" | ");
}

function assertHealthy(replies: CapturedReply[], label: string): string | null {
  if (!replies.length) return `${label}: no reply`;
  const flat = replyDigest(replies);
  if (flat.includes("An error occurred")) return `${label}: handler error text`;
  return null;
}

type SimStep = { line: string; channelId: string };

/** Offline command smoke: shared channel ids where session state must carry over. */
const STEPS: SimStep[] = [
  { line: "help", channelId: "sim-help" },
  { line: "crew forge", channelId: "sim-crew" },
  { line: "joke mesh", channelId: "sim-joke" },
  { line: "trivia mesh", channelId: "sim-trivia" },
  { line: "trivia answer", channelId: "sim-trivia" },
  { line: "trivia stats", channelId: "sim-trivia" },
  { line: "play flip", channelId: "sim-play" },
  { line: "deep fact", channelId: "sim-deep" },
  { line: "meshword start", channelId: "sim-mw-a" },
  { line: "meshword abandon", channelId: "sim-mw-a" },
  { line: "chain start", channelId: "sim-chain" },
  { line: "paradox", channelId: "sim-paradox" },
  { line: "drift", channelId: "sim-drift" },
  { line: "lore", channelId: "sim-lore" },
  { line: "tetra start", channelId: "sim-tetra" },
  { line: "hangman new", channelId: "sim-hm" },
  { line: "qclock", channelId: "sim-qclock" },
  { line: "qclock trim 0.5", channelId: "sim-qclock" },
  { line: "qclock shuffle", channelId: "sim-qclock-sh" },
  { line: "meshword daily", channelId: "sim-mw-b" },
  { line: "meshword abandon", channelId: "sim-mw-b" },
  { line: "trivia daily", channelId: "sim-triv-d" },
];

export async function runSimulation(prefix = "p31"): Promise<SimulationResult> {
  const registry = createBotRegistry();
  const steps: SimulationResult["steps"] = [];
  let allOk = true;

  for (const { line, channelId } of STEPS) {
    try {
      const replies = await dispatchPrefixCommand(registry, prefix, line, {
        channelId,
        guildId: "sim-guild",
        userId: "sim-user",
      });
      const err = assertHealthy(replies, line);
      if (err) {
        allOk = false;
        steps.push({ line, ok: false, detail: err });
      } else {
        steps.push({ line, ok: true });
      }
    } catch (e) {
      allOk = false;
      steps.push({
        line,
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { ok: allOk, steps };
}
