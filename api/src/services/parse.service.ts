import { geminiService } from "./gemini.service.js";
import { ReceiptExtraction, AppError } from "../schemas/receipt.schema.js";
import { verifyReceiptConsistency } from "../utils/consistencyCheck.js";
import { validateFileMagicBytes } from "../utils/fileValidator.js";

export interface ParseResult {
  receipt: ReceiptExtraction;
  consistencyChecked: boolean;
  retried: boolean;
  telemetry: {
    model: string;
    inputTokens: number;
    outputTokens: number;
  };
}

export class ParseService {
  /**
   * Complete parsing pipeline:
   * 1. Magic bytes validation
   * 2. First extraction attempt via Gemini
   * 3. Self-consistency check
   * 4. Single retry if inconsistent
   * 5. Throw CONSISTENCY_CHECK_FAILED if second attempt still fails
   */
  async parseReceipt(fileBuffer: Buffer, mimeType: string, originalName: string): Promise<ParseResult> {
    // 1. Magic bytes validation
    const isMagicValid = validateFileMagicBytes(fileBuffer, mimeType);
    if (!isMagicValid) {
      throw new AppError(
        "INVALID_FILE_TYPE",
        `File magic header does not match declared type '${mimeType}'. File may be corrupt or misnamed.`,
        400,
        { originalName, mimeType }
      );
    }

    // 2. Initial extraction attempt
    let extraction = await geminiService.extractReceipt(fileBuffer, mimeType);

    // 3. Consistency verification
    let check = verifyReceiptConsistency(extraction);

    if (check.isConsistent) {
      return {
        receipt: extraction,
        consistencyChecked: true,
        retried: false,
        telemetry: { ...geminiService.lastTelemetry }
      };
    }

    // 4. Inconsistent: Retry once with recalculation prompt
    console.warn("Receipt consistency check failed on attempt 1. Retrying with recalculation prompt...", check.recalculationReason);

    extraction = await geminiService.extractReceipt(
      fileBuffer,
      mimeType,
      check.recalculationReason
    );

    // 5. Re-check consistency
    check = verifyReceiptConsistency(extraction);

    if (!check.isConsistent) {
      throw new AppError(
        "CONSISTENCY_CHECK_FAILED",
        "Calculated arithmetic on receipt failed self-consistency verification after retry.",
        422,
        {
          recalculationReason: check.recalculationReason,
          itemSum: check.itemSum,
          subtotal: extraction.subtotal,
          tax: extraction.tax,
          total: extraction.total,
          extractedData: extraction
        }
      );
    }

    return {
      receipt: extraction,
      consistencyChecked: true,
      retried: true,
      telemetry: { ...geminiService.lastTelemetry }
    };
  }
}

export const parseService = new ParseService();
