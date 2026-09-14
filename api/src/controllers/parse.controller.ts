import { Request, Response, NextFunction } from "express";
import { parseService } from "../services/parse.service.js";
import { UsageRepository } from "../db/repositories.js";
import { AppError } from "../schemas/receipt.schema.js";

export class ParseController {
  static async parseReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();

    if (!req.file) {
      return next(
        new AppError(
          "INVALID_REQUEST",
          "No file uploaded. Please supply a receipt file in the 'file' multipart field.",
          400
        )
      );
    }

    const { buffer, mimetype, originalname, size } = req.file;
    const userId = req.userId || "anonymous";
    const apiKeyId = req.apiKeyRecord?.id || "unknown";

    try {
      const result = await parseService.parseReceipt(buffer, mimetype, originalname);
      const durationMs = Date.now() - startTime;

      // Log successful usage asynchronously with cost telemetry (no receipt contents or sensitive data)
      UsageRepository.logUsage({
        user_id: userId,
        api_key_id: apiKeyId,
        file_name: originalname,
        file_size_bytes: size,
        mime_type: mimetype,
        status: "SUCCESS",
        duration_ms: durationMs,
        model: result.telemetry.model,
        input_tokens: result.telemetry.inputTokens,
        output_tokens: result.telemetry.outputTokens
      }).catch((err) => {
        console.error("Failed to write usage log:", err);
      });

      // Successful response returns clean structured JSON directly
      res.status(200).json(result.receipt);
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      // Log failure in usage log
      UsageRepository.logUsage({
        user_id: userId,
        api_key_id: apiKeyId,
        file_name: originalname,
        file_size_bytes: size,
        mime_type: mimetype,
        status: "FAILED",
        duration_ms: durationMs
      }).catch((err) => {
        console.error("Failed to write usage log:", err);
      });

      next(error);
    }
  }
}
