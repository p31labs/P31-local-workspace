import { EmbedBuilder } from "discord.js";
import type { CommandContext, P31Command } from "./base";
import { MESH_CREW, randomInt } from "../lib/p31-amusement-data";

export class CrewCommand implements P31Command {
  name = "crew";
  description = "Meet the mesh crew — bios, vibes, and chatty quips";
  aliases = ["personas", "meshcrew"];
  usage = "crew [forge|counsel|scribe|oracle|triage|narrator|phos|mesh]";

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const key = args[0]?.toLowerCase();

    if (!key) {
      const embed = new EmbedBuilder()
        .setTitle("🔺 Mesh crew (personas)")
        .setColor(0x6366f1)
        .setDescription(
          `Each lane has a voice — inspired by the P31 fleet. Go deeper: \`${prefix}crew forge\` …`,
        );
      for (const p of MESH_CREW) {
        embed.addFields({
          name: `${p.emoji} ${p.name}`,
          value: `${p.vibe}\n\`${prefix}crew ${p.id}\``,
          inline: true,
        });
      }
      embed.setFooter({ text: "Fictional flavor; real verify bar still wins arguments." });
      await message.reply({ embeds: [embed] });
      return;
    }

    const persona = MESH_CREW.find((p) => p.id === key || p.name.toLowerCase() === key);
    if (!persona) {
      await message.reply(
        `Unknown crew member \`${key}\`. Try \`${prefix}crew\` for the roster.`,
      );
      return;
    }

    const line = persona.quips[randomInt(persona.quips.length)]!;
    const embed = new EmbedBuilder()
      .setTitle(`${persona.emoji} ${persona.name}`)
      .setColor(0x00ff88)
      .setDescription(`_${persona.role}_\n\n${persona.lore}`)
      .addFields(
        { name: "Vibe", value: persona.vibe, inline: false },
        { name: "Black box", value: persona.blackBox, inline: false },
        { name: "Hot mic", value: line, inline: false },
      )
      .setFooter({ text: `Run again for another quip · ${prefix}deep fact` });
    await message.reply({ embeds: [embed] });
  }
}
