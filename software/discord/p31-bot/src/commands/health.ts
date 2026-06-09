import { Message, EmbedBuilder } from "discord.js";
import { CommandContext, P31Command, getApiUrls } from "./base";
import { defaultRetryableFetch } from "../services/retryUtility";

interface HealthStatus {
  name: string;
  url: string;
  status: "online" | "offline" | "degraded";
  latency?: number;
  error?: string;
}

export class HealthCommand implements P31Command {
  name = "health";
  description = "P31 Network Health — check status of all workers and services";
  aliases = ["ping", "workers"];
  usage = "health";

  async execute(context: CommandContext): Promise<void> {
    const { message, apiUrls } = context;
    await message.reply("🏥 Checking P31 Network Health...");

    const services = await this.checkAllServices(apiUrls);
    const onlineCount = services.filter(s => s.status === "online").length;
    const totalCount = services.length;

    const embed = new EmbedBuilder()
      .setTitle(`🏥 P31 Network Health (${onlineCount}/${totalCount} online)`)
      .setColor(onlineCount === totalCount ? 0x00ff88 : onlineCount > totalCount / 2 ? 0xf59e0b : 0xef4444)
      .setTimestamp();

    for (const service of services) {
      const statusEmoji = service.status === "online" ? "✅" : service.status === "degraded" ? "⚠️" : "❌";
      const latencyText = service.latency ? `${service.latency}ms` : "N/A";
      const errorText = service.error ? `\nError: ${service.error}` : "";
      
      embed.addFields({
        name: `${statusEmoji} ${service.name}`,
        value: `URL: ${service.url}\nLatency: ${latencyText}${errorText}`,
        inline: true
      });
    }

    embed.setFooter({ text: "P31 Network • Circuit breaker states available via internal query" });

    await message.reply({ embeds: [embed] });
  }

  private async checkAllServices(apiUrls: ReturnType<typeof getApiUrls>): Promise<HealthStatus[]> {
    const services: HealthStatus[] = [
      { name: "BONDING API", url: apiUrls.bonding, status: "offline" },
      { name: "Node One", url: apiUrls.nodeOneStatus, status: "offline" },
      { name: "Spoon API", url: apiUrls.spoon, status: "offline" },
      { name: "Cortex", url: apiUrls.cortex, status: "offline" },
    ];

    const checks = services.map(async (service, index) => {
      const startTime = Date.now();
      try {
        const response = await defaultRetryableFetch.fetchWithRetry(
          service.url,
          { method: "GET", signal: AbortSignal.timeout(5000) },
          service.name.toLowerCase().replace(/\s+/g, "-")
        );
        service.latency = Date.now() - startTime;
        service.status = response.ok ? "online" : "degraded";
        if (!response.ok) service.error = `HTTP ${response.status}`;
      } catch (error) {
        service.status = "offline";
        service.error = error instanceof Error ? error.message : "Unknown error";
      }
      return service;
    });

    await Promise.all(checks);
    return services;
  }
}
