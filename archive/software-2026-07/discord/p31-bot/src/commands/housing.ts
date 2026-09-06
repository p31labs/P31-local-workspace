import { EmbedBuilder } from 'discord.js';
import type { CommandContext, P31Command } from './base';

export class HousingCommand implements P31Command {
  name = 'housing';
  description = 'Emergency housing resources in Georgia';
  aliases = ['shelter', 'homeless'];
  usage = 'housing';

  async execute(context: CommandContext): Promise<void> {
    const { message } = context;

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle('🏠 Emergency Housing Resources - Georgia')
      .setDescription('Critical resources for housing assistance and homelessness prevention.')
      .addFields(
        {
          name: 'Georgia Rehoused Program',
          value: 'Streamlined funding for communities to reduce homelessness.\nPre-applications open.\n[Learn more](https://dca.georgia.gov/georgia-rehoused)',
          inline: false
        },
        {
          name: 'Emergency Solutions Grants (ESG)',
          value: 'Federal funding for shelter, prevention, re-housing.\nApplications open April 13, due May 8.\n[Apply here](https://dca.georgia.gov/affordable-housing/homelessness-assistance/emergency-solutions-grants)',
          inline: false
        },
        {
          name: 'Southeast Georgia Consolidated Housing Authority',
          value: 'Public housing in Camden County area.\nPhone: (912) 434-2743\n[Visit site](https://segaha.org/)',
          inline: false
        },
        {
          name: 'Georgia Initiative for Community Housing (GICH)',
          value: 'Local housing solutions in St. Marys.\n[City of St. Marys](https://www.stmarysga.gov/departments/community_development/gich.php)',
          inline: false
        },
        {
          name: 'Georgia Housing Search',
          value: 'Comprehensive housing resources statewide.\n[Search here](https://www.georgiahousingsearch.org/)',
          inline: false
        },
        {
          name: 'SVDP Georgia',
          value: 'Eviction prevention and transitional housing.\n[Get help](https://svdpgeorgia.org/what-we-do/housing/)',
          inline: false
        }
      )
      .setFooter({ text: 'P31 Labs · If you need immediate help, contact local authorities or 211.' });

    await message.reply({ embeds: [embed] });
  }
}