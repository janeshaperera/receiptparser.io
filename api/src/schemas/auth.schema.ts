import { z } from "zod";

export const SignupRequestSchema = z.object({
  email: z.string().email("Please provide a valid email address")
});

export const RecoverRequestSchema = z.object({
  email: z.string().email("Please provide a valid email address")
});

export const RecoverConfirmRequestSchema = z.object({
  token: z.string().min(1, "Recovery token is required")
});
