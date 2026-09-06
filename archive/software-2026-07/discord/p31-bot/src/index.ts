import {
  Client,
  GatewayIntentBits,
  Message,
  TextChannel,
  Events,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import * as dotenv from "dotenv";
import WebhookHandler from "./services/webhookHandler";
import { setupCortexRoutes } from "./services/cortexWebhook";
import FawnDetector from "./services/fawnDetector";
import TelemetryService from "./services/telemetry";
import QuantumEggHunt from "./services/quantumEggHunt";
import {
  createCommandRegistry,
  getApiUrls,
  getTimeout,
  getPrefix,
  parseArgs,
  CommandContext,
} from "./commands/base";
import { registerAllCommands } from "./boot/registerCommands";
import { handleScaffoldCommand } from "./services/serverScaffold";
import * as spoonLedger from "./services/spoonLedger";
import { startSubstackIntegration, initSubstackPoller } from "./services/substackPoller";

// Load environment variables
dotenv.config();

// Initialize services
const webhookPort = parseInt(process.env.NODE_ONE_WEBHOOK_PORT || "3000", 10);
const webhookHandler = new WebhookHandler(webhookPort);

const fawnDetector = new FawnDetector(
  process.env.ENABLE_FAWN_DETECTION === "true",
);

const telemetryService = new TelemetryService(
  process.env.TELEMETRY_API_URL || "",
  !!process.env.TELEMETRY_API_URL,
  getTimeout(),
);

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Wire Cortex webhook routes (must be after client init)
setupCortexRoutes(webhookHandler.app, client);

// Initialize command registry
const registry = createCommandRegistry();

registerAllCommands(registry);

// Get configuration
const prefix = getPrefix();
const apiUrls = getApiUrls();
const timeout = getTimeout();

// Channel IDs
const bondingChannelId = process.env.BONDING_CHANNEL_ID;
const nodeOneChannelId = process.env.NODE_ONE_CHANNEL_ID;
const announcementsChannelId = process.env.ANNOUNCEMENTS_CHANNEL_ID;
let showcaseChannelId = process.env.SHOWCASE_CHANNEL_ID;

// Initialize Quantum Egg Hunt service (may be rebound after scaffold)
let quantumEggHunt = new QuantumEggHunt({
  targetChannelId: showcaseChannelId,
  announcementsChannelId,
  telemetry: telemetryService,
});

// Helper function to get channel
function getChannel(channelId?: string): TextChannel | null {
  if (!channelId) return null;
  const channel = client.channels.cache.get(channelId);
  if (channel && channel instanceof TextChannel) {
    return channel;
  }
  return null;
}

// Handle webhook events
webhookHandler.on("kofi", async (event) => {
  console.log("Ko-fi webhook received:", event);
  const channel = getChannel(announcementsChannelId);
  if (channel) {
    const p = event.payload;
    // Ko-fi uses from_name, amount (string), currency
    const fromName = String(p.from_name || p.supporterName || "Anonymous");
    const amount = p.amount ? `${p.amount} ${p.currency || ""}`.trim() : "N/A";
    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle("💖 Ko-fi Support Received")
      .addFields(
        { name: "From", value: fromName, inline: true },
        { name: "Amount", value: amount, inline: true },
        { name: "Type", value: String(p.type || "Donation"), inline: true },
      )
      .setFooter({
        text: "P31 Labs — Thank you for keeping the mesh alive. 💜🔺💜",
      });
    if (p.message)
      embed.addFields({ name: "Message", value: String(p.message) });

    // Award spoons keyed by Ko-fi name (Discord account linking is a future step)
    const kofiKey = `kofi:${fromName}`;
    const KOFI_SPOONS = 39;
    const newBalance = spoonLedger.award(kofiKey, KOFI_SPOONS);
    embed.addFields({
      name: "Spoons",
      value: `+${KOFI_SPOONS} → ${newBalance} total (run \`p31 spoon link ${fromName}\` to link your Discord account)`,
      inline: false,
    });

    await channel.send({ embeds: [embed] });
  }
  await telemetryService.trackWebhook("kofi", event.payload.type as string);
});

webhookHandler.on("node_one", async (event) => {
  console.log("Node One webhook received:", event);
  const channel = getChannel(nodeOneChannelId);
  if (channel) {
    await channel.send({
      content: `🔘 Node One event: ${event.payload.event}`,
    });
  }
  await telemetryService.trackWebhook(
    "node_one",
    event.payload.event as string,
  );
});

// Egg-indicative formulas from BONDING (display names that hint at hunt eggs)
const EGG_FORMULA_HINTS: Array<{ match: RegExp; egg: string; label: string }> =
  [
    { match: /bashium|bash/i, egg: "bashium", label: "Bashium Element" },
    { match: /willium|will/i, egg: "willium", label: "Willium Element" },
    {
      match: /ca9|ca₉|posner/i,
      egg: "tetrahedron",
      label: "Posner Molecule (K₄)",
    },
    {
      match: /172\.?35/i,
      egg: "missing_node",
      label: "The Missing Node (172.35Hz)",
    },
  ];

webhookHandler.on("bonding", async (event) => {
  console.log("BONDING webhook received:", event);
  const channel = getChannel(bondingChannelId);
  if (channel) {
    const evt = event.payload.event as string;
    const room = String(event.payload.roomCode || "unknown");
    const evtMeta: Record<
      string,
      { emoji: string; title: string; color: number }
    > = {
      game_start: {
        emoji: "🧬",
        title: "New Session Started",
        color: 0x3b82f6,
      },
      game_end: { emoji: "🏁", title: "Session Complete", color: 0x64748b },
      molecule_created: {
        emoji: "⚛️",
        title: "Molecule Synthesized",
        color: 0x00ff88,
      },
      quest_complete: { emoji: "🔺", title: "Quest Complete", color: 0x9c27b0 },
      love_earned: { emoji: "💜", title: "L.O.V.E. Earned", color: 0xff69b4 },
    };
    const meta = evtMeta[evt] ?? { emoji: "🔘", title: evt, color: 0x06b6d4 };
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${meta.emoji} BONDING: ${meta.title}`)
      .addFields({ name: "Room", value: room, inline: true })
      .setFooter({ text: "BONDING Game — Bridge the distance." });

    // If molecule_created matches an egg formula, add a hunt hint
    if (evt === "molecule_created") {
      const data = event.payload.data as Record<string, unknown> | undefined;
      const formula = String(data?.formula ?? data?.displayFormula ?? "");
      const hit = EGG_FORMULA_HINTS.find((h) => h.match.test(formula));
      if (hit) {
        embed.addFields({
          name: `🔺 Egg Detected: ${hit.label}`,
          value: `Post the formula in #showcase and run \`p31 eggs\` to claim your discovery.`,
          inline: false,
        });
      }
      if (data?.love)
        embed.addFields({
          name: "LOVE",
          value: String(data.love),
          inline: true,
        });
    }

    await channel.send({ embeds: [embed] });
  }
  await telemetryService.trackWebhook("bonding", event.payload.event as string);
});

// Stripe donate webhook → #announcements embed + spoon award
webhookHandler.on("stripe", async (event) => {
  console.log("Stripe webhook received:", event.payload.type);
  const channel = getChannel(announcementsChannelId);
  const stripeType = event.payload.type as string;

  // Only handle completed checkout sessions
  if (stripeType !== "checkout.session.completed") return;

  const dataWrap = event.payload.data as Record<string, unknown> | undefined;
  const obj = (dataWrap?.object as Record<string, unknown>) ?? {};
  const amount =
    typeof obj.amount_total === "number"
      ? (obj.amount_total / 100).toFixed(2)
      : "?";
  const currency = String(obj.currency ?? "usd").toUpperCase();
  const customerEmail = String(
    (obj.customer_details as Record<string, unknown>)?.email ??
      obj.customer_email ??
      "Anonymous",
  );
  const name = String(
    (obj.customer_details as Record<string, unknown>)?.name ?? customerEmail,
  );

  const STRIPE_SPOONS = 39;
  const stripeKey = `stripe:${customerEmail}`;
  const newBalance = spoonLedger.award(stripeKey, STRIPE_SPOONS);

  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setTitle("💜 Stripe Donation Received")
      .addFields(
        { name: "From", value: name, inline: true },
        { name: "Amount", value: `${amount} ${currency}`, inline: true },
        {
          name: "Spoons",
          value: `+${STRIPE_SPOONS} → ${newBalance} total (run \`p31 spoon link ${name}\` to link Discord)`,
          inline: false,
        },
      )
      .setFooter({
        text: "P31 Labs — Thank you for keeping the mesh alive. 💜🔺💜",
      });
    await channel.send({ embeds: [embed] });
  }
  await telemetryService.trackWebhook("stripe", stripeType);
});

webhookHandler.on("github", async (event) => {
  console.log("GitHub webhook received:", event.payload.githubEvent);
  const channel = getChannel(announcementsChannelId);
  if (!channel) return;
  const ghEvent = event.payload.githubEvent as string;
  const repo =
    ((event.payload.repository as Record<string, unknown>)
      ?.full_name as string) || "p31labs/andromeda";
  if (ghEvent === "push") {
    const pusher =
      (event.payload.pusher as Record<string, string>)?.name || "unknown";
    const branch =
      (event.payload.ref as string)?.replace("refs/heads/", "") || "unknown";
    const commits = ((event.payload.commits as unknown[]) || []).length;
    const embed = new EmbedBuilder()
      .setColor(0x06b6d4)
      .setTitle("🔀 Push to Andromeda")
      .addFields(
        { name: "Branch", value: `\`${branch}\``, inline: true },
        { name: "Commits", value: String(commits), inline: true },
        { name: "Pusher", value: pusher, inline: true },
      )
      .setFooter({ text: repo });
    await channel.send({ embeds: [embed] });
  } else if (ghEvent === "pull_request") {
    const pr = event.payload.pull_request as Record<string, unknown>;
    const action = event.payload.action as string;
    if (action === "closed" && pr.merged) {
      const embed = new EmbedBuilder()
        .setColor(0x9c27b0)
        .setTitle(`✅ PR Merged: ${pr.title}`)
        .setURL(pr.html_url as string)
        .addFields({
          name: "Author",
          value: (pr.user as Record<string, string>)?.login || "unknown",
          inline: true,
        })
        .setFooter({ text: repo });
      await channel.send({ embeds: [embed] });
    }
  }
});

// Discord message handler
client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check for Quantum Egg Hunt triggers in showcase channel
  if (showcaseChannelId && message.channel.id === showcaseChannelId && quantumEggHunt.isActive()) {
    await quantumEggHunt.processMessage(message);
  }

  // Scaffold command
  if (message.content === "!scaffold-p31") {
    await handleScaffoldCommand(message, (newShowcaseId) => {
      showcaseChannelId = newShowcaseId;
      process.env.SHOWCASE_CHANNEL_ID = newShowcaseId;
      quantumEggHunt = new QuantumEggHunt({
        targetChannelId: newShowcaseId,
        announcementsChannelId,
      });
      quantumEggHunt.setClient(client);
      console.log(
        `[SCAFFOLD] QuantumEggHunt rebound to #showcase (${newShowcaseId})`,
      );
    });
    return;
  }

  // Check for hidden !quantum-egg or !863 commands (case-insensitive)
  const lowerContent = message.content.toLowerCase().trim();
  if (lowerContent === "!quantum-egg" || lowerContent === "!863") {
    await quantumEggHunt.handleHiddenCommand(message);
    return;
  }

  // Check if message starts with prefix
  if (!message.content.startsWith(prefix)) {
    // Check for fawning patterns in all messages
    const fawnResult = fawnDetector.analyze(message.content);
    if (fawnResult.isFawning) {
      console.log(
        `Fawning detected in message from ${message.author.id}:`,
        fawnResult.patterns,
      );
      await telemetryService.trackFawnDetection(
        message.author.id,
        fawnResult.confidence,
        fawnResult.patterns,
      );

      // Optionally respond with a gentle reminder (disabled by default)
      // if (fawnResult.suggestion) {
      //   await message.reply(fawnResult.suggestion);
      // }
    }
    return;
  }

  // Parse command and args
  const args = parseArgs(message.content, prefix);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  // Get command from registry
  const command = registry.get(commandName);
  if (!command) {
    await message.reply(
      `Unknown command: ${commandName}. Use \`${prefix} help\` for available commands.`,
    );
    return;
  }

  // Create command context
  const context: CommandContext = {
    message,
    args,
    prefix,
    apiUrls,
    timeout,
  };

  // Execute command
  try {
    await command.execute(context);
    await telemetryService.trackCommand(
      command.name,
      message.author.id,
      message.guildId || "dm",
    );
  } catch (error) {
    console.error(`Error executing command ${command.name}:`, error);
    await message.reply(
      `An error occurred while executing \`${command.name}\`. Please try again.`,
    );
    await telemetryService.trackError(
      "command_execution",
      error instanceof Error ? error.message : "Unknown error",
      error instanceof Error ? error.stack : undefined,
    );
  }
});

// Bot ready handler
client.on(Events.ClientReady, async () => {
  console.log(`P31 Bot logged in as ${client.user?.tag}`);
  console.log(`Prefix: ${prefix}`);
  console.log(
    `Commands: ${registry
      .getAll()
      .map((c) => c.name)
      .join(", ")}`,
  );
  console.log(
    `Fawn detection: ${fawnDetector.isEnabled() ? "enabled" : "disabled"}`,
  );
  console.log(
    `Telemetry: ${telemetryService.isEnabled() ? "enabled" : "disabled"}`,
  );

  // Auto-scaffold #showcase channel across connected guilds
  for (const [, guild] of client.guilds.cache) {
    let showcase = guild.channels.cache.find((c) => c.name === "showcase");

    if (!showcase) {
      console.log(`[SCAFFOLD] Creating #showcase in ${guild.name}...`);
      try {
        showcase = await guild.channels.create({
          name: "showcase",
          type: ChannelType.GuildText,
          topic:
            "Quantum Egg Hunt: Chemical Egg Verification. Post Bashium, Willium, or Posner formulas here.",
        });
        console.log(
          `[SCAFFOLD] #showcase created in ${guild.name} (${showcase.id})`,
        );
      } catch (err) {
        console.error(
          `[SCAFFOLD] Missing Manage Channels permission in ${guild.name} — grant it to the bot role.`,
        );
        continue;
      }
    } else {
      console.log(
        `[SCAFFOLD] #showcase found in ${guild.name} (${showcase.id})`,
      );
    }

    // Dynamically bind showcase ID — last guild wins if multi-guild
    showcaseChannelId = showcase.id;
    process.env.SHOWCASE_CHANNEL_ID = showcase.id;
  }

  // Rebind Quantum Egg Hunt with discovered channel ID
  quantumEggHunt = new QuantumEggHunt({
    targetChannelId: showcaseChannelId,
    announcementsChannelId,
  });
  quantumEggHunt.setClient(client);

  // Start spoon economy regeneration cron
  spoonLedger.startSpoonRegeneration();

  // Start Substack RSS poller for Content Forge
  const substackWebhook = process.env.SUBSTACK_WEBHOOK_URL;
  if (substackWebhook) {
    initSubstackPoller(substackWebhook);
    startSubstackIntegration();
  } else {
    console.log('[BOT] Substack poller not configured (SUBSTACK_WEBHOOK_URL missing)');
  }
});

// Error handlers
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  telemetryService.trackError(
    "unhandled_rejection",
    error instanceof Error ? error.message : "Unknown error",
    error instanceof Error ? error.stack : undefined,
  );
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  telemetryService.trackError("uncaught_exception", error.message, error.stack);
  process.exit(1);
});

// Start the bot
async function main(): Promise<void> {
  // Start webhook server
  await webhookHandler.start();
  console.log(`Webhook handler started on port ${webhookPort}`);

  // Login to Discord
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error("DISCORD_TOKEN is required");
  }

  await client.login(token);
}

main().catch(console.error);

export { client, registry, webhookHandler, fawnDetector, telemetryService };
