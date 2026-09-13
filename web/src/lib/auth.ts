const STORAGE_KEY = "rcpt_session_key";

export function getSessionKey(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setSessionKey(key: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, key);
}

export function clearSessionKey(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 14) return "••••••••••••••••";
  const prefix = key.substring(0, 14);
  return `${prefix}${"•".repeat(Math.max(0, key.length - 14))}`;
}
