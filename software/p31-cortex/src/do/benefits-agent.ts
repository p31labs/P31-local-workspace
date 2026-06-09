import { BaseAgent, type AgentEnv } from "./base-agent";
import { sendEmail } from "../notify/index";

interface BenefitProgram {
  id: string;
  name: string;
  type: "snap" | "medicaid" | "fers" | "ssa" | "wic" | "other";
  status:
    | "active"
    | "pending"
    | "renewal_due"
    | "expired"
    | "denied"
    | "appealing";
  renewalDate?: string;
  renewalIntervalDays: number;
  cliffRisk: boolean;
  cliffTrigger?: string;
  notes: string;
}

const BENEFITS_CLIFF_RULES = [
  {
    name: "snap_income_threshold",
    programs: ["snap"],
    check: (income: number) =>
      income > 1580
        ? "SNAP: Income approaching limit ($1,580/mo for household of 3)"
        : null,
  },
  {
    name: "medicaid_income_threshold",
    programs: ["medicaid"],
    check: (income: number) =>
      income > 2500
        ? "Medicaid: Income may exceed threshold — check Georgia PATHS eligibility"
        : null,
  },
  {
    name: "grant_income_impact",
    programs: ["snap", "medicaid"],
    check: (income: number) =>
      income > 0
        ? "New income detected — verify SNAP/Medicaid eligibility before accepting"
        : null,
  },
];

export class BenefitsAgentDO extends BaseAgent {
  protected async handleInit(request: Request): Promise<Response> {
    const body = await request.json<Partial<BenefitProgram>>();
    const id = this.generateId();

    const program: BenefitProgram = {
      id,
      name: body.name ?? "Untitled Program",
      type: body.type ?? "other",
      status: body.status ?? "active",
      renewalDate: body.renewalDate,
      renewalIntervalDays: body.renewalIntervalDays ?? 365,
      cliffRisk: body.cliffRisk ?? false,
      cliffTrigger: body.cliffTrigger,
      notes: body.notes ?? "",
    };

    await this.env.DB.prepare(
      `INSERT INTO deadlines (id, title, description, due_date, category, priority, status, alert_days, metadata)
       VALUES (?, ?, ?, ?, 'benefits', ?, ?, '[30,14,7,3,1]', ?)`,
    )
      .bind(
        program.id,
        `${program.name} (${program.type.toUpperCase()})`,
        program.notes,
        program.renewalDate ??
          new Date(
            Date.now() + program.renewalIntervalDays * 86400000,
          ).toISOString(),
        program.cliffRisk ? "critical" : "high",
        program.status === "expired" ? "overdue" : "pending",
        JSON.stringify({
          type: program.type,
          status: program.status,
          renewalIntervalDays: program.renewalIntervalDays,
          cliffRisk: program.cliffRisk,
          cliffTrigger: program.cliffTrigger,
        }),
      )
      .run();

    // Schedule renewal alerts
    if (program.renewalDate) {
      for (const days of [30, 14, 7, 3, 1]) {
        const alertDate = new Date(program.renewalDate);
        alertDate.setDate(alertDate.getDate() - days);
        if (alertDate > new Date()) {
          await this.env.DB.prepare(
            `INSERT INTO alerts (id, deadline_id, type, scheduled_for, status, message)
             VALUES (?, ?, 'email', ?, 'scheduled', ?)`,
          )
            .bind(
              this.generateId(),
              program.id,
              alertDate.toISOString(),
              `${program.name} renewal in ${days} day(s) — ${program.cliffRisk ? "⚠️ CLIFF RISK" : "standard renewal"}`,
            )
            .run();
        }
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

      // 1. Fire scheduled alerts
      const alerts = await this.env.DB.prepare(
        `SELECT a.*, d.title, d.due_date, d.metadata
         FROM alerts a
         JOIN deadlines d ON a.deadline_id = d.id
         WHERE d.category = 'benefits' AND a.status = 'scheduled' AND a.scheduled_for <= ?`,
      )
        .bind(now.toISOString())
        .all<Record<string, string>>();

      let sent = 0;
      for (const alert of alerts.results ?? []) {
        const meta = JSON.parse(alert.metadata ?? "{}");
        const daysRemaining = Math.ceil(
          (new Date(alert.due_date).getTime() - now.getTime()) / 86400000,
        );

        const payload = {
          to: this.env.ALERT_EMAIL,
          subject: `🏥 BENEFITS: ${alert.title}`,
          body: [
            `P31 CORTEX — BENEFITS ALERT`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `${alert.message}`,
            ``,
            `Due: ${alert.due_date}`,
            `Days remaining: ${Math.max(0, daysRemaining)}`,
            ...(meta.cliffRisk
              ? [
                  "",
                  "⚠️ CLIFF RISK: Losing this benefit may affect other programs.",
                  "Consult Georgia WIPA before any income changes.",
                ]
              : []),
            ``,
            `It's okay to be a little wonky. 🔺`,
          ].join("\n"),
          priority: meta.cliffRisk ? ("high" as const) : ("normal" as const),
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

      // 2. Check for expired programs
      const expired = await this.env.DB.prepare(
        `UPDATE deadlines SET status = 'overdue', updated_at = datetime('now')
         WHERE category = 'benefits' AND status = 'pending' AND due_date < date('now')`,
      ).run();

      if ((expired.meta?.changes ?? 0) > 0) {
        await sendEmail(this.env, {
          to: this.env.ALERT_EMAIL,
          subject: "🚨 BENEFITS EXPIRED — Immediate action required",
          body: [
            "P31 CORTEX — CRITICAL BENEFITS ALERT",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            `${expired.meta?.changes} benefit program(s) have passed their renewal date.`,
            "",
            "Check /api/deadlines?category=benefits&status=overdue for details.",
            "Do NOT ignore — SNAP/Medicaid lapse = catastrophe.",
            "",
            "It's okay to be a little wonky. 🔺",
          ].join("\n"),
          priority: "high",
        });
      }

      // 3. Benefits status summary
      const programs = await this.env.DB.prepare(
        `SELECT id, title, due_date, priority, status, metadata
         FROM deadlines
         WHERE category = 'benefits'
         ORDER BY due_date ASC`,
      ).all<Record<string, string>>();

      // 4. Cliff risk scan — check for upcoming renewals within 60 days
      const cliffRisk = await this.env.DB.prepare(
        `SELECT id, title, due_date, metadata
         FROM deadlines
         WHERE category = 'benefits' AND status = 'pending'
         AND due_date <= date('now', '+60 days')
         AND due_date >= date('now')
         AND priority = 'critical'`,
      ).all<Record<string, string>>();

      await this.setIdle();

      return new Response(
        JSON.stringify({
          ok: true,
          alertsSent: sent,
          expired: expired.meta?.changes ?? 0,
          programs: programs.results,
          cliffRiskItems: cliffRisk.results,
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
