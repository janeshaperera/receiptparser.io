import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import { config } from "./config/index.js";
import { createRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { BillingController } from "./controllers/billing.controller.js";
import v1Routes from "./routes/v1.routes.js";

export function createApp(options?: { rateLimitMax?: number }): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  const corsOrigin = config.env === "production" ? config.webOrigin : "*";
  app.use(
    cors({
      origin: corsOrigin,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Stripe-Signature"]
    })
  );

  // CRITICAL: Mount Stripe raw body webhook BEFORE express.json()
  app.post(
    "/v1/billing/webhook",
    express.raw({ type: "application/json" }),
    BillingController.handleWebhook
  );

  // Body Parsing for standard JSON (non-webhook)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Global Rate Limiting
  app.use("/v1", createRateLimiter(options?.rateLimitMax));

  // Mount API Routes
  app.use("/v1", v1Routes);

  // 404 Route Not Found Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message: `Endpoint '${req.method} ${req.originalUrl}' not found`,
        details: {}
      }
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
