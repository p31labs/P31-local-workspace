import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import fetch from 'node-fetch';
import type { CommandContext, P31Command } from './base';

const KNOWN_WORKFLOWS = ['social-dispatch', 'build-portable'];

export class DeployCommand implements P31Command {
  name = 'deploy';
  description = 'Trigger a GitHub Actions workflow from Discord (Admin only)';
  aliases = ['dispatch', 'ci'];
  usage = 'deploy <workflow> [branch]';

  async execute(context: CommandContext): Promise<void> {
    const { message, args } = context;

    if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await message.reply('Access Denied. Admin privileges required to trigger deployments.');
      return;
    }

    const workflow = args[0];
    const branch = args[1] || 'main';

    if (!workflow) {
      await message.reply(
        `Usage: \`p31 deploy <workflow> [branch]\`\n\nKnown workflows:\n${KNOWN_WORKFLOWS.map(w => `• \`${w}\``).join('\n')}`
      );
      return;
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO || 'p31labs/andromeda';

    if (!token) {
      await message.reply('❌ `GITHUB_TOKEN` not set in bot `.env`. Add it to enable remote dispatch.');
      return;
    }

    const statusMsg = await message.reply(`⚙️ Dispatching \`${workflow}.yml\` → \`${branch}\`...`);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows/${workflow}.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ref: branch }),
        }
      );

      if (response.status === 204) {
        const embed = new EmbedBuilder()
          .setColor(0x00FF88)
          .setTitle('✅ Workflow Dispatched')
          .addFields(
            { name: 'Workflow', value: `\`${workflow}.yml\``, inline: true },
            { name: 'Branch',   value: `\`${branch}\``,       inline: true },
            { name: 'Repo',     value: repo,                   inline: true },
          )
          .setFooter({ text: 'Check GitHub Actions for run status.' });
        await statusMsg.edit({ content: '', embeds: [embed] });
      } else {
        const body = await response.text();
        await statusMsg.edit(`❌ GitHub API ${response.status}: \`${body}\``);
      }
    } catch (error) {
      await statusMsg.edit(
        `❌ Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export default DeployCommand;
