import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { DRIFT_AFTER, DRIFT_BEFORE, DRIFT_MID, randomInt } from "../lib/p31-amusement-data";

export class DriftCommand implements P31Command {
  name = "drift";
  description = "Procedural changelog / commit-message drift — safe nonsense";
  aliases = ["changelog", "commitmsg", "shipnote"];
  usage = "drift";

  async execute(context: CommandContext): Promise<void> {
    const b = DRIFT_BEFORE[randomInt(DRIFT_BEFORE.length)]!;
    const m = DRIFT_MID[randomInt(DRIFT_MID.length)]!;
    const a = DRIFT_AFTER[randomInt(DRIFT_AFTER.length)]!;
    const line = `${b} ${m} ${a}`;
    const embed = new EmbedBuilder()
      .setTitle("🌫️ Drift log")
      .setColor(0x64748b)
      .setDescription(`\`${line}\``)
      .setFooter({ text: "Not for real git — unless you're brave." });
    await context.message.reply({ embeds: [embed] });
  }
}
