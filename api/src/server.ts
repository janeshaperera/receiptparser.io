import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { pool, checkDbHealth } from "./db/index.js";

async function startServer() {
  console.log("==========================================");
  console.log("Starting ReceiptParser.io API Server...");
  console.log(`Environment: ${config.env}`);
  console.log(`MOCK_DB: ${config.mockDb}`);
  console.log(`MOCK_LLM: ${config.mockLlm}`);
  console.log(`MOCK_STRIPE: ${config.mockStripe}`);
  console.log("==========================================");

  // In production, MOCK_DB, MOCK_LLM, and MOCK_STRIPE are strictly forbidden
  if (config.env === "production") {
    if (
      process.env.MOCK_DB === "true" ||
      process.env.MOCK_LLM === "true" ||
      process.env.MOCK_STRIPE === "true"
    ) {
      console.error(
        "FATAL SECURITY ERROR: MOCK_DB, MOCK_LLM, or MOCK_STRIPE cannot be enabled in production environment."
      );
      process.exit(1);
    }
  }

  // If MOCK_DB is false, ensure PostgreSQL connection works; otherwise fail loudly!
  if (!config.mockDb) {
    if (!config.databaseUrl) {
      console.error("FATAL ERROR: MOCK_DB is false but DATABASE_URL is not set.");
      process.exit(1);
    }

    const isHealthy = await checkDbHealth();
    if (!isHealthy) {
      console.error("FATAL ERROR: PostgreSQL database is unreachable at startup.");
      process.exit(1);
    }
    console.log("PostgreSQL connection successfully established.");
  } else {
    console.warn("WARNING: Running with MOCK_DB=true. PostgreSQL is bypassed for development.");
  }

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`ReceiptParser.io API running on port ${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/v1/health`);
    console.log(`Status info:  http://localhost:${config.port}/v1/status`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      if (pool) {
        await pool.end();
        console.log("PostgreSQL connection pool closed.");
      }
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
