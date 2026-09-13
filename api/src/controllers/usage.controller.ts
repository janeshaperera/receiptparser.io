import { Request, Response, NextFunction } from "express";
import { UsageRepository, UserRepository } from "../db/repositories.js";
import { PLANS } from "../schemas/billing.schema.js";

export class UsageController {
  static async getUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const user = await UserRepository.findById(userId);
      const planTier = user?.plan_tier || "free";
      const planConfig = PLANS[planTier] || PLANS.free;

      const usedCount = await UsageRepository.getMonthlyUsageCount(userId);
      const totalRequests = await UsageRepository.getTotalUsage(userId);
      const remaining = Math.max(0, planConfig.monthlyLimit - usedCount);

      const now = new Date();
      const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

      res.status(200).json({
        user_id: userId,
        plan: planTier,
        used: usedCount,
        total_requests: totalRequests,
        limit: planConfig.monthlyLimit,
        remaining,
        period: currentPeriod
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDailyUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const user = await UserRepository.findById(userId);
      const planTier = user?.plan_tier || "free";
      const dailyBreakdown = await UsageRepository.getDailyUsage(userId, 30);

      res.status(200).json({
        user_id: userId,
        plan: planTier,
        days: dailyBreakdown
      });
    } catch (error) {
      next(error);
    }
  }
}
