/**
 * SQLite-backed Durable Object: one chat session per id (name).
 * @see https://developers.cloudflare.com/durable-objects/get-started/
 */
import { DurableObject } from "cloudflare:workers";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export class AgentSession extends DurableObject {
  /** @param {any} ctx @param {any} env */
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const url = new URL(request.url);
    if (url.pathname !== "/chat") {
      return new Response("Not Found", { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const userText =
      typeof body.message === "string"
        ? body.message
        : Array.isArray(body.messages) && body.messages.length
          ? String(body.messages[body.messages.length - 1]?.content ?? "")
          : "";

    if (!userText.trim()) {
      return json({ error: "message_required" }, 400);
    }

    let history = [];
    try {
      const raw = await this.ctx.storage.get("messages");
      if (raw) history = JSON.parse(raw);
    } catch {
      history = [];
    }
    if (!Array.isArray(history)) history = [];

    history.push({ role: "user", content: userText.trim() });

    const model =
      this.env.WORKERS_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";

    let assistantText;
    try {
      const result = await this.env.AI.run(model, {
        messages: [
          {
            role: "system",
            content:
              "You are P31 Agent Hub, a concise technical assistant for P31 Labs assistive-tech context. Do not invent FDA classifications or legal determinations.",
          },
          ...history.map((m) => ({
            role: m.role,
            content: String(m.content),
          })),
        ],
      });
      assistantText =
        result?.response ?? result?.text ?? (typeof result === "string" ? result : JSON.stringify(result));
    } catch (e) {
      return json(
        {
          error: "ai_unavailable",
          detail: String(e?.message ?? e),
        },
        502,
      );
    }

    history.push({ role: "assistant", content: assistantText });
    if (history.length > 40) history = history.slice(-40);
    await this.ctx.storage.put("messages", JSON.stringify(history));

    return json({
      reply: assistantText,
      message_count: history.length,
    });
  }
}
