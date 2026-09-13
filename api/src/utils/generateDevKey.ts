import dotenv from "dotenv";
dotenv.config();

// Ensure mock mode if DB is not provided
if (!process.env.DATABASE_URL) {
  process.env.MOCK_DB = "true";
}

import { ApiKeyService } from "../services/apiKey.service.js";
import { pool } from "../db/index.js";

async function main() {
  const userId = process.argv[2] || "00000000-0000-0000-0000-000000000001";
  const keyName = process.argv[3] || "Dev Key";

  console.log("Generating API Key for user:", userId);
  const result = await ApiKeyService.createApiKey(userId, keyName);

  console.log("\n=======================================================");
  console.log("NEW API KEY GENERATED (STORE THIS NOW, IT CANNOT BE RETRIEVED LATER):");
  console.log("-------------------------------------------------------");
  console.log(`Key Prefix: ${result.apiKey.key_prefix}`);
  console.log(`Raw Key:    ${result.rawKey}`);
  console.log("=======================================================\n");

  if (pool) {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Failed to generate key:", err);
  process.exit(1);
});
