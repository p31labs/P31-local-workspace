import { BaseAgent, type AgentEnv } from "./base-agent";
import { sendEmail, formatDeadlineAlert } from "../notify/index";

interface LegalDeadline {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  caseNumber: string;
  court: string;
  filingType: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "overdue";
  alertDays: number[];
  notes: string;
}

export class LegalAgentDO extends BaseAgent {
  protected async handleInit(request: Request): Promise<Response> {
    const body = await request.json<Partial<LegalDeadline>>();
    const id = this.generateId();
    const now = new Date().toISOString();

    const deadline: LegalDeadline = {
      id,
      title: body.title ?? "Untitled",
      description: body.description ?? "",
      dueDate: body.dueDate ?? new Date().toISOString(),
      caseNumber: body.caseNumber ?? "2025CV936",
      court: body.court ?? "Camden County Superior Court",
      filingType: body.filingType ?? "general",
      priority: body.priority ?? "medium",
      status: "pending",
      alertDays: body.alertDays ?? [7, 3, 1],
      notes: body.notes ?? "",
    };

    await this.env.DB.prepare(
      `INSERT INTO deadlines (id, title, description, due_date, category, priority, status, alert_days, metadata)
       VALUES (?, ?, ?, ?, 'legal', ?, ?, ?, ?)`,
    )
      .bind(
        deadline.id,
        deadline.title,
        deadline.description,
        deadline.dueDate,
        deadline.priority,
        deadline.status,
        JSON.stringify(deadline.alertDays),
        JSON.stringify({
          caseNumber: deadline.caseNumber,
          court: deadline.court,
          filingType: deadline.filingType,
          notes: deadline.notes,
        }),
      )
      .run();

    // Schedule alerts
    for (const days of deadline.alertDays) {
      const alertDate = new Date(deadline.dueDate);
      alertDate.setDate(alertDate.getDate() - days);

      if (alertDate > new Date()) {
        await this.env.DB.prepare(
          `INSERT INTO alerts (id, deadline_id, type, scheduled_for, status, message)
           VALUES (?, ?, 'email', ?, 'scheduled', ?)`,
        )
          .bind(
            this.generateId(),
            deadline.id,
            alertDate.toISOString(),
            `Legal deadline in ${days} day(s): ${deadline.title}`,
          )
          .run();
      }
    }

    return new Response(JSON.stringify({ ok: true, id }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  protected async handleRun(_request: Request): Promise<Response> {
    await this.setRunning();

    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // 1. Check for overdue deadlines
      const overdue = await this.env.DB.prepare(
        `UPDATE deadlines SET status = 'overdue', updated_at = datetime('now')
         WHERE category = 'legal' AND status = 'pending' AND due_date < ?`,
      )
        .bind(today)
        .run();

      // 2. Find alerts due now
      const alerts = await this.env.DB.prepare(
        `SELECT a.*, d.title, d.due_date, d.priority
         FROM alerts a
         JOIN deadlines d ON a.deadline_id = d.id
         WHERE a.status = 'scheduled' AND a.scheduled_for <= ?`,
      )
        .bind(now.toISOString())
        .all<Record<string, string>>();

      let sent = 0;
      let failed = 0;

      for (const alert of alerts.results ?? []) {
        const daysRemaining = Math.ceil(
          (new Date(alert.due_date).getTime() - now.getTime()) / 86400000,
        );

        const payload = formatDeadlineAlert(
          alert.title,
          alert.due_date,
          Math.max(0, daysRemaining),
          "LEGAL",
        );
        payload.to = this.env.ALERT_EMAIL;

        const ok = await sendEmail(this.env, payload);

        if (ok) {
          await this.env.DB.prepare(
            `UPDATE alerts SET status = 'sent', sent_at = datetime('now') WHERE id = ?`,
          )
            .bind(alert.id)
            .run();
          sent++;
        } else {
          await this.env.DB.prepare(
            `UPDATE alerts SET status = 'failed' WHERE id = ?`,
          )
            .bind(alert.id)
            .run();
          failed++;
        }
      }

      // 3. Get upcoming deadlines summary
      const upcoming = await this.env.DB.prepare(
        `SELECT id, title, due_date, priority, status
         FROM deadlines
         WHERE category = 'legal' AND status IN ('pending', 'in_progress')
         ORDER BY due_date ASC
         LIMIT 10`,
      ).all<Record<string, string>>();

      await this.setIdle();

      return new Response(
        JSON.stringify({
          ok: true,
          overdue: overdue.meta?.changes ?? 0,
          alertsSent: sent,
          alertsFailed: failed,
          upcoming: upcoming.results,
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
