import { Request, Response, NextFunction } from "express";
import { config } from "../config/index.js";
import { AppError } from "../schemas/receipt.schema.js";
import { UsageRepository } from "../db/repositories.js";

export class AdminController {
  /**
   * GET /v1/admin/stats
   * Returns internal aggregate usage stats:
   * total_processed, total_input_tokens, total_output_tokens, estimated_ai_cost_usd, active_users_this_month
   * Protected by x-admin-key header.
   */
  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    const adminKey = req.headers["x-admin-key"];

    if (!adminKey || typeof adminKey !== "string" || adminKey !== config.adminSecretKey) {
      return next(
        new AppError(
          "ADMIN_UNAUTHORIZED",
          "Unauthorized. Valid 'x-admin-key' header required.",
          401
        )
      );
    }

    try {
      const raw = await UsageRepository.getAdminStats();
      // Gemini 2.5 Flash pricing: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens
      const inputCost = (raw.input_tokens_total / 1_000_000) * 0.075;
      const outputCost = (raw.output_tokens_total / 1_000_000) * 0.30;
      const estimated_ai_cost_usd = Number((inputCost + outputCost).toFixed(4));

      res.status(200).json({
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
    } catch (err) {
      next(err);
    }
  }
}
