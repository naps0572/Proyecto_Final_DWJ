import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  SERVICE_BOT_API_KEY: z.string().min(16).optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().optional(),
  JSON_BODY_LIMIT: z.string().default('100kb'),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true')
});

const parsedEnv = envSchema.parse(process.env);

const configuredOrigins = parsedEnv.CORS_ORIGINS
  ? parsedEnv.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [parsedEnv.FRONTEND_URL];

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  isProduction: parsedEnv.NODE_ENV === 'production',
  port: parsedEnv.PORT,
  jwtSecret: parsedEnv.JWT_SECRET,
  serviceBotApiKey: parsedEnv.SERVICE_BOT_API_KEY,
  frontendUrl: parsedEnv.FRONTEND_URL,
  corsOrigins: configuredOrigins,
  jsonBodyLimit: parsedEnv.JSON_BODY_LIMIT,
  trustProxy: parsedEnv.TRUST_PROXY
};
