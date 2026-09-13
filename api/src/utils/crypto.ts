import crypto from "crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const KEY_PREFIX = "rcpt_live_";
const HMAC_SECRET = process.env.RECOVERY_SECRET || "receiptparser_dev_recovery_secret_key_32bytes";

export interface GeneratedApiKey {
  rawKey: string;
  prefix: string;
  hash: string;
}

/**
 * Generate a cryptographically secure API key.
 * Format: rcpt_live_<32 hex chars>
 */
export async function generateApiKey(): Promise<GeneratedApiKey> {
  const randomBytes = crypto.randomBytes(16).toString("hex");
  const rawKey = `${KEY_PREFIX}${randomBytes}`;
  // Store prefix as first 14 chars: rcpt_live_xxxx
  const prefix = rawKey.substring(0, 14);
  const hash = await bcrypt.hash(rawKey, SALT_ROUNDS);

  return { rawKey, prefix, hash };
}

/**
 * Verify a plaintext key against a bcrypt hash
 */
export async function verifyApiKey(rawKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(rawKey, hash);
}

/**
 * Extract prefix from raw key
 */
export function extractPrefix(rawKey: string): string {
  return rawKey.substring(0, 14);
}

/**
 * Generate a secure time-limited HMAC recovery token for an email address.
 * Format: email:timestamp:signature
 */
export function generateRecoveryToken(email: string, expiresInMs = 60 * 60 * 1000): string {
  const expiresAt = Date.now() + expiresInMs;
  const payload = `${email}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");
  const token = Buffer.from(`${payload}:${hmac}`).toString("base64url");
  return token;
}

/**
 * Verify HMAC recovery token. Returns email if valid and not expired.
 */
export function verifyRecoveryToken(token: string): { valid: boolean; email?: string; error?: string } {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 3) {
      return { valid: false, error: "Invalid token format" };
    }

    const [email, expiresAtStr, receivedHmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, error: "Recovery token has expired" };
    }

    const payload = `${email}:${expiresAtStr}`;
    const expectedHmac = crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac))) {
      return { valid: true, email };
    }

    return { valid: false, error: "Invalid recovery signature" };
  } catch {
    return { valid: false, error: "Failed to decode recovery token" };
  }
}
