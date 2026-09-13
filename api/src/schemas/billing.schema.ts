import { z } from "zod";

export type PlanTier = "free" | "starter" | "pro";

export interface PlanConfig {
  name: PlanTier;
  monthlyLimit: number;
  priceMonthlyUsd: number;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    name: "free",
    monthlyLimit: 50,
    priceMonthlyUsd: 0
  },
  starter: {
    name: "starter",
    monthlyLimit: 1000,
    priceMonthlyUsd: 29
  },
  pro: {
    name: "pro",
    monthlyLimit: 10000,
    priceMonthlyUsd: 99
  }
};

export const CheckoutRequestSchema = z.object({
  plan: z.enum(["starter", "pro"], {
    errorMap: () => ({ message: "Plan must be either 'starter' or 'pro'. Free plan cannot be purchased via Checkout." })
  })
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
