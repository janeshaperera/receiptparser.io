import dotenv from "dotenv";

dotenv.config();

export const config = {
  get env(): string {
    return process.env.NODE_ENV || "development";
  },
  get port(): number {
    return parseInt(process.env.PORT || "10000", 10);
  },
  get databaseUrl(): string {
    return process.env.DATABASE_URL || "";
  },
  get mockDb(): boolean {
    if (this.env === "production") {
      return false;
    }
    return process.env.MOCK_DB === "true";
  },
  get mockLlm(): boolean {
    if (this.env === "production") {
      return false;
    }
    return process.env.MOCK_LLM === "true";
  },
  get mockStripe(): boolean {
    if (this.env === "production") {
      return false;
    }
    return process.env.MOCK_STRIPE === "true";
  },
  get geminiApiKey(): string {
    return process.env.GEMINI_API_KEY || "";
  },
  get geminiModel(): string {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  },
  get webOrigin(): string {
    return process.env.WEB_ORIGIN || "http://localhost:3001";
  },
  get rateLimitWindowMs(): number {
    return 15 * 60 * 1000;
  },
  get rateLimitMax(): number {
    return parseInt(process.env.RATE_LIMIT_MAX || "100", 10);
  },
  // Stripe configurations
  get stripeSecretKey(): string {
    return process.env.STRIPE_SECRET_KEY || "";
  },
  get stripeWebhookSecret(): string {
    return process.env.STRIPE_WEBHOOK_SECRET || "";
  },
  get stripeStarterPriceId(): string {
    return process.env.STRIPE_STARTER_PRICE_ID || "price_starter_test";
  },
  get stripeProPriceId(): string {
    return process.env.STRIPE_PRO_PRICE_ID || "price_pro_test";
  },
  get stripeBusinessPriceId(): string {
    return process.env.STRIPE_BUSINESS_PRICE_ID || "price_business_test";
  },
  get adminSecretKey(): string {
    return process.env.ADMIN_SECRET_KEY || "rcpt_admin_secret_key_change_in_prod";
  }
};
