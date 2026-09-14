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

export async function getOrCreateDemoSessionKey(): Promise<string> {
  const existing = getSessionKey();
  if (existing) return existing;

  try {
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const res = await fetch("http://localhost:10000/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `guest-${Date.now()}-${randomSuffix}@receiptparser.local` })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.api_key?.raw_key) {
        setSessionKey(data.api_key.raw_key);
        return data.api_key.raw_key;
      }
    }
  } catch (e) {
    console.warn("Failed to create guest demo key:", e);
  }

  return "";
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 14) return "••••••••••••••••";
  const prefix = key.substring(0, 14);
  return `${prefix}${"•".repeat(Math.max(0, key.length - 14))}`;
}
