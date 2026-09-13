import Stripe from "stripe";
import { stripeService } from "./stripe.service.js";
import { UserRepository, WebhookEventRepository } from "../db/repositories.js";
import { PlanTier } from "../schemas/billing.schema.js";

export class WebhookService {
  /**
   * Process Stripe webhook event with idempotency guarantees
   */
  async processEvent(event: Stripe.Event): Promise<{ handled: boolean; duplicate: boolean }> {
    // 1. Check idempotency
    const isNew = await WebhookEventRepository.recordEvent(event.id, event.type);
    if (!isNew) {
      console.log(`Duplicate webhook event ${event.id} (${event.type}) skipped.`);
      return { handled: true, duplicate: true };
    }

    console.log(`Processing webhook event ${event.id} of type ${event.type}`);

    // 2. Handle specific billing events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutSessionCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }

      default:
        // Safely ignore unknown/unrelated events
        console.log(`Unhandled webhook event type: ${event.type}`);
        break;
    }

    return { handled: true, duplicate: false };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.user_id;
    const plan = (session.metadata?.plan as PlanTier) || "starter";
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (!userId) {
      console.warn("checkout.session.completed event missing metadata.user_id");
      return;
    }

    await UserRepository.updatePlanAndSubscription({
      userId,
      plan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: "active"
    });

    console.log(`User ${userId} successfully upgraded to ${plan} via Checkout session.`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    if (!customerId) return;

    const user = await UserRepository.findByStripeCustomerId(customerId);
    if (!user) {
      console.warn(`No user found with stripe_customer_id: ${customerId}`);
      return;
    }

    // Determine plan from current subscription price ID or metadata
    const firstItemPriceId = subscription.items.data[0]?.price?.id;
    const planFromPrice = stripeService.mapPriceIdToPlan(firstItemPriceId);
    const plan = (subscription.metadata?.plan as PlanTier) || planFromPrice;

    const status = subscription.status === "active" ? "active" : subscription.status;

    await UserRepository.updatePlanAndSubscription({
      userId: user.id,
      plan: subscription.status === "active" ? plan : "free",
      stripeSubscriptionId: subscription.id,
      status
    });

    console.log(`User ${user.id} subscription updated: plan=${plan}, status=${status}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    if (!customerId) return;

    const user = await UserRepository.findByStripeCustomerId(customerId);
    if (!user) return;

    // Immediately downgrade to free
    await UserRepository.updatePlanAndSubscription({
      userId: user.id,
      plan: "free",
      stripeSubscriptionId: null,
      status: "canceled"
    });

    console.log(`User ${user.id} subscription canceled. Downgraded to free.`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (!customerId) return;

    const user = await UserRepository.findByStripeCustomerId(customerId);
    if (!user) return;

    // Immediately downgrade to free upon payment failure
    await UserRepository.updatePlanAndSubscription({
      userId: user.id,
      plan: "free",
      status: "past_due"
    });

    console.log(`User ${user.id} payment failed. Downgraded to free.`);
  }
}

export const webhookService = new WebhookService();
