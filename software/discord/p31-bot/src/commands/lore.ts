import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { LORE_SNIPPETS, randomInt } from "../lib/p31-amusement-data";

export class LoreCommand implements P31Command {
  name = "lore";
  description = "Micro-lore vignettes from the mesh canon (original flavor text)";
  aliases = ["micro", "vignette", "snippet"];
  usage = "lore";

  async execute(context: CommandContext): Promise<void> {
    const line = LORE_SNIPPETS[randomInt(LORE_SNIPPETS.length)]!;
    const embed = new EmbedBuilder()
      .setTitle("📜 Lore drop")
      .setColor(0xc084fc)
      .setDescription(line)
      .setFooter({ text: "Fictional texture — not legal/medical advice." });
    await context.message.reply({ embeds: [embed] });
  }
}
