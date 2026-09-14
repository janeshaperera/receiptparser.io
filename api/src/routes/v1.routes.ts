import { Router } from "express";
import { HealthController } from "../controllers/health.controller.js";
import { ParseController } from "../controllers/parse.controller.js";
import { UsageController } from "../controllers/usage.controller.js";
import { BillingController } from "../controllers/billing.controller.js";
import { AuthController } from "../controllers/auth.controller.js";
import { AdminController } from "../controllers/admin.controller.js";
import { authenticateApiKey } from "../middleware/auth.js";
import { checkPlanUsageLimit } from "../middleware/planLimit.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Public health & status endpoints
router.get("/health", HealthController.getHealth);
router.get("/status", HealthController.getStatus);

// Admin stats endpoint (requires x-admin-key header)
router.get("/admin/stats", AdminController.getStats);

// Authentication & Recovery endpoints
router.post("/auth/signup", AuthController.signup);
router.post("/auth/login", AuthController.login);
router.post("/auth/verify", authenticateApiKey, AuthController.verifyKey);
router.post("/auth/recover", AuthController.recover);
router.post("/auth/recover/confirm", AuthController.confirmRecovery);

// Parse endpoint (enforces API key auth + plan quota before processing or calling Gemini)
router.post(
  "/parse",
  authenticateApiKey,
  checkPlanUsageLimit,
  upload.single("file"),
  ParseController.parseReceipt
);

// Usage monitoring endpoints
router.get("/usage", authenticateApiKey, UsageController.getUsage);
router.get("/usage/daily", authenticateApiKey, UsageController.getDailyUsage);

// Billing endpoints
router.post("/billing/checkout", authenticateApiKey, BillingController.createCheckout);
router.post("/billing/portal", authenticateApiKey, BillingController.createPortal);

export default router;
