import { Request, Response, NextFunction } from "express";
import { stripeService } from "../services/stripe.service.js";
import { webhookService } from "../services/webhook.service.js";
import { UserRepository } from "../db/repositories.js";
import { CheckoutRequestSchema } from "../schemas/billing.schema.js";
import { AppError } from "../schemas/receipt.schema.js";

export class BillingController {
  /**
   * POST /v1/billing/checkout
   * Initiates Stripe Checkout Session for starter or pro plans
   */
  static async createCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.userId!;
    const apiKeyId = req.apiKeyRecord?.id || "unknown";

    const parsed = CheckoutRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        new AppError(
          "INVALID_PLAN",
          parsed.error.errors[0]?.message || "Invalid plan selection. Choose 'starter' or 'pro'.",
          400,
          { errors: parsed.error.flatten() }
        )
      );
    }

    try {
      const user = await UserRepository.findById(userId);
      const email = user?.email || `user_${userId}@receiptparser.io`;

      const session = await stripeService.createCheckoutSession({
        userId,
        email,
        apiKeyId,
        plan: parsed.data.plan
      });

      res.status(200).json({
        checkout_url: session.url,
        session_id: session.sessionId
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /v1/billing/portal
   * Initiates Stripe Customer Portal Session for existing Stripe customers
   */
  static async createPortal(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.userId!;

    try {
      const portal = await stripeService.createPortalSession(userId);
      res.status(200).json({
        portal_url: portal.url
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /v1/billing/webhook
   * Handles incoming Stripe webhooks using raw body and signature verification
   */
  static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      return next(
        new AppError(
          "STRIPE_WEBHOOK_INVALID",
          "Missing 'Stripe-Signature' header",
          400
        )
      );
    }

    let rawBody: Buffer;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    } else if (typeof req.body === "string") {
      rawBody = Buffer.from(req.body, "utf8");
    } else if (req.body && typeof req.body === "object") {
      rawBody = Buffer.from(JSON.stringify(req.body), "utf8");
    } else {
      return next(
        new AppError(
          "STRIPE_WEBHOOK_INVALID",
          "Webhook endpoint requires request body",
          400
        )
      );
    }

    try {
      const event = stripeService.constructWebhookEvent(rawBody, signature);
      const result = await webhookService.processEvent(event);

      res.status(200).json({
        received: true,
        event_id: event.id,
        event_type: event.type,
        duplicate: result.duplicate
      });
    } catch (err) {
      next(err);
    }
  }
}
