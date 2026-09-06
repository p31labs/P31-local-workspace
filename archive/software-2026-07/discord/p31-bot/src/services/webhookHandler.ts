import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { EventEmitter } from "events";
import rateLimit from "express-rate-limit";
import {
  verifyP31IngressSignature,
  verifyGitHubSignature,
  verifyStripeWebhookSignature,
  StripeEventDedup,
  assertInternalWebhookSecret,
} from "./webhookSecurity";

export interface WebhookEvent {
  type: "kofi" | "stripe" | "node_one" | "bonding" | "github";
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface KoFiPayload {
  [key: string]: unknown;
  type: "Donation" | "Subscription" | "ShopOrder";
  amount: number;
  currency: string;
  message?: string;
  supporterName?: string;
}

export interface NodeOnePayload {
  [key: string]: unknown;
  event:
    | "button_press"
    | "haptic_feedback"
    | "battery_status"
    | "connection_status";
  deviceId: string;
  data: Record<string, unknown>;
}

export interface BondingPayload {
  [key: string]: unknown;
  event:
    | "game_start"
    | "game_end"
    | "molecule_created"
    | "quest_complete"
    | "love_earned";
  roomCode: string;
  userId: string;
  data: Record<string, unknown>;
}

class WebhookHandler extends EventEmitter {
  private _app: express.Application;
  public get app(): express.Application {
    return this._app;
  }
  private port: number;
  private readonly stripeDedup = new StripeEventDedup();

  constructor(port: number = 3000) {
    super();
    const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;
    this.port = Number.isFinite(envPort) ? envPort : port;
    this._app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this._app.use(cors());
    this._app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : false);
  }

  private setupRoutes(): void {
    const webhookLimiter = rateLimit({
      windowMs: 60_000,
      max: Number(process.env.WEBHOOK_RATE_LIMIT_MAX || 120),
      standardHeaders: true,
      legacyHeaders: false,
    });

    const ingressSecret = process.env.P31_DISCORD_INGRESS_SECRET;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const insecure = process.env.WEBHOOK_INSECURE_INGRESS === "1";
    const legacyOpen = process.env.WEBHOOK_LEGACY_OPEN === "1";

    // Order: raw / special parsers before any global json()
    this._app.post(
      "/webhook/stripe",
      webhookLimiter,
      express.raw({ type: "application/json", limit: "1mb" }),
      (req: Request, res: Response) => {
        try {
          const rawBuf = req.body as Buffer;
          if (!Buffer.isBuffer(rawBuf) || rawBuf.length === 0) {
            res.status(400).json({ error: "Empty body" });
            return;
          }
          const rawStr = rawBuf.toString("utf8");

          const ingressHdr = req.headers["x-p31-ingress-signature"];
          const ingressOk =
            ingressSecret &&
            typeof ingressHdr === "string" &&
            verifyP31IngressSignature(rawStr, ingressHdr, ingressSecret);

          const stripeSig = req.headers["stripe-signature"];
          const stripeOk =
            stripeWebhookSecret &&
            typeof stripeSig === "string" &&
            verifyStripeWebhookSignature(rawStr, stripeSig, stripeWebhookSecret);

          if (!ingressOk && !stripeOk && !insecure && !legacyOpen) {
            console.warn(
              "[webhook/stripe] rejected — set P31_DISCORD_INGRESS_SECRET (pair with donate-api), STRIPE_WEBHOOK_SECRET (direct Stripe), WEBHOOK_LEGACY_OPEN=1 (interim), or WEBHOOK_INSECURE_INGRESS=1 (local dev only)",
            );
            res.status(401).json({ error: "Unauthorized" });
            return;
          }

          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(rawStr) as Record<string, unknown>;
          } catch {
            res.status(400).json({ error: "Invalid JSON" });
            return;
          }

          const eventId = typeof parsed.id === "string" ? parsed.id : null;
          const eventType = typeof parsed.type === "string" ? parsed.type : "";
          if (
            eventType === "checkout.session.completed" &&
            eventId &&
            this.stripeDedup.isDuplicate(eventId)
          ) {
            res.status(200).json({ received: true, duplicate: true });
            return;
          }

          const event: WebhookEvent = {
            type: "stripe",
            payload: parsed,
            timestamp: new Date().toISOString(),
          };
          this.emit("stripe", event);
          res.status(200).json({ received: true });
        } catch (error) {
          console.error("Error processing Stripe webhook:", error);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    this._app.post(
      "/webhook/github",
      webhookLimiter,
      express.raw({ type: "application/json", limit: "2mb" }),
      (req: Request, res: Response) => {
        try {
          const rawBuf = req.body as Buffer;
          if (!Buffer.isBuffer(rawBuf)) {
            res.status(400).json({ error: "Invalid body" });
            return;
          }
          const ghSecret = process.env.GITHUB_WEBHOOK_SECRET;
          const sig = req.headers["x-hub-signature-256"];
          if (
            ghSecret &&
            !verifyGitHubSignature(
              rawBuf,
              typeof sig === "string" ? sig : undefined,
              ghSecret,
            )
          ) {
            res.status(401).json({ error: "Invalid GitHub signature" });
            return;
          }
          let body: Record<string, unknown>;
          try {
            body = JSON.parse(rawBuf.toString("utf8")) as Record<string, unknown>;
          } catch {
            res.status(400).json({ error: "Invalid JSON" });
            return;
          }
          const githubEvent = req.headers["x-github-event"] as string;
          const event: WebhookEvent = {
            type: "github",
            payload: { ...body, githubEvent },
            timestamp: new Date().toISOString(),
          };
          this.emit("github", event);
          res.status(200).json({ success: true });
        } catch (error) {
          console.error("Error processing GitHub webhook:", error);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET;

    this._app.post(
      "/webhook/kofi",
      webhookLimiter,
      express.urlencoded({ extended: true, limit: "256kb" }),
      (req: Request, res: Response) => {
        try {
          let payload: KoFiPayload;
          if (req.body?.data && typeof req.body.data === "string") {
            payload = JSON.parse(req.body.data) as KoFiPayload;
          } else {
            payload = req.body as KoFiPayload;
          }

          const kofiToken = process.env.KOFI_VERIFICATION_TOKEN;
          if (kofiToken && payload.verification_token !== kofiToken) {
            console.warn("[Ko-fi] Invalid verification token — rejected");
            res.status(401).json({ error: "Unauthorized" });
            return;
          }

          const event: WebhookEvent = {
            type: "kofi",
            payload,
            timestamp: new Date().toISOString(),
          };
          this.emit("kofi", event);
          res.status(200).json({ success: true });
        } catch (error) {
          console.error("Error processing Ko-fi webhook:", error);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    this._app.post(
      "/webhook/node-one",
      webhookLimiter,
      express.json({ limit: "256kb" }),
      (req, res) => {
        try {
          if (!assertInternalWebhookSecret(req, internalSecret)) {
            res.status(401).json({ error: "Unauthorized" });
            return;
          }
          const payload = req.body as NodeOnePayload;
          const event: WebhookEvent = {
            type: "node_one",
            payload,
            timestamp: new Date().toISOString(),
          };
          this.emit("node_one", event);
          res.status(200).json({ success: true });
        } catch (error) {
          console.error("Error processing Node One webhook:", error);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    this._app.post(
      "/webhook/bonding",
      webhookLimiter,
      express.json({ limit: "512kb" }),
      (req, res) => {
        try {
          if (!assertInternalWebhookSecret(req, internalSecret)) {
            res.status(401).json({ error: "Unauthorized" });
            return;
          }
          const payload = req.body as BondingPayload;
          const event: WebhookEvent = {
            type: "bonding",
            payload,
            timestamp: new Date().toISOString(),
          };
          this.emit("bonding", event);
          res.status(200).json({ success: true });
        } catch (error) {
          console.error("Error processing BONDING webhook:", error);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    this._app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "ok",
        service: "p31-webhook-handler",
        uptime_s: Math.floor(process.uptime()),
        ingress: ingressSecret ? "hmac" : "none",
        stripe_direct: stripeWebhookSecret ? "on" : "off",
        github_hmac: process.env.GITHUB_WEBHOOK_SECRET ? "on" : "off",
        internal_routes: internalSecret ? "protected" : "open",
      });
    });

    this._app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Unhandled error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this._app.listen(this.port, () => {
        console.log(`Webhook handler listening on port ${this.port}`);
        resolve();
      });
    });
  }

  public on(
    event: "kofi" | "stripe" | "node_one" | "bonding" | "github",
    listener: (event: WebhookEvent) => void,
  ): this {
    return super.on(event, listener);
  }
}

export default WebhookHandler;
export { WebhookHandler };
