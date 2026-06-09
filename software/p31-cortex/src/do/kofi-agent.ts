import { BaseAgent, type AgentEnv } from "./base-agent";
import { sendEmail } from "../notify/index";

interface KofiOrder {
  id: string;
  type: "donation" | "subscription" | "shop_order";
  amount: number;
  currency: string;
  supporterName: string;
  supporterEmail: string;
  message?: string;
  productName?: string;
  timestamp: string;
}

interface NodeMilestone {
  count: number;
  name: string;
  significance: string;
  reached: boolean;
}

const NODE_MILESTONES: NodeMilestone[] = [
  {
    count: 4,
    name: "First Tetrahedron",
    significance: "Maxwell rigidity — first stable structure",
    reached: false,
  },
  {
    count: 39,
    name: "Posner Number",
    significance: "Ca9(PO4)6 — 39 atoms in the calcium cage",
    reached: false,
  },
  { count: 69, name: "Nice", significance: "Nice.", reached: false },
  {
    count: 150,
    name: "Dunbar's Number",
    significance: "Maximum meaningful social connections",
    reached: false,
  },
  {
    count: 420,
    name: "The Answer",
    significance: "The answer to everything",
    reached: false,
  },
  {
    count: 863,
    name: "Larmor Frequency",
    significance: "863 Hz — canonical resonance of 31P in Earth's field",
    reached: false,
  },
  {
    count: 1776,
    name: "Abdication",
    significance: "Full independence",
    reached: false,
  },
];

export class KofiAgentDO extends BaseAgent {
  protected async handleInit(request: Request): Promise<Response> {
    const body = await request.json<Partial<KofiOrder>>();
    const id = this.generateId();

    const order: KofiOrder = {
      id,
      type: body.type ?? "donation",
      amount: body.amount ?? 0,
      currency: body.currency ?? "USD",
      supporterName: body.supporterName ?? "Anonymous",
      supporterEmail: body.supporterEmail ?? "",
      message: body.message,
      productName: body.productName,
      timestamp: body.timestamp ?? new Date().toISOString(),
    };

    // Store as finance entry
    await this.env.DB.prepare(
      `INSERT INTO deadlines (id, title, description, due_date, category, priority, status, alert_days, metadata)
       VALUES (?, ?, ?, ?, 'kofi', 'low', 'completed', '[]', ?)`,
    )
      .bind(
        order.id,
        `Ko-fi ${order.type}: $${order.amount.toFixed(2)} from ${order.supporterName}`,
        order.message ?? "",
        order.timestamp,
        JSON.stringify({
          type: order.type,
          amount: order.amount,
          currency: order.currency,
          supporterName: order.supporterName,
          supporterEmail: order.supporterEmail,
          productName: order.productName,
        }),
      )
      .run();

    // Check node count
    const nodeCount = await this.getNodeCount();
    const newMilestone = NODE_MILESTONES.find(
      (m) => m.count === nodeCount && !m.reached,
    );

    // Alert on new supporter + milestone
    const alertLines = [
      `P31 CORTEX — NEW NODE`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Type: ${order.type}`,
      `Amount: $${order.amount.toFixed(2)} ${order.currency}`,
      `From: ${order.supporterName}`,
    ];

    if (order.message) {
      alertLines.push(`Message: "${order.message}"`);
    }
    if (order.productName) {
      alertLines.push(`Product: ${order.productName}`);
    }

    alertLines.push("", `Node Count: ${nodeCount}`);

    if (newMilestone) {
      alertLines.push(
        "",
        `🔺 MILESTONE REACHED: ${newMilestone.name} (${newMilestone.count} nodes)`,
        `${newMilestone.significance}`,
      );
    }

    alertLines.push("", "It's okay to be a little wonky. 🔺");

    await sendEmail(this.env, {
      to: this.env.ALERT_EMAIL,
      subject: newMilestone
        ? `🔺 NODE MILESTONE: ${newMilestone.name} (${nodeCount} nodes)`
        : `💚 New Ko-fi ${order.type}: $${order.amount.toFixed(2)} — Node ${nodeCount}`,
      body: alertLines.join("\n"),
      priority: newMilestone ? "high" : "normal",
    });

    return new Response(
      JSON.stringify({
        ok: true,
        id,
        nodeCount,
        milestone: newMilestone?.name ?? null,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  protected async handleRun(_request: Request): Promise<Response> {
    await this.setRunning();

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
        .toISOString()
        .split("T")[0];

      // 1. Revenue summary (last 30 days)
      const orders = await this.env.DB.prepare(
        `SELECT id, title, due_date, metadata
         FROM deadlines
         WHERE category = 'kofi' AND due_date >= ?
         ORDER BY due_date ASC`,
      )
        .bind(thirtyDaysAgo)
        .all<Record<string, string>>();

      let totalDonations = 0;
      let totalShop = 0;
      let totalSubscriptions = 0;
      let supporterCount = 0;
      const supporters = new Set<string>();

      for (const order of orders.results ?? []) {
        const meta = JSON.parse(order.metadata ?? "{}");
        supporterCount++;
        supporters.add(meta.supporterName ?? "anonymous");

        switch (meta.type) {
          case "donation":
            totalDonations += meta.amount ?? 0;
            break;
          case "shop_order":
            totalShop += meta.amount ?? 0;
            break;
          case "subscription":
            totalSubscriptions += meta.amount ?? 0;
            break;
        }
      }

      const nodeCount = await this.getNodeCount();

      // 2. Check milestones
      const currentMilestones = NODE_MILESTONES.map((m) => ({
        ...m,
        reached: nodeCount >= m.count,
      }));
      const nextMilestone = currentMilestones.find((m) => !m.reached);

      // 3. Monthly Ko-fi report (1st of month)
      if (now.getDate() === 1) {
        await sendEmail(this.env, {
          to: this.env.ALERT_EMAIL,
          subject: `📊 KO-FI MONTHLY REPORT — ${now.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
          body: [
            `P31 CORTEX — KO-FI REPORT`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `Period: Last 30 days`,
            ``,
            `Donations:     $${totalDonations.toFixed(2)}`,
            `Shop Sales:    $${totalShop.toFixed(2)}`,
            `Subscriptions: $${totalSubscriptions.toFixed(2)}`,
            `Total:         $${(totalDonations + totalShop + totalSubscriptions).toFixed(2)}`,
            ``,
            `Unique supporters: ${supporters.size}`,
            `Node Count: ${nodeCount}`,
            ``,
            ...(nextMilestone
              ? [
                  `Next milestone: ${nextMilestone.name} (${nextMilestone.count} nodes)`,
                  `${nextMilestone.count - nodeCount} nodes to go.`,
                  ``,
                ]
              : [`All milestones reached! 🔺`, ``]),
            `It's okay to be a little wonky. 🔺`,
          ].join("\n"),
          priority: "normal",
        });
      }

      await this.setIdle();

      return new Response(
        JSON.stringify({
          ok: true,
          nodeCount,
          period: { from: thirtyDaysAgo, to: now.toISOString().split("T")[0] },
          revenue: {
            donations: totalDonations,
            shop: totalShop,
            subscriptions: totalSubscriptions,
            total: totalDonations + totalShop + totalSubscriptions,
          },
          uniqueSupporters: supporters.size,
          milestones: currentMilestones,
          nextMilestone: nextMilestone
            ? {
                name: nextMilestone.name,
                count: nextMilestone.count,
                remaining: nextMilestone.count - nodeCount,
              }
            : null,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await this.setError(msg);
      throw err;
    }
  }

  private async getNodeCount(): Promise<number> {
    const result = await this.env.DB.prepare(
      `SELECT COUNT(*) as count FROM deadlines WHERE category = 'kofi'`,
    ).first<{ count: number }>();
    return result?.count ?? 0;
  }
}
