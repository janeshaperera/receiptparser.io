import pg from "pg";
import { config } from "../config/index.js";
import { AppError } from "../schemas/receipt.schema.js";

const { Pool } = pg;

export let pool: pg.Pool | null = null;

if (!config.mockDb) {
  if (!config.databaseUrl) {
    console.error("FATAL: DATABASE_URL is not set and MOCK_DB is false.");
  } else {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
    });
  }
}

/**
 * Execute a query or fail loudly if DB is down/unconfigured
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  if (config.mockDb) {
    throw new AppError("DATABASE_ERROR", "Direct query called in mock DB mode", 500);
  }

  if (!pool) {
    throw new AppError("DATABASE_ERROR", "Database connection is not configured or unavailable", 503);
  }

  try {
    return await pool.query<T>(text, params);
  } catch (err: any) {
    console.error("PostgreSQL Query Error:", err.message);
    throw new AppError("DATABASE_ERROR", "Database operation failed", 500, {
      hint: config.env === "development" ? err.message : undefined
    });
  }
}

/**
 * Health check ping
 */
export async function checkDbHealth(): Promise<boolean> {
  if (config.mockDb) {
    return true; // Mock mode reports healthy
  }

  if (!pool) {
    return false;
  }

  try {
    const res = await pool.query("SELECT 1");
    return res.rowCount !== null && res.rowCount > 0;
  } catch {
    return false;
  }
}
