import { z } from 'zod';
import type { MiteConfig } from '../types/index.js';

const miteConfigSchema = z
  .object({
    accountName: z.string().min(1, 'Account name is required'),
    apiKey: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().optional(),
  })
  .refine(data => data.apiKey || (data.email && data.password), {
    message: 'Either API key or email/password combination is required',
  });

export function validateConfig(config: unknown): MiteConfig {
  return miteConfigSchema.parse(config);
}

export function getConfigFromEnv(): MiteConfig {
  const config = {
    accountName: process.env.MITE_ACCOUNT_NAME || '',
    apiKey: process.env.MITE_API_KEY,
    email: process.env.MITE_EMAIL,
    password: process.env.MITE_PASSWORD,
  };

  return validateConfig(config);
}
