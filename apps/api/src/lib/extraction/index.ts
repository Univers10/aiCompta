import Decimal from 'decimal.js';
import type { IExtractor, ExtractionResult } from '@aicompta/types';
import { isMockAI, env } from '../../config/env';
import { prisma } from '../db/prisma';
import { getObjectBuffer } from '../storage';
import { logger } from '../logger';
import { ClaudeExtractor } from './claude';
import { MockExtractor } from './mock';
import { classifyDocument } from './classifier';
import { validateAmounts, validateJournalBalance } from '../accounting/validators';
import {
  buildPurchaseInvoiceEntry,
  buildSalesInvoiceEntry,
  buildExpenseNoteEntry,
} from '../accounting/journal';

let _extractor: IExtractor | null = null;
export function getExtractor(): IExtractor {
  if (_extractor) return _extractor;
  _extractor = isMockAI ? new MockExtractor() : new ClaudeExtractor();
  logger.info({ extractor: _extractor.model, isMock: isMockAI }, 'Extracteur initialisé');
  return _extractor;
}

export async function processDocument(documentId: string, orgId: string): Promise<void> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, organizationId: orgId },
  });
  if (!doc) {
    logger.warn({ documentId, orgId }, 'Document introuvable pour extraction');
    return;
  }

  await prisma.document.update({
    where: { id: doc.id },
    data: { status: 'PROCESSING' },
  });

  const extractor = getExtractor();
  let extracted: ExtractionResult | null = null;
  let errorMessage: string | null = null;

  try {
    const buffer = await getObjectBuffer(doc.fileUrl);
    const docType = doc.type ?? (await classifyDocument(doc.fileName, doc.mimeType, buffer));
    extracted = await extractor.extract(buffer, doc.mimeType, orgId);

    const ht = new Decimal(extracted.totalHT);
    const tva = new Decimal(extracted.totalTVA);
    const ttc = new Decimal(extracted.totalTTC);
    validateAmounts(ht, tva, ttc);

    // Construit l'écriture selon le type
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        organizationId: orgId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });
    if (!fiscalYear) throw new Error("Aucun exercice fiscal actif");

    const docCtx = {
      id: doc.id,
      invoiceNumber: doc.invoiceNumber ?? extracted.invoiceNumber,
      invoiceDate: doc.invoiceDate ?? (extracted.date ? new Date(extracted.date) : null),
      currency: extracted.currency,
      fxRate: new Decimal(doc.fxRate.toString()),
      supplierId: doc.supplierId,
      customerId: doc.customerId,
    };

    let built;
    switch (docType) {
      case 'SALES_INVOICE':
        built = await buildSalesInvoiceEntry(extracted, docCtx, orgId);
        break;
      case 'EXPENSE_NOTE':
      case 'RECEIPT':
        built = await buildExpenseNoteEntry(extracted, docCtx, orgId);
        break;
      default:
        built = await buildPurchaseInvoiceEntry(extracted, docCtx, orgId);
    }

    validateJournalBalance(
      built.lines.map((l) => ({ lineType: l.lineType, amount: l.amountXof })),
    );

    const meetsThreshold = extracted.confidence >= env.AI_CONFIDENCE_THRESHOLD;
    const status = meetsThreshold ? 'EXTRACTED' : 'NEEDS_REVIEW';

    // Transaction atomique : enregistre l'attempt, met à jour le doc, persiste l'écriture si seuil OK
    await prisma.$transaction(async (tx) => {
      await tx.extractionAttempt.create({
        data: {
          documentId: doc.id,
          organizationId: orgId,
          model: extractor.model,
          promptTokens: 0,
          completionTokens: 0,
          confidence: extracted!.confidence,
          rawResponse: extracted!.rawResponse as object,
          success: true,
        },
      });
      await tx.document.update({
        where: { id: doc.id },
        data: {
          status,
          type: docType,
          extractedData: extracted as unknown as object,
          confidence: extracted!.confidence,
          invoiceNumber: extracted!.invoiceNumber,
          invoiceDate: extracted!.date ? new Date(extracted!.date) : null,
          totalHT: extracted!.totalHT,
          totalTVA: extracted!.totalTVA,
          totalTTC: extracted!.totalTTC,
          currency: extracted!.currency,
        },
      });

      if (meetsThreshold) {
        await tx.journalEntry.create({
          data: {
            organizationId: orgId,
            fiscalYearId: fiscalYear.id,
            journal: built.journal,
            date: built.date,
            reference: built.reference,
            description: built.description,
            documentId: built.documentId,
            createdById: doc.validatedById ?? (await getOrgOwnerId(tx, orgId)),
            lines: {
              create: built.lines.map((l) => ({
                organizationId: orgId,
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
        await tx.document.update({
          where: { id: doc.id },
          data: { status: 'POSTED' },
        });
      }
    });

    logger.info({ documentId: doc.id, status, confidence: extracted.confidence }, 'Document traité');
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err, documentId: doc.id }, 'Erreur extraction document');
    await prisma.$transaction(async (tx) => {
      await tx.extractionAttempt.create({
        data: {
          documentId: doc.id,
          organizationId: orgId,
          model: extractor.model,
          confidence: 0,
          rawResponse: { error: errorMessage } as object,
          success: false,
          errorMessage,
        },
      });
      await tx.document.update({
        where: { id: doc.id },
        data: { status: 'NEEDS_REVIEW' },
      });
    });
  }
}

async function getOrgOwnerId(
  tx: { membership: typeof prisma.membership },
  orgId: string,
): Promise<string> {
  const m = await tx.membership.findFirst({
    where: { organizationId: orgId, role: 'OWNER' },
  });
  if (!m) throw new Error("Aucun propriétaire trouvé pour l'organisation");
  return m.userId;
}
