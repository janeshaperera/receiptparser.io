import { generateApiKey, GeneratedApiKey } from "../utils/crypto.js";
import { ApiKeyRepository, ApiKeyRecord } from "../db/repositories.js";

export class ApiKeyService {
  /**
   * Create an API key for a user.
   * Returns the raw key ONLY ONCE at creation.
   */
  static async createApiKey(userId: string, name = "Default Key"): Promise<{ apiKey: ApiKeyRecord; rawKey: string }> {
    const generated: GeneratedApiKey = await generateApiKey();

    const record = await ApiKeyRepository.create({
      user_id: userId,
      name,
      key_prefix: generated.prefix,
      key_hash: generated.hash
    });

    return {
      apiKey: record,
      rawKey: generated.rawKey
    };
  }
}
