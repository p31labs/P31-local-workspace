import { EmbedBuilder } from 'discord.js';
import type { CommandContext, P31Command } from './base';
import { eggTracker, ALL_EGGS, PROGRESS_FILE } from '../services/eggTracker';
import type { EggId } from '../services/eggTracker';
import fs from 'fs';

export class LeaderboardCommand implements P31Command {
  name = 'leaderboard';
  description = 'Top Quantum Egg Hunt hunters';
  aliases = ['lb', 'top'];
  usage = 'leaderboard';

  async execute(context: CommandContext): Promise<void> {
    const { message } = context;

    try {
      const progress = JSON.parse(
        fs.readFileSync(PROGRESS_FILE, 'utf-8')
      ) as Record<string, EggId[]>;

      const hunters = Object.entries(progress).map(([userId, eggs]) => ({
        userId,
        eggsFound: eggs.length,
        completed: eggs.length === ALL_EGGS.length,
      }));

      // Sort by completed first, then by eggs found
      hunters.sort((a, b) => {
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
        return b.eggsFound - a.eggsFound;
      });

      const topHunters = hunters.slice(0, 10);

      const embed = new EmbedBuilder()
        .setColor(0x9c27b0)
        .setTitle('🔺 Quantum Egg Hunt Leaderboard')
        .setDescription('Top hunters by eggs found and completion status');

      if (topHunters.length === 0) {
        embed.addFields({ name: 'No hunters yet', value: 'Be the first to find an egg!', inline: false });
      } else {
        const fields = topHunters.map((hunter, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const status = hunter.completed ? ' (Complete!)' : '';
          return {
            name: `${medal} <@${hunter.userId}>`,
            value: `${hunter.eggsFound}/4 eggs${status}`,
            inline: false,
          };
        });
        embed.addFields(...fields);
      }

      embed.setFooter({ text: 'P31 Labs · 💜🔺💜 · Hunt ends March 31' });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[LeaderboardCommand] Error:', error);
      await message.reply('Error loading leaderboard. Please try again.');
    }
  }
}