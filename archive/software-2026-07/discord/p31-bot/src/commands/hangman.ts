import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { HANGMAN_MAX_WRONG, MESHWORD_LEXICON, randomInt } from "../lib/p31-amusement-data";

type HangState = {
  word: string;
  guessed: Set<string>;
  wrong: number;
};

const sessions = new Map<string, HangState>();

function mask(state: HangState): string {
  return state.word
    .split("")
    .map((c) => (state.guessed.has(c.toLowerCase()) ? c : "░"))
    .join(" ");
}

function won(state: HangState): boolean {
  const letters = new Set(state.word.toLowerCase().split(""));
  for (const ch of letters) {
    if (!state.guessed.has(ch)) return false;
  }
  return true;
}

export class HangmanCommand implements P31Command {
  name = "hangman";
  description = "Guess a 5-letter mesh word letter-by-letter";
  aliases = ["hm"];
  usage = "hangman • hangman new • hangman a • hangman reveal";

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const cid = message.channel.id;
    const first = args[0]?.toLowerCase();

    if (first === "help" || first === "menu") {
      await message.reply(
        [
          "🪢 **Hangman** — lexicon words, **one letter** per guess.",
          `\`${prefix}hangman\` / \`${prefix}hangman new\` — new word`,
          `\`${prefix}hangman e\` — guess letter`,
          `\`${prefix}hangman reveal\` — spoil + reset`,
          `Wrong limit: **${HANGMAN_MAX_WRONG}**`,
        ].join("\n"),
      );
      return;
    }

    if (first === "reveal" || first === "answer") {
      const st = sessions.get(cid);
      sessions.delete(cid);
      if (!st) {
        await message.reply("No game in flight.");
        return;
      }
      await message.reply(`The word was **${st.word}** — mesh reveals all eventually.`);
      return;
    }

    if (!first || first === "new" || first === "start") {
      const word = MESHWORD_LEXICON[randomInt(MESHWORD_LEXICON.length)]!;
      const state: HangState = { word, guessed: new Set(), wrong: 0 };
      sessions.set(cid, state);
      await message.reply(
        [
          `**${mask(state)}** · wrong **0/${HANGMAN_MAX_WRONG}**`,
          `\`${prefix}hangman z\` — guess a letter`,
        ].join("\n"),
      );
      return;
    }

    if (first.length !== 1 || !/^[a-z]$/i.test(first)) {
      await message.reply(`Guess **one letter**, e.g. \`${prefix}hangman t\`.`);
      return;
    }

    let state = sessions.get(cid);
    if (!state) {
      const word = MESHWORD_LEXICON[randomInt(MESHWORD_LEXICON.length)]!;
      state = { word, guessed: new Set(), wrong: 0 };
      sessions.set(cid, state);
    }

    const letter = first.toLowerCase();
    if (state.guessed.has(letter)) {
      await message.reply("You already guessed that letter.");
      return;
    }
    state.guessed.add(letter);
    const inWord = state.word.toLowerCase().includes(letter);
    if (!inWord) state.wrong += 1;

    if (won(state)) {
      sessions.delete(cid);
      await message.reply(`🎉 **${state.word}** — clean solve. Wrong guesses: **${state.wrong}**.`);
      return;
    }

    if (state.wrong >= HANGMAN_MAX_WRONG) {
      const w = state.word;
      sessions.delete(cid);
      await message.reply(
        `💀 Out of wrong guesses — **${w}**. \`${prefix}hangman\` for another.`,
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🪢 Hangman")
      .setColor(0x0ea5e9)
      .setDescription(
        [
          `**${mask(state)}**`,
          "",
          inWord ? `✅ **${letter.toUpperCase()}** is in the word.` : `❌ **${letter.toUpperCase()}** — not in word.`,
          "",
          `Wrong **${state.wrong}/${HANGMAN_MAX_WRONG}** · guessed: ${[...state.guessed].sort().join(", ") || "—"}`,
        ].join("\n"),
      );
    await message.reply({ embeds: [embed] });
  }
}
