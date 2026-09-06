import type { CommandContext, P31Command } from './base';

export class EasterCommand implements P31Command {
  name = 'easter';
  description = 'Link to Easter egg hunt for kids';
  aliases = ['eggs'];
  usage = 'easter';

  async execute(context: CommandContext): Promise<void> {
    const { message } = context;

    await message.reply('🐣 Happy Easter! Check out the virtual egg hunt for the kids: https://p31ca.org/easter.html');
  }
}