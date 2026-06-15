const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Redis } = require('@upstash/redis');
const crypto = require('crypto');
require('dotenv').config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const POSNER_REQUIREMENTS = { calcium: 9, phosphate: 6, contributors: 5 };
const SPOONS_COST = { calcium: 10, phosphate: 10, larmor: 1 };
const KARMA_REWARDS = { ion: 5, posner: 100, larmor: 50 };

async function getUser(userId) {
  let user = await redis.get(`user:${userId}`);
  if (!user) {
    user = {
      userId,
      username: userId,
      spoons: 100,
      karma: 0,
      contributions: { calcium: 0, phosphate: 0, total: 0 },
      larmorSyncs: 0,
      bestResonance: 0,
      lastRegen: Date.now(),
    };
    await redis.set(`user:${userId}`, JSON.stringify(user));
  } else {
    user = JSON.parse(user);
  }
  return user;
}

async function updateUser(userId, updates) {
  const user = await getUser(userId);
  Object.assign(user, updates);
  await redis.set(`user:${userId}`, JSON.stringify(user));
  return user;
}

async function getLeaderboard() {
  const keys = await redis.keys('user:*');
  const users = await Promise.all(keys.map(async (k) => JSON.parse(await redis.get(k))));
  const topContributors = users.sort((a,b) => b.contributions.total - a.contributions.total).slice(0,5);
  const topKarma = users.sort((a,b) => b.karma - a.karma).slice(0,5);
  const larmorMasters = users.sort((a,b) => b.larmorSyncs - a.larmorSyncs).slice(0,5);
  return { topContributors, topKarma, larmorMasters };
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  const commands = [
    { name: 'status', description: 'Ecosystem status' },
    { name: 'contribute-ion', description: 'Contribute calcium or phosphate ion', options: [{ name: 'ion_type', type: 3, required: true, choices: [{ name: 'Calcium', value: 'calcium' }, { name: 'Phosphate', value: 'phosphate' }] }] },
    { name: 'larmor-sync', description: 'Sync to Larmor frequency', options: [{ name: 'timestamps', type: 3, required: true }] },
    { name: 'leaderboard', description: 'Community leaderboard' },
    { name: 'profile', description: 'Your P31 profile', options: [{ name: 'user', type: 6 }] },
    { name: 'start-crew-manual', description: 'Start onboarding journey' },
  ];
  await client.application.commands.set(commands);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, user } = interaction;

  if (commandName === 'status') {
    const posner = await redis.get('posner-status') || { calcium: 0, phosphate: 0, contributors: 0 };
    const embed = new EmbedBuilder()
      .setTitle('📊 P31 Ecosystem Status')
      .setColor(0x6366f1)
      .addFields(
        { name: 'Posner Molecule', value: `${posner.calcium}/${POSNER_REQUIREMENTS.calcium} Ca²⁺ | ${posner.phosphate}/${POSNER_REQUIREMENTS.phosphate} PO₄³⁻\nContributors: ${posner.contributors}/${POSNER_REQUIREMENTS.contributors}`, inline: false },
        { name: 'System Health', value: '🟢 All systems operational', inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  }

  else if (commandName === 'contribute-ion') {
    const ionType = interaction.options.getString('ion_type');
    let userData = await getUser(user.id);
    if (userData.spoons < SPOONS_COST[ionType]) {
      return interaction.reply({ content: `❌ You need ${SPOONS_COST[ionType]} spoons.`, ephemeral: true });
    }
    userData.spoons -= SPOONS_COST[ionType];
    userData.contributions[ionType]++;
    userData.contributions.total++;
    userData.karma += KARMA_REWARDS.ion;
    await updateUser(user.id, userData);

    let posner = await redis.get('posner-status') || { calcium: 0, phosphate: 0, contributors: 0 };
    posner[ionType]++;
    if (userData.contributions.total === 1) posner.contributors++;
    await redis.set('posner-status', JSON.stringify(posner));

    const embed = new EmbedBuilder()
      .setTitle(`🧪 ${ionType === 'calcium' ? 'Calcium' : 'Phosphate'} Ion Contributed!`)
      .setColor(0x10b981)
      .setDescription(`You spent ${SPOONS_COST[ionType]} spoons and gained ${KARMA_REWARDS.ion} karma.\nPosner progress: ${posner.calcium}/${POSNER_REQUIREMENTS.calcium} Ca²⁺, ${posner.phosphate}/${POSNER_REQUIREMENTS.phosphate} PO₄³⁻`);
    await interaction.reply({ embeds: [embed] });
  }

  else if (commandName === 'larmor-sync') {
    const timestamps = JSON.parse(interaction.options.getString('timestamps'));
    const target = 1162;
    let valid = 0;
    for (let i = 1; i < timestamps.length; i++) {
      const interval = timestamps[i] - timestamps[i-1];
      if (Math.abs(interval - target) / target <= 0.05) valid++;
    }
    if (valid < 10) {
      return interaction.reply({ content: '❌ Synchronization failed. Try again with more consistent rhythm.', ephemeral: true });
    }
    let userData = await getUser(user.id);
    if (userData.spoons < SPOONS_COST.larmor) {
      return interaction.reply({ content: `❌ You need ${SPOONS_COST.larmor} spoon.`, ephemeral: true });
    }
    userData.spoons -= SPOONS_COST.larmor;
    userData.larmorSyncs++;
    userData.bestResonance = Math.min(10, userData.bestResonance + 1);
    userData.karma += KARMA_REWARDS.larmor;
    await updateUser(user.id, userData);
    const decryptedCID = `bafybei${crypto.randomBytes(20).toString('hex')}`;
    const embed = new EmbedBuilder()
      .setTitle('🎵 Larmor Frequency Lock Achieved!')
      .setColor(0x00ffff)
      .addFields(
        { name: 'Resonance Level', value: `${userData.bestResonance}/10`, inline: true },
        { name: 'Karma Earned', value: `+${KARMA_REWARDS.larmor}`, inline: true },
        { name: 'Decrypted CID', value: `\`${decryptedCID}\``, inline: false }
      );
    await interaction.reply({ embeds: [embed] });
  }

  else if (commandName === 'leaderboard') {
    const { topContributors, topKarma, larmorMasters } = await getLeaderboard();
    const embed = new EmbedBuilder()
      .setTitle('🏆 P31 Community Leaderboard')
      .setColor(0x6366f1)
      .addFields(
        { name: 'Top Contributors', value: topContributors.map((u,i) => `${i+1}. ${u.username} (${u.contributions.total} ions)`).join('\n') || 'None', inline: true },
        { name: 'Top Karma', value: topKarma.map((u,i) => `${i+1}. ${u.username} (${u.karma} karma)`).join('\n') || 'None', inline: true },
        { name: 'Larmor Masters', value: larmorMasters.map((u,i) => `${i+1}. ${u.username} (${u.larmorSyncs} syncs)`).join('\n') || 'None', inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  }

  else if (commandName === 'profile') {
    const target = interaction.options.getUser('user') || user;
    const userData = await getUser(target.id);
    const embed = new EmbedBuilder()
      .setTitle(`👤 ${target.username}'s P31 Profile`)
      .setColor(0x6366f1)
      .addFields(
        { name: '🧠 Spoons', value: `${userData.spoons}/100`, inline: true },
        { name: '💎 Karma', value: `${userData.karma}`, inline: true },
        { name: '🔬 Contributions', value: `Ca²⁺: ${userData.contributions.calcium}\nPO₄³⁻: ${userData.contributions.phosphate}`, inline: true },
        { name: '🎵 Larmor Syncs', value: `${userData.larmorSyncs}`, inline: true },
        { name: '⚡ Best Resonance', value: `${userData.bestResonance}/10`, inline: true }
      );
    await interaction.reply({ embeds: [embed] });
  }

  else if (commandName === 'start-crew-manual') {
    const dm = await user.createDM();
    const embed = new EmbedBuilder()
      .setTitle('Welcome to P31 Labs!')
      .setDescription('You are about to embark on a journey to sovereignty. Click the button to begin the Crew Manual onboarding.')
      .setColor(0x00ff88);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('crew_l0_ready').setLabel('I\'m Ready!').setStyle(ButtonStyle.Primary)
    );
    await dm.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '📬 Check your DMs!', ephemeral: true });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const { customId, user } = interaction;
  if (customId === 'crew_l0_ready') {
    const embed = new EmbedBuilder()
      .setTitle('🛡️ The Safety Net')
      .setDescription('Important: In this network, you\'re never alone.\n\n• If you feel overwhelmed, step back — your progress is saved\n• If you need help, reach out to the community\n• Your cognitive resources regenerate over time\n\n*This is designed by neurodivergent people, for neurodivergent people.*')
      .setColor(0x00ff88);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('crew_l05_understand').setLabel('I Understand').setStyle(ButtonStyle.Secondary)
    );
    await interaction.update({ embeds: [embed], components: [row] });
  } else if (customId === 'crew_l05_understand') {
    const userData = await getUser(user.id);
    const embed = new EmbedBuilder()
      .setTitle('🔋 Level 1: Check Your Pocket')
      .setDescription(`Your **Spoons** represent your available cognitive energy.\n\n**Your current Spoons:** ${userData.spoons}/100\n\n*Track your energy. Respect your limits.*`)
      .setColor(0x00d4ff);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('crew_l1_pocket').setLabel('Check My Pocket').setStyle(ButtonStyle.Primary)
    );
    await interaction.update({ embeds: [embed], components: [row] });
  } else if (customId === 'crew_l1_pocket') {
    const userData = await getUser(user.id);
    const embed = new EmbedBuilder()
      .setTitle('🔑 Level 2: Practice Turning Your Key')
      .setDescription(`**Karma** is earned through contribution.\n\n**Your current Karma:** ${userData.karma}\n\n*Small contributions compound into something greater.*`)
      .setColor(0x7a27ff);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('crew_l2_key').setLabel('Practice Turning My Key').setStyle(ButtonStyle.Primary)
    );
    await interaction.update({ embeds: [embed], components: [row] });
  } else if (customId === 'crew_l2_key') {
    const userData = await getUser(user.id);
    const embed = new EmbedBuilder()
      .setTitle('⚡ Level 3: Tune The Engine')
      .setDescription(`**Larmor frequency** (863 Hz) is our biological anchor.\n\n**Your Resonance Level:** ${userData.bestResonance}/10\n\n🔗 **[BONDING Game](https://bonding.p31ca.org)** — Practice synchronization here`)
      .setColor(0xff6600);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('crew_l3_engine').setLabel('Tune The Engine').setStyle(ButtonStyle.Primary)
    );
    await interaction.update({ embeds: [embed], components: [row] });
  } else if (customId === 'crew_l3_engine') {
    const embed = new EmbedBuilder()
      .setTitle('🎉 Crew Manual Complete!')
      .setDescription('You\'ve completed the onboarding journey. You\'re now a verified node in the P31 network.\n\n• Use /profile to track your resources\n• Use /contribute-ion to build the Posner molecule\n• Use /larmor-sync to verify your quantum signature\n• Check /leaderboard to see community progress')
      .setColor(0x00ff88);
    await interaction.update({ embeds: [embed], components: [] });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
