import { Message, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import { CommandContext, P31Command, getApiUrls } from "./base";
import { defaultRetryableFetch } from "../services/retryUtility";

interface CortexStatus {
  status: string;
  pendingDeadlines: number;
  overdueDeadlines: number;
  scheduledAlerts: number;
  timestamp: string;
}

interface Deadline {
  id: string;
  title: string;
  due_date: string;
  category: string;
  priority: string;
  status: string;
  metadata: string;
}

interface OrchestratorResult {
  timestamp: string;
  totalDuration: number;
  agentsRun: number;
  agentsSucceeded: number;
  agentsFailed: number;
  results: Array<{
    name: string;
    ok: boolean;
    duration: number;
    data?: Record<string, unknown>;
    error?: string;
  }>;
}

export class CortexCommand implements P31Command {
  name = "cortex";
  description = "P31 Cortex — operations dashboard, deadlines, agent status";
  aliases = ["ops", "deadlines", "alert"];
  usage = "cortex [status|deadlines|run|agent <name>]";

  async execute(context: CommandContext): Promise<void> {
    const { message, args, apiUrls } = context;
    const cortexUrl = apiUrls.cortex;
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case "status":
      case "health":
        await this.showStatus(message, cortexUrl);
        break;
      case "deadlines":
      case "dl":
        await this.showDeadlines(message, cortexUrl, args.slice(1));
        break;
      case "run":
        await this.runOrchestrator(message, cortexUrl);
        break;
      case "agent":
        await this.runAgent(message, cortexUrl, args[1]);
        break;
      case "overdue":
        await this.showOverdue(message, cortexUrl);
        break;
      default:
        await this.showDashboard(message, cortexUrl);
    }
  }

  private async showDashboard(message: Message, cortexUrl: string): Promise<void> {
    try {
      const status = await this.fetchCortex<CortexStatus>(cortexUrl, "/api/status");
      const deadlines = await this.fetchCortex<{ deadlines: Deadline[] }>(
        cortexUrl,
        "/api/deadlines",
      );

      const byCategory: Record<string, number> = {};
      for (const dl of deadlines.deadlines ?? []) {
        byCategory[dl.category] = (byCategory[dl.category] ?? 0) + 1;
      }

      const categoryLines = Object.entries(byCategory)
        .map(
          ([cat, count]) => `  ${this.getCategoryEmoji(cat)} ${cat}: ${count}`,
        )
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle("🧠 P31 Cortex — Operations Dashboard")
        .setColor(
          status.overdueDeadlines > 0
            ? 0xef4444
            : status.pendingDeadlines > 5
              ? 0xf59e0b
              : 0x00ff88,
        )
        .addFields(
          {
            name: "📋 Pending",
            value: String(status.pendingDeadlines),
            inline: true,
          },
          {
            name: "🚨 Overdue",
            value: String(status.overdueDeadlines),
            inline: true,
          },
          {
            name: "⏰ Scheduled Alerts",
            value: String(status.scheduledAlerts),
            inline: true,
          },
          {
            name: "Categories",
            value: categoryLines || "No deadlines tracked",
            inline: false,
          },
        )
        .addFields({
          name: "Commands",
          value: [
            "`p31 cortex status` — system health",
            "`p31 cortex deadlines [category]` — list deadlines",
            "`p31 cortex overdue` — show overdue items",
            "`p31 cortex run` — run all agents now",
            "`p31 cortex agent <name>` — run single agent",
          ].join("\n"),
          inline: false,
        })
        .setFooter({
          text: `Last updated: ${new Date(status.timestamp).toLocaleString()} • It's okay to be a little wonky. 🔺`,
        });

      await message.reply({ embeds: [embed] });
    } catch {
      await this.replyOffline(message, cortexUrl);
    }
  }

  private async showStatus(message: Message, cortexUrl: string): Promise<void> {
    try {
      const status = await this.fetchCortex<CortexStatus>(cortexUrl, "/api/status");

      const embed = new EmbedBuilder()
        .setTitle("🧠 P31 Cortex Status")
        .setColor(0x00ff88)
        .addFields(
          { name: "Status", value: status.status.toUpperCase(), inline: true },
          {
            name: "Pending Deadlines",
            value: String(status.pendingDeadlines),
            inline: true,
          },
          {
            name: "Overdue",
            value: String(status.overdueDeadlines),
            inline: true,
          },
          {
            name: "Scheduled Alerts",
            value: String(status.scheduledAlerts),
            inline: true,
          },
        )
        .setFooter({ text: `Timestamp: ${status.timestamp}` });

      await message.reply({ embeds: [embed] });
    } catch {
      await this.replyOffline(message, cortexUrl);
    }
  }

  private async showDeadlines(
    message: Message,
    cortexUrl: string,
    filters: string[],
  ): Promise<void> {
    try {
      const category = filters[0];
      const query = category ? `?category=${category}` : "";
      const data = await this.fetchCortex<{ deadlines: Deadline[] }>(
        cortexUrl,
        `/api/deadlines${query}`,
      );

      const deadlines = data.deadlines ?? [];
      if (deadlines.length === 0) {
        await message.reply(
          "✅ No deadlines found" +
            (category ? ` in category: ${category}` : "."),
        );
        return;
      }

      const lines = deadlines.slice(0, 15).map((dl) => {
        const icon = this.getPriorityIcon(dl.priority);
        const daysLeft = Math.ceil(
          (new Date(dl.due_date).getTime() - Date.now()) / 86400000,
        );
        const urgency =
          daysLeft < 0
            ? `**${Math.abs(daysLeft)}d OVERDUE**`
            : daysLeft === 0
              ? "**TODAY**"
              : `${daysLeft}d`;
        return `${icon} **${dl.title}** — ${urgency} (${dl.category})`;
      });

      const embed = new EmbedBuilder()
        .setTitle(`📋 Deadlines${category ? ` — ${category}` : ""}`)
        .setColor(0x00d4ff)
        .setDescription(lines.join("\n"))
        .setFooter({
          text: `${deadlines.length} total • p31 cortex deadlines <category> to filter`,
        });

      await message.reply({ embeds: [embed] });
    } catch {
      await this.replyOffline(message, cortexUrl);
    }
  }

  private async showOverdue(message: Message, cortexUrl: string): Promise<void> {
    try {
      const data = await this.fetchCortex<{ deadlines: Deadline[] }>(
        cortexUrl,
        "/api/deadlines?status=overdue",
      );

      const overdue = data.deadlines ?? [];
      if (overdue.length === 0) {
        await message.reply("✅ Nothing overdue. Breathe.");
        return;
      }

      const lines = overdue.map(
        (dl) => `🚨 **${dl.title}** — was due ${dl.due_date} (${dl.category})`,
      );

      const embed = new EmbedBuilder()
        .setTitle("🚨 OVERDUE DEADLINES")
        .setColor(0xef4444)
        .setDescription(lines.join("\n"))
        .setFooter({ text: `${overdue.length} overdue item(s)` });

      await message.reply({ embeds: [embed] });
    } catch {
      await this.replyOffline(message, cortexUrl);
    }
  }

  private async runOrchestrator(message: Message, cortexUrl: string): Promise<void> {
    await message.reply("⚡ Running all agents...");

    try {
      const result = await this.fetchCortex<OrchestratorResult>(
        cortexUrl,
        "/api/orchestrator/run",
        "POST",
      );

      const agentLines = result.results.map(
        (r) => `${r.ok ? "✅" : "❌"} ${r.name} (${r.duration}ms)`,
      );

      const embed = new EmbedBuilder()
        .setTitle("⚡ Orchestrator Run Complete")
        .setColor(result.agentsFailed > 0 ? 0xef4444 : 0x00ff88)
        .addFields(
          {
            name: "Duration",
            value: `${result.totalDuration}ms`,
            inline: true,
          },
          {
            name: "Succeeded",
            value: `${result.agentsSucceeded}/${result.agentsRun}`,
            inline: true,
          },
          { name: "Failed", value: String(result.agentsFailed), inline: true },
          { name: "Results", value: agentLines.join("\n"), inline: false },
        )
        .setFooter({ text: `Timestamp: ${result.timestamp}` });

      await message.reply({ embeds: [embed] });
    } catch {
      await this.replyOffline(message, cortexUrl);
    }
  }

  private async runAgent(message: Message, cortexUrl: string, agentName?: string): Promise<void> {
    const validAgents = [
      "legal",
      "grant",
      "content",
      "finance",
      "benefits",
      "kofi",
    ];

    if (!agentName || !validAgents.includes(agentName.toLowerCase())) {
      await message.reply(
        `Usage: \`p31 cortex agent <name>\`\nValid agents: ${validAgents.join(", ")}`,
      );
      return;
    }

    await message.reply(`⚡ Running ${agentName} agent...`);

    try {
      const result = await this.fetchCortex<Record<string, unknown>>(
        `/api/${agentName.toLowerCase()}/run`,
        "POST",
      );

      const embed = new EmbedBuilder()
        .setTitle(
          `⚡ ${agentName.charAt(0).toUpperCase() + agentName.slice(1)} Agent Run`,
        )
        .setColor(0x00ff88)
        .setDescription(
          "```json\n" +
            JSON.stringify(result, null, 2).slice(0, 1900) +
            "\n```",
        )
        .setFooter({ text: "P31 Cortex" });

      await message.reply({ embeds: [embed] });
    } catch {
      await this.replyOffline(message, cortexUrl);
    }
  }

  private async fetchCortex<T>(
    cortexUrl: string,
    path: string,
    method: string = "GET",
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await defaultRetryableFetch.fetchWithRetry(
      `${cortexUrl}${path}`,
      {
        method,
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      },
      "cortex"
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Cortex returned ${response.status}`);
    }

    return (await response.json()) as T;
  }

  private async replyOffline(message: Message, cortexUrl: string): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("⚠️ P31 Cortex Unreachable")
      .setColor(0xef4444)
      .setDescription(
        "Could not connect to P31 Cortex. The operations layer may be down.",
      )
      .addFields({ name: "URL", value: cortexUrl });

    await message.reply({ embeds: [embed] });
  }

  private getCategoryEmoji(category: string): string {
    const map: Record<string, string> = {
      legal: "⚖️",
      grant: "💰",
      content: "📝",
      finance: "📊",
      benefits: "🏥",
      kofi: "☕",
    };
    return map[category] ?? "📋";
  }

  private getPriorityIcon(priority: string): string {
    const map: Record<string, string> = {
      critical: "🔴",
      high: "🔶",
      medium: "📋",
      low: "⚪",
    };
    return map[priority] ?? "📋";
  }
}

export default CortexCommand;
