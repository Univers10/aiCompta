import { parseEnv, type Env } from '@aicompta/validators';

export const env: Env = parseEnv(process.env);
export const isMockAI = env.ANTHROPIC_API_KEY.trim() === '';
export const isMockEmail = env.RESEND_API_KEY.trim() === '';
