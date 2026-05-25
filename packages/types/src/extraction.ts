/**
 * Types liés à l'extraction IA des pièces justificatives.
 * Tous les montants sont en string (sérialisés depuis Decimal côté API).
 */

export interface ExtractionLine {
  description: string;
  accountCode: string | null;
  amountHT: string;
  tvaRate: string;
  amountTVA: string;
  amountTTC: string;
}

export interface ExtractionResult {
  supplier: string | null;
  customer: string | null;
  date: string | null;
  invoiceNumber: string | null;
  lines: ExtractionLine[];
  totalHT: string;
  totalTVA: string;
  totalTTC: string;
  currency: string;
  confidence: number;
  rawResponse: unknown;
}

export interface IExtractor {
  /**
   * Extrait les données d'une pièce justificative.
   * @param fileBuffer Contenu binaire du document
   * @param mimeType Type MIME (application/pdf, image/jpeg, etc.)
   * @param orgId Identifiant de l'organisation (pour traçabilité)
   */
  extract(fileBuffer: Uint8Array, mimeType: string, orgId: string): Promise<ExtractionResult>;
  readonly model: string;
}

export interface ExtractionMetadata {
  promptTokens: number;
  completionTokens: number;
  costUsd: string;
  model: string;
}
