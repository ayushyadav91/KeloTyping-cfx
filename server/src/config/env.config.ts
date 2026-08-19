import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('*'),
  MOCK_AUTH_TOKEN: z.string().default('mock_token_xyz'),
  SESSION_TTL_MINUTES: z.coerce.number().positive().default(15),
  CLEANUP_INTERVAL_MINUTES: z.coerce.number().positive().default(5),
  MAX_TYPING_VELOCITY_CHARS_PER_50MS: z.coerce.number().positive().default(10),
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Environment schema validation failed: ${JSON.stringify(result.error.format())}`);
  }
  return result.data;
};

export const env = parseEnv();

