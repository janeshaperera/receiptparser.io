export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (data && typeof data === "object" && data.error) {
      throw new ApiClientError(
        data.error.code || "REQUEST_FAILED",
        data.error.message || "An unexpected error occurred",
        res.status,
        data.error.details
      );
    }
    throw new ApiClientError("REQUEST_FAILED", typeof data === "string" ? data : "Request failed", res.status);
  }

  return data as T;
}

export const api = {
  async signup(email: string) {
    const res = await fetch(`${API_BASE_URL}/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    return handleResponse<{
      user: { id: string; email: string; plan: string };
      api_key: { id: string; prefix: string; raw_key: string };
      message: string;
    }>(res);
  },

  async verifyKey(apiKey: string) {
    const res = await fetch(`${API_BASE_URL}/v1/auth/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    return handleResponse<{
      valid: boolean;
      user: { id: string; email: string; plan: string; stripe_customer_id: string | null };
      api_key: { id: string; prefix: string; created_at: string };
    }>(res);
  },

  async requestRecovery(email: string) {
    const res = await fetch(`${API_BASE_URL}/v1/auth/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async confirmRecovery(token: string) {
    const res = await fetch(`${API_BASE_URL}/v1/auth/recover/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    return handleResponse<{
      user: { id: string; email: string; plan: string };
      api_key: { id: string; prefix: string; raw_key: string };
      message: string;
    }>(res);
  },

  async getUsage(apiKey: string) {
    const res = await fetch(`${API_BASE_URL}/v1/usage`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return handleResponse<{
      user_id: string;
      plan: string;
      used: number;
      total_requests: number;
      limit: number;
      remaining: number;
      period: string;
    }>(res);
  },

  async getDailyUsage(apiKey: string) {
    const res = await fetch(`${API_BASE_URL}/v1/usage/daily`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return handleResponse<{
      user_id: string;
      plan: string;
      days: Array<{ date: string; count: number }>;
    }>(res);
  },

  async createCheckout(apiKey: string, plan: "starter" | "pro") {
    const res = await fetch(`${API_BASE_URL}/v1/billing/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ plan })
    });
    return handleResponse<{ checkout_url: string; session_id: string }>(res);
  },

  async createPortal(apiKey: string) {
    const res = await fetch(`${API_BASE_URL}/v1/billing/portal`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return handleResponse<{ portal_url: string }>(res);
  },

  async parseReceipt(apiKey: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/v1/parse`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData
    });
    return handleResponse<any>(res);
  }
};
