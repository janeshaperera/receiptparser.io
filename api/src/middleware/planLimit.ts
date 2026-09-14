import { Request, Response, NextFunction } from "express";
import { UserRepository, UsageRepository } from "../db/repositories.js";
import { PLANS } from "../schemas/billing.schema.js";
import { AppError } from "../schemas/receipt.schema.js";

/**
 * Enforces monthly request quota based on user's current plan tier.
 * Must run after authenticateApiKey middleware.
 */
export async function checkPlanUsageLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.userId;

  if (!userId) {
    return next(new AppError("INVALID_REQUEST", "User authentication missing", 401));
  }

  try {
    const user = await UserRepository.findById(userId);
    const planTier = user?.plan_tier || "free";
    const planConfig = PLANS[planTier] || PLANS.free;

    const monthlyUsage = await UsageRepository.getMonthlyUsageCount(userId);

    if (monthlyUsage >= planConfig.monthlyLimit) {
      // Calculate next monthly reset date (1st of next month)
      const now = new Date();
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const resetDate = nextMonth.toISOString().split("T")[0];

      return next(
        new AppError(
          "PLAN_LIMIT_EXCEEDED",
          `You've used all ${planConfig.monthlyLimit} ${planTier} receipts this month.`,
          429,
          {
            plan: planTier,
            used: monthlyUsage,
            limit: planConfig.monthlyLimit,
            remaining: 0,
            reset_date: resetDate,
            upgrade_url: "/v1/billing/checkout"
          }
        )
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
