import type { CommandContext, P31Command } from './base';

export class EsgCommand implements P31Command {
  name = 'esg';
  description = 'ESG application draft for housing assistance';
  aliases = ['grant'];
  usage = 'esg';

  async execute(context: CommandContext): Promise<void> {
    const { message } = context;

    const draft = `# P31 Labs ESG Application Draft

## Organization
- **Name:** P31 Labs (501(c)(3) Nonprofit)
- **Mission:** Assistive technology for neurodivergent individuals
- **Contact:** will@p31ca.org

## Program: Neurodivergent Housing Stability
- **Services:** Rapid re-housing, prevention, tech integration
- **Target:** Neurodivergent adults/families at risk
- **Budget:** $50,000 request
- **Timeline:** Applications open April 13, due May 8

For full draft, see ESG_Application_Draft.md`;

    await message.reply(`\`\`\`markdown\n${draft}\n\`\`\``);
  }
}