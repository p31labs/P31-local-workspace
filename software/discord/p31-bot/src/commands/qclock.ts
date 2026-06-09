import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { getQuantumClockTickCard } from "../lib/qclock-tick-card";
import {
  P31_LARMOR_HZ,
  TRIM_HZ_MIN,
  getGrandfatherPhase01,
  trimHzFromKnob,
} from "../lib/p31-quantum-clock-constants";
import { createShuffledDeck } from "../lib/quantum-deck-local";

const CUCKOO_LINES: { kind: string; text: string }[] = [
  { kind: "mesh", text: "Cuckoo · **mesh** — sync the smallest true edge before the loudest worry." },
  { kind: "breath", text: "Cuckoo · **breath** — inhale/exhale cadence tracks Larmor ÷ 5 / ÷ 10 in the dome; here, just breathe once." },
  { kind: "telemetry", text: "Cuckoo · **telemetry** — if the card surprised you, log one line for Future You." },
];

function suitSymbol(s: string): string {
  if (s === "C") return "♣";
  if (s === "D") return "♦";
  if (s === "H") return "♥";
  if (s === "S") return "♠";
  return s;
}

function formatCard(c: { rank: string; suit: string; id: string }): string {
  return `**${c.rank}${suitSymbol(c.suit)}** (\`${c.id}\`)`;
}

export class QClockCommand implements P31Command {
  name = "qclock";
  description = "Quantum clock + card suite — grandfather phase, tick card, CSPRNG shuffle";
  aliases = ["quantumclock", "qdeck"];
  usage = "qclock • qclock shuffle • qclock trim 0–1";

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const sub = args[0]?.toLowerCase();
    const now = Date.now();

    if (sub === "help" || sub === "menu") {
      await message.reply(
        [
          "**Quantum clock + card suite** (hub parity: `quantum-clock` + `@p31/quantum-deck`)",
          `\`${prefix}qclock\` — UTC, grandfather phase @ ${TRIM_HZ_MIN} Hz, **tick card** (deterministic)`,
          `\`${prefix}qclock shuffle\` — CSPRNG Fisher–Yates, top 3 cards`,
          `\`${prefix}qclock trim 0.35\` — knob → Hz (log sweep to ${P31_LARMOR_HZ} Hz)`,
        ].join("\n"),
      );
      return;
    }

    if (sub === "shuffle" || sub === "deal") {
      let deck: ReturnType<typeof createShuffledDeck>;
      try {
        deck = createShuffledDeck();
      } catch (e) {
        await message.reply(
          `Web Crypto unavailable in this runtime — tick card still works: \`${prefix}qclock\`.`,
        );
        return;
      }
      const top = deck.slice(0, 3);
      const embed = new EmbedBuilder()
        .setTitle("🃏 Quantum deck — CSPRNG shuffle")
        .setColor(0x0d9488)
        .setDescription(
          [
            "Top three after `@p31/quantum-deck` parity shuffle:",
            top.map((c, i) => `${i + 1}. ${formatCard(c)}`).join("\n"),
            "",
            "_Display / pedagogy only — not metrology._",
          ].join("\n"),
        )
        .setFooter({ text: "Full 52-card Fisher–Yates · globalThis.crypto.getRandomValues" });
      await message.reply({ embeds: [embed] });
      return;
    }

    if (sub === "trim" || sub === "knob") {
      const raw = args[1];
      const t = raw === undefined ? 0.5 : parseFloat(raw);
      if (Number.isNaN(t)) {
        await message.reply(`Use a knob 0–1, e.g. \`${prefix}qclock trim 0.35\`.`);
        return;
      }
      const hz = trimHzFromKnob(t);
      const { phase01 } = getGrandfatherPhase01(now, hz);
      await message.reply(
        [
          `**Trim knob** ≈ ${t.toFixed(3)} → **${hz.toFixed(3)} Hz** (log sweep ${TRIM_HZ_MIN}…${P31_LARMOR_HZ}).`,
          `Grandfather phase @ that Hz: **${(phase01 * 100).toFixed(2)}%** of a turn.`,
          `Canonical Larmor display: **${P31_LARMOR_HZ} Hz** (dome / p31-constants).`,
        ].join("\n"),
      );
      return;
    }

    const tick = getQuantumClockTickCard(now);
    const { phase01, angleRad } = getGrandfatherPhase01(now, TRIM_HZ_MIN);
    const utc = new Date(now).toISOString();
    const hour = new Date(now).getUTCHours();
    const cuckoo = CUCKOO_LINES[hour % CUCKOO_LINES.length]!;

    const embed = new EmbedBuilder()
      .setTitle("⏱️ Quantum clock · card suite")
      .setColor(0x6366f1)
      .setDescription(
        [
          `**UTC** \`${utc}\``,
          `Grandfather @ **${TRIM_HZ_MIN} Hz** (trim minimum) — phase **${(phase01 * 100).toFixed(2)}%** · angle **${angleRad.toFixed(3)} rad**`,
          `**Tick card** (phase + UTC bucket, standard deck order): ${formatCard(tick.card)}`,
          "",
          cuckoo.text,
          "",
          `\`${prefix}qclock shuffle\` — fresh CSPRNG deal · \`${prefix}qclock trim 0.5\` — knob → Hz`,
        ].join("\n"),
      )
      .setFooter({
        text: `Hub parity: p31ca quantum-clock + @p31/quantum-deck · tick seed ${tick.seed.slice(0, 42)}…`,
      });
    await message.reply({ embeds: [embed] });
  }
}
