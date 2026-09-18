import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment configuration, validated once at boot.
 * Fail fast: if a required var is missing/invalid the process exits before
 * the server or DB connection is attempted.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  BASE_CURRENCY: z.string().length(3).default('USD'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  // CORS_ORIGIN may be a comma-separated list.
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((o) => o.trim()),
  isProd: parsed.data.NODE_ENV === 'production',
};
