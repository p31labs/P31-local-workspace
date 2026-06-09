import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import {
  ANAGRAM_PUZZLES,
  DEEP_FACTS,
  FORTUNES,
  RIDDLES,
  WOULD_YOU_RATHER,
  randomInt,
  shuffleWord,
} from "../lib/p31-amusement-data";

const DEEP_MENU_BLURB = "🫧 **Deep menu** — rabbit holes without API keys.";

export class DeepCommand implements P31Command {
  name = "deep";
  description = "Deeper cuts: would-you-rather, riddles, fortunes, facts, anagrams";
  aliases = ["deeper", "rabbit"];
  usage =
    "deep • deep wyr • deep riddle [answer] • deep fortune • deep fact • deep anagram [WORD]";

  private static riddleIdx = new Map<string, number>();
  private static anagram = new Map<string, { answer: string; scrambled: string; clue: string }>();

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const cid = message.channel.id;
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === "help" || sub === "menu") {
      await message.reply(
        [
          DEEP_MENU_BLURB,
          `\`${prefix}deep wyr\` — would you rather`,
          `\`${prefix}deep riddle\` · \`${prefix}deep riddle answer\``,
          `\`${prefix}deep fortune\` · \`${prefix}deep fact\``,
          `\`${prefix}deep anagram\` · \`${prefix}deep anagram GRAPH\``,
          `More: \`${prefix}qclock\` (quantum clock + deck) · \`${prefix}tetra\` · \`${prefix}meshword\` / \`daily\` · \`${prefix}trivia daily\` · \`${prefix}chain\` · \`${prefix}paradox\` · \`${prefix}hangman\` · \`${prefix}drift\` · \`${prefix}lore\` · \`${prefix}play number\`.`,
        ].join("\n"),
      );
      return;
    }

    if (sub === "wyr" || sub === "rather" || sub === "choose") {
      const pair = WOULD_YOU_RATHER[randomInt(WOULD_YOU_RATHER.length)]!;
      const embed = new EmbedBuilder()
        .setTitle("⚖️ Would you rather…")
        .setColor(0xec4899)
        .setDescription(
          [`**A)** ${pair.a}`, "", `**B)** ${pair.b}`, "", "_React with your gut — no wrong mesh._"].join(
            "\n",
          ),
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    if (sub === "fortune" || sub === "cookie") {
      const line = FORTUNES[randomInt(FORTUNES.length)]!;
      const embed = new EmbedBuilder()
        .setTitle("🥠 Mesh fortune")
        .setColor(0xf59e0b)
        .setDescription(line);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (sub === "fact") {
      const line = DEEP_FACTS[randomInt(DEEP_FACTS.length)]!;
      const embed = new EmbedBuilder()
        .setTitle("🧬 Deep fact (snack-sized)")
        .setColor(0x06b6d4)
        .setDescription(line);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (sub === "riddle") {
      const mode = args[1]?.toLowerCase();
      if (mode === "answer" || mode === "reveal") {
        const idx = DeepCommand.riddleIdx.get(cid);
        if (idx === undefined) {
          await message.reply(`No riddle queued — try \`${prefix}deep riddle\`.`);
          return;
        }
        const card = RIDDLES[idx]!;
        const embed = new EmbedBuilder()
          .setTitle("🧩 Riddle — answer")
          .setColor(0x9c27b0)
          .setDescription(`_${card.q}_\n\n**${card.a}**`);
        await message.reply({ embeds: [embed] });
        return;
      }
      const idx = randomInt(RIDDLES.length);
      DeepCommand.riddleIdx.set(cid, idx);
      const card = RIDDLES[idx]!;
      const embed = new EmbedBuilder()
        .setTitle("🧩 Riddle")
        .setColor(0x8b5cf6)
        .setDescription(
          `${card.q}\n\n— \`${prefix}deep riddle answer\` when you give up (or win and want proof).`,
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    if (sub === "anagram") {
      const guessParts = args.slice(1).filter(Boolean);
      const guessRaw = guessParts.join("").toUpperCase();

      if (!guessRaw) {
        const puzzle = ANAGRAM_PUZZLES[randomInt(ANAGRAM_PUZZLES.length)]!;
        const scrambled = shuffleWord(puzzle.answer, Math.random);
        DeepCommand.anagram.set(cid, {
          answer: puzzle.answer.toUpperCase(),
          scrambled,
          clue: puzzle.clue,
        });
        const embed = new EmbedBuilder()
          .setTitle("🔀 Anagram")
          .setColor(0x10b981)
          .setDescription(
            [
              `**Clue:** ${puzzle.clue}`,
              "",
              `**Letters:** \`${scrambled}\``,
              "",
              `\`${prefix}deep anagram YOURGUESS\``,
            ].join("\n"),
          );
        await message.reply({ embeds: [embed] });
        return;
      }

      const active = DeepCommand.anagram.get(cid);
      if (!active) {
        await message.reply(`No anagram active — run \`${prefix}deep anagram\` first.`);
        return;
      }
      if (guessRaw === active.answer) {
        DeepCommand.anagram.delete(cid);
        await message.reply(`✅ **${active.answer}** — unscrambled. Big brain / big mesh energy.`);
        return;
      }
      await message.reply(
        `Not quite — try again, or \`${prefix}deep anagram\` for a fresh scramble.`,
      );
      return;
    }

    await message.reply(`Unknown subcommand. Try \`${prefix}deep\` for the menu.`);
  }
}
