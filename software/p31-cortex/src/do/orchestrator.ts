import { BaseAgent, type AgentEnv } from "./base-agent";
import type { CortexEnv } from "../types";
import { sendEmail } from "../notify/index";
import { sendDiscordAlert, formatDiscordDigest } from "../notify/discord";

interface AgentDescriptor {
  name: string;
  binding: keyof AgentEnv;
  priority: number;
}

const AGENTS: AgentDescriptor[] = [
  { name: "Legal", binding: "LEGAL_AGENT" as keyof AgentEnv, priority: 1 },
  {
    name: "Benefits",
    binding: "BENEFITS_AGENT" as keyof AgentEnv,
    priority: 2,
  },
  { name: "Finance", binding: "FINANCE_AGENT" as keyof AgentEnv, priority: 3 },
  { name: "Grant", binding: "GRANT_AGENT" as keyof AgentEnv, priority: 4 },
  { name: "Content", binding: "CONTENT_AGENT" as keyof AgentEnv, priority: 5 },
  { name: "Ko-fi", binding: "KOFI_AGENT" as keyof AgentEnv, priority: 6 },
];

interface AgentRunResult {
  name: string;
  ok: boolean;
  duration: number;
  data?: Record<string, unknown>;
  error?: string;
}

export class OrchestratorDO extends BaseAgent {
  declare env: CortexEnv;

  protected async handleInit(_request: Request): Promise<Response> {
    return new Response(
      JSON.stringify({ ok: true, message: "Orchestrator initialized" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  protected async handleRun(_request: Request): Promise<Response> {
    await this.setRunning();
    const startTime = Date.now();

    try {
      const results: AgentRunResult[] = [];
      const sorted = [...AGENTS].sort((a, b) => a.priority - b.priority);

      for (const agent of sorted) {
        const agentStart = Date.now();
        try {
          const binding = (this.env as unknown as Record<string, unknown>)[
            agent.binding
          ] as DurableObjectNamespace | undefined;
          if (!binding) {
            results.push({
              name: agent.name,
              ok: false,
              duration: 0,
              error: `Binding ${agent.binding} not available`,
            });
            continue;
          }

          const id = binding.idFromName(`${agent.name.toLowerCase()}-primary`);
          const stub = binding.get(id);
          const resp = await stub.fetch("http://internal/run", {
            method: "POST",
          });
          const data = (await resp.json()) as Record<string, unknown>;

          results.push({
            name: agent.name,
            ok: resp.ok,
            duration: Date.now() - agentStart,
            data,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          results.push({
            name: agent.name,
            ok: false,
            duration: Date.now() - agentStart,
            error: msg,
          });
        }
      }

      const totalDuration = Date.now() - startTime;
      const failed = results.filter((r) => !r.ok);
      const summary = {
        timestamp: new Date().toISOString(),
        totalDuration,
        agentsRun: results.length,
        agentsSucceeded: results.filter((r) => r.ok).length,
        agentsFailed: failed.length,
        results,
      };

      await this.storage.put("lastRunSummary", summary);

      // Alert on failures — email + Discord
      if (failed.length > 0) {
        const failList = failed
          .map((f) => `  * ${f.name}: ${f.error}`)
          .join("\n");

        const alertPayload = {
          to: this.env.ALERT_EMAIL,
          subject: `ORCHESTRATOR: ${failed.length} agent(s) failed`,
          body: [
            "P31 CORTEX — ORCHESTRATOR ALERT",
            "================================",
            "",
            `${failed.length} of ${results.length} agents failed during scheduled run:`,
            "",
            failList,
            "",
            `Total duration: ${totalDuration}ms`,
            "",
            "It's okay to be a little wonky.",
          ].join("\n"),
          priority: "high" as const,
        };

        await sendEmail(this.env, alertPayload);
        await sendDiscordAlert(
          this.env as unknown as { DISCORD_WEBHOOK_URL: string },
          alertPayload,
        );
      }

      // Daily digest — email + Discord (morning run only)
      const hour = new Date().getUTCHours();
      if (hour === 7) {
        await this.sendDailyDigest(results);
      }

      await this.setIdle();

      return new Response(JSON.stringify(summary), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await this.setError(msg);
      throw err;
    }
  }

  private async sendDailyDigest(results: AgentRunResult[]): Promise<void> {
    const upcoming = await this.env.DB.prepare(
      `SELECT title, due_date, category, priority, status
        FROM deadlines
        WHERE status IN ('pending', 'in_progress')
        AND due_date <= date('now', '+7 days')
        ORDER BY due_date ASC`,
    ).all<Record<string, string>>();

    const overdue = await this.env.DB.prepare(
      `SELECT title, due_date, category
        FROM deadlines
        WHERE status = 'overdue'
        ORDER BY due_date ASC`,
    ).all<Record<string, string>>();

    // Email digest
    const emailLines: string[] = [
      "P31 CORTEX — DAILY DIGEST",
      "================================",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "AGENT STATUS:",
    ];

    for (const r of results) {
      const icon = r.ok ? "OK" : "FAIL";
      emailLines.push(`  [${icon}] ${r.name} (${r.duration}ms)`);
    }

    if ((overdue.results?.length ?? 0) > 0) {
      emailLines.push("", "OVERDUE:");
      for (const d of overdue.results ?? []) {
        emailLines.push(
          `  * [${d.category.toUpperCase()}] ${d.title} — was due ${d.due_date}`,
        );
      }
    }

    if ((upcoming.results?.length ?? 0) > 0) {
      emailLines.push("", "DUE THIS WEEK:");
      for (const d of upcoming.results ?? []) {
        emailLines.push(
          `  [${d.category.toUpperCase()}] ${d.title} — ${d.due_date}`,
        );
      }
    } else {
      emailLines.push("", "Nothing due this week. Breathe.");
    }

    emailLines.push("", "It's okay to be a little wonky.");

    await sendEmail(this.env, {
      to: this.env.ALERT_EMAIL,
      subject: `P31 CORTEX DAILY — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
      body: emailLines.join("\n"),
      priority: "normal",
    });

    // Discord digest (rich embed)
    const discordPayload = formatDiscordDigest(
      results,
      (upcoming.results ?? []) as Array<{
        title: string;
        due_date: string;
        category: string;
        priority: string;
      }>,
      (overdue.results ?? []) as Array<{
        title: string;
        due_date: string;
        category: string;
      }>,
    );
    await sendDiscordAlert(
      this.env as unknown as { DISCORD_WEBHOOK_URL: string },
      discordPayload,
    );
  }
}
