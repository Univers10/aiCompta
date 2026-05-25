import { Router } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from '../lib/db/prisma';
import { buildObjectKey, uploadObject, ensureBucket } from '../lib/storage';
import { addExtractionJob } from '../lib/queue/connection';
import { logger } from '../lib/logger';

const router = Router();

function verifyResendSignature(rawBody: string, signature: string | undefined): boolean {
  if (!env.RESEND_INBOUND_SECRET || !signature) return false;
  const expected = crypto
    .createHmac('sha256', env.RESEND_INBOUND_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

interface ResendInboundPayload {
  to?: string | string[];
  from?: string;
  subject?: string;
  attachments?: Array<{
    filename: string;
    content_type?: string;
    content?: string; // base64
  }>;
}

router.post('/email-inbound', async (req, res) => {
  const raw = JSON.stringify(req.body);
  const signature = req.headers['resend-signature'] as string | undefined;
  if (env.RESEND_INBOUND_SECRET && !verifyResendSignature(raw, signature)) {
    res.status(401).json({ code: 'INVALID_SIGNATURE', message: 'Signature invalide' });
    return;
  }

  const payload = req.body as ResendInboundPayload;
  const toAddress = Array.isArray(payload.to) ? payload.to[0] : payload.to;
  const slug = toAddress?.split('@')[0]?.toLowerCase();
  if (!slug) {
    res.status(200).json({ ignored: true });
    return;
  }
  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) {
    logger.warn({ slug }, 'Organisation introuvable pour l\'email inbound');
    res.status(200).json({ ignored: true });
    return;
  }

  await ensureBucket();
  const attachments = (payload.attachments ?? []).filter((a) => {
    const ct = a.content_type ?? '';
    return ct === 'application/pdf' || ct.startsWith('image/');
  });

  for (const att of attachments) {
    if (!att.content) continue;
    const buffer = Buffer.from(att.content, 'base64');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const existing = await prisma.document.findUnique({
      where: { organizationId_fileHash: { organizationId: org.id, fileHash: hash } },
    });
    if (existing) continue;

    const key = buildObjectKey(org.id, att.filename);
    await uploadObject(key, buffer, att.content_type ?? 'application/octet-stream');

    const doc = await prisma.document.create({
      data: {
        organizationId: org.id,
        status: 'PENDING',
        fileName: att.filename,
        mimeType: att.content_type ?? 'application/octet-stream',
        fileSizeBytes: buffer.length,
        fileHash: hash,
        fileUrl: key,
        currency: 'XOF',
        fxRate: '1',
      },
    });
    await addExtractionJob(doc.id, org.id);
  }

  res.status(200).json({ ok: true });
});

export default router;
