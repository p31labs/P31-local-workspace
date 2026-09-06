import { Message, EmbedBuilder } from 'discord.js';
import { CommandContext, P31Command, CommandRegistry } from './base';

export class HelpCommand implements P31Command {
  name = 'help';
  description = 'Show this help message';
  aliases = ['h', '?'];
  usage = 'help [command]';

  private registry: CommandRegistry;

  constructor(registry: CommandRegistry) {
    this.registry = registry;
  }

  async execute(context: CommandContext): Promise<void> {
    const { message, args, prefix } = context;
    const commandName = args[0]?.toLowerCase();

    if (commandName) {
      const command = this.registry.get(commandName);
      if (command) {
        await this.showCommandHelp(message, command, prefix);
      } else {
        await message.reply(`Unknown command: ${commandName}`);
      }
    } else {
      await this.showGeneralHelp(message, prefix);
    }
  }

  private async showGeneralHelp(message: Message, prefix: string): Promise<void> {
    const commands = this.registry.getAll();

    const embed = new EmbedBuilder()
      .setTitle('🔺 P31 Bot Commands')
      .setColor(0x00FF88)
      .setDescription('Cognitive accessibility tools for the P31 ecosystem')
      .addFields(
        { name: '🟢 System', value: `\`${prefix} status\` - Check Node One/P31 system status`, inline: true },
        { name: '🧬 BONDING', value: `\`${prefix} bonding\` - BONDING game stats and help`, inline: true },
        { name: '🥄 Spoons', value: `\`${prefix} spoon\` - Track spoons and LOVE (economy)`, inline: true },
        { name: '❓ Help', value: `\`${prefix} help\` - Show this help message`, inline: true }
      )
      .addFields(
        {
          name: '🎭 Mesh crew & fun',
          value: [
            `\`${prefix} crew\` · \`${prefix} joke\` [\`dev\`|\`mesh\`|\`dad\`] · \`${prefix} lore\` · \`${prefix} drift\``,
            `\`${prefix} trivia\` + tags + \`daily\` (UTC) + \`stats\` · \`${prefix} meshword\` + \`daily\``,
            `\`${prefix} qclock\` (quantum clock + deck) · \`${prefix} tetra\` · \`${prefix} deep\` · \`${prefix} chain\` · \`${prefix} paradox\` · \`${prefix} hangman\``,
            `\`${prefix} play\` — rps · flip · roll · 8ball · number`,
          ].join('\n'),
          inline: false,
        },
      )
      .addFields(
        { name: 'Webhooks', value: 'Receives events from Ko-fi, Node One, and BONDING', inline: false }
      )
      .setFooter({ text: '🔺 P31 Labs • p31 help [command] for details' });

    await message.reply({ embeds: [embed] });
  }

  private async showCommandHelp(message: Message, command: P31Command, prefix: string): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle(`📖 ${prefix}${command.name}`)
      .setColor(0x00D4FF)
      .setDescription(command.description)
      .addFields(
        { name: 'Usage', value: `\`${prefix}${command.usage}\`` }
      );

    if (command.aliases && command.aliases.length > 0) {
      embed.addFields({
        name: 'Aliases',
        value: command.aliases.map(a => `\`${prefix}${a}\``).join(', ')
      });
    }

    await message.reply({ embeds: [embed] });
  }
}

export default HelpCommand;