import { z } from "zod";

export const LineItemSchema = z.object({
  description: z.string().min(1, "Line item description is required"),
  quantity: z.number().positive("Quantity must be positive").default(1),
  unit_price: z.number().nonnegative("Unit price must be non-negative"),
  total_price: z.number().nonnegative("Total price must be non-negative")
});

export const ReceiptExtractionSchema = z.object({
  vendor_name: z.string().min(1, "Vendor name is required"),
  raw_date: z.string().min(1, "Raw date string is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD ISO format"),
  currency: z.string().default("USD"),
  line_items: z.array(LineItemSchema).min(1, "At least one line item is required"),
  subtotal: z.number().nonnegative("Subtotal must be non-negative"),
  tax: z.number().nonnegative("Tax must be non-negative"),
  total: z.number().nonnegative("Total must be non-negative")
});

export type LineItem = z.infer<typeof LineItemSchema>;
export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

export type ErrorCode =
  | "INVALID_API_KEY"
  | "MISSING_API_KEY"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "INVALID_REQUEST"
  | "LLM_ERROR"
  | "EXTRACTION_FAILED"
  | "CONSISTENCY_CHECK_FAILED"
  | "DATABASE_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "PLAN_LIMIT_EXCEEDED"
  | "INVALID_PLAN"
  | "STRIPE_ERROR"
  | "STRIPE_CUSTOMER_NOT_FOUND"
  | "STRIPE_WEBHOOK_INVALID"
  | "STRIPE_WEBHOOK_PROCESSING_FAILED"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "ADMIN_UNAUTHORIZED"
  | "INTERNAL_SERVER_ERROR";

export interface StandardApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, statusCode = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
