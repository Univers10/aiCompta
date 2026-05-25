import { Client } from 'minio';
import { env } from '../../config/env';

export const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(env.MINIO_PORT || '9000'),
  useSSL: env.MINIO_USE_SSL === 'true',
  accessKey: env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: env.MINIO_SECRET_KEY || 'minioadmin',
});

export const BUCKET_NAME = env.MINIO_BUCKET || 'aicompta-documents';

export async function ensureBucketExists(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
    console.log(`✅ Bucket ${BUCKET_NAME} created`);
  }
}

export async function uploadFile(
  fileName: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  await ensureBucketExists();
  
  const objectName = `${Date.now()}-${fileName}`;
  
  await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
    'Content-Type': mimeType,
  });
  
  return objectName;
}

export async function getFileUrl(objectName: string): Promise<string> {
  return await minioClient.presignedGetObject(BUCKET_NAME, objectName, 24 * 60 * 60);
}

export async function deleteFile(objectName: string): Promise<void> {
  await minioClient.removeObject(BUCKET_NAME, objectName);
}
