import request from "supertest";
import { createApp } from "../src/app.js";
import { mockStore } from "../src/db/repositories.js";
import { ApiKeyService } from "../src/services/apiKey.service.js";
import { geminiService, DETERMINISTIC_MOCK_RECEIPT } from "../src/services/gemini.service.js";
import { AppError } from "../src/schemas/receipt.schema.js";
import * as dbModule from "../src/db/index.js";
import { Express } from "express";

describe("ReceiptParser.io API Core - 20 Requirement Test Suite", () => {
  let app: Express;
  let validApiKey: string;
  let validUserId: string;

  // Tiny valid file buffers with proper magic bytes
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01
  ]);

  const validJpgBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01
  ]);

  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
  ]);

  const validPdfBuffer = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");

  beforeAll(async () => {
    app = createApp();
    mockStore.reset();
    validUserId = "00000000-0000-0000-0000-000000000001";
    const created = await ApiKeyService.createApiKey(validUserId, "Test Key");
    validApiKey = created.rawKey;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. GET /v1/health
  test("1. GET /v1/health returns 200 and healthy status without sensitive data", async () => {
    const res = await request(app).get("/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "healthy");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).not.toHaveProperty("databaseUrl");
    expect(res.body).not.toHaveProperty("apiKey");
  });

  // 2. GET /v1/status
  test("2. GET /v1/status returns 200 with non-sensitive status information", async () => {
    const res = await request(app).get("/v1/status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name", "ReceiptParser.io API");
    expect(res.body).toHaveProperty("version", "1.0.0");
    expect(res.body).toHaveProperty("services");
    expect(res.body.services).toHaveProperty("database", "operational");
  });

  // 3. Missing API key
  test("3. Missing API key returns 401 with MISSING_API_KEY", async () => {
    const res = await request(app)
      .post("/v1/parse")
      .attach("file", validPngBuffer, "receipt.png");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("MISSING_API_KEY");
  });

  // 4. Invalid API key
  test("4. Invalid API key returns 401 with INVALID_API_KEY", async () => {
    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", "Bearer rcpt_live_invalidkey1234567890123456")
      .attach("file", validPngBuffer, "receipt.png");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_API_KEY");
  });

  // 5. Valid API key authentication
  test("5. Valid API key authenticates successfully on /v1/usage", async () => {
    const res = await request(app)
      .get("/v1/usage")
      .set("Authorization", `Bearer ${validApiKey}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user_id", validUserId);
    expect(res.body).toHaveProperty("total_requests");
  });

  // 6. Missing upload file
  test("6. Missing upload file returns 400 with INVALID_REQUEST", async () => {
    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  // 7. Invalid file type (e.g. .txt / text/plain)
  test("7. Invalid file type returns 400 with INVALID_FILE_TYPE", async () => {
    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", Buffer.from("plain text content"), "receipt.txt");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
  });

  // 8. File over 10 MB limit
  test("8. File over 10 MB returns 400 with FILE_TOO_LARGE", async () => {
    const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1024);

    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", oversizedBuffer, "large.png");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FILE_TOO_LARGE");
  });

  // 9. Valid JPEG upload
  test("9. Valid JPEG upload returns structured receipt JSON", async () => {
    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", validJpgBuffer, "receipt.jpg");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("vendor_name");
    expect(res.body).toHaveProperty("raw_date");
    expect(res.body).toHaveProperty("date");
    expect(res.body).toHaveProperty("line_items");
    expect(res.body).toHaveProperty("total");
  });

  // 10. Valid PNG upload
  test("10. Valid PNG upload returns structured receipt JSON", async () => {
    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", validPngBuffer, "receipt.png");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("vendor_name");
    expect(res.body).toHaveProperty("subtotal");
  });

  // 11. Valid WEBP upload
  test("11. Valid WEBP upload returns structured receipt JSON", async () => {
    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", validWebpBuffer, "receipt.webp");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("vendor_name");
  });

  // 12. Valid PDF upload
  test("12. Valid PDF upload returns structured receipt JSON", async () => {
    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", validPdfBuffer, "invoice.pdf");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("vendor_name");
  });

  // 13. Mock Gemini extraction returns deterministic sample data
  test("13. Mock Gemini extraction returns deterministic consistent data", async () => {
    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", validPngBuffer, "test.png");

    expect(res.status).toBe(200);
    expect(res.body.vendor_name).toBe(DETERMINISTIC_MOCK_RECEIPT.vendor_name);
    expect(res.body.subtotal).toBe(DETERMINISTIC_MOCK_RECEIPT.subtotal);
  });

  // 14. Gemini validation failure (schema mismatch)
  test("14. Gemini validation failure returns 502 with EXTRACTION_FAILED", async () => {
    jest.spyOn(geminiService, "extractReceipt").mockRejectedValueOnce(
      new AppError("EXTRACTION_FAILED", "Gemini output failed schema validation", 502)
    );

    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", validPngBuffer, "invalid_schema.png");

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("EXTRACTION_FAILED");
  });

  // 15. Consistency check success
  test("15. Receipt arithmetic consistency check succeeds when math aligns", async () => {
    const balancedReceipt = {
      vendor_name: "Apple Store",
      raw_date: "11/20/2024",
      date: "2024-11-20",
      currency: "USD",
      line_items: [
        { description: "USB-C Cable", quantity: 1, unit_price: 19.0, total_price: 19.0 },
        { description: "Power Adapter", quantity: 1, unit_price: 20.0, total_price: 20.0 }
      ],
      subtotal: 39.0,
      tax: 3.12,
      total: 42.12
    };

    jest.spyOn(geminiService, "extractReceipt").mockResolvedValueOnce(balancedReceipt);

    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", validPngBuffer, "balanced.png");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(42.12);
  });

  // 16. Consistency check retry on first failure, succeeds on retry
  test("16. Consistency check triggers recalculation retry and succeeds on 2nd attempt", async () => {
    const unbalancedReceipt = {
      vendor_name: "Coffee Shop",
      raw_date: "05/01/2024",
      date: "2024-05-01",
      currency: "USD",
      line_items: [
        { description: "Latte", quantity: 1, unit_price: 5.0, total_price: 5.0 }
      ],
      subtotal: 10.0,
      tax: 1.0,
      total: 11.0
    };

    const correctedReceipt = {
      vendor_name: "Coffee Shop",
      raw_date: "05/01/2024",
      date: "2024-05-01",
      currency: "USD",
      line_items: [
        { description: "Latte", quantity: 1, unit_price: 5.0, total_price: 5.0 }
      ],
      subtotal: 5.0,
      tax: 0.5,
      total: 5.5
    };

    const extractSpy = jest
      .spyOn(geminiService, "extractReceipt")
      .mockResolvedValueOnce(unbalancedReceipt)
      .mockResolvedValueOnce(correctedReceipt);

    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", validPngBuffer, "retry_success.png");

    expect(extractSpy).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5.5);
  });

  // 17. Consistency check failure after retry returns CONSISTENCY_CHECK_FAILED
  test("17. Double arithmetic mismatch returns 422 with CONSISTENCY_CHECK_FAILED", async () => {
    const unbalancedReceipt = {
      vendor_name: "Broken Store",
      raw_date: "05/01/2024",
      date: "2024-05-01",
      currency: "USD",
      line_items: [
        { description: "Item A", quantity: 1, unit_price: 5.0, total_price: 5.0 }
      ],
      subtotal: 99.0,
      tax: 1.0,
      total: 100.0
    };

    jest
      .spyOn(geminiService, "extractReceipt")
      .mockResolvedValueOnce(unbalancedReceipt)
      .mockResolvedValueOnce(unbalancedReceipt);

    const res = await request(app)
      .post("/v1/parse")
      .set("Authorization", `Bearer ${validApiKey}`)
      .attach("file", validPngBuffer, "retry_failed.png");

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("CONSISTENCY_CHECK_FAILED");
  });

  // 18. Standardized error envelope format
  test("18. Standardized error envelope format is strictly followed", async () => {
    const res = await request(app).get("/v1/non-existent-endpoint");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toHaveProperty("code", "INVALID_REQUEST");
    expect(res.body.error).toHaveProperty("message");
    expect(res.body.error).toHaveProperty("details");
  });

  // 19. Rate limiting
  test("19. Rate limiting triggers 429 when max requests exceeded", async () => {
    const rateLimitedApp = createApp({ rateLimitMax: 2 });

    await request(rateLimitedApp).get("/v1/health");
    await request(rateLimitedApp).get("/v1/health");
    const res = await request(rateLimitedApp).get("/v1/health");

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  // 20. Database failure behavior (loud rejection, no silent bypass)
  test("20. Database failure behavior returns 503 and reports degraded status", async () => {
    jest.spyOn(dbModule, "checkDbHealth").mockResolvedValueOnce(false);

    const res = await request(app).get("/v1/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("unhealthy");
  });
});
