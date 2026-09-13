import { Request, Response, NextFunction } from "express";
import { UserRepository, ApiKeyRepository } from "../db/repositories.js";
import { ApiKeyService } from "../services/apiKey.service.js";
import { emailService } from "../services/email.service.js";
import { generateRecoveryToken, verifyRecoveryToken } from "../utils/crypto.js";
import { SignupRequestSchema, RecoverRequestSchema, RecoverConfirmRequestSchema } from "../schemas/auth.schema.js";
import { AppError } from "../schemas/receipt.schema.js";
import { config } from "../config/index.js";

export class AuthController {
  /**
   * POST /v1/auth/signup
   * Passwordless signup: accepts email, creates user & API key,
   * returns raw API key ONCE.
   */
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = SignupRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        new AppError(
          "INVALID_REQUEST",
          parsed.error.errors[0]?.message || "Invalid email address",
          400
        )
      );
    }

    const { email } = parsed.data;

    try {
      let user = await UserRepository.findByEmail(email);
      let isNewUser = false;

      if (!user) {
        user = await UserRepository.create(email);
        isNewUser = true;
      }

      // Generate API key for the user
      const { apiKey, rawKey } = await ApiKeyService.createApiKey(
        user.id,
        isNewUser ? "Initial Key" : "Dashboard Key"
      );

      // Generate recovery token and email link
      const recoveryToken = generateRecoveryToken(user.email);
      const recoveryUrl = `${config.webOrigin}/recover?token=${encodeURIComponent(recoveryToken)}`;

      // Send passwordless welcome/recovery email
      emailService.sendEmail({
        to: user.email,
        subject: "Your ReceiptParser.io Account Access & Recovery Link",
        text: `Welcome to ReceiptParser.io!

Your new API Key prefix: ${apiKey.key_prefix}
(The full key was presented in your browser and will never be shown again)

If you ever misplace your API key, you can regenerate one using your secure recovery link:
${recoveryUrl}

Documentation: ${config.webOrigin}/docs`
      }).catch((err) => {
        console.error("Failed to send welcome email:", err);
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan_tier
        },
        api_key: {
          id: apiKey.id,
          prefix: apiKey.key_prefix,
          raw_key: rawKey
        },
        message: "API key generated successfully. Save this key now; it will not be shown again."
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /v1/auth/verify
   * Validates an API key provided in the Authorization header.
   * Returns authenticated user profile and masked key info.
   */
  static async verifyKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const keyRecord = req.apiKeyRecord!;
      const user = await UserRepository.findById(userId);

      if (!user) {
        return next(new AppError("INVALID_API_KEY", "User associated with this key no longer exists", 401));
      }

      res.status(200).json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan_tier,
          stripe_customer_id: user.stripe_customer_id
        },
        api_key: {
          id: keyRecord.id,
          prefix: keyRecord.key_prefix,
          created_at: keyRecord.created_at
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /v1/auth/recover
   * Initiates passwordless account recovery via email token.
   */
  static async recover(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = RecoverRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        new AppError(
          "INVALID_REQUEST",
          parsed.error.errors[0]?.message || "Invalid email address",
          400
        )
      );
    }

    const { email } = parsed.data;

    try {
      const user = await UserRepository.findByEmail(email);

      // Always return success to prevent email enumeration
      if (user) {
        const token = generateRecoveryToken(user.email);
        const recoveryUrl = `${config.webOrigin}/recover?token=${encodeURIComponent(token)}`;

        await emailService.sendEmail({
          to: user.email,
          subject: "ReceiptParser.io - Secure Account Recovery Link",
          text: `You requested a recovery link for your ReceiptParser.io account.

Click the link below to generate a new API key and regain access to your dashboard:
${recoveryUrl}

This link is valid for 1 hour.`
        });
      }

      res.status(200).json({
        success: true,
        message: "If an account with that email exists, a recovery link has been sent."
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /v1/auth/recover/confirm
   * Confirms recovery token, generates a fresh API key, and returns it once.
   */
  static async confirmRecovery(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parsed = RecoverConfirmRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError("INVALID_REQUEST", "Recovery token is required", 400));
    }

    const verification = verifyRecoveryToken(parsed.data.token);
    if (!verification.valid || !verification.email) {
      return next(
        new AppError("INVALID_REQUEST", verification.error || "Invalid or expired recovery link", 400)
      );
    }

    try {
      const user = await UserRepository.findByEmail(verification.email);
      if (!user) {
        return next(new AppError("INVALID_REQUEST", "Account not found", 404));
      }

      // Generate a fresh key
      const { apiKey, rawKey } = await ApiKeyService.createApiKey(user.id, "Recovered Key");

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan_tier
        },
        api_key: {
          id: apiKey.id,
          prefix: apiKey.key_prefix,
          raw_key: rawKey
        },
        message: "Account recovered successfully. Please save your new API key now."
      });
    } catch (err) {
      next(err);
    }
  }
}
