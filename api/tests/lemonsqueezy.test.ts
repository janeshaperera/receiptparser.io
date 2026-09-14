import request from "supertest";
import crypto from "crypto";
import { createApp } from "../src/app.js";
import { mockStore, UserRepository, UsageRepository } from "../src/db/repositories.js";
import { ApiKeyService } from "../src/services/apiKey.service.js";
import { lemonSqueezyService } from "../src/services/lemonSqueezy.service.js";
import { config } from "../src/config/index.js";
import { Express } from "express";

describe("Lemon Squeezy Billing Integration Suite", () => {
  let app: Express;
  let userApiKey = "";
  let userId = "";
  const webhookSecret = "test_ls_webhook_secret_32bytes";

  beforeEach(async () => {
    process.env.BILLING_PROVIDER = "lemonsqueezy";
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = webhookSecret;
    process.env.LEMON_SQUEEZY_STARTER_VARIANT_ID = "var_starter_123";
    process.env.LEMON_SQUEEZY_PRO_VARIANT_ID = "var_pro_456";

    app = createApp();
    mockStore.reset();

    userId = "00000000-0000-0000-0000-000000000001";
    const key = await ApiKeyService.createApiKey(userId, "Primary Key");
    userApiKey = key.rawKey;
  });

  afterEach(() => {
    process.env.BILLING_PROVIDER = "stripe";
    jest.restoreAllMocks();
  });

  function signPayload(payload: any): string {
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    return crypto.createHmac("sha256", webhookSecret).update(raw).digest("hex");
  }

  test("1. Checkout creates Lemon Squeezy session for Starter", async () => {
    const res = await request(app)
      .post("/v1/billing/checkout")
      .set("Authorization", `Bearer ${userApiKey}`)
      .send({ plan: "starter" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("checkout_url");
    expect(res.body.checkout_url).toContain("var_starter_123");
  });

  test("2. Checkout creates Lemon Squeezy session for Pro", async () => {
    const res = await request(app)
      .post("/v1/billing/checkout")
      .set("Authorization", `Bearer ${userApiKey}`)
      .send({ plan: "pro" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("checkout_url");
    expect(res.body.checkout_url).toContain("var_pro_456");
  });

  test("3. Free -> Starter via subscription_created upgrades plan to starter (250 limit)", async () => {
    const payload = {
      meta: {
        event_name: "subscription_created",
        webhook_id: `ls_hook_${Date.now()}_1`,
        custom_data: {
          user_id: userId,
          plan: "starter"
        }
      },
      data: {
        id: "ls_sub_001",
        attributes: {
          customer_id: "ls_cus_100",
          variant_id: "var_starter_123",
          status: "active"
        }
      }
    };

    const signature = signPayload(payload);

    const res = await request(app)
      .post("/v1/billing/lemonsqueezy/webhook")
      .set("X-Signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    const updatedUser = await UserRepository.findById(userId);
    expect(updatedUser?.plan_tier).toBe("starter");

    const usageRes = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(usageRes.body.plan).toBe("starter");
    expect(usageRes.body.limit).toBe(250);
  });

  test("4. Starter -> Pro via subscription_updated upgrades plan to pro (1000 limit)", async () => {
    await UserRepository.updatePlanAndSubscription({
      userId,
      plan: "starter",
      stripeCustomerId: "ls_cus_100",
      stripeSubscriptionId: "ls_sub_001",
      status: "active"
    });

    const payload = {
      meta: {
        event_name: "subscription_updated",
        webhook_id: `ls_hook_${Date.now()}_2`,
        custom_data: { user_id: userId }
      },
      data: {
        id: "ls_sub_001",
        attributes: {
          customer_id: "ls_cus_100",
          variant_id: "var_pro_456",
          status: "active"
        }
      }
    };

    const signature = signPayload(payload);

    const res = await request(app)
      .post("/v1/billing/lemonsqueezy/webhook")
      .set("X-Signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(res.status).toBe(200);

    const updatedUser = await UserRepository.findById(userId);
    expect(updatedUser?.plan_tier).toBe("pro");

    const usageRes = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(usageRes.body.plan).toBe("pro");
    expect(usageRes.body.limit).toBe(1000);
  });

  test("5. Subscription cancellation downgrades user to Free (20 limit)", async () => {
    await UserRepository.updatePlanAndSubscription({
      userId,
      plan: "pro",
      stripeCustomerId: "ls_cus_100",
      stripeSubscriptionId: "ls_sub_001",
      status: "active"
    });

    const payload = {
      meta: {
        event_name: "subscription_cancelled",
        webhook_id: `ls_hook_${Date.now()}_3`,
        custom_data: { user_id: userId }
      },
      data: {
        id: "ls_sub_001",
        attributes: {
          customer_id: "ls_cus_100",
          variant_id: "var_pro_456",
          status: "cancelled"
        }
      }
    };

    const signature = signPayload(payload);

    const res = await request(app)
      .post("/v1/billing/lemonsqueezy/webhook")
      .set("X-Signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(res.status).toBe(200);

    const updatedUser = await UserRepository.findById(userId);
    expect(updatedUser?.plan_tier).toBe("free");

    const usageRes = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(usageRes.body.plan).toBe("free");
    expect(usageRes.body.limit).toBe(20);
  });

  test("6. Invalid signature is rejected with 400", async () => {
    const payload = {
      meta: { event_name: "subscription_created" },
      data: { id: "ls_sub_999" }
    };

    const res = await request(app)
      .post("/v1/billing/lemonsqueezy/webhook")
      .set("X-Signature", "invalid_signature_hex")
      .set("Content-Type", "application/json")
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("LEMON_SQUEEZY_WEBHOOK_INVALID");
  });

  test("7. Duplicate webhook event is safely ignored", async () => {
    const payload = {
      meta: {
        event_name: "subscription_created",
        webhook_id: "ls_duplicate_event_001",
        custom_data: { user_id: userId, plan: "starter" }
      },
      data: {
        id: "ls_duplicate_event_001",
        attributes: { variant_id: "var_starter_123", status: "active" }
      }
    };

    const signature = signPayload(payload);

    const firstRes = await request(app)
      .post("/v1/billing/lemonsqueezy/webhook")
      .set("X-Signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(firstRes.status).toBe(200);
    expect(firstRes.body.duplicate).toBe(false);

    const secondRes = await request(app)
      .post("/v1/billing/lemonsqueezy/webhook")
      .set("X-Signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.duplicate).toBe(true);
  });
});
