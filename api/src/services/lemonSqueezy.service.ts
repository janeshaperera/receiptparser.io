import crypto from "crypto";
import { config } from "../config/index.js";
import { AppError } from "../schemas/receipt.schema.js";
import { PlanTier } from "../schemas/billing.schema.js";
import { UserRepository, WebhookEventRepository } from "../db/repositories.js";

export class LemonSqueezyService {
  /**
   * Resolve Lemon Squeezy variant ID for selected plan
   */
  getVariantIdForPlan(plan: "starter" | "pro" | "business"): string {
    if (plan === "starter") {
      return config.lemonSqueezyStarterVariantId;
    }
    if (plan === "pro") {
      return config.lemonSqueezyProVariantId;
    }
    throw new AppError("INVALID_PLAN", `Invalid or unsupported plan for Lemon Squeezy: ${plan}`, 400);
  }

  /**
   * Map Lemon Squeezy variant ID to internal PlanTier
   */
  mapVariantIdToPlan(variantId?: string | number | null): PlanTier {
    if (!variantId) return "free";
    const strVariant = String(variantId);
    if (strVariant === String(config.lemonSqueezyStarterVariantId)) return "starter";
    if (strVariant === String(config.lemonSqueezyProVariantId)) return "pro";
    return "free";
  }

  /**
   * Create Lemon Squeezy Checkout Session via API
   */
  async createCheckoutSession(params: {
    userId: string;
    email: string;
    apiKeyId: string;
    plan: "starter" | "pro" | "business";
  }): Promise<{ url: string; sessionId: string }> {
    const variantId = this.getVariantIdForPlan(params.plan);

    // If apiKey is missing or in mock mode during tests
    if (!config.lemonSqueezyApiKey || !config.lemonSqueezyStoreId) {
      if (config.mockStripe || config.env !== "production") {
        return {
          url: `https://receiptparser.lemonsqueezy.com/buy/${variantId || "mock_variant"}?checkout[custom][user_id]=${params.userId}`,
          sessionId: `ls_mock_${Date.now()}`
        };
      }
      throw new AppError("BILLING_NOT_CONFIGURED", "Lemon Squeezy is not configured with LEMON_SQUEEZY_API_KEY and STORE_ID", 500);
    }

    const primaryOrigin = config.webOrigin.split(",")[0].trim();
    const redirectUrl = `${primaryOrigin}/dashboard?billing=success`;

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: params.email,
            custom: {
              user_id: params.userId,
              api_key_id: params.apiKeyId,
              plan: params.plan
            }
          },
          product_options: {
            redirect_url: redirectUrl
          }
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(config.lemonSqueezyStoreId)
            }
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId)
            }
          }
        }
      }
    };

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${config.lemonSqueezyApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Lemon Squeezy Checkout API Error:", res.status, errBody);
      throw new AppError("BILLING_ERROR", `Failed to create Lemon Squeezy checkout: ${errBody}`, 502);
    }

    const data: any = await res.json();
    const checkoutUrl = data?.data?.attributes?.url;

    if (!checkoutUrl) {
      throw new AppError("BILLING_ERROR", "Lemon Squeezy response missing checkout URL", 502);
    }

    return {
      url: checkoutUrl,
      sessionId: data?.data?.id || `ls_${Date.now()}`
    };
  }

  /**
   * Verify Lemon Squeezy HMAC-SHA256 webhook signature
   */
  verifyWebhookSignature(rawBody: Buffer | string, signature: string, secret: string): boolean {
    if (!secret || !signature) return false;
    try {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = hmac.update(rawBody).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"));
    } catch {
      return false;
    }
  }

  /**
   * Process Lemon Squeezy webhook event with idempotency
   */
  async processWebhookEvent(payload: any): Promise<{ handled: boolean; duplicate: boolean }> {
    const eventName = payload?.meta?.event_name;
    const eventId = String(payload?.data?.id || payload?.meta?.webhook_id || `ls_event_${Date.now()}`);

    if (!eventName) {
      throw new AppError("INVALID_WEBHOOK", "Missing event_name in webhook metadata", 400);
    }

    const isNew = await WebhookEventRepository.recordEvent(eventId, eventName);
    if (!isNew) {
      console.log(`Duplicate Lemon Squeezy webhook event ${eventId} (${eventName}) skipped.`);
      return { handled: true, duplicate: true };
    }

    console.log(`Processing Lemon Squeezy webhook: ${eventName} (id: ${eventId})`);

    const customData = payload?.meta?.custom_data || {};
    const attributes = payload?.data?.attributes || {};
    const userId = customData.user_id;

    switch (eventName) {
      case "subscription_created":
      case "subscription_resumed": {
        const variantId = attributes.variant_id;
        const plan = (customData.plan as PlanTier) || this.mapVariantIdToPlan(variantId);
        const customerId = String(attributes.customer_id || "");
        const subscriptionId = String(payload?.data?.id || "");

        if (userId) {
          await UserRepository.updatePlanAndSubscription({
            userId,
            plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: "active"
          });
          console.log(`User ${userId} upgraded to ${plan} via Lemon Squeezy subscription.`);
        }
        break;
      }

      case "subscription_updated": {
        const variantId = attributes.variant_id;
        const plan = this.mapVariantIdToPlan(variantId);
        const customerId = String(attributes.customer_id || "");
        const subscriptionId = String(payload?.data?.id || "");
        const status = attributes.status === "active" ? "active" : attributes.status || "inactive";

        let targetUserId = userId;
        if (!targetUserId && customerId) {
          const user = await UserRepository.findByStripeCustomerId(customerId);
          if (user) targetUserId = user.id;
        }

        if (targetUserId) {
          await UserRepository.updatePlanAndSubscription({
            userId: targetUserId,
            plan: status === "active" ? plan : "free",
            stripeSubscriptionId: subscriptionId,
            status
          });
          console.log(`User ${targetUserId} updated to ${status === "active" ? plan : "free"} via Lemon Squeezy subscription update.`);
        }
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        const customerId = String(attributes.customer_id || "");
        const subscriptionId = String(payload?.data?.id || "");

        let targetUserId = userId;
        if (!targetUserId && customerId) {
          const user = await UserRepository.findByStripeCustomerId(customerId);
          if (user) targetUserId = user.id;
        }

        if (targetUserId) {
          await UserRepository.updatePlanAndSubscription({
            userId: targetUserId,
            plan: "free",
            stripeSubscriptionId: subscriptionId,
            status: "cancelled"
          });
          console.log(`User ${targetUserId} downgraded to free following Lemon Squeezy cancellation.`);
        }
        break;
      }

      default:
        console.log(`Unhandled Lemon Squeezy event: ${eventName}`);
        break;
    }

    return { handled: true, duplicate: false };
  }
}

export const lemonSqueezyService = new LemonSqueezyService();
