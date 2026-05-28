import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { logger } from './logger';

// Configuration MinIO (compatible S3)
const minioEndpoint = `http${env.MINIO_USE_SSL === 'true' ? 's' : ''}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`;

export const s3 = new S3Client({
  region: env.MINIO_REGION,
  endpoint: minioEndpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
});

export async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.MINIO_BUCKET }));
  } catch {
    try {
      await s3.send(new CreateBucketCommand({ Bucket: env.MINIO_BUCKET }));
      logger.info({ bucket: env.MINIO_BUCKET }, 'Bucket MinIO créé');
    } catch (err) {
      logger.warn({ err, bucket: env.MINIO_BUCKET }, 'Création du bucket impossible');
    }
  }
}

export function buildObjectKey(orgId: string, fileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
  const id = crypto.randomUUID();
  return `${orgId}/${year}/${month}/${id}.${ext}`;
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await s3.send(new GetObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }));
  const stream = res.Body as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function getSignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }), {
    expiresIn: expiresInSeconds,
  });
}
