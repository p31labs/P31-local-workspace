import type { CommandContext, P31Command } from './base';

// P31 Cortex GrantAgent DO endpoint — fetches live pipeline
const CORTEX_URL = 'https://p31-cortex.trimtab-signal.workers.dev/api/grant/run';

interface GrantMetadata {
  funder: string;
  amount: number;
  status: string;
  requirements: string[];
  notes: string;
}

interface GrantRecord {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  status: string;
  metadata: string; // JSON string
}

interface PipelineResponse {
  ok: boolean;
  overdue: number;
  alertsSent: number;
  pipeline: GrantRecord[];
  needsAssembly: { id: string; title: string; due_date: string }[];
}

export class GrantsCommand implements P31Command {
  name = 'grants';
  description = 'Show P31 Labs funding pipeline status (live from GrantAgent)';
  aliases = ['funding', 'donations'];
  usage = 'grants';

  async execute(context: CommandContext): Promise<void> {
    const { message } = context;

    let response = '# 💰 P31 Labs Funding Pipeline\n\n';
    response += `_Data source: P31 Cortex GrantAgent DO_\n\n`;

    try {
      const resp = await fetch(CORTEX_URL, { method: 'POST' });
      const data = (await resp.json()) as PipelineResponse;

      if (data.ok && data.pipeline.length > 0) {
        // Sort by deadline ascending
        const sorted = data.pipeline.sort((a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );

        for (const g of sorted) {
          const meta = JSON.parse(g.metadata || '{}');
          const funder = meta.funder || 'Unknown';
          const amount = (meta.amount || 0).toLocaleString();
          const daysLeft = Math.ceil(
            (new Date(g.due_date).getTime() - Date.now()) / 86400000
          );

          response += `**${g.title}**\n`;
          response += `  Funder: ${funder}\n`;
          response += `  Amount: $${amount}\n`;
          response += `  Deadline: ${g.due_date} (${daysLeft > 0 ? daysLeft + ' days' : 'OVERDUE'})\n`;
          response += `  Status: ${g.status}\n\n`;
        }

        response += `---\n`;
        response += `📊 Pipeline: ${data.pipeline.length} active grants\n`;
        if (data.needsAssembly?.length) {
          response += `⚠️ Assembly needed: ${data.needsAssembly.length} grant(s) within 21 days\n`;
          for (const n of data.needsAssembly) {
            response += `   • ${n.title} (due ${n.due_date})\n`;
          }
        }
        if (data.overdue > 0) {
          response += `🚨 Overdue: ${data.overdue} grant(s)\n`;
        }
      } else {
        response += `No active grants in pipeline.\n`;
        response += `Use \`!grant init\` to add a new opportunity.\n`;
      }
    } catch (e) {
      response += `⚠️ Could not fetch live data.\n`;
      response += `Cortex endpoint unreachable: ${CORTEX_URL}\n`;
      response += `Falling back to static list.\n\n`;

      // Fallback to hardcoded (will be removed once Cortex is live)
      const fallback = [
        { name: 'Awesome Foundation', amount: '$1,000', status: 'Deliberating — April cycle', due: 'Rolling' },
        { name: 'ASAN Teighlor McGee', amount: '$6,250', status: 'Portal opens May 15', due: 'July 31, 2026' },
        { name: 'Stimpunks Foundation', amount: '$3,000', status: 'Opens June 1', due: 'TBD' },
        { name: 'NLnet NGI Zero Commons', amount: '€15,000', status: 'Draft ready — submit before June 1', due: 'June 1, 2026' },
      ];
      for (const g of fallback) {
        response += `**${g.name}** (${g.amount})\n  Status: ${g.status}\n  Due: ${g.due}\n\n`;
      }
    }

    response += `\n_Last updated: ${new Date().toISOString().slice(0, 10)}_`;

    await message.reply(`\`\`\`markdown\n${response}\n\`\`\``);
  }
}
