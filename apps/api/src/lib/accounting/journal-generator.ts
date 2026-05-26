import { prisma } from '../db/prisma';
import type { InvoiceData } from '../ai/invoice-extractor';

interface JournalLineInput {
  accountCode: string;
  accountLabel: string;
  lineType: 'DEBIT' | 'CREDIT';
  amount: string;
  amountXof: string;
  description: string;
  supplierId?: string | null;
  customerId?: string | null;
}

interface GenerateJournalInput {
  organizationId: string;
  fiscalYearId: string;
  documentId: string;
  invoiceData: InvoiceData;
  createdById: string;
  supplierId?: string | null;
  customerId?: string | null;
}

/**
 * Génère les écritures comptables à partir des données de facture extraites
 */
export async function generateJournalEntries(input: GenerateJournalInput) {
  const { organizationId, fiscalYearId, documentId, invoiceData, createdById, supplierId, customerId } = input;

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

  // Si la facture a des lignes détaillées, les utiliser
  if (invoiceData.items && invoiceData.items.length > 0) {
    console.log(`[Journal Generator] Processing ${invoiceData.items.length} invoice items`);
    
    // Pour chaque ligne de facture : Débit du compte de charge
    invoiceData.items.forEach((item, index) => {
      lines.push({
        accountCode: '601', // TODO: Déterminer le compte selon la nature
        accountLabel: 'Achats de matières premières',
        lineType: 'DEBIT',
        amount: item.totalHT.toString(),
        amountXof: item.totalHT.toString(),
        description: `${item.description} (Qté: ${item.quantity} x ${item.unitPrice})`,
        supplierId: supplierId, // Lier au fournisseur
      });

      // TVA pour cette ligne
      if (item.tvaAmount > 0) {
        lines.push({
          accountCode: '4452',
          accountLabel: 'TVA déductible',
          lineType: 'DEBIT',
          amount: item.tvaAmount.toString(),
          amountXof: item.tvaAmount.toString(),
          description: `TVA ${item.tvaRate}% - ${item.description}`,
          supplierId: supplierId, // Lier au fournisseur
        });
      }
    });
  } else {
    // Fallback : une seule ligne agrégée
    console.log('[Journal Generator] No items found, using aggregated amounts');
    
    lines.push({
      accountCode: '601',
      accountLabel: 'Achats de matières premières',
      lineType: 'DEBIT',
      amount: totalHT.toString(),
      amountXof: totalHT.toString(),
      description: description,
      supplierId: supplierId, // Lier au fournisseur
    });

    if (totalTVA > 0) {
      lines.push({
        accountCode: '4452',
        accountLabel: 'TVA déductible',
        lineType: 'DEBIT',
        amount: totalTVA.toString(),
        amountXof: totalTVA.toString(),
        description: 'TVA déductible',
        supplierId: supplierId, // Lier au fournisseur
      });
    }
  }

  // Ligne de crédit : Compte fournisseur (401)
  lines.push({
    accountCode: '401',
    accountLabel: `Fournisseurs - ${invoiceData.supplierName || 'Divers'}`,
    lineType: 'CREDIT',
    amount: totalTTC.toString(),
    amountXof: totalTTC.toString(),
    description: `Facture ${reference}`,
    supplierId: supplierId, // Lier au fournisseur
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
