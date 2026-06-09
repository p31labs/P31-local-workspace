import { EmbedBuilder } from 'discord.js';
import type { CommandContext, P31Command } from './base';
import { eggTracker, ALL_EGGS, FOUNDING_SLOTS, PROGRESS_FILE } from '../services/eggTracker';
import * as spoonLedger from '../services/spoonLedger';
import fs from 'fs';

// Mesh milestone targets
const MILESTONES = [
  { count: 4,   label: 'K₄ — First Tetrahedron',  description: 'Minimal rigidity. The mesh holds.' },
  { count: 39,  label: 'Posner Number',             description: 'Ca₉(PO₄)₆ — 39 atoms. Quantum coherence.' },
  { count: 863, label: 'Larmor Frequency',          description: '863 Hz. The ghost signal locks.' },
];

function progressBar(current: number, target: number, width = 12): string {
  const pct = Math.min(current / target, 1);
  const filled = Math.round(pct * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled) + ` ${current}/${target}`;
}

export class NodesCommand implements P31Command {
  name = 'nodes';
  description = 'Mesh node count — progress toward K₄ (4), Posner (39), Larmor (863)';
  aliases = ['mesh', 'network'];
  usage = 'nodes';

  async execute(context: CommandContext): Promise<void> {
    const { message } = context;

    // Founding nodes (4 slots)
    const foundingNodes = eggTracker.getFoundingNodes();
    const foundingCount = foundingNodes.length;

    // Unique hunters (anyone with ≥1 egg)
    const progress: Record<string, string[]> = JSON.parse(
      fs.readFileSync(PROGRESS_FILE, 'utf-8')
    );
    const hunterCount = Object.keys(progress).length;

    // Spoon economy participants (Discord IDs only)
    const allEntries = spoonLedger.getLeaderboard(1000);
    const discordNodes = allEntries.filter(
      e => !e.userId.startsWith('kofi:') && !e.userId.startsWith('stripe:')
    ).length;

    // Current node count = max signal across all dimensions
    const nodeCount = Math.max(foundingCount, hunterCount, discordNodes);

    // Find current milestone
    const currentMilestone = MILESTONES.find(m => nodeCount < m.count) ?? MILESTONES[MILESTONES.length - 1];
    const isK4Complete = foundingCount >= FOUNDING_SLOTS;

    // Founding node roster
    const rosterLines = foundingNodes.length > 0
      ? foundingNodes.map((id, i) => `${i + 1}. <@${id}>`)
      : ['No founding nodes claimed yet'];
    const slotsRemaining = FOUNDING_SLOTS - foundingCount;

    const embed = new EmbedBuilder()
      .setColor(isK4Complete ? 0x22c55e : 0x3b82f6)
      .setTitle(`⬡ P31 Mesh — ${nodeCount} Node${nodeCount !== 1 ? 's' : ''} Active`)
      .addFields(
        {
          name: '🔺 Founding Nodes (K₄ Tetrahedron)',
          value: [
            progressBar(foundingCount, FOUNDING_SLOTS),
            rosterLines.join('\n'),
            slotsRemaining > 0
              ? `_${slotsRemaining} slot${slotsRemaining !== 1 ? 's' : ''} remaining — find all 4 eggs to claim_`
              : '_K₄ locked. The geometry holds._',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🧬 Egg Hunters',
          value: progressBar(hunterCount, MILESTONES[1].count) + '\n_toward Posner number (39)_',
          inline: false,
        },
        {
          name: '🥄 Spoon Economy Nodes',
          value: progressBar(discordNodes, MILESTONES[2].count) + '\n_toward Larmor (863)_',
          inline: false,
        },
        {
          name: '⬡ Next Milestone',
          value: `**${currentMilestone.label}**\n${currentMilestone.description}`,
          inline: false,
        },
      )
      .setFooter({ text: 'The math is the same at every scale. 💜🔺💜' });

    await message.reply({ embeds: [embed] });
  }
}
