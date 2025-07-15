import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getConfigFromEnv, validateConfig } from '../../utils/config.js';

describe('Config validation', () => {
  describe('validateConfig', () => {
    it('should accept valid config with API key', () => {
      const config = {
        accountName: 'testaccount',
        apiKey: 'test-api-key',
      };

      const result = validateConfig(config);

      expect(result).toEqual(config);
    });

    it('should accept valid config with email and password', () => {
      const config = {
        accountName: 'testaccount',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = validateConfig(config);

      expect(result).toEqual(config);
    });

    it('should reject config without account name', () => {
      const config = {
        apiKey: 'test-api-key',
      };

      expect(() => validateConfig(config)).toThrow();
    });

    it('should reject config without authentication', () => {
      const config = {
        accountName: 'testaccount',
      };

      expect(() => validateConfig(config)).toThrow(
        'Either API key or email/password combination is required'
      );
    });

    it('should reject config with invalid email', () => {
      const config = {
        accountName: 'testaccount',
        email: 'invalid-email',
        password: 'password123',
      };

      expect(() => validateConfig(config)).toThrow();
    });

    it('should accept config with all fields', () => {
      const config = {
        accountName: 'testaccount',
        apiKey: 'test-api-key',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = validateConfig(config);

      expect(result).toEqual(config);
    });
  });

  describe('getConfigFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should read config from environment variables with API key', () => {
      process.env.MITE_ACCOUNT_NAME = 'envaccount';
      process.env.MITE_API_KEY = 'env-api-key';

      const config = getConfigFromEnv();

      expect(config).toEqual({
        accountName: 'envaccount',
        apiKey: 'env-api-key',
        email: undefined,
        password: undefined,
      });
    });

    it('should read config from environment variables with email/password', () => {
      process.env.MITE_ACCOUNT_NAME = 'envaccount';
      process.env.MITE_EMAIL = 'env@example.com';
      process.env.MITE_PASSWORD = 'env-password';

      const config = getConfigFromEnv();

      expect(config).toEqual({
        accountName: 'envaccount',
        apiKey: undefined,
        email: 'env@example.com',
        password: 'env-password',
      });
    });

    it('should throw error when required env vars are missing', () => {
      process.env.MITE_ACCOUNT_NAME = undefined;
      process.env.MITE_API_KEY = undefined;
      process.env.MITE_EMAIL = undefined;
      process.env.MITE_PASSWORD = undefined;

      expect(() => getConfigFromEnv()).toThrow();
    });
  });
});
