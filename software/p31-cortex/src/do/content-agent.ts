import { BaseAgent, type AgentEnv } from "./base-agent";
import { sendEmail } from "../notify/index";

interface ContentItem {
  id: string;
  title: string;
  platform:
    | "zenodo"
    | "substack"
    | "kofi"
    | "github"
    | "hackaday"
    | "superstonk";
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor: string;
  publishedAt?: string;
  artifactPath: string;
  notes: string;
}

export class ContentAgentDO extends BaseAgent {
  protected async handleInit(request: Request): Promise<Response> {
    const body = await request.json<Partial<ContentItem>>();
    const id = this.generateId();

    const item: ContentItem = {
      id,
      title: body.title ?? "Untitled",
      platform: body.platform ?? "substack",
      status: body.status ?? "draft",
      scheduledFor: body.scheduledFor ?? new Date().toISOString(),
      artifactPath: body.artifactPath ?? "",
      notes: body.notes ?? "",
    };

    await this.env.DB.prepare(
      `INSERT INTO deadlines (id, title, description, due_date, category, priority, status, alert_days, metadata)
       VALUES (?, ?, ?, ?, 'content', 'medium', ?, '[7,3,1]', ?)`,
    )
      .bind(
        item.id,
        item.title,
        `Publish to ${item.platform}`,
        item.scheduledFor,
        item.status === "published" ? "completed" : "pending",
        JSON.stringify({
          platform: item.platform,
          artifactPath: item.artifactPath,
          notes: item.notes,
        }),
      )
      .run();

    // Schedule pre-publish reminder
    const reminderDate = new Date(item.scheduledFor);
    reminderDate.setDate(reminderDate.getDate() - 1);
    if (reminderDate > new Date()) {
      await this.env.DB.prepare(
        `INSERT INTO alerts (id, deadline_id, type, scheduled_for, status, message)
         VALUES (?, ?, 'email', ?, 'scheduled', ?)`,
      )
        .bind(
          this.generateId(),
          item.id,
          reminderDate.toISOString(),
          `Content publish tomorrow: ${item.title} → ${item.platform}`,
        )
        .run();
    }

    return new Response(JSON.stringify({ ok: true, id }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  protected async handleRun(_request: Request): Promise<Response> {
    await this.setRunning();

    try {
      const now = new Date();

      // 1. Fire scheduled alerts
      const alerts = await this.env.DB.prepare(
        `SELECT a.*, d.title, d.due_date, d.metadata
         FROM alerts a
         JOIN deadlines d ON a.deadline_id = d.id
         WHERE d.category = 'content' AND a.status = 'scheduled' AND a.scheduled_for <= ?`,
      )
        .bind(now.toISOString())
        .all<Record<string, string>>();

      let sent = 0;
      for (const alert of alerts.results ?? []) {
        const payload = {
          to: this.env.ALERT_EMAIL,
          subject: `📝 CONTENT: ${alert.title}`,
          body: [
            `P31 CORTEX — CONTENT ALERT`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `${alert.message}`,
            ``,
            `Scheduled: ${alert.due_date}`,
            ``,
            `It's okay to be a little wonky. 🔺`,
          ].join("\n"),
          priority: "normal" as const,
        };

        const ok = await sendEmail(this.env, payload);
        if (ok) {
          await this.env.DB.prepare(
            `UPDATE alerts SET status = 'sent', sent_at = datetime('now') WHERE id = ?`,
          )
            .bind(alert.id)
            .run();
          sent++;
        }
      }

      // 2. Content pipeline summary
      const pipeline = await this.env.DB.prepare(
        `SELECT id, title, due_date, status, metadata
         FROM deadlines
         WHERE category = 'content' AND status IN ('pending', 'in_progress')
         ORDER BY due_date ASC`,
      ).all<Record<string, string>>();

      // 3. Ready to publish (due today or overdue)
      const readyToPublish = await this.env.DB.prepare(
        `SELECT id, title, due_date, metadata
         FROM deadlines
         WHERE category = 'content' AND status = 'pending'
         AND due_date <= date('now')`,
      ).all<Record<string, string>>();

      if ((readyToPublish.results?.length ?? 0) > 0) {
        const publishList = (readyToPublish.results ?? [])
          .map((c) => {
            const meta = JSON.parse(c.metadata ?? "{}");
            return `  • ${c.title} → ${meta.platform ?? "unknown"}`;
          })
          .join("\n");

        await sendEmail(this.env, {
          to: this.env.ALERT_EMAIL,
          subject: `🚀 CONTENT READY TO PUBLISH: ${readyToPublish.results?.length} items`,
          body: [
            `P31 CORTEX — PUBLISH QUEUE`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `The following content is ready to publish:`,
            ``,
            publishList,
            ``,
            `It's okay to be a little wonky. 🔺`,
          ].join("\n"),
          priority: "high",
        });
      }

      await this.setIdle();

      return new Response(
        JSON.stringify({
          ok: true,
          alertsSent: sent,
          pipeline: pipeline.results,
          readyToPublish: readyToPublish.results,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await this.setError(msg);
      throw err;
    }
  }
}
