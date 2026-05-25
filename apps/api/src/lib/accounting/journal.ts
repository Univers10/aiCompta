import Decimal from 'decimal.js';
import type { ExtractionResult } from '@aicompta/types';
import { validateAmounts, validateJournalBalance, type LineType } from './validators';
import { resolveAccountForDocument, getAccountLabel } from './chart-of-accounts';

export interface BuiltLine {
  accountCode: string;
  accountLabel: string;
  lineType: LineType;
  amount: string;
  currency: string;
  fxRate: string;
  amountXof: string;
  description: string | null;
  supplierId?: string | null;
  customerId?: string | null;
}

export interface BuiltEntry {
  reference: string;
  description: string;
  date: Date;
  journal: 'PURCHASE' | 'SALES' | 'BANK' | 'MISC';
  documentId: string | null;
  lines: BuiltLine[];
}

interface DocumentContext {
  id: string;
  invoiceNumber: string | null;
  invoiceDate: Date | null;
  currency: string;
  fxRate: Decimal;
  supplierId: string | null;
  customerId: string | null;
}

function toAmountXof(amount: Decimal, fxRate: Decimal): Decimal {
  return amount.times(fxRate);
}

/**
 * Construit l'écriture comptable d'une facture d'achat.
 * Schéma SYSCOHADA :
 *   60x/62x (charges)   D HT
 *   4452 (TVA récup.)   D TVA
 *   401 (Fournisseur)   C TTC
 */
export async function buildPurchaseInvoiceEntry(
  extracted: ExtractionResult,
  doc: DocumentContext,
  orgId: string,
): Promise<BuiltEntry> {
  const ht = new Decimal(extracted.totalHT);
  const tva = new Decimal(extracted.totalTVA);
  const ttc = new Decimal(extracted.totalTTC);
  validateAmounts(ht, tva, ttc);

  const fxRate = doc.fxRate;
  const currency = doc.currency;
  const supplierLabel = extracted.supplier ?? 'Fournisseur';
  const description = `Facture ${doc.invoiceNumber ?? extracted.invoiceNumber ?? ''} — ${supplierLabel}`.trim();

  const lines: BuiltLine[] = [];

  for (const line of extracted.lines) {
    const lineHT = new Decimal(line.amountHT);
    if (lineHT.isZero()) continue;
    const accountCode =
      line.accountCode ??
      (await resolveAccountForDocument(orgId, [line.description, supplierLabel], 'PURCHASE_INVOICE'));
    const accountLabel = await getAccountLabel(orgId, accountCode);
    lines.push({
      accountCode,
      accountLabel,
      lineType: 'DEBIT',
      amount: lineHT.toFixed(4),
      currency,
      fxRate: fxRate.toString(),
      amountXof: toAmountXof(lineHT, fxRate).toFixed(4),
      description: line.description,
      supplierId: doc.supplierId,
    });
  }

  if (tva.greaterThan(0)) {
    const tvaCode = '4452';
    lines.push({
      accountCode: tvaCode,
      accountLabel: await getAccountLabel(orgId, tvaCode),
      lineType: 'DEBIT',
      amount: tva.toFixed(4),
      currency,
      fxRate: fxRate.toString(),
      amountXof: toAmountXof(tva, fxRate).toFixed(4),
      description: 'TVA récupérable',
    });
  }

  lines.push({
    accountCode: '401',
    accountLabel: await getAccountLabel(orgId, '401'),
    lineType: 'CREDIT',
    amount: ttc.toFixed(4),
    currency,
    fxRate: fxRate.toString(),
    amountXof: toAmountXof(ttc, fxRate).toFixed(4),
    description: `Dette envers ${supplierLabel}`,
    supplierId: doc.supplierId,
  });

  validateJournalBalance(
    lines.map((l) => ({ lineType: l.lineType, amount: l.amountXof })),
  );

  return {
    reference: doc.invoiceNumber ?? extracted.invoiceNumber ?? `ACH-${doc.id.slice(0, 8)}`,
    description,
    date: doc.invoiceDate ?? new Date(extracted.date ?? Date.now()),
    journal: 'PURCHASE',
    documentId: doc.id,
    lines,
  };
}

/**
 * Construit l'écriture d'une facture de vente.
 *   411 (Client)         D TTC
 *   70x (Ventes)         C HT
 *   4431 (TVA collectée) C TVA
 */
export async function buildSalesInvoiceEntry(
  extracted: ExtractionResult,
  doc: DocumentContext,
  orgId: string,
): Promise<BuiltEntry> {
  const ht = new Decimal(extracted.totalHT);
  const tva = new Decimal(extracted.totalTVA);
  const ttc = new Decimal(extracted.totalTTC);
  validateAmounts(ht, tva, ttc);

  const fxRate = doc.fxRate;
  const currency = doc.currency;
  const customerLabel = extracted.customer ?? extracted.supplier ?? 'Client';
  const description = `Facture ${doc.invoiceNumber ?? extracted.invoiceNumber ?? ''} — ${customerLabel}`.trim();

  const lines: BuiltLine[] = [
    {
      accountCode: '411',
      accountLabel: await getAccountLabel(orgId, '411'),
      lineType: 'DEBIT',
      amount: ttc.toFixed(4),
      currency,
      fxRate: fxRate.toString(),
      amountXof: toAmountXof(ttc, fxRate).toFixed(4),
      description: `Créance ${customerLabel}`,
      customerId: doc.customerId,
    },
  ];

  for (const line of extracted.lines) {
    const lineHT = new Decimal(line.amountHT);
    if (lineHT.isZero()) continue;
    const accountCode =
      line.accountCode ??
      (await resolveAccountForDocument(orgId, [line.description, customerLabel], 'SALES_INVOICE'));
    lines.push({
      accountCode,
      accountLabel: await getAccountLabel(orgId, accountCode),
      lineType: 'CREDIT',
      amount: lineHT.toFixed(4),
      currency,
      fxRate: fxRate.toString(),
      amountXof: toAmountXof(lineHT, fxRate).toFixed(4),
      description: line.description,
      customerId: doc.customerId,
    });
  }

  if (tva.greaterThan(0)) {
    lines.push({
      accountCode: '4431',
      accountLabel: await getAccountLabel(orgId, '4431'),
      lineType: 'CREDIT',
      amount: tva.toFixed(4),
      currency,
      fxRate: fxRate.toString(),
      amountXof: toAmountXof(tva, fxRate).toFixed(4),
      description: 'TVA collectée',
    });
  }

  validateJournalBalance(lines.map((l) => ({ lineType: l.lineType, amount: l.amountXof })));

  return {
    reference: doc.invoiceNumber ?? extracted.invoiceNumber ?? `VTE-${doc.id.slice(0, 8)}`,
    description,
    date: doc.invoiceDate ?? new Date(extracted.date ?? Date.now()),
    journal: 'SALES',
    documentId: doc.id,
    lines,
  };
}

/**
 * Construit l'écriture d'une note de frais.
 *   6xx (charge)          D HT
 *   4452 (TVA récup.)     D TVA
 *   571 (Caisse) ou 421   C TTC
 */
export async function buildExpenseNoteEntry(
  extracted: ExtractionResult,
  doc: DocumentContext,
  orgId: string,
): Promise<BuiltEntry> {
  const ht = new Decimal(extracted.totalHT);
  const tva = new Decimal(extracted.totalTVA);
  const ttc = new Decimal(extracted.totalTTC);
  validateAmounts(ht, tva, ttc);

  const fxRate = doc.fxRate;
  const currency = doc.currency;
  const description = `Note de frais ${doc.invoiceNumber ?? ''}`.trim();

  const lines: BuiltLine[] = [];
  for (const line of extracted.lines) {
    const lineHT = new Decimal(line.amountHT);
    if (lineHT.isZero()) continue;
    const accountCode =
      line.accountCode ??
      (await resolveAccountForDocument(orgId, [line.description], 'EXPENSE_NOTE'));
    lines.push({
      accountCode,
      accountLabel: await getAccountLabel(orgId, accountCode),
      lineType: 'DEBIT',
      amount: lineHT.toFixed(4),
      currency,
      fxRate: fxRate.toString(),
      amountXof: toAmountXof(lineHT, fxRate).toFixed(4),
      description: line.description,
    });
  }

  if (tva.greaterThan(0)) {
    lines.push({
      accountCode: '4452',
      accountLabel: await getAccountLabel(orgId, '4452'),
      lineType: 'DEBIT',
      amount: tva.toFixed(4),
      currency,
      fxRate: fxRate.toString(),
      amountXof: toAmountXof(tva, fxRate).toFixed(4),
      description: 'TVA récupérable',
    });
  }

  lines.push({
    accountCode: '571',
    accountLabel: await getAccountLabel(orgId, '571'),
    lineType: 'CREDIT',
    amount: ttc.toFixed(4),
    currency,
    fxRate: fxRate.toString(),
    amountXof: toAmountXof(ttc, fxRate).toFixed(4),
    description: 'Paiement caisse',
  });

  validateJournalBalance(lines.map((l) => ({ lineType: l.lineType, amount: l.amountXof })));

  return {
    reference: doc.invoiceNumber ?? `NDF-${doc.id.slice(0, 8)}`,
    description,
    date: doc.invoiceDate ?? new Date(extracted.date ?? Date.now()),
    journal: 'MISC',
    documentId: doc.id,
    lines,
  };
}

export interface ReversalInput {
  id: string;
  reference: string;
  description: string;
  journal: 'PURCHASE' | 'SALES' | 'BANK' | 'MISC';
  documentId: string | null;
  lines: Array<{
    accountCode: string;
    accountLabel: string;
    lineType: LineType;
    amount: string;
    currency: string;
    fxRate: string;
    amountXof: string;
    description: string | null;
    supplierId: string | null;
    customerId: string | null;
  }>;
}

/**
 * Construit une écriture de contre-passation : inverse débit/crédit de l'écriture d'origine.
 */
export function buildReversalEntry(
  original: ReversalInput,
  reason: string,
): BuiltEntry {
  const reversedLines: BuiltLine[] = original.lines.map((l) => ({
    accountCode: l.accountCode,
    accountLabel: l.accountLabel,
    lineType: l.lineType === 'DEBIT' ? 'CREDIT' : 'DEBIT',
    amount: l.amount,
    currency: l.currency,
    fxRate: l.fxRate,
    amountXof: l.amountXof,
    description: l.description ? `Contre-passation : ${l.description}` : 'Contre-passation',
    supplierId: l.supplierId,
    customerId: l.customerId,
  }));

  validateJournalBalance(
    reversedLines.map((l) => ({ lineType: l.lineType, amount: l.amountXof })),
  );

  return {
    reference: `CP-${original.reference}`,
    description: `Contre-passation de ${original.reference} : ${reason}`,
    date: new Date(),
    journal: original.journal,
    documentId: original.documentId,
    lines: reversedLines,
  };
}
