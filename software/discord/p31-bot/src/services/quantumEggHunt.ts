/**
 * Quantum Egg Hunt Service
 * 
 * Per-egg tracking with founding node detection.
 * Rewards: 39 Spoons per NEW egg discovery.
 * Grand prize: First 4 to complete all 4 eggs get Node Zero hardware devices.
 */

import { Message, EmbedBuilder, Client } from 'discord.js';
import * as spoonLedger from './spoonLedger';
import { eggTracker, EggId, ALL_EGGS, FOUNDING_SLOTS } from './eggTracker';
import TelemetryService from './telemetry';

const EGG_TRIGGERS: Record<string, EggId> = {
  // Egg 1: Bashium (chemical - Genesis quest in BONDING)
  'bashium': 'bashium',
  // Egg 2: Willium (chemical - Kitchen quest in BONDING)
  'willium': 'willium',
  // Egg 3: Missing Node (acoustic - 172.35 Hz at p31ca.org/#collider)
  '172.35': 'missing_node',
  '172hz': 'missing_node',
  '172 hz': 'missing_node',
  'locktone': 'missing_node',
  'missing node': 'missing_node',
  'missingnode': 'missing_node',
  // Egg 4: First Tetrahedron (geometric - K4 in BONDING or Posner molecule)
  'k4': 'tetrahedron',
  'k₄': 'tetrahedron',
  'posner': 'tetrahedron',
  'ca9(po4)6': 'tetrahedron',
  'ca₉(po₄)₆': 'tetrahedron',
  'ca9po46': 'tetrahedron',
  '39 atoms': 'tetrahedron',
  '39atoms': 'tetrahedron',
  'first tetrahedron': 'tetrahedron',
  'firsttetrahedron': 'tetrahedron',
};

const EGG_NAMES: Record<EggId, string> = {
  'bashium': 'Bashium Element',
  'willium': 'Willium Element',
  'missing_node': 'The Missing Node (172.35Hz)',
  'tetrahedron': 'The First Tetrahedron (K₄)'
};

const EGG_ICONS: Record<EggId, string> = {
  'bashium': '🟣',
  'willium': '🟢',
  'missing_node': '🔊',
  'tetrahedron': '🧱'
};

export class QuantumEggHunt {
  private targetChannelId: string;
  private announcementsChannelId: string;
  private rewardSpoons: number;
  private rewardRole: string;
  private client: Client | null = null;
  private lastDiscovery: Map<string, number> = new Map(); // userId -> timestamp
  private discoveryCooldown = 60000; // 1 minute
  private telemetry: TelemetryService;

  constructor(config: {
    targetChannelId?: string;
    announcementsChannelId?: string;
    rewardSpoons?: number;
    rewardRole?: string;
    telemetry?: TelemetryService;
  }) {
    this.targetChannelId = config.targetChannelId ?? '';
    this.announcementsChannelId = config.announcementsChannelId ?? '';
    this.rewardSpoons = config.rewardSpoons || 39;
    this.rewardRole = config.rewardRole || '[⚛️] Creator';
    this.telemetry = config.telemetry || new TelemetryService('', false, 5000);
  }

  setClient(client: Client) {
    this.client = client;
  }

  isActive(): boolean {
    return !!this.targetChannelId;
  }

  /**
   * Handle hidden command !quantum-egg or !863
   */
  async handleHiddenCommand(message: Message): Promise<boolean> {
    if (message.content === '!quantum-egg' || message.content === '!863') {
      const embed = new EmbedBuilder()
        .setColor(0x9c27b0) // Purple
        .setTitle('🧩 QUANTUM EGG HUNT')
        .setDescription('You found the hidden terminal. The hunt is active.')
        .addFields(
          { name: 'The 4 Eggs', value: '• Bashium (Genesis quest)\n• Willium (Kitchen quest)\n• Missing Node (172.35Hz)\n• First Tetrahedron (K₄)' },
          { name: 'Per Egg Reward', value: '+39 Spoons (Posner number)' },
          { name: 'The Grand Prize', value: 'First 4 to find ALL 4 eggs win **Node Zero hardware devices** + become Founding Nodes in the first physical K₄ mesh.\n\nOnly 4 slots exist. The geometry is strict.' },
          { name: 'How to Submit', value: `Post keyword + image in <#${this.targetChannelId}>` }
        )
        .setFooter({ text: 'The geometry is invariant. 💜🔺💜' });

      await message.reply({ embeds: [embed] });
      return true;
    }
    return false;
  }

  /**
   * Process a message in the target channel
   */
  async processMessage(message: Message): Promise<void> {
    // Only process in target channel
    if (message.channelId !== this.targetChannelId) return;
    if (message.author.bot) return;

    // Must have attachment (image proof required)
    if (message.attachments.size === 0) return;

    // Must be an image
    if (!message.attachments.some(att => att.contentType?.startsWith('image/'))) return;

    // Rate limit: one discovery per user per minute
    const userId = message.author.id;
    const now = Date.now();
    const last = this.lastDiscovery.get(userId) || 0;
    if (now - last < this.discoveryCooldown) {
      await message.reply('⏳ Please wait before submitting another discovery.');
      return;
    }

    // Fuzzy string matching: normalize text
    const normalizedText = message.content.toLowerCase().replace(/\s+/g, '');
    
    // Find which egg was discovered (normalize trigger too — strips spaces for multi-word phrases)
    let foundEggId: EggId | null = null;
    for (const [trigger, eggId] of Object.entries(EGG_TRIGGERS)) {
      if (normalizedText.includes(trigger.replace(/\s+/g, ''))) {
        foundEggId = eggId;
        break;
      }
    }

    if (foundEggId) {
      await this.processDiscovery(message, foundEggId);
    }
  }

  /**
   * Process a verified discovery
   */
  private async processDiscovery(message: Message, eggId: EggId): Promise<void> {
    const userId = message.author.id;

    // 1. Record discovery - returns true only if NEW
    const isNewDiscovery = eggTracker.recordDiscovery(userId, eggId);

    // Send telemetry
    if (isNewDiscovery) {
      this.telemetry.trackEggDiscovery(userId, eggId);
    }

    if (!isNewDiscovery) {
      // Already found this specific egg
      await message.reply(`✅ Already verified. You claimed ${EGG_ICONS[eggId]} ${EGG_NAMES[eggId]} earlier.`);
      return;
    }

    // 2. Award Spoons (only for new discoveries - prevents infinite spoon glitch)
    const newBalance = spoonLedger.award(userId, this.rewardSpoons);
    const progress = eggTracker.getUserProgress(userId);
    const isComplete = progress.length === 4;

    // Update rate limit
    this.lastDiscovery.set(userId, Date.now());

    // DM user about their discovery
    await this.dmUser(userId, eggId, newBalance, progress.length);

    // Build progress visualization
    const progressVisual = ALL_EGGS.map(e => progress.includes(e) ? '🟩' : '⬛').join(' ');

    // 3a. Not complete yet - standard progress embed
    if (!isComplete) {
      const embed = new EmbedBuilder()
        .setColor(0x06b6d4) // Cyan
        .setTitle(`${EGG_ICONS[eggId]} ARTIFACT VERIFIED: ${EGG_NAMES[eggId]}`)
        .setDescription(`<@${userId}> has cracked a node.`)
        .addFields(
          { name: 'Reward', value: `+${this.rewardSpoons} Spoons — balance: **${newBalance}**` },
          { name: 'Progress', value: `${progressVisual} (${progress.length}/4)` }
        )
        .setFooter({ text: 'Find all 4 to form the Founding Tetrahedron.' });

      await message.reply({ embeds: [embed] });
      return;
    }

    // 3b. ALL 4 COMPLETE - Check for Founding Node status
    const member = message.member;
    const creatorRole = message.guild?.roles.cache.find(r => r.name === this.rewardRole);

    // Always grant Creator role for full completion
    if (creatorRole && member) {
      try {
        await member.roles.add(creatorRole);
      } catch (e) {
        console.error('[QuantumEggHunt] Error granting role:', e);
      }
    }

    // Claim founding node slot
    const slotNumber = eggTracker.claimFoundingNode(userId);

    if (slotNumber) {
      // FIRST 4: Founding Node - Node Zero prize!
      const embed = new EmbedBuilder()
        .setColor(0x22c55e) // Green
        .setTitle(`🔺 FOUNDING NODE #${slotNumber} — TETRAHEDRON LOCKED 🔺`)
        .setDescription(`<@${userId}> has found ALL 4 eggs. The first physical K₄ mesh is taking shape.`)
        .addFields(
          { name: 'Geometry Status', value: `You are **Founding Node #${slotNumber}** of 4.` },
          { name: 'Prize', value: '**Node Zero hardware device** allocated. Shipped when production-ready.' },
          { name: 'Access', value: '`[⚛️] Creator` role granted.' }
        )
        .setFooter({ text: 'The mesh holds. 💜🔺💜' });

      await message.reply({ embeds: [embed] });

      // Broadcast to #announcements
      await this.broadcastFoundingNode(message, slotNumber, userId);

      // DM operator
      await this.dmOperator(`🔺 **TETRAHEDRON ALERT:** ${message.author.tag} (${message.author.id}) just claimed Founding Slot #${slotNumber}!`);
    } else {
      // COMPLETE BUT SLOTS FULL - Node #5
      const embed = new EmbedBuilder()
        .setColor(0x9c27b0) // Purple
        .setTitle('🔺 SEQUENCE COMPLETE — ALL ARTIFACTS FOUND')
        .setDescription(`<@${userId}> has successfully located all 4 eggs!`)
        .addFields(
          { name: 'Status', value: 'All 4 founding hardware slots are occupied.' },
          { name: 'Access', value: '`[⚛️] Creator` role granted for full completion.' },
          { name: 'Progress', value: '🟩 🟩 🟩 🟩 (4/4)' }
        )
        .setFooter({ text: 'You are verified. The geometry is strict. 💜🔺💜' });

      await message.reply({ embeds: [embed] });
    }
  }

  /**
   * Broadcast founding node claim to #announcements
   */
  private async broadcastFoundingNode(message: Message, slotNumber: number, userId: string): Promise<void> {
    if (!this.announcementsChannelId || !this.client) return;
    try {
      const channel = this.client.channels.cache.get(this.announcementsChannelId);
      if (!channel || !(channel instanceof (await import('discord.js')).TextChannel)) return;

      const allNodes = eggTracker.getFoundingNodes();
      const isK4Complete = allNodes.length >= FOUNDING_SLOTS;
      const nodeIcons = ['🔺', '🔻', '🔷', '🔶'];

      const embed = new EmbedBuilder()
        .setColor(isK4Complete ? 0x22c55e : 0x9c27b0)
        .setTitle(
          isK4Complete
            ? '🔺 K₄ COMPLETE — THE FIRST TETRAHEDRON IS LOCKED 🔺'
            : `${nodeIcons[slotNumber - 1]} FOUNDING NODE #${slotNumber} CLAIMED`
        )
        .setDescription(
          isK4Complete
            ? `The first physical K₄ mesh is locked.\n\n<@${userId}> sealed the tetrahedron as **Founding Node #${slotNumber}**.\n\nThe geometry is invariant. The shape holds at every scale.`
            : `<@${userId}> found all 4 eggs and claimed **Founding Node #${slotNumber}** of ${FOUNDING_SLOTS}.\n\n${FOUNDING_SLOTS - allNodes.length} slot${FOUNDING_SLOTS - allNodes.length !== 1 ? 's' : ''} remaining.`
        )
        .addFields({
          name: 'K₄ Progress',
          value: allNodes.map((id, i) => `${nodeIcons[i]} Node #${i + 1}: <@${id}>`).join('\n') +
            (allNodes.length < FOUNDING_SLOTS ? `\n${'⬜ '.repeat(FOUNDING_SLOTS - allNodes.length).trim()} — open` : ''),
          inline: false,
        })
        .setFooter({ text: '💜🔺💜 The math is the same at every scale.' });

      await (channel as import('discord.js').TextChannel).send({ embeds: [embed] });
    } catch (e) {
      console.error('[QuantumEggHunt] Failed to broadcast founding node:', e);
    }
  }

  /**
   * DM the user about their discovery
   */
  private async dmUser(userId: string, eggId: EggId, balance: number, progressCount: number): Promise<void> {
    if (!this.client) return;

    try {
      const user = await this.client.users.fetch(userId);
      const embed = new EmbedBuilder()
        .setColor(0x06b6d4)
        .setTitle(`🎉 Egg Discovered: ${EGG_NAMES[eggId]}`)
        .setDescription(`You found ${EGG_ICONS[eggId]} **${EGG_NAMES[eggId]}**!`)
        .addFields(
          { name: 'Reward', value: `+${this.rewardSpoons} Spoons — balance: **${balance}**` },
          { name: 'Progress', value: `${progressCount}/4 eggs found` }
        )
        .setFooter({ text: 'Keep hunting! 💜🔺💜' });

      await user.send({ embeds: [embed] });
    } catch (e) {
      console.error('[QuantumEggHunt] Failed to DM user:', e);
    }
  }

  /**
   * DM the operator when a founding node is claimed
   */
  private async dmOperator(content: string): Promise<void> {
    const operatorId = process.env.OPERATOR_DISCORD_USER_ID;
    if (!operatorId || !this.client) return;

    try {
      const operator = await this.client.users.fetch(operatorId);
      await operator.send(content);
    } catch (e) {
      console.error('[QuantumEggHunt] Failed to DM operator:', e);
    }
  }
}

export default QuantumEggHunt;
