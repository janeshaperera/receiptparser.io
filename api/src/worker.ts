import { Hono } from "hono";
import { cors } from "hono/cors";
import { GoogleGenAI, Type } from "@google/genai";
import Stripe from "stripe";
import { config } from "./config/index.js";
import { UserRepository, ApiKeyRepository, UsageRepository, WebhookEventRepository } from "./db/repositories.js";
import { ApiKeyService } from "./services/apiKey.service.js";
import { parseService } from "./services/parse.service.js";
import { stripeService } from "./services/stripe.service.js";
import { webhookService } from "./services/webhook.service.js";
import { PLANS } from "./schemas/billing.schema.js";
import { SignupRequestSchema, LoginRequestSchema, RecoverRequestSchema, RecoverConfirmRequestSchema } from "./schemas/auth.schema.js";
import { CheckoutRequestSchema } from "./schemas/billing.schema.js";
import { AppError } from "./schemas/receipt.schema.js";
import { extractPrefix, verifyApiKey, generateRecoveryToken, verifyRecoveryToken } from "./utils/crypto.js";
import bcrypt from "bcryptjs";
import { checkDbHealth } from "./db/index.js";

export type Bindings = {
  NODE_ENV?: string;
  PORT?: string;
  DATABASE_URL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_STARTER_PRICE_ID?: string;
  STRIPE_PRO_PRICE_ID?: string;
  STRIPE_BUSINESS_PRICE_ID?: string;
  RECOVERY_SECRET?: string;
  MOCK_DB?: string;
  MOCK_LLM?: string;
  MOCK_STRIPE?: string;
  WEB_ORIGIN?: string;
  RATE_LIMIT_MAX?: string;
  ADMIN_SECRET_KEY?: string;
};

type Variables = {
  userId?: string;
  apiKeyRecord?: any;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Populate environment variables into process.env so config/index.js works identically
app.use("*", async (c, next) => {
  if (c.env) {
    for (const [key, value] of Object.entries(c.env)) {
      if (value !== undefined) {
        process.env[key] = String(value);
      }
    }
  }
  await next();
});

// Global CORS Middleware
app.use("*", async (c, next) => {
  const originHeader = c.req.header("origin");
  const configuredOrigins = (process.env.WEB_ORIGIN || "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((s) => s.trim());

  let allowOrigin = "*";
  if (process.env.NODE_ENV === "production" && originHeader) {
    if (configuredOrigins.includes(originHeader)) {
      allowOrigin = originHeader;
    }
  }

  // Handle OPTIONS preflight directly
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature, x-admin-key",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  await next();
  c.header("Access-Control-Allow-Origin", allowOrigin);
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Stripe-Signature, x-admin-key");
});

// Centralized error handling
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details
        }
      },
      err.statusCode as any
    );
  }

  console.error("Unhandled Worker Exception:", err);
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "An unexpected internal server error occurred",
        details: {}
      }
    },
    500
  );
});

// Public health & status endpoints
app.get("/v1/health", async (c) => {
  const isDbHealthy = await checkDbHealth();
  const statusCode = isDbHealthy ? 200 : 503;
  return c.json(
    {
      status: isDbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString()
    },
    statusCode as any
  );
});

const workerStartTime = Date.now();

app.get("/v1/status", async (c) => {
  const isDbHealthy = await checkDbHealth();
  const uptimeSeconds = Math.floor((Date.now() - workerStartTime) / 1000);
  return c.json({
    name: "ReceiptParser.io API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime_seconds: uptimeSeconds,
    timestamp: new Date().toISOString(),
    services: {
      database: isDbHealthy ? "operational" : "degraded",
      gemini_model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
    }
  });
});

// Admin stats endpoint
app.get("/v1/admin/stats", async (c) => {
  const adminKey = c.req.header("x-admin-key");
  const expectedAdminSecret = process.env.ADMIN_SECRET_KEY || "rcpt_admin_secret_key_change_in_prod";

  if (!adminKey || adminKey !== expectedAdminSecret) {
    throw new AppError("ADMIN_UNAUTHORIZED", "Unauthorized. Valid 'x-admin-key' header required.", 401);
  }

  const raw = await UsageRepository.getAdminStats();
  const inputCost = (raw.input_tokens_total / 1_000_000) * 0.075;
  const outputCost = (raw.output_tokens_total / 1_000_000) * 0.30;
  const estimated_ai_cost_usd = Number((inputCost + outputCost).toFixed(4));

  return c.json({
    success: true,
    stats: {
      total_processed: raw.receipts_processed_all_time,
      total_input_tokens: raw.input_tokens_total,
      total_output_tokens: raw.output_tokens_total,
      estimated_ai_cost_usd,
      active_users_this_month: raw.receipts_processed_this_month > 0 ? raw.total_users : 0,
      ...raw
    }
  });
});

// Authentication endpoints
app.post("/v1/auth/signup", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = SignupRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("INVALID_REQUEST", parsed.error.errors[0]?.message || "Invalid signup details", 400);
  }

  const { name, email, password } = parsed.data;
  let existingUser = await UserRepository.findByEmail(email);
  if (existingUser) {
    throw new AppError("EMAIL_ALREADY_EXISTS", "An account with this email already exists. Please sign in instead.", 409);
  }

  let passwordHash: string | undefined = undefined;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const user = await UserRepository.create(email, {
    name: name || "User",
    password_hash: passwordHash
  });

  const { apiKey, rawKey } = await ApiKeyService.createApiKey(user.id, "Primary Account Key");

  return c.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan_tier
      },
      api_key: {
        id: apiKey.id,
        prefix: apiKey.key_prefix,
        raw_key: rawKey
      },
      message: "Account created successfully."
    },
    201
  );
});

app.post("/v1/auth/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = LoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("INVALID_REQUEST", parsed.error.errors[0]?.message || "Email and password are required", 400);
  }

  const { email, password } = parsed.data;
  const user = await UserRepository.findByEmail(email);
  if (!user) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  if (!user.password_hash) {
    throw new AppError("INVALID_CREDENTIALS", "This account was created without a password. Please sign in with your API key or recover access.", 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  const { apiKey, rawKey } = await ApiKeyService.createApiKey(user.id, "Login Session Key");

  return c.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan_tier,
      stripe_customer_id: user.stripe_customer_id
    },
    api_key: {
      id: apiKey.id,
      prefix: apiKey.key_prefix,
      raw_key: rawKey
    }
  });
});

// Authentication middleware helper
async function authenticate(c: any) {
  const authHeader = c.req.header("authorization");
  if (!authHeader) {
    throw new AppError("MISSING_API_KEY", "Authorization header with Bearer token is required (e.g. 'Authorization: Bearer rcpt_live_...')", 401);
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new AppError("INVALID_API_KEY", "Authorization header must follow the format 'Bearer <API_KEY>'", 401);
  }

  const rawKey = parts[1].trim();
  if (!rawKey.startsWith("rcpt_live_") || rawKey.length < 20) {
    throw new AppError("INVALID_API_KEY", "The provided API key is invalid or malformed", 401);
  }

  const prefix = extractPrefix(rawKey);
  const keyRecord = await ApiKeyRepository.findByPrefix(prefix);
  if (!keyRecord) {
    throw new AppError("INVALID_API_KEY", "The provided API key does not exist or has been revoked", 401);
  }

  const isValid = await verifyApiKey(rawKey, keyRecord.key_hash);
  if (!isValid) {
    throw new AppError("INVALID_API_KEY", "The provided API key is invalid", 401);
  }

  c.set("userId", keyRecord.user_id);
  c.set("apiKeyRecord", keyRecord);
  return { userId: keyRecord.user_id, apiKeyRecord: keyRecord };
}

// Plan quota helper
async function checkQuota(userId: string) {
  const user = await UserRepository.findById(userId);
  const planTier = user?.plan_tier || "free";
  const planConfig = PLANS[planTier] || PLANS.free;
  const monthlyUsage = await UsageRepository.getMonthlyUsageCount(userId);

  if (monthlyUsage >= planConfig.monthlyLimit) {
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const resetDate = nextMonth.toISOString().split("T")[0];

    throw new AppError("PLAN_LIMIT_EXCEEDED", `You've used all ${planConfig.monthlyLimit} ${planTier} receipts this month.`, 429, {
      plan: planTier,
      used: monthlyUsage,
      limit: planConfig.monthlyLimit,
      remaining: 0,
      reset_date: resetDate,
      upgrade_url: "/v1/billing/checkout"
    });
  }

  return { planTier, monthlyUsage, planConfig };
}

app.post("/v1/auth/verify", async (c) => {
  const { userId, apiKeyRecord } = await authenticate(c);
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "Account associated with this API key not found", 404);
  }

  return c.json({
    valid: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan_tier,
      stripe_customer_id: user.stripe_customer_id
    },
    api_key: {
      id: apiKeyRecord.id,
      prefix: apiKeyRecord.key_prefix,
      name: apiKeyRecord.name
    }
  });
});

app.post("/v1/auth/recover", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = RecoverRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("INVALID_REQUEST", parsed.error.errors[0]?.message || "Invalid email", 400);
  }

  const user = await UserRepository.findByEmail(parsed.data.email);
  if (user) {
    const token = generateRecoveryToken(user.email);
    console.log(`[Recovery Token generated for ${user.email}]: ${token}`);
  }

  return c.json({
    message: "If an account exists for that email, a recovery link has been generated."
  });
});

app.post("/v1/auth/recover/confirm", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = RecoverConfirmRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("INVALID_REQUEST", parsed.error.errors[0]?.message || "Invalid recovery data", 400);
  }

  const verification = verifyRecoveryToken(parsed.data.token);
  if (!verification.valid || !verification.email) {
    throw new AppError("INVALID_RECOVERY_TOKEN", verification.error || "Recovery link is invalid or expired", 400);
  }

  const user = await UserRepository.findByEmail(verification.email);
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "Account not found", 404);
  }

  if (parsed.data.password) {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await UserRepository.updatePassword(user.id, passwordHash);
  }

  const { apiKey, rawKey } = await ApiKeyService.createApiKey(user.id, "Recovered API Key");

  return c.json({
    message: "Access recovered successfully.",
    api_key: {
      id: apiKey.id,
      prefix: apiKey.key_prefix,
      raw_key: rawKey
    }
  });
});

// Parse Receipt endpoint
app.post("/v1/parse", async (c) => {
  const { userId, apiKeyRecord } = await authenticate(c);
  await checkQuota(userId);

  const startTime = Date.now();
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch (err: any) {
    throw new AppError("INVALID_REQUEST", "Failed to parse multipart form data: " + err.message, 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new AppError("INVALID_REQUEST", "No file uploaded. Please supply a receipt file in the 'file' multipart field.", 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimetype = file.type || "image/jpeg";
  const originalname = file.name || "receipt.jpg";
  const size = file.size;

  try {
    const result = await parseService.parseReceipt(buffer, mimetype, originalname);
    const durationMs = Date.now() - startTime;

    try {
      await UsageRepository.logUsage({
        user_id: userId,
        api_key_id: apiKeyRecord.id,
        file_name: originalname,
        file_size_bytes: size,
        mime_type: mimetype,
        status: "SUCCESS",
        duration_ms: durationMs,
        model: result.telemetry.model,
        input_tokens: result.telemetry.inputTokens,
        output_tokens: result.telemetry.outputTokens
      });
    } catch (err) {
      console.error("Usage log error:", err);
    }

    return c.json(result.receipt);
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    try {
      await UsageRepository.logUsage({
        user_id: userId,
        api_key_id: apiKeyRecord.id,
        file_name: originalname,
        file_size_bytes: size,
        mime_type: mimetype,
        status: "FAILED",
        duration_ms: durationMs
      });
    } catch (err) {
      console.error("Usage log error:", err);
    }
    throw error;
  }
});

// Usage endpoints
app.get("/v1/usage", async (c) => {
  const { userId } = await authenticate(c);
  const user = await UserRepository.findById(userId);
  const planTier = user?.plan_tier || "free";
  const planConfig = PLANS[planTier] || PLANS.free;

  const usedCount = await UsageRepository.getMonthlyUsageCount(userId);
  const totalRequests = await UsageRepository.getTotalUsage(userId);
  const remaining = Math.max(0, planConfig.monthlyLimit - usedCount);

  const now = new Date();
  const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const resetDate = nextMonth.toISOString().split("T")[0];

  return c.json({
    user_id: userId,
    plan: planTier,
    used: usedCount,
    total_requests: totalRequests,
    limit: planConfig.monthlyLimit,
    remaining,
    period: currentPeriod,
    reset_date: resetDate
  });
});

app.get("/v1/usage/daily", async (c) => {
  const { userId } = await authenticate(c);
  const user = await UserRepository.findById(userId);
  const planTier = user?.plan_tier || "free";
  const dailyBreakdown = await UsageRepository.getDailyUsage(userId, 30);

  return c.json({
    user_id: userId,
    plan: planTier,
    days: dailyBreakdown
  });
});

// Billing endpoints
app.post("/v1/billing/checkout", async (c) => {
  const { userId, apiKeyRecord } = await authenticate(c);
  const body = await c.req.json().catch(() => ({}));
  const parsed = CheckoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("INVALID_PLAN", parsed.error.errors[0]?.message || "Invalid plan selection. Choose 'starter', 'pro', or 'business'.", 400);
  }

  const user = await UserRepository.findById(userId);
  const email = user?.email || `user_${userId}@receiptparser.io`;

  const session = await stripeService.createCheckoutSession({
    userId,
    email,
    apiKeyId: apiKeyRecord.id,
    plan: parsed.data.plan
  });

  return c.json({
    checkout_url: session.url,
    session_id: session.sessionId
  });
});

app.post("/v1/billing/portal", async (c) => {
  const { userId } = await authenticate(c);
  const portal = await stripeService.createPortalSession(userId);
  return c.json({
    portal_url: portal.url
  });
});

app.post("/v1/billing/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) {
    throw new AppError("STRIPE_WEBHOOK_INVALID", "Missing 'Stripe-Signature' header", 400);
  }

  const rawBodyText = await c.req.text();
  const rawBodyBuffer = Buffer.from(rawBodyText, "utf8");

  const event = stripeService.constructWebhookEvent(rawBodyBuffer, signature);
  const result = await webhookService.processEvent(event);

  return c.json({
    received: true,
    event_id: event.id,
    event_type: event.type,
    duplicate: result.duplicate
  });
});

// 404 Fallback
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message: `Endpoint '${c.req.method} ${c.req.path}' not found`,
        details: {}
      }
    },
    404
  );
});

export default app;
