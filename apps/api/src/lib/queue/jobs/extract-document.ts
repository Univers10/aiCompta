import type { Job } from 'bullmq';
import { processDocument } from '../../extraction';
import { logger } from '../../logger';
import type { ExtractionJobData } from '../connection';

export async function processExtractionJob(job: Job<ExtractionJobData>): Promise<void> {
  const { documentId, orgId } = job.data;
  const started = Date.now();
  try {
    await processDocument(documentId, orgId);
    logger.info(
      { jobId: job.id, documentId, durationMs: Date.now() - started },
      'Extraction terminée',
    );
  } catch (err) {
    logger.error({ err, jobId: job.id, documentId }, 'Échec extraction');
    throw err;
  }
}
