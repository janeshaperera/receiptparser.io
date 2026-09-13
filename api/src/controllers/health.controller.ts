import { Request, Response } from "express";
import { checkDbHealth } from "../db/index.js";
import { config } from "../config/index.js";

export class HealthController {
  /**
   * Lightweight and safe health check.
   * Does NOT expose database credentials, Gemini keys, or stack traces.
   */
  static async getHealth(req: Request, res: Response): Promise<void> {
    const isDbHealthy = await checkDbHealth();

    const statusCode = isDbHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: isDbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Status endpoint returning non-sensitive operational information.
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    const isDbHealthy = await checkDbHealth();

    res.status(200).json({
      name: "ReceiptParser.io API",
      version: "1.0.0",
      environment: config.env,
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      services: {
        database: isDbHealthy ? "operational" : "degraded",
        gemini_model: config.geminiModel
      }
    });
  }
}
