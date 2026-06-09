import { Message, ChannelType, PermissionsBitField, CategoryChannel, TextChannel } from 'discord.js';

const ROLES = [
  { name: '[🔺] Trimtab',   color: '#06b6d4' as const },
  { name: '[⚛️] Creator',   color: '#9c27b0' as const },
  { name: '[📡] Node',       color: '#3b82f6' as const },
  { name: '[🥄] Low Spoons', color: '#64748b' as const },
];

const TOPOLOGY = [
  {
    category: '[ 📡 ] THE DIRECTIVE',
    channels: [
      { name: 'rules',          topic: 'Core axioms of the P31 Mesh.',      readOnly: true },
      { name: 'announcements',  topic: 'Official P31 Labs updates.',         readOnly: true },
      { name: 'welcome',        topic: 'Landing zone.',                      readOnly: true },
    ],
  },
  {
    category: '[ 🧩 ] OPERATION TRIMTAB',
    channels: [
      { name: 'showcase',       topic: 'Quantum Egg Hunt: Chemical Egg Verification. Post Bashium, Willium, or Posner formulas here.', readOnly: false },
      { name: 'decryption-log', topic: 'Lore, frequencies, and hunt discussion.',                                                       readOnly: false },
    ],
  },
  {
    category: '[ 🧪 ] LABORATORIES',
    channels: [
      { name: 'bonding',        topic: 'BONDING Game development and chemistry.',       readOnly: false },
      { name: 'node-one',       topic: 'ESP32 hardware, mesh networking.',               readOnly: false },
      { name: 'spaceship-earth',topic: 'Cognitive dashboard, WebGPU visuals.',          readOnly: false },
      { name: 'the-buffer',     topic: 'Fawn Guard and NLP tools.',                     readOnly: false },
    ],
  },
  {
    category: '[ 💬 ] THE COMMONS',
    channels: [
      { name: 'general',        topic: 'Standard mesh chatter.',                        readOnly: false },
      { name: 'audhd-chat',     topic: 'Neurodivergent experiences and support.',       readOnly: false },
      { name: 'spoon-exchange', topic: 'Check in with your current capacity.',          readOnly: false },
    ],
  },
];

export const handleScaffoldCommand = async (
  message: Message,
  onShowcaseResolved?: (showcaseChannelId: string) => void
): Promise<void> => {
  if (!message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await message.reply('Access Denied. Admin privileges required to alter mesh topology.');
    return;
  }

  const guild = message.guild;
  if (!guild) return;

  const statusMsg = await message.reply('⚙️ `[SCAFFOLD]` Initiating P31 Server Topology Override...');

  try {
    // 1. Roles
    for (const r of ROLES) {
      if (!guild.roles.cache.find(role => role.name === r.name)) {
        await guild.roles.create({ name: r.name, color: r.color, reason: 'P31 Auto-Scaffold' });
        console.log(`[SCAFFOLD] Created role: ${r.name}`);
      }
    }

    // 2. Categories + channels
    let resolvedShowcaseId = '';

    for (const block of TOPOLOGY) {
      let category = guild.channels.cache.find(
        c => c.name === block.category && c.type === ChannelType.GuildCategory
      ) as CategoryChannel | undefined;

      if (!category) {
        category = await guild.channels.create({
          name: block.category,
          type: ChannelType.GuildCategory,
        });
        console.log(`[SCAFFOLD] Created category: ${block.category}`);
      }

      for (const ch of block.channels) {
        let channel = guild.channels.cache.find(
          c => c.name === ch.name && c.type === ChannelType.GuildText
        ) as TextChannel | undefined;

        if (!channel) {
          channel = await guild.channels.create({
            name: ch.name,
            type: ChannelType.GuildText,
            parent: category.id,
            topic: ch.topic,
            permissionOverwrites: ch.readOnly
              ? [
                  {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.SendMessages],
                    allow: [PermissionsBitField.Flags.ViewChannel],
                  },
                ]
              : [],
          });
          console.log(`[SCAFFOLD] Created channel: #${ch.name}`);
        } else if (channel.parentId !== category.id) {
          await channel.setParent(category.id);
          console.log(`[SCAFFOLD] Moved #${ch.name} → ${block.category}`);
        }

        if (ch.name === 'showcase') {
          resolvedShowcaseId = channel.id;
        }
      }
    }

    if (onShowcaseResolved && resolvedShowcaseId) {
      onShowcaseResolved(resolvedShowcaseId);
    }

    await statusMsg.edit('✅ `[SCAFFOLD]` Mesh topology successfully configured. P31 Server architecture is live.');
    console.log('[SCAFFOLD] Complete.');

  } catch (error) {
    console.error('[SCAFFOLD] Error:', error);
    await statusMsg.edit(
      '❌ `[ERROR]` Topology configuration failed. Ensure the bot has **Manage Channels** and **Manage Roles** permissions.'
    );
  }
};
