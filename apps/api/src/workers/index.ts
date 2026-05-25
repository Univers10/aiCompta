import { Worker } from 'bullmq';
import { redisConnection, EXTRACTION_QUEUE_NAME } from '../lib/queue/connection';
import { processExtractionJob } from '../lib/queue/jobs/extract-document';
import { logger } from '../lib/logger';

const worker = new Worker(EXTRACTION_QUEUE_NAME, processExtractionJob, {
  connection: redisConnection,
  concurrency: 3,
});

worker.on('completed', (job) => {
  logger.info({ jobId: job.id, name: job.name }, 'Job terminé');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, name: job?.name, err }, 'Job échoué');
});

worker.on('error', (err) => {
  logger.error({ err }, 'Worker error');
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Arrêt du worker (graceful)');
  try {
    await worker.close();
    await redisConnection.quit();
  } catch (err) {
    logger.error({ err }, 'Erreur lors du shutdown');
  } finally {
    process.exit(0);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

logger.info({ queue: EXTRACTION_QUEUE_NAME, concurrency: 3 }, 'Worker démarré');
