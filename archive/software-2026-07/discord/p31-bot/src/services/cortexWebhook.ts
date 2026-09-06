import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { Client, TextChannel, EmbedBuilder } from "discord.js";

const cortexRouteLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.WEBHOOK_RATE_LIMIT_MAX || 120),
  standardHeaders: true,
  legacyHeaders: false,
});

export interface CortexAlert {
  type:
    | "deadline"
    | "agent_failure"
    | "digest"
    | "kofi"
    | "benefits"
    | "finance";
  title: string;
  body: string;
  priority: "high" | "normal" | "low";
  category?: string;
  channelId?: string;
}

export function setupCortexRoutes(
  app: express.Application,
  client: Client,
): void {
  // Cortex pushes alerts here → routed to Discord channels (own JSON parser — stripe/github use raw body)
  app.post(
    "/webhook/cortex",
    cortexRouteLimiter,
    express.json({ limit: "256kb" }),
    async (req: Request, res: Response) => {
    try {
      const alert = req.body as CortexAlert;

      // Verify shared secret
      const secret = process.env.CORTEX_WEBHOOK_SECRET;
      if (secret && req.headers["x-cortex-secret"] !== secret) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const channelId = alert.channelId || process.env.ANNOUNCEMENTS_CHANNEL_ID;
      if (!channelId) {
        res.status(400).json({ error: "No target channel" });
        return;
      }

      const channel = client.channels.cache.get(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        res.status(404).json({ error: "Channel not found" });
        return;
      }

      const color =
        alert.priority === "high"
          ? 0xef4444
          : alert.priority === "low"
            ? 0x64748b
            : 0x00ff88;

      const embed = new EmbedBuilder()
        .setTitle(alert.title)
        .setDescription(alert.body.slice(0, 4000))
        .setColor(color)
        .setFooter({ text: "P31 Cortex • It's okay to be a little wonky. 🔺" })
        .setTimestamp();

      if (alert.category) {
        embed.addFields({
          name: "Category",
          value: alert.category.toUpperCase(),
          inline: true,
        });
      }

      await channel.send({ embeds: [embed] });
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Cortex webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  );

  // Cortex status check
  app.get("/webhook/cortex/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", service: "p31-bot-cortex-bridge" });
  });
}
