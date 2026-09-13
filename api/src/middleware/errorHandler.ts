import { Request, Response, NextFunction } from "express";
import { AppError } from "../schemas/receipt.schema.js";
import { config } from "../config/index.js";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers already sent, pass to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || {}
      }
    });
    return;
  }

  // Handle Multer errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: "Uploaded file exceeds the maximum allowed size of 10 MB",
          details: { maxSize: "10MB" }
        }
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message: err.message,
        details: { multerCode: err.code }
      }
    });
    return;
  }

  // Handle generic / unexpected errors
  console.error("Unhandled Server Error:", err);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected internal server error occurred",
      details: config.env === "development" ? { rawMessage: err.message } : {}
    }
  });
}
