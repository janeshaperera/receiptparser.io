import { Request, Response, NextFunction } from "express";
import { AppError } from "../schemas/receipt.schema.js";
import { extractPrefix, verifyApiKey } from "../utils/crypto.js";
import { ApiKeyRepository, ApiKeyRecord } from "../db/repositories.js";

declare global {
  namespace Express {
    interface Request {
      apiKeyRecord?: ApiKeyRecord;
      userId?: string;
    }
  }
}

export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(
      new AppError(
        "MISSING_API_KEY",
        "Authorization header with Bearer token is required (e.g. 'Authorization: Bearer rcpt_live_...')",
        401
      )
    );
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return next(
      new AppError(
        "INVALID_API_KEY",
        "Authorization header must follow the format 'Bearer <API_KEY>'",
        401
      )
    );
  }

  const rawKey = parts[1].trim();

  if (!rawKey.startsWith("rcpt_live_") || rawKey.length < 20) {
    return next(
      new AppError("INVALID_API_KEY", "The provided API key is invalid or malformed", 401)
    );
  }

  try {
    const prefix = extractPrefix(rawKey);
    const keyRecord = await ApiKeyRepository.findByPrefix(prefix);

    if (!keyRecord) {
      return next(
        new AppError("INVALID_API_KEY", "The provided API key does not exist or has been revoked", 401)
      );
    }

    const isValid = await verifyApiKey(rawKey, keyRecord.key_hash);
    if (!isValid) {
      return next(
        new AppError("INVALID_API_KEY", "The provided API key is invalid", 401)
      );
    }

    // Attach to request
    req.apiKeyRecord = keyRecord;
    req.userId = keyRecord.user_id;

    // Asynchronously update last_used_at without blocking request
    ApiKeyRepository.updateLastUsed(keyRecord.id).catch((err) => {
      console.error("Failed to update last_used_at for key:", keyRecord.id, err);
    });

    next();
  } catch (error) {
    next(error);
  }
}
