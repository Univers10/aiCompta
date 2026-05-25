import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { z } from 'zod';
import { DocumentQuerySchema, ValidateDocumentSchema, RejectDocumentSchema } from '@aicompta/validators';
import { env } from '../config/env';
import { prisma } from '../lib/db/prisma';
import { withOrg } from '../lib/db/tenant';
import { uploadFile, getFileUrl, ensureBucketExists } from '../lib/storage/minio';
import { addExtractionJob } from '../lib/queue/connection';
import {
  ConflictError,
  NotFoundError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  ValidationError,
} from '../lib/errors';
import { success, paginated } from '../lib/response';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { audit } from '../lib/audit';

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/heic']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES },
});

const router = Router();

const IdParam = z.object({ id: z.string().uuid() });

router.post('/', requireAuth, requireRole('ACCOUNTANT'), upload.single('file'), async (req, res) => {
  const auth = req.auth!;
  await ensureBucketExists();
  const file = req.file;
  if (!file) throw new ValidationError('Fichier manquant');
  if (file.size > env.MAX_UPLOAD_BYTES) throw new PayloadTooLargeError();
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new UnsupportedMediaTypeError(`Type ${file.mimetype} non supporté`);
  }

  const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

  const duplicate = await withOrg(auth.organizationId, (orgId) =>
    prisma.document.findUnique({
      where: { organizationId_fileHash: { organizationId: orgId, fileHash: hash } },
    }),
  );
  if (duplicate) throw new ConflictError('Doublon détecté : ce fichier a déjà été importé');

  const fileUrl = await uploadFile(file.originalname, file.buffer, file.mimetype);

  const doc = await withOrg(auth.organizationId, (orgId) =>
    prisma.document.create({
      data: {
        organizationId: orgId,
        status: 'PENDING',
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        fileHash: hash,
        fileUrl: fileUrl,
        currency: 'XOF',
        fxRate: '1',
      },
    }),
  );

  await addExtractionJob(doc.id, auth.organizationId);
  await audit(auth.organizationId, auth.userId, {
    action: 'document.uploaded',
    targetType: 'document',
    targetId: doc.id,
    metadata: { fileName: file.originalname, size: file.size },
    req,
  });

  res.status(202).json({ data: { documentId: doc.id, status: doc.status } });
});

router.get('/', requireAuth, validateQuery(DocumentQuerySchema), async (req, res) => {
  const auth = req.auth!;
  const q = req.query as unknown as {
    page: number;
    limit: number;
    status?: string;
    type?: string;
    supplierId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };

  const where: Record<string, unknown> = { organizationId: auth.organizationId };
  if (q.status) where.status = q.status;
  if (q.type) where.type = q.type;
  if (q.supplierId) where.supplierId = q.supplierId;
  if (q.dateFrom || q.dateTo) {
    where.createdAt = {
      ...(q.dateFrom ? { gte: new Date(q.dateFrom) } : {}),
      ...(q.dateTo ? { lte: new Date(q.dateTo) } : {}),
    };
  }
  if (q.search) {
    where.OR = [
      { fileName: { contains: q.search, mode: 'insensitive' } },
      { invoiceNumber: { contains: q.search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.document.count({ where: where as object }),
    prisma.document.findMany({
      where: where as object,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: { supplier: true, customer: true },
    }),
  ]);

  paginated(res, items, { page: q.page, limit: q.limit, total });
});

router.get('/:id', requireAuth, validateParams(IdParam), async (req, res) => {
  const auth = req.auth!;
  const { id } = req.params as unknown as { id: string };
  const doc = await prisma.document.findFirst({
    where: { id, organizationId: auth.organizationId },
    include: {
      extractionAttempts: { orderBy: { createdAt: 'desc' } },
      journalEntries: { include: { lines: true } },
      supplier: true,
      customer: true,
    },
  });
  if (!doc) throw new NotFoundError('Document introuvable');
  const signedUrl = await getFileUrl(doc.fileUrl);
  success(res, { ...doc, fileUrl: signedUrl });
});

router.post(
  '/:id/validate',
  requireAuth,
  requireRole('ACCOUNTANT'),
  validateParams(IdParam),
  validateBody(ValidateDocumentSchema),
  async (req, res) => {
    const auth = req.auth!;
    const { id } = req.params as unknown as { id: string };
    const doc = await prisma.document.findFirst({
      where: { id, organizationId: auth.organizationId },
    });
    if (!doc) throw new NotFoundError('Document introuvable');
    if (doc.status !== 'NEEDS_REVIEW' && doc.status !== 'EXTRACTED') {
      throw new ValidationError(`Document non validable depuis le statut ${doc.status}`);
    }

    // Note : la génération de l'écriture finale a normalement été tentée par le worker.
    // Si l'utilisateur soumet des corrections, on les persiste et on relance une extraction logique.
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: 'POSTED',
        validatedById: auth.userId,
        validatedAt: new Date(),
        ...(req.body && (req.body as Record<string, unknown>).corrections
          ? { extractedData: (req.body as { corrections: unknown }).corrections as object }
          : {}),
      },
    });

    await audit(auth.organizationId, auth.userId, {
      action: 'document.validated',
      targetType: 'document',
      targetId: doc.id,
      req,
    });

    success(res, { id: doc.id, status: 'POSTED' });
  },
);

router.post(
  '/:id/reject',
  requireAuth,
  requireRole('ACCOUNTANT'),
  validateParams(IdParam),
  validateBody(RejectDocumentSchema),
  async (req, res) => {
    const auth = req.auth!;
    const { id } = req.params as unknown as { id: string };
    const { reason } = req.body as { reason: string };
    const doc = await prisma.document.findFirst({
      where: { id, organizationId: auth.organizationId },
    });
    if (!doc) throw new NotFoundError('Document introuvable');
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: 'REJECTED', rejectedReason: reason },
    });
    await audit(auth.organizationId, auth.userId, {
      action: 'document.rejected',
      targetType: 'document',
      targetId: doc.id,
      metadata: { reason },
      req,
    });
    success(res, { id: doc.id, status: 'REJECTED' });
  },
);

router.post(
  '/:id/reextract',
  requireAuth,
  requireRole('ACCOUNTANT'),
  validateParams(IdParam),
  async (req, res) => {
    const auth = req.auth!;
    const { id } = req.params as unknown as { id: string };
    const doc = await prisma.document.findFirst({
      where: { id, organizationId: auth.organizationId },
    });
    if (!doc) throw new NotFoundError('Document introuvable');
    await prisma.document.update({ where: { id: doc.id }, data: { status: 'PENDING' } });
    await addExtractionJob(doc.id, auth.organizationId);
    await audit(auth.organizationId, auth.userId, {
      action: 'document.reextracted',
      targetType: 'document',
      targetId: doc.id,
      req,
    });
    res.status(202).json({ data: { id: doc.id, status: 'PENDING' } });
  },
);

export default router;
