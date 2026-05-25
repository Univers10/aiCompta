import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { env } from '../../config/env';

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const EXTRACTION_QUEUE_NAME = 'extraction';

export const extractionQueue = new Queue(EXTRACTION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export interface ExtractionJobData {
  documentId: string;
  orgId: string;
}

export async function addExtractionJob(documentId: string, orgId: string): Promise<void> {
  await extractionQueue.add(
    'extract',
    { documentId, orgId } satisfies ExtractionJobData,
    { jobId: `extract-${documentId}` },
  );
}
