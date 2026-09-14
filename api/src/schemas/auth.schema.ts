import { z } from "zod";

export const SignupRequestSchema = z.object({
  name: z.string().min(1, "Name is required").optional().default("User"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  confirmPassword: z.string().optional()
}).refine((data) => {
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const LoginRequestSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required")
});

export const RecoverRequestSchema = z.object({
  email: z.string().email("Please provide a valid email address")
});

export const RecoverConfirmRequestSchema = z.object({
  token: z.string().min(1, "Recovery token is required")
});
