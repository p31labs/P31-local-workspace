import type { NotificationPayload } from "../types";

interface DiscordEnv {
  DISCORD_WEBHOOK_URL: string;
}

export async function sendDiscordAlert(
  env: DiscordEnv,
  payload: NotificationPayload,
): Promise<boolean> {
  if (!env.DISCORD_WEBHOOK_URL) return false;

  try {
    const color =
      payload.priority === "high"
        ? 0xef4444
        : payload.priority === "low"
          ? 0x64748b
          : 0x00ff88;

    const resp = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: payload.subject,
            description: payload.body.slice(0, 4000),
            color,
            footer: {
              text: "P31 Cortex • It's okay to be a little wonky. 🔺",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    return resp.ok;
  } catch (err) {
    console.error("Discord webhook failed:", err);
    return false;
  }
}

export function formatDiscordDigest(
  agentResults: Array<{ name: string; ok: boolean; duration: number }>,
  upcomingDeadlines: Array<{
    title: string;
    due_date: string;
    category: string;
    priority: string;
  }>,
  overdueDeadlines: Array<{
    title: string;
    due_date: string;
    category: string;
  }>,
): NotificationPayload {
  const lines: string[] = [];

  // Agent status
  lines.push("**AGENT STATUS:**");
  for (const r of agentResults) {
    const icon = r.ok ? "✅" : "❌";
    lines.push(`${icon} ${r.name} (${r.duration}ms)`);
  }

  // Overdue
  if (overdueDeadlines.length > 0) {
    lines.push("", "**🚨 OVERDUE:**");
    for (const d of overdueDeadlines) {
      lines.push(
        `• [${d.category.toUpperCase()}] **${d.title}** — was due ${d.due_date}`,
      );
    }
  }

  // Upcoming
  if (upcomingDeadlines.length > 0) {
    lines.push("", "**📋 DUE THIS WEEK:**");
    for (const d of upcomingDeadlines) {
      const icon =
        d.priority === "critical" ? "🔴" : d.priority === "high" ? "🔶" : "📋";
      lines.push(
        `${icon} [${d.category.toUpperCase()}] **${d.title}** — ${d.due_date}`,
      );
    }
  } else {
    lines.push("", "✅ Nothing due this week. Breathe.");
  }

  return {
    to: "",
    subject: `☀️ P31 CORTEX DAILY — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
    body: lines.join("\n"),
    priority: "normal",
  };
}
