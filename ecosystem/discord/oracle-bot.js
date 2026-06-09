#!eusr/bin/env node

/**
 * P31 Oracle Discord Bot
 * Community interface for the Dual-Ledger Economy (Spoons/Karma)
 * Handles Posner molecule assembly, Larmor frequency verification, and academic hash validation
 * 
 * Updated to support Discord Message Components for Crew Manual onboarding flow
 */

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageComponentInteraction } = require('discord.js');
const Redis = require('ioredis');
const crypto = require('crypto');
require('dotenv').config();

class P31OracleBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });

        this.redis = new Redis(process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379');
        
        // Configuration
        this.config = {
            posnerRequirements: {
                calciumIons: 9,
                phosphateIons: 6,
                uniqueContributors: 5
            },
            spoonsCost: {
                calciumIon: 10,
                phosphateIon: 10,
                larmorSync: 1
            },
            karmaRewards: {
                ionContribution: 5,
                posnerAssembly: 100,
                larmorSync: 50
            }
        };

        // Crew Manual Message Content (L0-L3 onboarding flow)
        this.crewManualMessages = {
            L0: {
                title: 'Welcome to P31 Labs! 🚀',
                description: `**Level 0: Welcome**\n\nYou are about to embark on a journey to sovereignty. This system is designed to help you manage your cognitive load and maintain your independence.\n\n**IMPORTANT: Before you can access the system, you must agree to the P31 Master EULA.**\n\n**P31 is an assistive communication tool, NOT medical advice.** Your identity is cryptographically protected. System logs may be used as evidence in legal proceedings.\n\n**By clicking 'I Accept the EULA', you agree to all terms including:**\n- Medical device classification and limitations\n- Data privacy and cryptographic anonymity\n- Evidentiary implications and chain of custody\n- Mandatory arbitration and liability limitations\n\n**Do you accept these terms?**`,
                button: 'I\'m Ready!',
                buttonId: 'crew_l0_ready'
            },
            L0_5: {
                title: '🛡️ The Safety Net',
                description: `**Important:** In this network, you're never alone.\n\n• If you feel overwhelmed, step back — your progress is saved\n• If you need help, reach out to the community\n• Your cognitive resources (Spoons) regenerate over time\n• You control your own pace and boundaries\n\n*This is designed by neurodivergent people, for neurodivergent people.*`,
                button: 'I Understand',
                buttonId: 'crew_l05_understand'
            },
            L1: {
                title: '🔋 Level 1: Check Your Pocket',
                description: `Your **Spoons** represent your available cognitive energy. Every action in this network costs Spoons, but they regenerate over time.\n\nThink of it like a battery — you have a limited amount each day, but it recharges.\n\n**Your current Spoons:** {spoons}\n\n*Track your energy. Respect your limits.*`,
                button: 'Check My Pocket',
                buttonId: 'crew_l1_pocket',
                action: 'show_spoons'
            },
            L2: {
                title: '🔑 Level 2: Practice Turning Your Key',
                description: `**Karma** is earned through contribution. Every ion you add to the Posner molecule, every synchronization, every helpful interaction — it all counts.\n\nThe Posner molecule (Ca₉(PO₄)₆) needs 9 Calcium ions and 6 Phosphate ions from at least 5 unique contributors.\n\n**Your current Karma:** {karma}\n\n*Small contributions compound into something greater.*`,
                button: 'Practice Turning My Key',
                buttonId: 'crew_l2_key',
                action: 'show_karma'
            },
            L3: {
                title: '⚡ Level 3: Tune The Engine',
                description: `The **Larmor frequency** (863 Hz) is our biological anchor — the resonance of Phosphorus-31 in Earth's magnetic field.\n\nWhen you synchronize to this frequency in BONDING, you unlock encrypted content and verify your quantum signature.\n\n**Your Resonance Level:** {resonance}/10\n\n🔗 **[BONDING Game](https://bonding.p31ca.org)** — Practice synchronization here\n🔗 **[Heartbeat App](https://p31ca.org)** — Real-time Larmor visualization`,
                button: 'Tune The Engine',
                buttonId: 'crew_l3_engine',
                action: 'show_resonance'
            },
            complete: {
                title: '🎉 Crew Manual Complete!',
                description: `You've completed the onboarding journey. You're now a verified node in the P31 network.\n\n**What's next:**\n• Use /profile to track your resources\n• Use /contribute-ion to build the Posner molecule\n• Use /larmor-sync to verify your quantum signature\n• Check /leaderboard to see community progress\n\n*Welcome to the calcium cage. 🔺*`
            }
        };

        // Button custom IDs for Crew Manual
        this.crewButtonIds = {
            L0_READY: 'crew_l0_ready',
            L0_5_UNDERSTAND: 'crew_l05_understand',
            L1_POCKET: 'crew_l1_pocket',
            L2_KEY: 'crew_l2_key',
            L3_ENGINE: 'crew_l3_engine'
        };

        this.init();
    }

    /**
     * Initialize the bot
     */
    async init() {
        this.client.once('ready', () => {
            console.log(`🤖 P31 Oracle Bot ready as ${this.client.user.tag}`);
            this.setupCommands();
        });

        this.client.on('interactionCreate', this.handleInteraction.bind(this));
        
        await this.client.login(process.env.DISCORD_BOT_TOKEN);
    }

    /**
     * Setup slash commands
     */
    setupCommands() {
        const commands = [
            {
                name: 'status',
                description: 'Check the current state of the P31 ecosystem'
            },
            {
                name: 'contribute-ion',
                description: 'Contribute a Calcium or Phosphate ion to the Posner molecule',
                options: [
                    {
                        name: 'ion_type',
                        type: 3, // STRING
                        description: 'Type of ion to contribute (calcium or phosphate)',
                        required: true,
                        choices: [
                            { name: 'Calcium Ion (Ca²⁺)', value: 'calcium' },
                            { name: 'Phosphate Ion (PO₄³⁻)', value: 'phosphate' }
                        ]
                    }
                ]
            },
            {
                name: 'larmor-sync',
                description: 'Attempt to synchronize to the Larmor frequency (0.86 Hz)',
                options: [
                    {
                        name: 'timestamps',
                        type: 3, // STRING
                        description: 'JSON array of synchronization timestamps',
                        required: true
                    }
                ]
            },
            {
                name: 'verify-tetrahedron',
                description: 'Verify a Tetrahedron Protocol hash against Zenodo academic content',
                options: [
                    {
                        name: 'hash',
                        type: 3, // STRING
                        description: 'SHA-256 hash to verify',
                        required: true
                    }
                ]
            },
            {
                name: 'leaderboard',
                description: 'View the community leaderboard'
            },
            {
                name: 'profile',
                description: 'View your P31 profile',
                options: [
                    {
                        name: 'user',
                        type: 6, // USER
                        description: 'User to view profile for (optional)'
                    }
                ]
            },
            {
                name: 'start-crew-manual',
                description: 'Start or resume the P31 Crew Manual onboarding journey'
            }
        ];

        // Register commands (simplified for this example)
        console.log('📝 Commands registered:', commands.map(c => c.name).join(', '));
    }

    /**
     * Handle slash command interactions
     */
    async handleInteraction(interaction) {
        // Handle button interactions (Message Components)
        if (interaction.isButton()) {
            return await this.handleButtonInteraction(interaction);
        }

        // Handle slash commands
        if (!interaction.isChatInputCommand()) return;

        try {
            switch (interaction.commandName) {
                case 'status':
                    await this.handleStatus(interaction);
                    break;
                case 'contribute-ion':
                    await this.handleContributeIon(interaction);
                    break;
                case 'larmor-sync':
                    await this.handleLarmorSync(interaction);
                    break;
                case 'verify-tetrahedron':
                    await this.handleVerifyTetrahedron(interaction);
                    break;
                case 'leaderboard':
                    await this.handleLeaderboard(interaction);
                    break;
                case 'profile':
                    await this.handleProfile(interaction);
                    break;
                case 'start-crew-manual':
                    await this.sendCrewManualStart(interaction);
                    break;
                default:
                    await interaction.reply('Unknown command');
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            await interaction.reply({ content: 'An error occurred while processing your command.', ephemeral: true });
        }
    }

    /**
     * Handle /status command
     */
    async handleStatus(interaction) {
        const status = await this.getStatus();
        const embed = new EmbedBuilder()
            .setTitle('📊 P31 Ecosystem Status')
            .setColor('#6366f1')
            .addFields(
                {
                    name: '🔬 Posner Molecule Assembly',
                    value: `**${status.posner.calciumIons}/${this.config.posnerRequirements.calciumIons}** Ca²⁺ | **${status.posner.phosphateIons}/${this.config.posnerRequirements.phosphateIons}** PO₄³⁻\n**Contributors:** ${status.posner.uniqueContributors}/${this.config.posnerRequirements.uniqueContributors}\n**Status:** ${status.posner.assembled ? '✅ COMPLETE' : '⏳ IN PROGRESS'}`,
                    inline: false
                },
                {
                    name: '⚡ System Health',
                    value: `**Active Nodes:** ${status.system.activeNodes}\n**Queue Depth:** ${status.system.queueDepth}\n**Last Update:** ${new Date(status.timestamp).toLocaleString()}`,
                    inline: true
                },
                {
                    name: '🌐 IPFS/IPNS Status',
                    value: `**Gateway:** ${status.ipfs.gateway}\n**Domain:** ${status.ipfs.domain}\n**Latest CID:** ${status.ipfs.latestCID}`,
                    inline: true
                }
            )
            .setFooter({ text: 'P31 Oracle Bot • Real-time ecosystem monitoring' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    /**
     * Handle /contribute-ion command
     */
    async handleContributeIon(interaction) {
        const userId = interaction.user.id;
        const ionType = interaction.options.getString('ion_type');
        
        // Check if user has enough spoons
        const user = await this.getUserData(userId);
        const spoonsCost = this.config.spoonsCost[ionType + 'Ion'];
        
        if (user.spoons < spoonsCost) {
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Insufficient Spoons')
                .setDescription(`You need ${spoonsCost} Spoons to contribute a ${ionType === 'calcium' ? 'Calcium' : 'Phosphate'} ion.\n\nYou currently have ${user.spoons} Spoons.\n\n**Tip:** Rest to regenerate Spoons, or contribute to other community activities to earn more Karma.`)
                .setColor('#f59e0b')
                .setFooter({ text: 'P31 Oracle Bot • Neurodivergent-friendly pacing' });
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Check if user has already contributed maximum ions
        if (user.contributions.calciumContributed >= 3 && ionType === 'calcium') {
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Contribution Limit Reached')
                .setDescription(`You have already contributed the maximum of 3 Calcium ions.\n\nTry contributing a Phosphate ion instead, or help other community members!`)
                .setColor('#f59e0b');
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (user.contributions.phosphateContributed >= 3 && ionType === 'phosphate') {
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Contribution Limit Reached')
                .setDescription(`You have already contributed the maximum of 3 Phosphate ions.\n\nTry contributing a Calcium ion instead, or help other community members!`)
                .setColor('#f59e0b');
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Process contribution
        const result = await this.processIonContribution(userId, ionType);
        
        const embed = new EmbedBuilder()
            .setTitle('🎉 Ion Contribution Successful')
            .setDescription(`**${interaction.user.username}** contributed a **${ionType === 'calcium' ? 'Calcium' : 'Phosphate'} ion**!`)
            .addFields(
                {
                    name: '📊 Updated Status',
                    value: `**${result.status.calciumIons}/${this.config.posnerRequirements.calciumIons}** Ca²⁺ | **${result.status.phosphateIons}/${this.config.posnerRequirements.phosphateIons}** PO₄³⁻\n**Contributors:** ${result.status.uniqueContributors}/${this.config.posnerRequirements.uniqueContributors}`,
                    inline: false
                },
                {
                    name: '💰 Rewards',
                    value: `**Karma:** +${this.config.karmaRewards.ionContribution}\n**Spoons:** -${spoonsCost} (Remaining: ${result.user.spoons})`,
                    inline: true
                },
                {
                    name: '🔬 Your Contributions',
                    value: `**Calcium Ions:** ${result.user.contributions.calciumContributed}\n**Phosphate Ions:** ${result.user.contributions.phosphateContributed}`,
                    inline: true
                }
            )
            .setColor('#10b981')
            .setFooter({ text: 'P31 Oracle Bot • Building the future together' })
            .setTimestamp();

        // Check if Posner molecule is now complete
        if (result.status.assembled) {
            embed.addFields({
                name: '🎊 POSNER MOLECULE ASSEMBLED!',
                value: `The community has successfully assembled the Posner molecule ($Ca_9(PO_4)_6$)!\n\n**Next Step:** The associated GitHub PR can now be merged. Check the repository for updates.`,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    }

    /**
     * Handle /larmor-sync command
     */
    async handleLarmorSync(interaction) {
        const userId = interaction.user.id;
        const timestamps = JSON.parse(interaction.options.getString('timestamps'));
        
        // Check if user has enough spoons
        const user = await this.getUserData(userId);
        
        if (user.spoons < this.config.spoonsCost.larmorSync) {
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Insufficient Spoons')
                .setDescription(`You need ${this.config.spoonsCost.larmorSync} Spoon to attempt Larmor synchronization.\n\nYou currently have ${user.spoons} Spoons.`)
                .setColor('#f59e0b')
                .setFooter({ text: 'P31 Oracle Bot • Take your time, the frequency will wait' });
            
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Validate synchronization
        const validation = await this.validateLarmorSync(timestamps);
        
        if (!validation.valid) {
            const embed = new EmbedBuilder()
                .setTitle('🎵 Larmor Synchronization Failed')
                .setDescription(`The synchronization did not meet the required precision.\n\n**Target Frequency:** 0.86 Hz (Larmor precession)\n**Your Precision:** ${validation.metrics.precision}%\n**Required:** 80%`)
                .addFields({
                    name: '💡 Tips for Success',
                    value: '• Focus on the visual pulse in the BONDING game\n• Practice maintaining a steady rhythm\n• Try again when you feel focused and rested',
                    inline: false
                })
                .setColor('#ef4444')
                .setFooter({ text: 'P31 Oracle Bot • Quantum precision takes practice' });
            
            // Deduct spoon for attempt
            await this.updateUserSpoons(userId, -this.config.spoonsCost.larmorSync);
            return await interaction.reply({ embeds: [embed] });
        }

        // Process successful synchronization
        const result = await this.processLarmorSync(userId, validation);
        
        const embed = new EmbedBuilder()
            .setTitle('🎵 Larmor Frequency Lock Achieved!')
            .setDescription(`**${interaction.user.username}** successfully synchronized to the Larmor frequency!`)
            .addFields(
                {
                    name: '🎯 Synchronization Metrics',
                    value: `**Frequency:** ${validation.metrics.frequency} Hz\n**Precision:** ${validation.metrics.precision}%\n**Consistency:** ${validation.metrics.consistency}%\n**Resonance Level:** ${validation.metrics.resonanceLevel}/10`,
                    inline: false
                },
                {
                    name: '💰 Rewards',
                    value: `**Karma:** +${this.config.karmaRewards.larmorSync}\n**Spoons:** -${this.config.spoonsCost.larmorSync} (Remaining: ${result.user.spoons})`,
                    inline: true
                },
                {
                    name: '🔬 Content Unlocked',
                    value: `**Decrypted CID:** \`${result.decryptedCID}\`\n**Access:** https://ipfs.io/ipfs/${result.decryptedCID}`,
                    inline: true
                }
            )
            .setColor('#00ffff')
            .setFooter({ text: 'P31 Oracle Bot • Quantum biological interface active' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    /**
     * Handle /verify-tetrahedron command
     */
    async handleVerifyTetrahedron(interaction) {
        const hash = interaction.options.getString('hash');
        
        // Verify hash against Zenodo records
        const verification = await this.verifyTetrahedronHash(hash);
        
        const embed = new EmbedBuilder()
            .setTitle('🔍 Tetrahedron Protocol Verification')
            .setDescription(`Verifying hash: \`${hash}\``)
            .addFields({
                name: '📊 Verification Result',
                value: verification.valid 
                    ? `✅ **VALID** - Hash matches academic content\n**DOI:** ${verification.doi}\n**Title:** ${verification.title}`
                    : '❌ **INVALID** - Hash not found in academic records',
                inline: false
            })
            .setColor(verification.valid ? '#10b981' : '#ef4444')
            .setFooter({ text: 'P31 Oracle Bot • Academic integrity verification' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    /**
     * Handle /leaderboard command
     */
    async handleLeaderboard(interaction) {
        const leaderboard = await this.getLeaderboard();
        
        const embed = new EmbedBuilder()
            .setTitle('🏆 P31 Community Leaderboard')
            .setDescription('Top contributors to the quantum biological network')
            .setColor('#6366f1')
            .addFields(
                {
                    name: '🥇 Top Contributors',
                    value: leaderboard.topContributors.map((user, index) => 
                        `${index + 1}. **${user.username}** - ${user.contributions.total} ions`
                    ).join('\n') || 'No contributors yet',
                    inline: false
                },
                {
                    name: '⚡ Top Karma Earners',
                    value: leaderboard.topKarma.map((user, index) => 
                        `${index + 1}. **${user.username}** - ${user.karma} karma`
                    ).join('\n') || 'No karma earned yet',
                    inline: false
                },
                {
                    name: '🎵 Larmor Masters',
                    value: leaderboard.larmorMasters.map((user, index) => 
                        `${index + 1}. **${user.username}** - ${user.larmorSyncs} successful synchronizations`
                    ).join('\n') || 'No synchronizations yet',
                    inline: false
                }
            )
            .setFooter({ text: 'P31 Oracle Bot • Community achievements' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    /**
     * Handle /profile command
     */
    async handleProfile(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const user = await this.getUserData(targetUser.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`👤 ${targetUser.username}'s P31 Profile`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setColor('#6366f1')
            .addFields(
                {
                    name: '🧠 Cognitive Resources',
                    value: `**Spoons:** ${user.spoons}/100\n**Karma:** ${user.karma}\n**Last Regen:** ${new Date(user.lastSpoonsRegen).toLocaleString()}`,
                    inline: true
                },
                {
                    name: '🔬 Scientific Contributions',
                    value: `**Calcium Ions:** ${user.contributions.calciumContributed}\n**Phosphate Ions:** ${user.contributions.phosphateContributed}\n**Total Ions:** ${user.contributions.total}\n**Unique Contributors:** ${user.contributions.uniqueContributors}`,
                    inline: true
                },
                {
                    name: '🎵 Quantum Achievements',
                    value: `**Larmor Synchronizations:** ${user.larmorSyncs}\n**Best Resonance:** ${user.bestResonanceLevel}/10\n**Precision Score:** ${user.precisionScore}%\n**Consistency Score:** ${user.consistencyScore}%`,
                    inline: false
                }
            )
            .setFooter({ text: 'P31 Oracle Bot • Your quantum journey' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    /**
     * Handle button interactions for Crew Manual
     */
    async handleButtonInteraction(interaction) {
        const customId = interaction.customId;
        const userId = interaction.user.id;
        
        try {
            // Acknowledge button press immediately
            await interaction.deferUpdate();
            
            // Get user data and progression state
            const user = await this.getUserData(userId);
            const progress = await this.getCrewProgress(userId);
            
            // Route to appropriate handler based on button customId
            switch (customId) {
                case this.crewButtonIds.L0_READY:
                    await this.handleCrewL0Ready(interaction, user, progress);
                    break;
                case this.crewButtonIds.L0_5_UNDERSTAND:
                    await this.handleCrewL05Understand(interaction, user, progress);
                    break;
                case this.crewButtonIds.L1_POCKET:
                    await this.handleCrewL1Pocket(interaction, user, progress);
                    break;
                case this.crewButtonIds.L2_KEY:
                    await this.handleCrewL2Key(interaction, user, progress);
                    break;
                case this.crewButtonIds.L3_ENGINE:
                    await this.handleCrewL3Engine(interaction, user, progress);
                    break;
                default:
                    console.log(`Unknown button interaction: ${customId}`);
            }
        } catch (error) {
            console.error('Error handling button interaction:', error);
            try {
                await interaction.followUp({ content: 'An error occurred. Please try again.', ephemeral: true });
            } catch (e) {
                // Interaction might be too old
            }
        }
    }

    /**
     * Handle L0 Ready button - Start the Crew Manual
     */
    async handleCrewL0Ready(interaction, user, progress) {
        // Update progress to L0.5
        await this.updateCrewProgress(interaction.user.id, 'L0.5');
        
        const msg = this.crewManualMessages.L0_5;
        const embed = new EmbedBuilder()
            .setTitle(msg.title)
            .setDescription(msg.description)
            .setColor('#00FF88')
            .setFooter({ text: 'P31 Oracle Bot • Crew Manual' });
        
        const button = new ButtonBuilder()
            .setCustomId(msg.buttonId)
            .setLabel(msg.button)
            .setStyle(ButtonStyle.Secondary);
        
        const row = new ActionRowBuilder().addComponents(button);
        
        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    /**
     * Handle L0.5 Understand button - Acknowledge Safety Net and go to L1
     */
    async handleCrewL05Understand(interaction, user, progress) {
        // Update progress to L1
        await this.updateCrewProgress(interaction.user.id, 'L1');
        
        const msg = this.crewManualMessages.L1;
        const description = msg.description.replace('{spoons}', user.spoons);
        
        const embed = new EmbedBuilder()
            .setTitle(msg.title)
            .setDescription(description)
            .setColor('#00D4FF')
            .setFooter({ text: 'P31 Oracle Bot • Crew Manual' });
        
        const button = new ButtonBuilder()
            .setCustomId(msg.buttonId)
            .setLabel(msg.button)
            .setStyle(ButtonStyle.Primary);
        
        const row = new ActionRowBuilder().addComponents(button);
        
        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    /**
     * Handle L1 Pocket button - Show spoons and proceed to L2
     */
    async handleCrewL1Pocket(interaction, user, progress) {
        // Update progress to L2
        await this.updateCrewProgress(interaction.user.id, 'L2');
        
        const msg = this.crewManualMessages.L2;
        const description = msg.description.replace('{karma}', user.karma);
        
        const embed = new EmbedBuilder()
            .setTitle(msg.title)
            .setDescription(description)
            .setColor('#7A27FF')
            .addFields({
                name: '💡 Your Spoons',
                value: `You have **${user.spoons}/100** Spoons available.`,
                inline: false
            })
            .setFooter({ text: 'P31 Oracle Bot • Crew Manual' });
        
        const button = new ButtonBuilder()
            .setCustomId(msg.buttonId)
            .setLabel(msg.button)
            .setStyle(ButtonStyle.Primary);
        
        const row = new ActionRowBuilder().addComponents(button);
        
        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    /**
     * Handle L2 Key button - Show karma and proceed to L3
     */
    async handleCrewL2Key(interaction, user, progress) {
        // Update progress to L3
        await this.updateCrewProgress(interaction.user.id, 'L3');
        
        const msg = this.crewManualMessages.L3;
        const description = msg.description.replace('{resonance}', user.bestResonanceLevel);
        
        const embed = new EmbedBuilder()
            .setTitle(msg.title)
            .setDescription(description)
            .setColor('#FF6600')
            .addFields({
                name: '💡 Your Karma',
                value: `You have earned **${user.karma}** Karma from contributions.`,
                inline: false
            })
            .setFooter({ text: 'P31 Oracle Bot • Crew Manual' });
        
        const button = new ButtonBuilder()
            .setCustomId(msg.buttonId)
            .setLabel(msg.button)
            .setStyle(ButtonStyle.Primary);
        
        const row = new ActionRowBuilder().addComponents(button);
        
        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    /**
     * Handle L3 Engine button - Complete the Crew Manual
     */
    async handleCrewL3Engine(interaction, user, progress) {
        // Mark as complete
        await this.updateCrewProgress(interaction.user.id, 'complete');
        
        const msg = this.crewManualMessages.complete;
        
        const embed = new EmbedBuilder()
            .setTitle(msg.title)
            .setDescription(msg.description)
            .setColor('#00FF88')
            .addFields({
                name: '🎯 Your Stats',
                value: `**Spoons:** ${user.spoons}/100\n**Karma:** ${user.karma}\n**Resonance:** ${user.bestResonanceLevel}/10`,
                inline: true
            })
            .setFooter({ text: 'P31 Oracle Bot • Welcome to the network!' });
        
        // Clear buttons (no more navigation)
        await interaction.editReply({ embeds: [embed], components: [] });
    }

    /**
     * Send Crew Manual start message (for DM or slash command)
     */
    async sendCrewManualStart(interaction) {
        const userId = interaction.user.id;
        
        // Check if already in progress or complete
        const progress = await this.getCrewProgress(userId);
        if (progress && progress !== 'L0') {
            // Resume from current position
            return await this.resumeCrewManual(interaction, userId, progress);
        }
        
        // Start at L0
        await this.updateCrewProgress(userId, 'L0');
        
        const msg = this.crewManualMessages.L0;
        const embed = new EmbedBuilder()
            .setTitle(msg.title)
            .setDescription(msg.description)
            .setColor('#00FF88')
            .setFooter({ text: 'P31 Oracle Bot • Crew Manual' });
        
        const button = new ButtonBuilder()
            .setCustomId(msg.buttonId)
            .setLabel(msg.button)
            .setStyle(ButtonStyle.Primary);
        
        const row = new ActionRowBuilder().addComponents(button);
        
        // Check if this is a slash command or button interaction
        if (interaction.isChatInputCommand()) {
            // For slash commands, send as DM
            try {
                const dmChannel = await interaction.user.createDM();
                await dmChannel.send({ embeds: [embed], components: [row] });
                await interaction.reply({ content: '📬 Check your DMs for the Crew Manual!', ephemeral: true });
            } catch (error) {
                // Fallback to reply if DM fails
                await interaction.reply({ embeds: [embed], components: [row] });
            }
        } else {
            // For button interactions, edit the original message
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    /**
     * Resume Crew Manual from a specific progress point
     */
    async resumeCrewManual(interaction, userId, progress) {
        const user = await this.getUserData(userId);
        
        let msg, embed, button, row;
        
        switch (progress) {
            case 'L0.5':
                msg = this.crewManualMessages.L0_5;
                embed = new EmbedBuilder()
                    .setTitle(msg.title)
                    .setDescription(msg.description)
                    .setColor('#00FF88')
                    .setFooter({ text: 'P31 Oracle Bot • Crew Manual (resumed)' });
                button = new ButtonBuilder()
                    .setCustomId(msg.buttonId)
                    .setLabel(msg.button)
                    .setStyle(ButtonStyle.Secondary);
                row = new ActionRowBuilder().addComponents(button);
                break;
            case 'L1':
                msg = this.crewManualMessages.L1;
                const desc1 = msg.description.replace('{spoons}', user.spoons);
                embed = new EmbedBuilder()
                    .setTitle(msg.title)
                    .setDescription(desc1)
                    .setColor('#00D4FF')
                    .setFooter({ text: 'P31 Oracle Bot • Crew Manual (resumed)' });
                button = new ButtonBuilder()
                    .setCustomId(msg.buttonId)
                    .setLabel(msg.button)
                    .setStyle(ButtonStyle.Primary);
                row = new ActionRowBuilder().addComponents(button);
                break;
            case 'L2':
                msg = this.crewManualMessages.L2;
                const desc2 = msg.description.replace('{karma}', user.karma);
                embed = new EmbedBuilder()
                    .setTitle(msg.title)
                    .setDescription(desc2)
                    .setColor('#7A27FF')
                    .setFooter({ text: 'P31 Oracle Bot • Crew Manual (resumed)' });
                button = new ButtonBuilder()
                    .setCustomId(msg.buttonId)
                    .setLabel(msg.button)
                    .setStyle(ButtonStyle.Primary);
                row = new ActionRowBuilder().addComponents(button);
                break;
            case 'L3':
                msg = this.crewManualMessages.L3;
                const desc3 = msg.description.replace('{resonance}', user.bestResonanceLevel);
                embed = new EmbedBuilder()
                    .setTitle(msg.title)
                    .setDescription(desc3)
                    .setColor('#FF6600')
                    .setFooter({ text: 'P31 Oracle Bot • Crew Manual (resumed)' });
                button = new ButtonBuilder()
                    .setCustomId(msg.buttonId)
                    .setLabel(msg.button)
                    .setStyle(ButtonStyle.Primary);
                row = new ActionRowBuilder().addComponents(button);
                break;
            case 'complete':
                msg = this.crewManualMessages.complete;
                embed = new EmbedBuilder()
                    .setTitle(msg.title)
                    .setDescription(msg.description)
                    .setColor('#00FF88')
                    .addFields({
                        name: '🎯 Your Stats',
                        value: `**Spoons:** ${user.spoons}/100\n**Karma:** ${user.karma}\n**Resonance:** ${user.bestResonanceLevel}/10`,
                        inline: true
                    })
                    .setFooter({ text: 'P31 Oracle Bot • Welcome back!' });
                row = null;
                break;
            default:
                // Start fresh if unknown state
                return await this.sendCrewManualStart(interaction);
        }
        
        if (interaction.isChatInputCommand()) {
            try {
                const dmChannel = await interaction.user.createDM();
                await dmChannel.send({ embeds: [embed], components: row ? [row] : [] });
                await interaction.reply({ content: '📬 Check your DMs!', ephemeral: true });
            } catch {
                await interaction.reply({ embeds: [embed], components: row ? [row] : [] });
            }
        } else {
            await interaction.editReply({ embeds: [embed], components: row ? [row] : [] });
        }
    }

    /**
     * Get user Crew Manual progress from Redis
     */
    async getCrewProgress(userId) {
        const progress = await this.redis.get(`crew_progress:${userId}`);
        return progress || null;
    }

    /**
     * Update user Crew Manual progress in Redis
     */
    async updateCrewProgress(userId, level) {
        await this.redis.set(`crew_progress:${userId}`, level, 'EX', 86400 * 30); // 30 day TTL
    }

    /**
     * Helper methods for data management
     */
    
    async getStatus() {
        const [
            posnerStatus,
            systemStatus,
            ipfsStatus
        ] = await Promise.all([
            this.redis.get('posner-status'),
            this.redis.get('system-status'),
            this.redis.get('ipfs-status')
        ]);

        return {
            posner: posnerStatus ? JSON.parse(posnerStatus) : this.getDefaultPosnerStatus(),
            system: systemStatus ? JSON.parse(systemStatus) : this.getDefaultSystemStatus(),
            ipfs: ipfsStatus ? JSON.parse(ipfsStatus) : this.getDefaultIPFSStatus(),
            timestamp: new Date().toISOString()
        };
    }

    async getUserData(userId) {
        const userData = await this.redis.get(`user:${userId}`);
        if (userData) {
            return JSON.parse(userData);
        }
        
        return this.createUser(userId);
    }

    async createUser(userId) {
        const user = {
            userId: userId,
            username: userId, // Will be updated when we get the actual username
            spoons: 100,
            karma: 0,
            contributions: {
                calciumContributed: 0,
                phosphateContributed: 0,
                total: 0,
                uniqueContributors: 0
            },
            larmorSyncs: 0,
            bestResonanceLevel: 0,
            precisionScore: 0,
            consistencyScore: 0,
            lastSpoonsRegen: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        await this.redis.set(`user:${userId}`, JSON.stringify(user));
        return user;
    }

    async processIonContribution(userId, ionType) {
        const user = await this.getUserData(userId);
        const status = await this.getStatus();

        // Update user
        user.contributions[ionType + 'Contributed']++;
        user.contributions.total++;
        user.spoons -= this.config.spoonsCost[ionType + 'Ion'];
        user.karma += this.config.karmaRewards.ionContribution;

        // Update status
        status.posner[ionType + 'Ions']++;
        if (user.contributions.total === 1) {
            status.posner.uniqueContributors++;
        }

        // Check assembly completion
        status.posner.assembled = (
            status.posner.calciumIons >= this.config.posnerRequirements.calciumIons &&
            status.posner.phosphateIons >= this.config.posnerRequirements.phosphateIons &&
            status.posner.uniqueContributors >= this.config.posnerRequirements.uniqueContributors
        );

        // Save updates
        await Promise.all([
            this.redis.set(`user:${userId}`, JSON.stringify(user)),
            this.redis.set('posner-status', JSON.stringify(status.posner))
        ]);

        return { user, status };
    }

    async validateLarmorSync(timestamps) {
        const TARGET_FREQ = 0.86;
        const TARGET_INTERVAL = 1000 / TARGET_FREQ;
        const TOLERANCE = 120;
        const REQUIRED_RESONANCE = 10;

        if (!Array.isArray(timestamps) || timestamps.length < REQUIRED_RESONANCE) {
            return { valid: false, reason: 'Insufficient synchronization attempts' };
        }

        let consecutiveValid = 0;
        let totalValid = 0;
        const intervals = [];
        const deviations = [];

        for (let i = 1; i < timestamps.length; i++) {
            const interval = timestamps[i] - timestamps[i - 1];
            intervals.push(interval);
            
            const deviation = Math.abs(interval - TARGET_INTERVAL);
            deviations.push(deviation);
            
            if (deviation <= TOLERANCE) {
                consecutiveValid++;
                totalValid++;
            } else {
                consecutiveValid = 0;
            }
        }

        const valid = consecutiveValid >= REQUIRED_RESONANCE;
        
        return {
            valid: valid,
            metrics: {
                frequency: 1000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length),
                precision: Math.max(0, Math.round(100 - (deviations.reduce((a, b) => a + b, 0) / deviations.length / TOLERANCE) * 100)),
                consistency: Math.round((totalValid / intervals.length) * 100),
                resonanceLevel: valid ? 10 : Math.round((consecutiveValid / REQUIRED_RESONANCE) * 100)
            }
        };
    }

    async processLarmorSync(userId, validation) {
        const user = await this.getUserData(userId);
        
        // Update user stats
        user.larmorSyncs++;
        user.bestResonanceLevel = Math.max(user.bestResonanceLevel, validation.metrics.resonanceLevel);
        user.precisionScore = validation.metrics.precision;
        user.consistencyScore = validation.metrics.consistency;
        user.spoons -= this.config.spoonsCost.larmorSync;
        user.karma += this.config.karmaRewards.larmorSync;

        // Generate decrypted CID
        const decryptedCID = this.generateDecryptedCID(validation);

        // Save updates
        await this.redis.set(`user:${userId}`, JSON.stringify(user));

        return { user, decryptedCID };
    }

    generateDecryptedCID(validation) {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify({
            validation: validation.metrics,
            timestamp: new Date().toISOString(),
            userId: 'discord_user'
        }));
        
        return `bafybeih${hash.digest('hex').slice(0, 52)}`;
    }

    async verifyTetrahedronHash(hash) {
        // This would normally query Zenodo API or academic database
        // For now, return a mock verification
        const validHashes = [
            'sha256:abc123def456...',
            'sha256:789ghi012jkl...'
        ];

        if (validHashes.includes(hash)) {
            return {
                valid: true,
                doi: '10.5281/zenodo.1234567',
                title: 'Quantum Biological Resonance in Phosphorus-31 Networks'
            };
        }

        return { valid: false };
    }

    async getLeaderboard() {
        // This would query all users and sort by various metrics
        // For now, return mock data
        return {
            topContributors: [],
            topKarma: [],
            larmorMasters: []
        };
    }

    getDefaultPosnerStatus() {
        return {
            assembled: false,
            calciumIons: 0,
            phosphateIons: 0,
            uniqueContributors: 0,
            requirements: this.config.posnerRequirements
        };
    }

    getDefaultSystemStatus() {
        return {
            activeNodes: 12,
            queueDepth: 0,
            lastUpdated: new Date().toISOString()
        };
    }

    getDefaultIPFSStatus() {
        return {
            gateway: 'https://ipfs.io',
            domain: 'andromeda.p31.eth',
            latestCID: 'bafybeih6h7d2x6j3j4x2p2y7b2m4z6q2w8v5n4c3k9j8h7g6f5d4s3a2'
        };
    }
}

// Start the bot
if (require.main === module) {
    const bot = new P31OracleBot();
}

module.exports = P31OracleBot;