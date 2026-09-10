import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('*'),

  // Database
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  // Auth
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Typing engine
  SESSION_TTL_MINUTES: z.coerce.number().positive().default(15),
  CLEANUP_INTERVAL_MINUTES: z.coerce.number().positive().default(5),
  MAX_TYPING_VELOCITY_CHARS_PER_50MS: z.coerce.number().positive().default(10),

  // Multiplayer rooms
  ROOM_MAX_PLAYERS: z.coerce.number().int().positive().default(6),
  ROOM_COUNTDOWN_SECONDS: z.coerce.number().int().positive().default(3),
  ROOM_IDLE_TTL_MINUTES: z.coerce.number().positive().default(20),
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
