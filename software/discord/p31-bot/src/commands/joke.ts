import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import {
  type JokeDeck,
  jokesForDeck,
  randomInt,
} from "../lib/p31-amusement-data";

export class JokeCommand implements P31Command {
  name = "joke";
  description = "Curated jokes — mix, dev, mesh, or dad tier";
  aliases = ["jk", "lol"];
  usage = "joke [mix|dev|mesh|dad]";

  async execute(context: CommandContext): Promise<void> {
    const deckArg = context.args[0]?.toLowerCase();
    let deck: JokeDeck = "mix";
    if (deckArg === "dev" || deckArg === "mesh" || deckArg === "dad" || deckArg === "mix") {
      deck = deckArg;
    }
    const list = jokesForDeck(deck);
    const joke = list[randomInt(list.length)]!;
    const embed = new EmbedBuilder()
      .setTitle(`🎭 Joke — ${deck}`)
      .setColor(0xf59e0b)
      .setDescription(joke)
      .setFooter({ text: "No API key required. Groans are BYO." });
    await context.message.reply({ embeds: [embed] });
  }
}
