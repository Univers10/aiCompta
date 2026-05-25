import { z } from 'zod';

/**
 * Schéma de validation des variables d'environnement de l'API.
 * Si `ANTHROPIC_API_KEY` est absente, l'application bascule en mode MOCK pour l'IA.
 */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL est requise'),
  REDIS_URL: z.string().min(1, 'REDIS_URL est requise'),

  R2_ENDPOINT: z.string().url('R2_ENDPOINT doit être une URL valide'),
  R2_BUCKET: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_REGION: z.string().default('auto'),
  R2_FORCE_PATH_STYLE: z
    .union([z.literal('true'), z.literal('false')])
    .default('true')
    .transform((v) => v === 'true'),

  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET doit faire au moins 32 caractères'),
  AUTH_BASE_URL: z.string().url().default('http://localhost:3001'),

  RESEND_API_KEY: z.string().optional().default(''),
  RESEND_INBOUND_SECRET: z.string().optional().default(''),
  RESEND_FROM: z.string().default('AI Compta <noreply@aicompta.app>'),

  ANTHROPIC_API_KEY: z.string().optional().default(''),
  ANTHROPIC_MODEL_EXTRACTION: z.string().default('claude-sonnet-4-5'),
  ANTHROPIC_MODEL_CLASSIFIER: z.string().default('claude-haiku-4-5'),

  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(26214400),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.85),
  AI_TOKEN_BUDGET_MONTHLY: z.coerce.number().int().positive().default(1_000_000),

  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Parse et valide les variables d'environnement.
 * En cas d'échec, log un message clair et termine le process avec le code 1.
 */
export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    // eslint-disable-next-line no-console
    console.error(`[env] Variables d'environnement invalides :\n${issues}`);
    process.exit(1);
  }
  return result.data;
}
