import { Router } from 'express';
import { z } from 'zod';
import Decimal from 'decimal.js';
import { JournalEntryQuerySchema, CancelJournalEntrySchema } from '@aicompta/validators';
import { prisma } from '../lib/db/prisma';
import { NotFoundError, ValidationError } from '../lib/errors';
import { success, paginated } from '../lib/response';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { buildReversalEntry } from '../lib/accounting/journal';
import { audit } from '../lib/audit';

const router = Router();
const IdParam = z.object({ id: z.string().uuid() });

router.get('/', requireAuth, validateQuery(JournalEntryQuerySchema), async (req, res) => {
  const auth = req.auth!;
  const q = req.query as unknown as {
    page: number;
    limit: number;
    journal?: string;
    accountCode?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: string;
    amountMax?: string;
  };

  const where: Record<string, unknown> = { organizationId: auth.organizationId };
  if (q.journal) where.journal = q.journal;
  if (q.dateFrom || q.dateTo) {
    where.date = {
      ...(q.dateFrom ? { gte: new Date(q.dateFrom) } : {}),
      ...(q.dateTo ? { lte: new Date(q.dateTo) } : {}),
    };
  }
  if (q.accountCode) {
    where.lines = { some: { accountCode: q.accountCode } };
  }

  const [total, items] = await Promise.all([
    prisma.journalEntry.count({ where: where as object }),
    prisma.journalEntry.findMany({
      where: where as object,
      orderBy: { date: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: { lines: true },
    }),
  ]);

  // Filtre montant en post-filter (faible volume attendu)
  let filtered = items;
  if (q.amountMin || q.amountMax) {
    const min = q.amountMin ? new Decimal(q.amountMin) : null;
    const max = q.amountMax ? new Decimal(q.amountMax) : null;
    filtered = items.filter((entry) => {
      const debit = entry.lines
        .filter((l) => l.lineType === 'DEBIT')
        .reduce((acc, l) => acc.plus(new Decimal(l.amountXof.toString())), new Decimal(0));
      if (min && debit.lessThan(min)) return false;
      if (max && debit.greaterThan(max)) return false;
      return true;
    });
  }

  paginated(res, filtered, { page: q.page, limit: q.limit, total });
});

router.post(
  '/:id/cancel',
  requireAuth,
  requireRole('ACCOUNTANT'),
  validateParams(IdParam),
  validateBody(CancelJournalEntrySchema),
  async (req, res) => {
    const auth = req.auth!;
    const { id } = req.params as unknown as { id: string };
    const { reason } = req.body as { reason: string };

    const entry = await prisma.journalEntry.findFirst({
      where: { id, organizationId: auth.organizationId },
      include: { lines: true },
    });
    if (!entry) throw new NotFoundError('Écriture introuvable');
    if (entry.isReversal) throw new ValidationError('Une contre-passation ne peut pas être annulée');
    const already = await prisma.journalEntry.findFirst({
      where: { reversalOfId: entry.id },
    });
    if (already) throw new ValidationError('Cette écriture a déjà été annulée');

    const built = buildReversalEntry(
      {
        id: entry.id,
        reference: entry.reference,
        description: entry.description,
        journal: entry.journal,
        documentId: entry.documentId,
        lines: entry.lines.map((l) => ({
          accountCode: l.accountCode,
          accountLabel: l.accountLabel,
          lineType: l.lineType,
          amount: l.amount.toString(),
          currency: l.currency,
          fxRate: l.fxRate.toString(),
          amountXof: l.amountXof.toString(),
          description: l.description,
          supplierId: l.supplierId,
          customerId: l.customerId,
        })),
      },
      reason,
    );

    await prisma.$transaction(async (tx) => {
      await tx.journalEntry.create({
        data: {
          organizationId: auth.organizationId,
          fiscalYearId: entry.fiscalYearId,
          journal: built.journal,
          date: built.date,
          reference: built.reference,
          description: built.description,
          documentId: built.documentId,
          isReversal: true,
          reversalOfId: entry.id,
          createdById: auth.userId,
          lines: {
            create: built.lines.map((l) => ({
              organizationId: auth.organizationId,
              accountCode: l.accountCode,
              accountLabel: l.accountLabel,
              lineType: l.lineType,
              amount: l.amount,
              currency: l.currency,
              fxRate: l.fxRate,
              amountXof: l.amountXof,
              description: l.description,
              supplierId: l.supplierId ?? null,
              customerId: l.customerId ?? null,
            })),
          },
        },
      });
      if (entry.documentId) {
        await tx.document.update({
          where: { id: entry.documentId },
          data: { status: 'CANCELLED' },
        });
      }
    });

    await audit(auth.organizationId, auth.userId, {
      action: 'entry.cancelled',
      targetType: 'journalEntry',
      targetId: entry.id,
      metadata: { reason },
      req,
    });

    success(res, { ok: true });
  },
);

export default router;
