import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { ensureBucket } from './lib/storage';

async function main(): Promise<void> {
  const app = createApp();

  // Best-effort: création du bucket S3 en dev
  try {
    await ensureBucket();
  } catch (err) {
    logger.warn({ err }, 'ensureBucket() a échoué (continuer)');
  }

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, '🚀 AI Compta API démarrée');
  });
}

void main();
