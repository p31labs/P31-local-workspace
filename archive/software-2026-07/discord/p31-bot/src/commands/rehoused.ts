import type { CommandContext, P31Command } from './base';

export class RehousedCommand implements P31Command {
  name = 'rehoused';
  description = 'Georgia Rehoused application draft';
  aliases = ['ga-rehoused'];
  usage = 'rehoused';

  async execute(context: CommandContext): Promise<void> {
    const { message } = context;

    const draft = `# P31 Labs Georgia Rehoused Application

## Overview
- Nonprofit: P31 Labs (501(c)(3))
- Focus: Neurodivergent housing stability via assistive tech
- Location: Saint Marys, GA

## Program: Technology-Assisted Housing Ecosystem
- Tools: Spaceship Earth, BONDING, Discord community
- Goal: Reduce unsheltered homelessness by 30%
- Funding: $25,000 request

Pre-applications open now. Full details in Georgia_Rehoused_Application.md`;

    await message.reply(`\`\`\`markdown\n${draft}\n\`\`\``);
  }
}