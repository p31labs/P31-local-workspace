import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { MESHWORD_LEXICON, isValidMeshwordToken, randomInt } from "../lib/p31-amusement-data";
import { scoreMeshwordGuess, tilesToEmoji } from "../lib/meshword-engine";
import { seededIndex, utcYmd } from "../lib/amusement-seed";

type MeshwordState = {
  word: string;
  guesses: string[];
  kind: "random" | "daily";
  /** UTC date for daily boards — rolls over at UTC midnight */
  ymd: string;
};

const MAX_TRIES = 6;
const sessions = new Map<string, MeshwordState>();

function pickWord(): string {
  return MESHWORD_LEXICON[randomInt(MESHWORD_LEXICON.length)]!;
}

function dailyWord(): string {
  const y = utcYmd();
  const i = seededIndex(MESHWORD_LEXICON.length, `meshword-daily:${y}`);
  return MESHWORD_LEXICON[i]!;
}

function rollDailyIfStale(state: MeshwordState): void {
  if (state.kind !== "daily") return;
  const y = utcYmd();
  if (state.ymd !== y) {
    state.ymd = y;
    state.word = dailyWord();
    state.guesses = [];
  }
}

export class MeshwordCommand implements P31Command {
  name = "meshword";
  description = "Wordle-style 5-letter puzzle — random or UTC-daily (shared word worldwide)";
  aliases = ["wordle", "mw"];
  usage =
    "meshword • meshword daily • meshword WORD • meshword guess WORD • meshword abandon";

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const cid = message.channel.id;
    const first = args[0]?.toLowerCase();

    if (first === "daily") {
      const y = utcYmd();
      const w = dailyWord();
      sessions.set(cid, { word: w, guesses: [], kind: "daily", ymd: y });
      await message.reply(
        [
          `📅 **Meshword — daily (${y} UTC)**`,
          "Same secret word for every channel today (each channel has its own guess board).",
          "**6** tries · lexicon guesses only.",
          `Guess: \`${prefix}meshword SPOON\``,
          "🟩 · 🟨 · ⬛",
        ].join("\n"),
      );
      return;
    }

    if (!first || first === "new" || first === "start") {
      const word = pickWord();
      sessions.set(cid, { word, guesses: [], kind: "random", ymd: utcYmd() });
      await message.reply(
        [
          "🔠 **Meshword** — 6 tries, **dictionary guesses only** (same list as the answer).",
          `Random round. For the UTC daily: \`${prefix}meshword daily\`.`,
          `Reply with \`${prefix}meshword GRAPH\` or \`${prefix}meshword guess GRAPH\`.`,
          "🟩 right letter & slot · 🟨 right letter, wrong slot · ⬛ not in the word",
        ].join("\n"),
      );
      return;
    }

    if (first === "abandon" || first === "forfeit" || first === "quit") {
      sessions.delete(cid);
      await message.reply("Game cleared. The mesh forgives unfinished side quests.");
      return;
    }

    const raw = first === "guess" ? args[1] : args[0];
    const guess = raw?.toUpperCase() ?? "";
    if (!/^[A-Z]{5}$/.test(guess)) {
      await message.reply(
        `Give a **5-letter** A–Z guess, e.g. \`${prefix}meshword SPOON\`.`,
      );
      return;
    }
    if (!isValidMeshwordToken(guess)) {
      await message.reply(
        `**\`${guess}\`** isn't in the Meshword lexicon — try another 5-letter from the stack.`,
      );
      return;
    }

    const state = sessions.get(cid);
    if (!state) {
      await message.reply(`No active game — \`${prefix}meshword\` or \`${prefix}meshword daily\`.`);
      return;
    }
    rollDailyIfStale(state);

    if (state.guesses.length >= MAX_TRIES) {
      await message.reply(
        `Out of tries — the word was **${state.word}**. Run \`${prefix}meshword\` to play again.`,
      );
      sessions.delete(cid);
      return;
    }
    if (state.guesses.includes(guess)) {
      await message.reply("You already tried that word — pick a different route.");
      return;
    }

    state.guesses.push(guess);
    const tiles = scoreMeshwordGuess(state.word, guess);
    const row = tilesToEmoji(tiles);
    const modeLabel = state.kind === "daily" ? `daily ${state.ymd} UTC` : "random";

    if (guess === state.word) {
      const embed = new EmbedBuilder()
        .setTitle("🟩 Meshword solved")
        .setColor(0x22c55e)
        .setDescription(
          [
            `**${guess}** — ${state.guesses.length}/${MAX_TRIES} · _${modeLabel}_`,
            ...state.guesses.map((g, i) => {
              const t = scoreMeshwordGuess(state.word, g);
              return `${tilesToEmoji(t)}  \`${g}\`${i === state.guesses.length - 1 ? "  ←" : ""}`;
            }),
          ].join("\n"),
        );
      sessions.delete(cid);
      await message.reply({ embeds: [embed] });
      return;
    }

    if (state.guesses.length >= MAX_TRIES) {
      const embed = new EmbedBuilder()
        .setTitle("⬛ Meshword — out of runway")
        .setColor(0xf97316)
        .setDescription(
          [
            `The word was **${state.word}** · _${modeLabel}_`,
            ...state.guesses.map((g) => {
              const t = scoreMeshwordGuess(state.word, g);
              return `${tilesToEmoji(t)}  \`${g}\``;
            }),
          ].join("\n"),
        );
      sessions.delete(cid);
      await message.reply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🔠 Meshword — ${state.guesses.length}/${MAX_TRIES} (${modeLabel})`)
      .setColor(0x6366f1)
      .setDescription(
        [
          ...state.guesses.map((g) => {
            const t = scoreMeshwordGuess(state.word, g);
            return `${tilesToEmoji(t)}  \`${g}\``;
          }),
          "",
          `Latest: **${row}**  \`${guess}\``,
        ].join("\n"),
      )
      .setFooter({ text: "Lexicon-only guesses keep the puzzle fair on small servers." });
    await message.reply({ embeds: [embed] });
  }
}
