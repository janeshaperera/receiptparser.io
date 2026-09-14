import pg from "pg";
import { config } from "../config/index.js";
import { AppError } from "../schemas/receipt.schema.js";

import { Client as NeonClient } from "@neondatabase/serverless";

// Determine if running inside Cloudflare Workers or Node.js
const isCloudflareWorker = typeof WebSocketPair !== "undefined" || (typeof navigator !== "undefined" && navigator.userAgent?.includes("Cloudflare-Workers"));

export let pool: any = null;

export function getPool(): any {
  if (config.mockDb) {
    return null;
  }
  if (!pool && config.databaseUrl && !isCloudflareWorker) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: config.databaseUrl.includes("supabase") || process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
    });

    pool.on("error", (err: any) => {
      console.error("Unexpected error on idle PostgreSQL client", err);
    });
  }
  return pool;
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

  if (!config.databaseUrl) {
    throw new AppError("DATABASE_ERROR", "Database connection is not configured or unavailable", 503);
  }

  // Cloudflare Workers runtime: create request-scoped client to satisfy Worker I/O rules
  if (isCloudflareWorker) {
    const client = new NeonClient(config.databaseUrl);
    try {
      await client.connect();
      const result = await client.query<T>(text, params);
      return result;
    } catch (err: any) {
      console.error("PostgreSQL Worker Query Error:", err.message);
      throw new AppError("DATABASE_ERROR", "Database operation failed", 500, {
        hint: err.message
      });
    } finally {
      client.end().catch(() => {});
    }
  }

  // Standard Node.js environment: use connection pool
  const activePool = getPool();
  if (!activePool) {
    throw new AppError("DATABASE_ERROR", "Database connection is not configured or unavailable", 503);
  }

  try {
    return await activePool.query<T>(text, params);
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

  if (!config.databaseUrl) {
    return false;
  }

  try {
    const res = await query("SELECT 1 as healthy");
    return res.rows[0]?.healthy === 1;
  } catch {
    return false;
  }
}
