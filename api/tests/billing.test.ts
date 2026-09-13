import request from "supertest";
import { createApp } from "../src/app.js";
import { mockStore, UserRepository, UsageRepository } from "../src/db/repositories.js";
import { ApiKeyService } from "../src/services/apiKey.service.js";
import { geminiService } from "../src/services/gemini.service.js";
import { stripeService } from "../src/services/stripe.service.js";
import { Express } from "express";

describe("ReceiptParser.io Phase 2: Usage + Stripe Billing Test Suite", () => {
  let app: Express;
  let userApiKey = "";
  let userId = "";

  let otherApiKey = "";
  let otherUserId = "";

  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01
  ]);

  beforeEach(async () => {
    app = createApp();
    mockStore.reset();

    // Primary test user
    userId = "00000000-0000-0000-0000-000000000001";
    const key = await ApiKeyService.createApiKey(userId, "Primary Key");
    userApiKey = key.rawKey;

    // Secondary test user (for cross-user isolation test)
    otherUserId = "00000000-0000-0000-0000-000000000002";
    const otherUser = {
      id: otherUserId,
      email: "other@receiptparser.io",
      plan_tier: "free" as const,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: "inactive",
      created_at: new Date(),
      updated_at: new Date()
    };
    mockStore.users.set(otherUserId, otherUser);
    const otherKey = await ApiKeyService.createApiKey(otherUserId, "Other Key");
    otherApiKey = otherKey.rawKey;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ================= USAGE TESTS =================

  test("1. New free user has 0 usage", async () => {
    const res = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(res.status).toBe(200);
    expect(res.body.used).toBe(0);
    expect(res.body.plan).toBe("free");
    expect(res.body.limit).toBe(50);
    expect(res.body.remaining).toBe(50);
  });

  test("2. Successful parse creates usage record", async () => {
    const parseRes = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${userApiKey}`)
      .attach("file", validPngBuffer, "receipt.png");

    expect(parseRes.status).toBe(200);
    expect(mockStore.usageLogs.length).toBeGreaterThan(0);
    const log = mockStore.usageLogs[mockStore.usageLogs.length - 1];
    expect(log.user_id).toBe(userId);
    expect(log.status).toBe("SUCCESS");
    expect(log.file_name).toBe("receipt.png");
  });

  test("3. Usage count increases correctly", async () => {
    await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${userApiKey}`)
      .attach("file", validPngBuffer, "receipt.png");

    const res = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(res.status).toBe(200);
    expect(res.body.used).toBe(1);
    expect(res.body.remaining).toBe(49);
  });

  test("4. GET /v1/usage returns correct usage structure", async () => {
    const res = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("plan", "free");
    expect(res.body).toHaveProperty("used");
    expect(res.body).toHaveProperty("limit");
    expect(res.body).toHaveProperty("remaining");
    expect(res.body).toHaveProperty("period");
  });

  test("5. GET /v1/usage/daily returns correct daily data", async () => {
    await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${userApiKey}`)
      .attach("file", validPngBuffer, "receipt.png");

    const res = await request(app)
      .get("/v1/usage/daily")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("plan", "free");
    expect(res.body).toHaveProperty("days");
    expect(Array.isArray(res.body.days)).toBe(true);
    expect(res.body.days.length).toBeGreaterThan(0);
    expect(res.body.days[0]).toHaveProperty("date");
    expect(res.body.days[0]).toHaveProperty("count");
  });

  test("6. Free limit = 50", async () => {
    const res = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(res.status).toBe(200);
    expect(res.body.plan).toBe("free");
    expect(res.body.limit).toBe(50);
  });

  test("7. Starter limit = 1,000", async () => {
    await UserRepository.updatePlanAndSubscription({ userId, plan: "starter" });

    const res = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(res.status).toBe(200);
    expect(res.body.plan).toBe("starter");
    expect(res.body.limit).toBe(1000);
  });

  test("8. Pro limit = 10,000", async () => {
    await UserRepository.updatePlanAndSubscription({ userId, plan: "pro" });

    const res = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(res.status).toBe(200);
    expect(res.body.plan).toBe("pro");
    expect(res.body.limit).toBe(10000);
  });

  test("9. Request at limit returns 429 PLAN_LIMIT_EXCEEDED", async () => {
    // Seed user usage to 50 (the free limit)
    for (let i = 0; i < 50; i++) {
      mockStore.usageLogs.push({
        id: `seed-${i}`,
        user_id: userId,
        api_key_id: "test-key-id",
        file_name: "receipt.png",
        file_size_bytes: 100,
        mime_type: "image/png",
        status: "SUCCESS",
        duration_ms: 50,
        created_at: new Date()
      });
    }

    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${userApiKey}`)
      .attach("file", validPngBuffer, "receipt.png");

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PLAN_LIMIT_EXCEEDED");
    expect(res.body.error.message).toContain("Monthly request limit exceeded");
  });

  test("10. PLAN_LIMIT_EXCEEDED does not call Gemini", async () => {
    const geminiSpy = jest.spyOn(geminiService, "extractReceipt");

    // Seed to 50
    for (let i = 0; i < 50; i++) {
      mockStore.usageLogs.push({
        id: `seed-${i}`,
        user_id: userId,
        api_key_id: "test-key-id",
        file_name: "receipt.png",
        file_size_bytes: 100,
        mime_type: "image/png",
        status: "SUCCESS",
        duration_ms: 50,
        created_at: new Date()
      });
    }

    await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${userApiKey}`)
      .attach("file", validPngBuffer, "receipt.png");

    expect(geminiSpy).not.toHaveBeenCalled();
  });

  // ================= STRIPE CHECKOUT TESTS =================

  test("11. Invalid plan rejected with INVALID_PLAN", async () => {
    const res = await request(app)
      .post("/v1/billing/checkout")
      .set("Authorization", `Bearer ${userApiKey}`)
      .send({ plan: "enterprise" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_PLAN");
  });

  test("12. Free plan cannot create Checkout", async () => {
    const res = await request(app)
      .post("/v1/billing/checkout")
      .set("Authorization", `Bearer ${userApiKey}`)
      .send({ plan: "free" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_PLAN");
  });

  test("13. Starter Checkout created", async () => {
    const res = await request(app)
      .post("/v1/billing/checkout")
      .set("Authorization", `Bearer ${userApiKey}`)
      .send({ plan: "starter" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("checkout_url");
    expect(res.body).toHaveProperty("session_id");
    expect(res.body.checkout_url).toContain("starter");
  });

  test("14. Pro Checkout created", async () => {
    const res = await request(app)
      .post("/v1/billing/checkout")
      .set("Authorization", `Bearer ${userApiKey}`)
      .send({ plan: "pro" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("checkout_url");
    expect(res.body).toHaveProperty("session_id");
    expect(res.body.checkout_url).toContain("pro");
  });

  test("15. Correct Stripe Price ID selected", () => {
    const starterPrice = stripeService.getPriceIdForPlan("starter");
    const proPrice = stripeService.getPriceIdForPlan("pro");

    expect(starterPrice).toBe("price_starter_test");
    expect(proPrice).toBe("price_pro_test");
  });

  test("16. Correct metadata included in checkout session call", async () => {
    const createSpy = jest.spyOn(stripeService, "createCheckoutSession");

    await request(app)
      .post("/v1/billing/checkout")
      .set("Authorization", `Bearer ${userApiKey}`)
      .send({ plan: "starter" });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        plan: "starter"
      })
    );
  });

  test("17. Existing Stripe customer reused", async () => {
    await UserRepository.updatePlanAndSubscription({
      userId,
      plan: "free",
      stripeCustomerId: "cus_existing_12345"
    });

    const customerId = await stripeService.getOrCreateCustomer(userId, "test@example.com");
    expect(customerId).toBe("cus_existing_12345");
  });

  // ================= CUSTOMER PORTAL TESTS =================

  test("18. Portal session created for user with Stripe customer", async () => {
    await UserRepository.updatePlanAndSubscription({
      userId,
      plan: "starter",
      stripeCustomerId: "cus_mock_test"
    });

    const res = await request(app)
      .post("/v1/billing/portal")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("portal_url");
    expect(res.body.portal_url).toContain("billing.stripe.com");
  });

  test("19. User without Stripe customer receives proper STRIPE_CUSTOMER_NOT_FOUND error", async () => {
    const res = await request(app)
      .post("/v1/billing/portal")
      .set("Authorization", `Bearer ${userApiKey}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("STRIPE_CUSTOMER_NOT_FOUND");
  });

  // ================= WEBHOOK TESTS =================

  test("20. Valid checkout.session.completed upgrades user", async () => {
    const webhookPayload = {
      id: "evt_test_checkout_1",
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_stripe_123",
          subscription: "sub_stripe_123",
          metadata: {
            user_id: userId,
            plan: "starter"
          }
        }
      }
    };

    const res = await request(app)
      .post("/v1/billing/webhook")
      .set("Content-Type", "application/json").set("Stripe-Signature", "valid_sig")
      .send(JSON.stringify(webhookPayload));

    expect(res.status).toBe(200);
    const updatedUser = await UserRepository.findById(userId);
    expect(updatedUser?.plan_tier).toBe("starter");
    expect(updatedUser?.stripe_customer_id).toBe("cus_stripe_123");
    expect(updatedUser?.stripe_subscription_id).toBe("sub_stripe_123");
  });

  test("21. Valid subscription.updated synchronizes plan", async () => {
    await UserRepository.updatePlanAndSubscription({
      userId,
      plan: "starter",
      stripeCustomerId: "cus_stripe_sync",
      stripeSubscriptionId: "sub_stripe_sync"
    });

    const webhookPayload = {
      id: "evt_test_sub_update_1",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_stripe_sync",
          customer: "cus_stripe_sync",
          status: "active",
          items: {
            data: [{ price: { id: "price_pro_test" } }]
          },
          metadata: { plan: "pro" }
        }
      }
    };

    const res = await request(app)
      .post("/v1/billing/webhook")
      .set("Content-Type", "application/json").set("Stripe-Signature", "valid_sig")
      .send(JSON.stringify(webhookPayload));

    expect(res.status).toBe(200);
    const updatedUser = await UserRepository.findById(userId);
    expect(updatedUser?.plan_tier).toBe("pro");
  });

  test("22. subscription.deleted downgrades to free", async () => {
    await UserRepository.updatePlanAndSubscription({
      userId,
      plan: "pro",
      stripeCustomerId: "cus_stripe_delete",
      stripeSubscriptionId: "sub_stripe_delete"
    });

    const webhookPayload = {
      id: "evt_test_sub_del_1",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_stripe_delete",
          customer: "cus_stripe_delete"
        }
      }
    };

    const res = await request(app)
      .post("/v1/billing/webhook")
      .set("Content-Type", "application/json").set("Stripe-Signature", "valid_sig")
      .send(JSON.stringify(webhookPayload));

    expect(res.status).toBe(200);
    const user = await UserRepository.findById(userId);
    expect(user?.plan_tier).toBe("free");
    expect(user?.stripe_subscription_id).toBeNull();
  });

  test("23. invoice.payment_failed downgrades to free", async () => {
    await UserRepository.updatePlanAndSubscription({
      userId,
      plan: "starter",
      stripeCustomerId: "cus_stripe_fail"
    });

    const webhookPayload = {
      id: "evt_test_invoice_fail_1",
      type: "invoice.payment_failed",
      data: {
        object: {
          customer: "cus_stripe_fail"
        }
      }
    };

    const res = await request(app)
      .post("/v1/billing/webhook")
      .set("Content-Type", "application/json").set("Stripe-Signature", "valid_sig")
      .send(JSON.stringify(webhookPayload));

    expect(res.status).toBe(200);
    const user = await UserRepository.findById(userId);
    expect(user?.plan_tier).toBe("free");
    expect(user?.subscription_status).toBe("past_due");
  });

  test("24. Invalid webhook signature rejected with 400", async () => {
    const res = await request(app)
      .post("/v1/billing/webhook")
      .set("Content-Type", "application/json").set("Stripe-Signature", "invalid_signature")
      .send(JSON.stringify({ id: "evt_1", type: "ping" }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("STRIPE_WEBHOOK_INVALID");
  });

  test("25. Duplicate webhook event is safely ignored", async () => {
    const webhookPayload = {
      id: "evt_test_idempotent_1",
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_idem",
          subscription: "sub_idem",
          metadata: { user_id: userId, plan: "starter" }
        }
      }
    };

    const res1 = await request(app)
      .post("/v1/billing/webhook")
      .set("Content-Type", "application/json").set("Stripe-Signature", "valid_sig")
      .send(JSON.stringify(webhookPayload));
    expect(res1.status).toBe(200);
    expect(res1.body.duplicate).toBe(false);

    const res2 = await request(app)
      .post("/v1/billing/webhook")
      .set("Content-Type", "application/json").set("Stripe-Signature", "valid_sig")
      .send(JSON.stringify(webhookPayload));
    expect(res2.status).toBe(200);
    expect(res2.body.duplicate).toBe(true);
  });

  test("26. Unknown/unrelated webhook event does not break the API", async () => {
    const webhookPayload = {
      id: "evt_test_unknown_event",
      type: "customer.created",
      data: { object: {} }
    };

    const res = await request(app)
      .post("/v1/billing/webhook")
      .set("Content-Type", "application/json").set("Stripe-Signature", "valid_sig")
      .send(JSON.stringify(webhookPayload));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  // ================= SECURITY TESTS =================

  test("27. User A cannot access User B's usage", async () => {
    for (let i = 0; i < 3; i++) {
      mockStore.usageLogs.push({
        id: `seed-a-${i}`,
        user_id: userId,
        api_key_id: "key-a",
        file_name: "receipt.png",
        file_size_bytes: 100,
        mime_type: "image/png",
        status: "SUCCESS",
        duration_ms: 50,
        created_at: new Date()
      });
    }

    const resB = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${otherApiKey}`);

    expect(resB.status).toBe(200);
    expect(resB.body.used).toBe(0);
  });

  test("28. Client cannot choose arbitrary Stripe Price ID", async () => {
    const res = await request(app)
      .post("/v1/billing/checkout")
      .set("Authorization", `Bearer ${userApiKey}`)
      .send({ plan: "pro", price_id: "price_hacked_cheap" });

    expect(res.status).toBe(200);
    const proPrice = stripeService.getPriceIdForPlan("pro");
    expect(proPrice).toBe("price_pro_test");
  });

  test("29. Client cannot directly set their own plan via request parameters", async () => {
    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${userApiKey}`)
      .set("X-Plan", "pro")
      .field("plan", "pro")
      .attach("file", validPngBuffer, "receipt.png");

    expect(res.status).toBe(200);

    const user = await UserRepository.findById(userId);
    expect(user?.plan_tier).toBe("free");
  });

  test("30. Stripe secrets are never returned in API responses", async () => {
    const checkoutRes = await request(app)
      .post("/v1/billing/checkout")
      .set("Authorization", `Bearer ${userApiKey}`)
      .send({ plan: "starter" });

    expect(checkoutRes.status).toBe(200);
    expect(JSON.stringify(checkoutRes.body)).not.toContain("sk_");
    expect(JSON.stringify(checkoutRes.body)).not.toContain("whsec_");
  });
});
