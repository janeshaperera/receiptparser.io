import { z } from "zod";

export type PlanTier = "free" | "starter" | "pro" | "business";

export interface PlanConfig {
  name: PlanTier;
  monthlyLimit: number;
  priceMonthlyUsd: number;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    name: "free",
    monthlyLimit: 20,
    priceMonthlyUsd: 0
  },
  starter: {
    name: "starter",
    monthlyLimit: 250,
    priceMonthlyUsd: 5
  },
  pro: {
    name: "pro",
    monthlyLimit: 1000,
    priceMonthlyUsd: 15
  },
  business: {
    name: "business",
    monthlyLimit: 5000,
    priceMonthlyUsd: 39
  }
};

export const CheckoutRequestSchema = z.object({
  plan: z.enum(["starter", "pro", "business"], {
    errorMap: () => ({ message: "Plan must be 'starter', 'pro', or 'business'. Free plan cannot be purchased via Checkout." })
  })
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
