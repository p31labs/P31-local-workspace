import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { PARADOX_CARDS, randomInt } from "../lib/p31-amusement-data";

const LABELS = ["A", "B", "C"] as const;

type Pack = { text: string; lie: boolean };

function shufflePacks(rng: () => number, card: (typeof PARADOX_CARDS)[number]): {
  options: [string, string, string];
  lieIdx: 0 | 1 | 2;
  explain: string;
} {
  const packs: Pack[] = [
    { text: card.truths[0]!, lie: false },
    { text: card.truths[1]!, lie: false },
    { text: card.lie, lie: true },
  ];
  for (let i = packs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [packs[i], packs[j]] = [packs[j]!, packs[i]!];
  }
  const lieIdx = packs.findIndex((p) => p.lie) as 0 | 1 | 2;
  return {
    options: [packs[0]!.text, packs[1]!.text, packs[2]!.text],
    lieIdx,
    explain: card.explain,
  };
}

type ParadoxState = {
  options: [string, string, string];
  lieIdx: 0 | 1 | 2;
  explain: string;
};

export class ParadoxCommand implements P31Command {
  name = "paradox";
  description = "Two truths & a lie — mesh-lore edition";
  aliases = ["2t1f", "twotruths", "twotruthsonelie"];
  usage = "paradox • paradox a|b|c • paradox reveal";

  private static last = new Map<string, ParadoxState>();

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const cid = message.channel.id;
    const sub = args[0]?.toLowerCase();

    if (sub === "help" || sub === "menu") {
      await message.reply(
        [
          "🎭 **Two truths & a lie** — pick the fib.",
          `\`${prefix}paradox\` — new card`,
          `\`${prefix}paradox a\` / \`b\` / \`c\` — lock in`,
          `\`${prefix}paradox reveal\` — show the lie + teachable beat`,
        ].join("\n"),
      );
      return;
    }

    if (sub === "reveal" || sub === "answer") {
      const st = ParadoxCommand.last.get(cid);
      if (!st) {
        await message.reply(`No card — \`${prefix}paradox\` first.`);
        return;
      }
      const letter = LABELS[st.lieIdx];
      const lieText = st.options[st.lieIdx];
      const embed = new EmbedBuilder()
        .setTitle("🎭 The lie")
        .setColor(0x9c27b0)
        .setDescription(
          `**${letter}** was false:\n_${lieText}_\n\n✅ The rest were true.\n\n_${st.explain}_`,
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    if (/^[abc]$/.test(sub)) {
      const st = ParadoxCommand.last.get(cid);
      if (!st) {
        await message.reply(`No card — \`${prefix}paradox\` first.`);
        return;
      }
      const pick = (sub.charCodeAt(0) - "a".charCodeAt(0)) as 0 | 1 | 2;
      const ok = pick === st.lieIdx;
      const letter = LABELS[st.lieIdx];
      const lieText = st.options[st.lieIdx];
      const embed = new EmbedBuilder()
        .setTitle(ok ? "🎯 Got it" : "📚 Sharp eye anyway")
        .setColor(ok ? 0x22c55e : 0xf97316)
        .setDescription(
          ok
            ? `**${letter}** was the lie:\n_${lieText}_\n\n_${st.explain}_`
            : `The lie was **${letter}**:\n_${lieText}_\n\n_${st.explain}_`,
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    const card = PARADOX_CARDS[randomInt(PARADOX_CARDS.length)]!;
    const { options, lieIdx, explain } = shufflePacks(Math.random, card);
    ParadoxCommand.last.set(cid, { options, lieIdx, explain });
    const lines = options.map((t, i) => `**${LABELS[i]}** — ${t}`).join("\n\n");
    const embed = new EmbedBuilder()
      .setTitle("🎭 Two truths & a lie")
      .setColor(0x6366f1)
      .setDescription(`${lines}\n\n— \`${prefix}paradox a\` … \`c\` · reveal: \`${prefix}paradox reveal\``);
    await message.reply({ embeds: [embed] });
  }
}
