import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file before validating — this must run before any other module
// reads process.env, so env.ts must be the first import in server.ts.
dotenv.config();

const envSchema = z.object({
  NODE_ENV:     z.enum(['development', 'production']).default('development'),
  PORT:         z.coerce.number().int().positive().default(5000),
  MONGO_URI:    z.string().min(1, 'MONGO_URI is required'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:');
  result.error.issues.forEach(issue => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = result.data;

// Optional: augments process.env typing for the rare cases where it is used directly.
// The preferred pattern is to import `env` from this file instead.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production';
      PORT?: string;
      MONGO_URI?: string;
      FRONTEND_URL?: string;
    }
  }
}
