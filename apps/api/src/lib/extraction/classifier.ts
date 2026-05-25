import type { DocumentType } from '@aicompta/types';

const HEURISTICS: Array<{ pattern: RegExp; type: DocumentType }> = [
  { pattern: /facture.*vente|invoice.*sale|vente|sales/i, type: 'SALES_INVOICE' },
  { pattern: /facture|invoice/i, type: 'PURCHASE_INVOICE' },
  { pattern: /avoir|credit.note|credit_note/i, type: 'CREDIT_NOTE' },
  { pattern: /reçu|recu|ticket|receipt/i, type: 'RECEIPT' },
  { pattern: /note.*frais|expense/i, type: 'EXPENSE_NOTE' },
  { pattern: /relevé|releve|bank.statement|statement/i, type: 'BANK_STATEMENT' },
];

/**
 * Classifie un document à partir de son nom de fichier (heuristique).
 * Le fallback Claude Haiku peut être ajouté ici si besoin (non bloquant pour MVP).
 */
export async function classifyDocument(
  fileName: string,
  _mimeType: string,
  _firstPageBuffer?: Buffer,
): Promise<DocumentType> {
  for (const { pattern, type } of HEURISTICS) {
    if (pattern.test(fileName)) return type;
  }
  return 'PURCHASE_INVOICE';
}
