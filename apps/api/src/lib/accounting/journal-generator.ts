import { prisma } from '../db/prisma';
import type { InvoiceData } from '../ai/invoice-extractor';

interface JournalLineInput {
  accountCode: string;
  accountLabel: string;
  lineType: 'DEBIT' | 'CREDIT';
  amount: string;
  amountXof: string;
  description: string;
}

interface GenerateJournalInput {
  organizationId: string;
  fiscalYearId: string;
  documentId: string;
  invoiceData: InvoiceData;
  createdById: string;
}

/**
 * Génère les écritures comptables à partir des données de facture extraites
 */
export async function generateJournalEntries(input: GenerateJournalInput) {
  const { organizationId, fiscalYearId, documentId, invoiceData, createdById } = input;

  // Vérifier que les montants sont cohérents
  const totalHT = invoiceData.totalHT ?? 0;
  const totalTVA = invoiceData.totalTVA ?? 0;
  const totalTTC = invoiceData.totalTTC ?? 0;

  if (Math.abs(totalHT + totalTVA - totalTTC) > 0.01) {
    console.warn('[Journal Generator] Montants incohérents:', {
      totalHT,
      totalTVA,
      totalTTC,
      diff: totalHT + totalTVA - totalTTC,
    });
  }

  // Générer la référence de l'écriture
  const reference = invoiceData.invoiceNumber || `DOC-${documentId.slice(0, 8)}`;
  const description = `Facture ${invoiceData.supplierName || 'Fournisseur'} - ${reference}`;

  // Construire les lignes d'écriture
  const lines: JournalLineInput[] = [];

  // Ligne 1: Débit du compte de charge (601 - Achats de matières premières)
  // Note: Le compte devrait être déterminé selon la nature de l'achat
  lines.push({
    accountCode: '601',
    accountLabel: 'Achats de matières premières',
    lineType: 'DEBIT',
    amount: totalHT.toString(),
    amountXof: totalHT.toString(),
    description: description,
  });

  // Ligne 2: Débit de la TVA déductible (4452 - TVA déductible)
  if (totalTVA > 0) {
    lines.push({
      accountCode: '4452',
      accountLabel: 'TVA déductible',
      lineType: 'DEBIT',
      amount: totalTVA.toString(),
      amountXof: totalTVA.toString(),
      description: 'TVA déductible',
    });
  }

  // Ligne 3: Crédit du compte fournisseur (401 - Fournisseurs)
  lines.push({
    accountCode: '401',
    accountLabel: `Fournisseurs - ${invoiceData.supplierName || 'Divers'}`,
    lineType: 'CREDIT',
    amount: totalTTC.toString(),
    amountXof: totalTTC.toString(),
    description: `Facture ${reference}`,
  });

  // Créer l'écriture comptable
  const journalEntry = await prisma.journalEntry.create({
    data: {
      organizationId,
      fiscalYearId,
      journal: 'PURCHASE',
      date: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date(),
      reference,
      description,
      documentId,
      createdById,
      lines: {
        create: lines.map((line) => ({
          organizationId: organizationId,
          accountCode: line.accountCode,
          accountLabel: line.accountLabel,
          lineType: line.lineType,
          amount: line.amount,
          amountXof: line.amountXof,
          description: line.description,
        })),
      },
    },
    include: {
      lines: true,
    },
  });

  console.log(`[Journal Generator] Created journal entry ${journalEntry.id} with ${lines.length} lines`);

  return journalEntry;
}
