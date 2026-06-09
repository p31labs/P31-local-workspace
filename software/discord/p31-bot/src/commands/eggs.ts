import { EmbedBuilder } from 'discord.js';
import type { CommandContext, P31Command } from './base';
import { eggTracker, ALL_EGGS, FOUNDING_SLOTS, EGG_META, PROGRESS_FILE } from '../services/eggTracker';
import type { EggId } from '../services/eggTracker';
import fs from 'fs';

export class EggsCommand implements P31Command {
  name = 'eggs';
  description = 'Quantum Egg Hunt — your progress + global status';
  aliases = ['hunt', 'egg'];
  usage = 'eggs';

  async execute(context: CommandContext): Promise<void> {
    const { message } = context;
    const userId = message.author.id;

    const userEggs = eggTracker.getUserProgress(userId);
    const foundingNodes = eggTracker.getFoundingNodes();
    const foundingSlot = foundingNodes.indexOf(userId);

    // Global discovery counts per egg
    const progress: Record<string, unknown> = JSON.parse(
      fs.readFileSync(PROGRESS_FILE, 'utf-8')
    );
    const globalCounts: Record<EggId, number> = {
      bashium: 0, willium: 0, missing_node: 0, tetrahedron: 0,
    };
    for (const eggs of Object.values(progress) as EggId[][]) {
      for (const egg of eggs) {
        if (egg in globalCounts) globalCounts[egg]++;
      }
    }

    // Build per-egg fields
    const eggFields = ALL_EGGS.map((id) => {
      const meta = EGG_META[id];
      const found = userEggs.includes(id);
      const globalCount = globalCounts[id];
      return {
        name: `${found ? meta.icon : '⬜'} ${meta.label}`,
        value: found
          ? `Found · ${globalCount} hunter${globalCount !== 1 ? 's' : ''} globally`
          : `Not found · ${globalCount} hunter${globalCount !== 1 ? 's' : ''} · Hint: *${meta.hint}*`,
        inline: false,
      };
    });

    // Founding node status
    const slotsRemaining = FOUNDING_SLOTS - foundingNodes.length;
    const foundingValue = foundingSlot >= 0
      ? `You are Founding Node #${foundingSlot + 1} of ${FOUNDING_SLOTS}. Node Zero hardware reserved.`
      : slotsRemaining > 0
        ? `${slotsRemaining} of ${FOUNDING_SLOTS} slots open. Complete all 4 eggs to claim one.`
        : `All ${FOUNDING_SLOTS} founding node slots claimed.`;

    const allFound = userEggs.length === ALL_EGGS.length;

    const embed = new EmbedBuilder()
      .setColor(allFound ? 0x9c27b0 : 0x3b82f6)
      .setTitle(`🔺 Quantum Egg Hunt — ${userEggs.length}/${ALL_EGGS.length} eggs found`)
      .addFields(...eggFields)
      .addFields({ name: '⬡ Founding Nodes', value: foundingValue, inline: false })
      .setFooter({ text: 'P31 Labs · 💜🔺💜 · Deadline: Easter Sunday, April 5' });

    await message.reply({ embeds: [embed] });
  }
}
