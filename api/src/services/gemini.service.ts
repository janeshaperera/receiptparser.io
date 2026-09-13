import { GoogleGenAI, Type } from "@google/genai";
import { config } from "../config/index.js";
import { ReceiptExtraction, ReceiptExtractionSchema, AppError } from "../schemas/receipt.schema.js";
import { normalizeReceiptDate } from "../utils/dateNormalizer.js";

// Structured response schema for Gemini
const geminiReceiptResponseSchema = {
  type: Type.OBJECT,
  properties: {
    vendor_name: { type: Type.STRING, description: "Name of the vendor/store" },
    raw_date: { type: Type.STRING, description: "Date string exactly as printed on the receipt" },
    currency: { type: Type.STRING, description: "Currency code (e.g. USD, EUR, GBP, CAD)" },
    line_items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Line item description" },
          quantity: { type: Type.NUMBER, description: "Quantity purchased" },
          unit_price: { type: Type.NUMBER, description: "Unit price per item" },
          total_price: { type: Type.NUMBER, description: "Total price for this line item" }
        },
        required: ["description", "quantity", "unit_price", "total_price"]
      }
    },
    subtotal: { type: Type.NUMBER, description: "Subtotal before tax" },
    tax: { type: Type.NUMBER, description: "Tax amount" },
    total: { type: Type.NUMBER, description: "Final total charged" },
    country_clues: { type: Type.STRING, description: "Any country, address, or store location clues" }
  },
  required: ["vendor_name", "raw_date", "currency", "line_items", "subtotal", "tax", "total"]
};

// Deterministic mock data for MOCK_LLM=true
export const DETERMINISTIC_MOCK_RECEIPT: ReceiptExtraction = {
  vendor_name: "Acme Supermarket Inc.",
  raw_date: "10/15/2024",
  date: "2024-10-15",
  currency: "USD",
  line_items: [
    {
      description: "Organic Whole Milk 1 Gallon",
      quantity: 1,
      unit_price: 4.5,
      total_price: 4.5
    },
    {
      description: "Artisan Sourdough Bread",
      quantity: 2,
      unit_price: 3.25,
      total_price: 6.5
    }
  ],
  subtotal: 11.0,
  tax: 0.95,
  total: 11.95
};

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (!config.mockLlm && config.geminiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  /**
   * Primary extraction call
   */
  async extractReceipt(
    fileBuffer: Buffer,
    mimeType: string,
    retryPrompt?: string
  ): Promise<ReceiptExtraction> {
    if (config.mockLlm) {
      // Deterministic mock mode
      return { ...DETERMINISTIC_MOCK_RECEIPT };
    }

    if (!config.geminiApiKey || !this.ai) {
      throw new AppError(
        "LLM_ERROR",
        "GEMINI_API_KEY is not configured and MOCK_LLM is false",
        500
      );
    }

    const base64Data = fileBuffer.toString("base64");

    const promptText = retryPrompt
      ? `CRITICAL RECALCULATION:
The previous receipt extraction had arithmetic discrepancies.
Carefully inspect the receipt image/document again and strictly recalculate:
- quantities
- unit prices
- line-item totals (quantity * unit_price)
- subtotal (sum of all line items)
- tax
- final total (subtotal + tax)

Ensure sum(line_items.total_price) precisely matches subtotal, and subtotal + tax precisely equals total.
${retryPrompt}`
      : `You are an expert OCR and financial document parsing assistant.
Analyze this receipt or invoice image/PDF carefully.
Extract all details strictly into the structured JSON schema.
- Preserve the exact raw date text in 'raw_date'.
- Detect any address/country or currency clues to assist date and currency normalization.
- Ensure all numbers are positive floats/integers.`;

    try {
      const response = await this.ai.models.generateContent({
        model: config.geminiModel,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              },
              {
                text: promptText
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: geminiReceiptResponseSchema
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new AppError("EXTRACTION_FAILED", "Gemini returned an empty response", 502);
      }

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (err: any) {
        throw new AppError(
          "EXTRACTION_FAILED",
          "Failed to parse structured JSON from Gemini output",
          502,
          { rawOutput: responseText }
        );
      }

      // Normalize date using raw_date and detected clues
      const normalizedDate = normalizeReceiptDate(
        parsedJson.raw_date,
        parsedJson.currency,
        { address: parsedJson.country_clues }
      );

      const candidateData = {
        vendor_name: parsedJson.vendor_name,
        raw_date: parsedJson.raw_date,
        date: normalizedDate,
        currency: (parsedJson.currency || "USD").toUpperCase(),
        line_items: parsedJson.line_items || [],
        subtotal: Number(parsedJson.subtotal),
        tax: Number(parsedJson.tax),
        total: Number(parsedJson.total)
      };

      // Validate with Zod
      const validationResult = ReceiptExtractionSchema.safeParse(candidateData);
      if (!validationResult.success) {
        throw new AppError(
          "EXTRACTION_FAILED",
          "Gemini output failed schema validation",
          502,
          { errors: validationResult.error.flatten() }
        );
      }

      return validationResult.data;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        "LLM_ERROR",
        `Gemini API request failed: ${err.message || "Unknown error"}`,
        502
      );
    }
  }
}

export const geminiService = new GeminiService();
