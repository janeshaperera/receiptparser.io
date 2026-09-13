import Stripe from "stripe";
import { config } from "../config/index.js";
import { AppError } from "../schemas/receipt.schema.js";
import { PlanTier, PLANS } from "../schemas/billing.schema.js";
import { UserRepository } from "../db/repositories.js";

export class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    if (!config.mockStripe && config.stripeSecretKey) {
      this.stripe = new Stripe(config.stripeSecretKey);
    }
  }

  /**
   * Helper to map plan tier to configured Price ID
   */
  getPriceIdForPlan(plan: "starter" | "pro"): string {
    if (plan === "starter") {
      return config.stripeStarterPriceId;
    }
    if (plan === "pro") {
      return config.stripeProPriceId;
    }
    throw new AppError("INVALID_PLAN", `Invalid plan: ${plan}`, 400);
  }

  /**
   * Create or retrieve Stripe Customer
   */
  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const user = await UserRepository.findById(userId);
    if (user?.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    if (config.mockStripe) {
      const mockCustomerId = `cus_mock_${userId.substring(0, 8)}`;
      await UserRepository.updatePlanAndSubscription({
        userId,
        plan: user?.plan_tier || "free",
        stripeCustomerId: mockCustomerId
      });
      return mockCustomerId;
    }

    if (!this.stripe) {
      throw new AppError("STRIPE_ERROR", "Stripe is not configured and MOCK_STRIPE is false", 500);
    }

    const customer = await this.stripe.customers.create({
      email,
      metadata: {
        userId
      }
    });

    await UserRepository.updatePlanAndSubscription({
      userId,
      plan: user?.plan_tier || "free",
      stripeCustomerId: customer.id
    });

    return customer.id;
  }

  /**
   * Create Stripe Checkout Session
   */
  async createCheckoutSession(params: {
    userId: string;
    email: string;
    apiKeyId: string;
    plan: "starter" | "pro";
  }): Promise<{ url: string; sessionId: string }> {
    const priceId = this.getPriceIdForPlan(params.plan);
    const customerId = await this.getOrCreateCustomer(params.userId, params.email);

    if (config.mockStripe) {
      return {
        url: `https://checkout.stripe.com/c/pay/mock_session_${params.plan}_${Date.now()}`,
        sessionId: `cs_mock_${Date.now()}`
      };
    }

    if (!this.stripe) {
      throw new AppError("STRIPE_ERROR", "Stripe is not configured and MOCK_STRIPE is false", 500);
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${config.webOrigin}/dashboard?session_id={CHECKOUT_SESSION_ID}&billing=success`,
      cancel_url: `${config.webOrigin}/pricing?billing=canceled`,
      metadata: {
        user_id: params.userId,
        api_key_id: params.apiKeyId,
        plan: params.plan
      },
      subscription_data: {
        metadata: {
          user_id: params.userId,
          api_key_id: params.apiKeyId,
          plan: params.plan
        }
      }
    });

    if (!session.url) {
      throw new AppError("STRIPE_ERROR", "Failed to generate Stripe Checkout URL", 502);
    }

    return {
      url: session.url,
      sessionId: session.id
    };
  }

  /**
   * Create Stripe Customer Portal Session
   */
  async createPortalSession(userId: string): Promise<{ url: string }> {
    const user = await UserRepository.findById(userId);

    if (!user || !user.stripe_customer_id) {
      throw new AppError(
        "STRIPE_CUSTOMER_NOT_FOUND",
        "No active Stripe customer found for this account. Please subscribe to a paid plan first.",
        404
      );
    }

    if (config.mockStripe) {
      return {
        url: `https://billing.stripe.com/p/session/mock_portal_${Date.now()}`
      };
    }

    if (!this.stripe) {
      throw new AppError("STRIPE_ERROR", "Stripe is not configured and MOCK_STRIPE is false", 500);
    }

    const portal = await this.stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${config.webOrigin}/dashboard`
    });

    return {
      url: portal.url
    };
  }

  /**
   * Construct & verify raw webhook event
   */
  constructWebhookEvent(rawBody: Buffer, signatureHeader: string): Stripe.Event {
    if (config.mockStripe) {
      // In mock mode, if signature equals "invalid_signature", reject
      if (signatureHeader === "invalid_signature") {
        throw new AppError("STRIPE_WEBHOOK_INVALID", "Invalid Stripe webhook signature", 400);
      }
      try {
        return JSON.parse(rawBody.toString("utf8")) as Stripe.Event;
      } catch {
        throw new AppError("STRIPE_WEBHOOK_INVALID", "Malformed webhook payload", 400);
      }
    }

    if (!config.stripeWebhookSecret || !this.stripe) {
      throw new AppError(
        "STRIPE_ERROR",
        "STRIPE_WEBHOOK_SECRET is not configured or Stripe client is inactive",
        500
      );
    }

    try {
      return this.stripe.webhooks.constructEvent(rawBody, signatureHeader, config.stripeWebhookSecret);
    } catch (err: any) {
      throw new AppError("STRIPE_WEBHOOK_INVALID", `Webhook signature verification failed: ${err.message}`, 400);
    }
  }

  /**
   * Map Stripe Price ID to internal plan
   */
  mapPriceIdToPlan(priceId?: string | null): PlanTier {
    if (!priceId) return "free";
    if (priceId === config.stripeStarterPriceId) return "starter";
    if (priceId === config.stripeProPriceId) return "pro";
    return "free";
  }
}

export const stripeService = new StripeService();
