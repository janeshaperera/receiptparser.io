import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";
import { AppError } from "../schemas/receipt.schema.js";

export function createRateLimiter(maxRequests?: number) {
  const defaultLimit = config.env === "development" ? 2000 : config.rateLimitMax;
  const limit = maxRequests ?? defaultLimit;
  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(
        new AppError(
          "RATE_LIMIT_EXCEEDED",
          "Too many requests from this IP or account, please try again later",
          429,
          {
            windowMs: config.rateLimitWindowMs,
            maxRequests: limit
          }
        )
      );
    }
  });
}

export const apiRateLimiter = createRateLimiter();
