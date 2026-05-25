import { z } from 'zod';

/**
 * Schéma Zod utilisé pour le forced tool use d'Anthropic.
 * Reflet du JSON schema envoyé au LLM.
 */
export const ExtractionLineSchema = z.object({
  description: z.string(),
  accountCode: z.string().nullable().optional(),
  amountHT: z.number().nonnegative(),
  tvaRate: z.number().nonnegative(),
  amountTVA: z.number().nonnegative(),
  amountTTC: z.number().nonnegative(),
});

export const ExtractionPayloadSchema = z.object({
  supplier: z.string().nullable(),
  customer: z.string().nullable(),
  date: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  lines: z.array(ExtractionLineSchema).min(1).max(100),
  totalHT: z.number().nonnegative(),
  totalTVA: z.number().nonnegative(),
  totalTTC: z.number().nonnegative(),
  currency: z.string().length(3).default('XOF'),
});

export const EXTRACTION_TOOL_JSON_SCHEMA = {
  type: 'object',
  properties: {
    supplier: { type: ['string', 'null'], description: 'Raison sociale du fournisseur' },
    customer: { type: ['string', 'null'], description: 'Raison sociale du client' },
    date: { type: ['string', 'null'], description: 'Date de facture YYYY-MM-DD' },
    invoiceNumber: { type: ['string', 'null'], description: 'Numéro de facture' },
    lines: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          accountCode: { type: ['string', 'null'] },
          amountHT: { type: 'number', minimum: 0 },
          tvaRate: { type: 'number', minimum: 0 },
          amountTVA: { type: 'number', minimum: 0 },
          amountTTC: { type: 'number', minimum: 0 },
        },
        required: ['description', 'amountHT', 'tvaRate', 'amountTVA', 'amountTTC'],
      },
    },
    totalHT: { type: 'number', minimum: 0 },
    totalTVA: { type: 'number', minimum: 0 },
    totalTTC: { type: 'number', minimum: 0 },
    currency: { type: 'string', minLength: 3, maxLength: 3 },
  },
  required: ['supplier', 'date', 'invoiceNumber', 'lines', 'totalHT', 'totalTVA', 'totalTTC', 'currency'],
} as const;
