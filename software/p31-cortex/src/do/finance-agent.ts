import { BaseAgent, type AgentEnv } from "./base-agent";
import { sendEmail } from "../notify/index";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: "income" | "expense" | "transfer" | "penalty" | "withdrawal";
  source: "bank" | "stripe" | "kofi" | "tsp" | "manual";
  flagged: boolean;
  flagReason?: string;
}

interface AnomalyRule {
  name: string;
  check: (tx: Transaction, history: Transaction[]) => string | null;
}

const ANOMALY_RULES: AnomalyRule[] = [
  {
    name: "large_withdrawal",
    check: (tx) =>
      tx.amount < -500 && tx.category === "withdrawal"
        ? `Large withdrawal: $${Math.abs(tx.amount).toFixed(2)}`
        : null,
  },
  {
    name: "unusual_expense",
    check: (tx, history) => {
      if (tx.amount >= 0) return null;
      const avgExpense =
        history
          .filter((h) => h.category === "expense" && h.amount < 0)
          .reduce((sum, h) => sum + Math.abs(h.amount), 0) /
        Math.max(
          history.filter((h) => h.category === "expense" && h.amount < 0)
            .length,
          1,
        );
      return Math.abs(tx.amount) > avgExpense * 3
        ? `Unusual expense: $${Math.abs(tx.amount).toFixed(2)} (avg: $${avgExpense.toFixed(2)})`
        : null;
    },
  },
  {
    name: "tsp_penalty",
    check: (tx) =>
      tx.source === "tsp" && tx.category === "penalty"
        ? `TSP penalty detected: $${Math.abs(tx.amount).toFixed(2)}`
        : null,
  },
  {
    name: "double_charge",
    check: (tx, history) => {
      if (tx.amount >= 0) return null;
      const dupe = history.find(
        (h) =>
          h.id !== tx.id &&
          h.description === tx.description &&
          Math.abs(h.amount - tx.amount) < 0.01 &&
          Math.abs(new Date(h.date).getTime() - new Date(tx.date).getTime()) <
            86400000 * 3,
      );
      return dupe
        ? `Possible double charge: ${tx.description} ($${Math.abs(tx.amount).toFixed(2)})`
        : null;
    },
  },
];

export class FinanceAgentDO extends BaseAgent {
  protected async handleInit(request: Request): Promise<Response> {
    const body = await request.json<Partial<Transaction>>();
    const id = this.generateId();

    const tx: Transaction = {
      id,
      date: body.date ?? new Date().toISOString().split("T")[0],
      description: body.description ?? "",
      amount: body.amount ?? 0,
      category: body.category ?? "expense",
      source: body.source ?? "manual",
      flagged: false,
    };

    // Run anomaly detection
    const history = await this.getTransactionHistory();
    for (const rule of ANOMALY_RULES) {
      const reason = rule.check(tx, history);
      if (reason) {
        tx.flagged = true;
        tx.flagReason = reason;
        break;
      }
    }

    await this.env.DB.prepare(
      `INSERT INTO deadlines (id, title, description, due_date, category, priority, status, alert_days, metadata)
       VALUES (?, ?, ?, ?, 'finance', ?, 'completed', '[]', ?)`,
    )
      .bind(
        tx.id,
        tx.description,
        `$${tx.amount.toFixed(2)} (${tx.category})`,
        tx.date,
        tx.flagged ? "high" : "low",
        JSON.stringify({
          amount: tx.amount,
          category: tx.category,
          source: tx.source,
          flagged: tx.flagged,
          flagReason: tx.flagReason,
        }),
      )
      .run();

    // Alert on flagged transactions
    if (tx.flagged) {
      await sendEmail(this.env, {
        to: this.env.ALERT_EMAIL,
        subject: `🚨 FINANCE FLAG: ${tx.flagReason}`,
        body: [
          `P31 CORTEX — FINANCIAL ANOMALY`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          ``,
          `Transaction: ${tx.description}`,
          `Amount: $${tx.amount.toFixed(2)}`,
          `Date: ${tx.date}`,
          `Source: ${tx.source}`,
          `Flag: ${tx.flagReason}`,
          ``,
          `Review immediately.`,
          ``,
          `It's okay to be a little wonky. 🔺`,
        ].join("\n"),
        priority: "high",
      });
    }

    return new Response(JSON.stringify({ ok: true, id, flagged: tx.flagged }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  protected async handleRun(_request: Request): Promise<Response> {
    await this.setRunning();

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
        .toISOString()
        .split("T")[0];

      // 1. Monthly burn report
      const transactions = await this.env.DB.prepare(
        `SELECT id, title, description, due_date, priority, metadata
         FROM deadlines
         WHERE category = 'finance'
         AND due_date >= ?
         ORDER BY due_date ASC`,
      )
        .bind(thirtyDaysAgo)
        .all<Record<string, string>>();

      let totalIncome = 0;
      let totalExpense = 0;
      let flaggedCount = 0;
      const flaggedItems: string[] = [];

      for (const tx of transactions.results ?? []) {
        const meta = JSON.parse(tx.metadata ?? "{}");
        if (meta.amount > 0) totalIncome += meta.amount;
        if (meta.amount < 0) totalExpense += Math.abs(meta.amount);
        if (meta.flagged) {
          flaggedCount++;
          flaggedItems.push(
            `  • ${tx.title}: ${meta.flagReason} (${tx.due_date})`,
          );
        }
      }

      // 2. Revenue tracking (Stripe + Ko-fi)
      const revenueItems = await this.env.DB.prepare(
        `SELECT id, title, due_date, metadata
         FROM deadlines
         WHERE category = 'finance'
         AND metadata LIKE '%"source":"stripe"%' OR metadata LIKE '%"source":"kofi"%'
         AND due_date >= ?`,
      )
        .bind(thirtyDaysAgo)
        .all<Record<string, string>>();

      let stripeRevenue = 0;
      let kofiRevenue = 0;
      for (const item of revenueItems.results ?? []) {
        const meta = JSON.parse(item.metadata ?? "{}");
        if (meta.source === "stripe") stripeRevenue += meta.amount;
        if (meta.source === "kofi") kofiRevenue += meta.amount;
      }

      // 3. Send monthly report if it's the 1st of the month
      if (now.getDate() === 1) {
        await sendEmail(this.env, {
          to: this.env.ALERT_EMAIL,
          subject: `📊 MONTHLY FINANCIAL REPORT — ${now.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
          body: [
            `P31 CORTEX — MONTHLY BURN REPORT`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `Period: Last 30 days`,
            ``,
            `Income:  $${totalIncome.toFixed(2)}`,
            `Expenses: $${totalExpense.toFixed(2)}`,
            `Net:     $${(totalIncome - totalExpense).toFixed(2)}`,
            ``,
            `Revenue:`,
            `  Stripe: $${stripeRevenue.toFixed(2)}`,
            `  Ko-fi:  $${kofiRevenue.toFixed(2)}`,
            ``,
            `Flagged transactions: ${flaggedCount}`,
            ...(flaggedItems.length > 0 ? ["", ...flaggedItems] : []),
            ``,
            `It's okay to be a little wonky. 🔺`,
          ].join("\n"),
          priority: "normal",
        });
      }

      await this.setIdle();

      return new Response(
        JSON.stringify({
          ok: true,
          period: { from: thirtyDaysAgo, to: now.toISOString().split("T")[0] },
          income: totalIncome,
          expenses: totalExpense,
          net: totalIncome - totalExpense,
          revenue: { stripe: stripeRevenue, kofi: kofiRevenue },
          flagged: flaggedCount,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await this.setError(msg);
      throw err;
    }
  }

  private async getTransactionHistory(): Promise<Transaction[]> {
    const results = await this.env.DB.prepare(
      `SELECT id, title, description, due_date, metadata
       FROM deadlines
       WHERE category = 'finance'
       ORDER BY due_date DESC
       LIMIT 100`,
    ).all<Record<string, string>>();

    return (results.results ?? []).map((row) => {
      const meta = JSON.parse(row.metadata ?? "{}");
      return {
        id: row.id,
        date: row.due_date,
        description: row.title,
        amount: meta.amount ?? 0,
        category: meta.category ?? "expense",
        source: meta.source ?? "manual",
        flagged: meta.flagged ?? false,
        flagReason: meta.flagReason,
      };
    });
  }
}
