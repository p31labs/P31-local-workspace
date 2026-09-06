import { Message, EmbedBuilder } from 'discord.js';
import { CommandContext, P31Command, getApiUrls, getTimeout } from './base';
import { defaultRetryableFetch } from '../services/retryUtility';

interface BondingStats {
  gamesPlayed: number;
  moleculesCreated: number;
  totalLove: number;
  questsCompleted: number;
}

interface QuestInfo {
  name: string;
  description: string;
  elements: string[];
  difficulty: 'seed' | 'sprout' | 'sapling';
}

export class BondingCommand implements P31Command {
  name = 'bonding';
  description = 'BONDING game stats, quest info, and multiplayer help';
  aliases = ['bond', 'molecule', 'molecules'];
  usage = 'bonding [stats|quest|multiplayer]';

  private readonly quests: QuestInfo[] = [
    {
      name: 'Genesis',
      description: 'Learn the basics of molecule building',
      elements: ['H', 'O'],
      difficulty: 'seed'
    },
    {
      name: 'Kitchen',
      description: 'Expand your element palette',
      elements: ['H', 'C', 'N', 'O'],
      difficulty: 'sprout'
    },
    {
      name: 'Posner',
      description: 'Master the calcium cage structure',
      elements: ['Ca', 'P', 'O'],
      difficulty: 'sapling'
    }
  ];

  async execute(context: CommandContext): Promise<void> {
    const { message, args, apiUrls, timeout } = context;
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'stats':
        await this.showStats(context);
        break;
      case 'quest':
        await this.showQuests(context);
        break;
      case 'multiplayer':
        await this.showMultiplayerHelp(context);
        break;
      default:
        await this.showGeneralHelp(context);
    }
  }

  private async showStats(context: CommandContext): Promise<void> {
    const { message, apiUrls, timeout } = context;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await defaultRetryableFetch.fetchWithRetry(
        `${apiUrls.bonding}/stats`,
        { signal: controller.signal },
        'bonding'
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const stats = await response.json() as BondingStats;

      const embed = new EmbedBuilder()
        .setTitle('🧬 BONDING Statistics')
        .setColor(0x00D4FF)
        .addFields(
          { name: 'Games Played', value: stats.gamesPlayed.toString(), inline: true },
          { name: 'Molecules Created', value: stats.moleculesCreated.toString(), inline: true },
          { name: 'Total LOVE', value: stats.totalLove.toString(), inline: true },
          { name: 'Quests Completed', value: stats.questsCompleted.toString(), inline: true }
        )
        .setFooter({ text: '🔺 P31 Labs • BONDING' });

      await message.reply({ embeds: [embed] });
    } catch (error) {
      await this.replyError(message, 'Could not fetch BONDING stats', apiUrls.bonding);
    }
  }

  private async showQuests(context: CommandContext): Promise<void> {
    const { message } = context;

    const embed = new EmbedBuilder()
      .setTitle('📜 BONDING Quest Chains')
      .setColor(0x7A27FF)
      .setDescription('Complete quests to unlock new elements and features')
      .addFields(
        ...this.quests.map(quest => ({
          name: `${this.getDifficultyEmoji(quest.difficulty)} ${quest.name}`,
          value: `${quest.description}\nElements: ${quest.elements.join(', ')}`,
          inline: false
        }))
      )
      .setFooter({ text: '🔺 P31 Labs • Use p31 bonding quest [name] for details' });

    await message.reply({ embeds: [embed] });
  }

  private async showMultiplayerHelp(context: CommandContext): Promise<void> {
    const { message, prefix } = context;

    const embed = new EmbedBuilder()
      .setTitle('👥 BONDING Multiplayer')
      .setColor(0x00FF88)
      .setDescription('Play side-by-side with others using room codes')
      .addFields(
        { name: 'How to Play', value: '1. Go to bonding.p31ca.org\n2. Click "Create Room" or "Join Room"\n3. Share the 6-character room code\n4. Both players build in the same room', inline: false },
        { name: 'Room Codes', value: '6-character codes (e.g., ABC123)\nCodes expire after 24 hours of inactivity', inline: false },
        { name: 'Commands', value: `\`${prefix} bonding stats\` - View player stats\n\`${prefix} bonding quest\` - Show quest chains\n\`${prefix} bonding multiplayer\` - This help`, inline: false }
      )
      .setFooter({ text: '🔺 P31 Labs • Parallel Play, No Competition' });

    await message.reply({ embeds: [embed] });
  }

  private async showGeneralHelp(context: CommandContext): Promise<void> {
    const { message, prefix } = context;

    const embed = new EmbedBuilder()
      .setTitle('🧬 BONDING')
      .setColor(0x00D4FF)
      .setDescription('Build molecules, complete quests, earn LOVE')
      .addFields(
        { name: '🎮 Play', value: '[bonding.p31ca.org](https://bonding.p31ca.org)', inline: false },
        { name: 'Commands', value: `\`${prefix} bonding stats\` - View player/game statistics\n\`${prefix} bonding quest [name]\` - Show quest chain details\n\`${prefix} bonding multiplayer\` - How to play with others`, inline: false },
        { name: 'Difficulty Modes', value: '🌱 Seed (H+O) → 🌿 Sprout (H+C+N+O) → 🌳 Sapling (all elements)', inline: false }
      )
      .setFooter({ text: '🔺 P31 Labs • It\'s okay to be a little wonky' });

    await message.reply({ embeds: [embed] });
  }

  private getDifficultyEmoji(difficulty: string): string {
    switch (difficulty) {
      case 'seed':
        return '🌱';
      case 'sprout':
        return '🌿';
      case 'sapling':
        return '🌳';
      default:
        return '❓';
    }
  }

  private async replyError(message: Message, errorMessage: string, apiUrl: string): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('⚠️ BONDING Service Unavailable')
      .setColor(0xEF4444)
      .setDescription(errorMessage)
      .addFields(
        { name: 'API URL', value: apiUrl, inline: false }
      );

    await message.reply({ embeds: [embed] });
  }
}

export default BondingCommand;