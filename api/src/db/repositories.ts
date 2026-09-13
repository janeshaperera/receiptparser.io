import { config } from "../config/index.js";
import { query } from "./index.js";
import { PlanTier } from "../schemas/billing.schema.js";

export interface UserRecord {
  id: string;
  email: string;
  plan_tier: PlanTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  is_active: boolean;
  last_used_at: Date | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UsageLogRecord {
  id: string;
  user_id: string;
  api_key_id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  status: string;
  duration_ms: number;
  created_at: Date;
}

// In-memory mock store used ONLY when MOCK_DB=true
class MockDataStore {
  public users: Map<string, UserRecord> = new Map();
  public apiKeys: Map<string, ApiKeyRecord> = new Map();
  public usageLogs: UsageLogRecord[] = [];
  public processedWebhooks: Set<string> = new Set();

  constructor() {
    this.reset();
  }

  public reset() {
    this.users.clear();
    this.apiKeys.clear();
    this.usageLogs = [];
    this.processedWebhooks.clear();

    // Seed default test user
    const defaultUser: UserRecord = {
      id: "00000000-0000-0000-0000-000000000001",
      email: "founder@receiptparser.io",
      plan_tier: "free",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: "inactive",
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.set(defaultUser.id, defaultUser);
  }
}

export const mockStore = new MockDataStore();

export class UserRepository {
  static async findById(id: string): Promise<UserRecord | null> {
    if (config.mockDb) {
      return mockStore.users.get(id) || null;
    }

    const res = await query<UserRecord>(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
    return res.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<UserRecord | null> {
    if (config.mockDb) {
      for (const user of mockStore.users.values()) {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          return user;
        }
      }
      return null;
    }

    const res = await query<UserRecord>(`SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
    return res.rows[0] || null;
  }

  static async create(email: string): Promise<UserRecord> {
    if (config.mockDb) {
      const newUser: UserRecord = {
        id: `mock-user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        email: email.toLowerCase(),
        plan_tier: "free",
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_status: "inactive",
        created_at: new Date(),
        updated_at: new Date()
      };
      mockStore.users.set(newUser.id, newUser);
      return newUser;
    }

    const res = await query<UserRecord>(
      `INSERT INTO users (email, plan_tier) VALUES ($1, 'free') RETURNING *`,
      [email.toLowerCase()]
    );
    return res.rows[0];
  }

  static async findByStripeCustomerId(customerId: string): Promise<UserRecord | null> {
    if (config.mockDb) {
      for (const user of mockStore.users.values()) {
        if (user.stripe_customer_id === customerId) {
          return user;
        }
      }
      return null;
    }

    const res = await query<UserRecord>(
      `SELECT * FROM users WHERE stripe_customer_id = $1 LIMIT 1`,
      [customerId]
    );
    return res.rows[0] || null;
  }

  static async updatePlanAndSubscription(data: {
    userId: string;
    plan: PlanTier;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    status?: string | null;
  }): Promise<void> {
    if (config.mockDb) {
      const user = mockStore.users.get(data.userId);
      if (user) {
        user.plan_tier = data.plan;
        if (data.stripeCustomerId !== undefined) user.stripe_customer_id = data.stripeCustomerId;
        if (data.stripeSubscriptionId !== undefined) user.stripe_subscription_id = data.stripeSubscriptionId;
        if (data.status !== undefined) user.subscription_status = data.status;
        user.updated_at = new Date();
      }

      // Also sync to user's api keys
      for (const apiKey of mockStore.apiKeys.values()) {
        if (apiKey.user_id === data.userId) {
          if (data.stripeCustomerId !== undefined) apiKey.stripe_customer_id = data.stripeCustomerId;
          if (data.stripeSubscriptionId !== undefined) apiKey.stripe_subscription_id = data.stripeSubscriptionId;
          apiKey.updated_at = new Date();
        }
      }
      return;
    }

    await query(
      `UPDATE users
       SET plan_tier = $1,
           stripe_customer_id = COALESCE($2, stripe_customer_id),
           stripe_subscription_id = $3,
           subscription_status = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [data.plan, data.stripeCustomerId || null, data.stripeSubscriptionId || null, data.status || null, data.userId]
    );

    // Sync to api_keys table
    await query(
      `UPDATE api_keys
       SET stripe_customer_id = COALESCE($1, stripe_customer_id),
           stripe_subscription_id = $2,
           updated_at = NOW()
       WHERE user_id = $3`,
      [data.stripeCustomerId || null, data.stripeSubscriptionId || null, data.userId]
    );
  }
}

export class ApiKeyRepository {
  static async findByPrefix(prefix: string): Promise<ApiKeyRecord | null> {
    if (config.mockDb) {
      for (const record of mockStore.apiKeys.values()) {
        if (record.key_prefix === prefix && record.is_active) {
          return record;
        }
      }
      return null;
    }

    const res = await query<ApiKeyRecord>(
      `SELECT * FROM api_keys WHERE key_prefix = $1 AND is_active = TRUE LIMIT 1`,
      [prefix]
    );
    return res.rows[0] || null;
  }

  static async create(data: {
    user_id: string;
    name: string;
    key_prefix: string;
    key_hash: string;
  }): Promise<ApiKeyRecord> {
    if (config.mockDb) {
      const newKey: ApiKeyRecord = {
        id: `mock-key-${Date.now()}-${Math.random()}`,
        user_id: data.user_id,
        name: data.name,
        key_prefix: data.key_prefix,
        key_hash: data.key_hash,
        is_active: true,
        last_used_at: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      mockStore.apiKeys.set(newKey.id, newKey);
      return newKey;
    }

    const res = await query<ApiKeyRecord>(
      `INSERT INTO api_keys (user_id, name, key_prefix, key_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.user_id, data.name, data.key_prefix, data.key_hash]
    );
    return res.rows[0];
  }

  static async updateLastUsed(keyId: string): Promise<void> {
    if (config.mockDb) {
      const record = mockStore.apiKeys.get(keyId);
      if (record) {
        record.last_used_at = new Date();
      }
      return;
    }

    await query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [keyId]);
  }
}

export class UsageRepository {
  static async logUsage(data: {
    user_id: string;
    api_key_id: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
    status: string;
    duration_ms: number;
  }): Promise<UsageLogRecord> {
    if (config.mockDb) {
      const log: UsageLogRecord = {
        id: `log-${Date.now()}-${Math.random()}`,
        ...data,
        created_at: new Date()
      };
      mockStore.usageLogs.push(log);
      return log;
    }

    const res = await query<UsageLogRecord>(
      `INSERT INTO usage_logs (user_id, api_key_id, file_name, file_size_bytes, mime_type, status, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.user_id,
        data.api_key_id,
        data.file_name,
        data.file_size_bytes,
        data.mime_type,
        data.status,
        data.duration_ms
      ]
    );
    return res.rows[0];
  }

  /**
   * Returns current calendar month's successful usage count
   * Only SUCCESS status counts against quota.
   */
  static async getMonthlyUsageCount(userId: string): Promise<number> {
    if (config.mockDb) {
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth();

      return mockStore.usageLogs.filter((l) => {
        if (l.user_id !== userId || l.status !== "SUCCESS") return false;
        const logDate = l.created_at;
        return logDate.getUTCFullYear() === currentYear && logDate.getUTCMonth() === currentMonth;
      }).length;
    }

    const res = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM usage_logs
       WHERE user_id = $1
         AND status = 'SUCCESS'
         AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)`,
      [userId]
    );
    return parseInt(res.rows[0]?.count || "0", 10);
  }

  static async getTotalUsage(userId: string): Promise<number> {
    if (config.mockDb) {
      return mockStore.usageLogs.filter((l) => l.user_id === userId && l.status === "SUCCESS").length;
    }

    const res = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM usage_logs WHERE user_id = $1 AND status = 'SUCCESS'`,
      [userId]
    );
    return parseInt(res.rows[0]?.count || "0", 10);
  }

  static async getDailyUsage(userId: string, days = 30): Promise<Array<{ date: string; count: number }>> {
    if (config.mockDb) {
      const logs = mockStore.usageLogs.filter((l) => l.user_id === userId && l.status === "SUCCESS");
      const counts: Record<string, number> = {};
      logs.forEach((log) => {
        const dateStr = log.created_at.toISOString().split("T")[0];
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      });
      return Object.entries(counts).map(([date, count]) => ({ date, count }));
    }

    const res = await query<{ date: string; count: string }>(
      `SELECT to_char(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
       FROM usage_logs
       WHERE user_id = $1 AND status = 'SUCCESS' AND created_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY date
       ORDER BY date ASC`,
      [userId, days]
    );
    return res.rows.map((r: { date: string; count: string }) => ({ date: r.date, count: parseInt(r.count, 10) }));
  }
}

export class WebhookEventRepository {
  /**
   * Atomically records a webhook event ID if not already processed.
   * Returns true if event is NEW (not previously processed).
   * Returns false if duplicate.
   */
  static async recordEvent(eventId: string, eventType: string): Promise<boolean> {
    if (config.mockDb) {
      if (mockStore.processedWebhooks.has(eventId)) {
        return false;
      }
      mockStore.processedWebhooks.add(eventId);
      return true;
    }

    try {
      const res = await query(
        `INSERT INTO processed_webhook_events (id, event_type)
         VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [eventId, eventType]
      );
      return (res.rowCount ?? 0) > 0;
    } catch {
      return false;
    }
  }
}
