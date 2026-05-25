import { z } from 'zod';

const isoDate = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/));

export const DocumentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      'PENDING',
      'PROCESSING',
      'EXTRACTED',
      'NEEDS_REVIEW',
      'VALIDATED',
      'POSTED',
      'REJECTED',
      'CANCELLED',
    ])
    .optional(),
  type: z
    .enum([
      'PURCHASE_INVOICE',
      'SALES_INVOICE',
      'RECEIPT',
      'EXPENSE_NOTE',
      'BANK_STATEMENT',
      'CREDIT_NOTE',
    ])
    .optional(),
  supplierId: z.string().uuid().optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  search: z.string().min(1).max(200).optional(),
});
export type DocumentQueryInput = z.infer<typeof DocumentQuerySchema>;

const decimalString = z.string().regex(/^-?\d+(\.\d+)?$/, 'Doit être un nombre décimal');

const ExtractionLineCorrectionSchema = z.object({
  description: z.string().min(1),
  accountCode: z.string().nullable(),
  amountHT: decimalString,
  tvaRate: decimalString,
  amountTVA: decimalString,
  amountTTC: decimalString,
});

const ExtractionCorrectionSchema = z
  .object({
    supplier: z.string().nullable(),
    customer: z.string().nullable(),
    date: isoDate.nullable(),
    invoiceNumber: z.string().nullable(),
    lines: z.array(ExtractionLineCorrectionSchema).min(1).max(50),
    totalHT: decimalString,
    totalTVA: decimalString,
    totalTTC: decimalString,
    currency: z.string().length(3),
  })
  .partial();

export const ValidateDocumentSchema = z.object({
  corrections: ExtractionCorrectionSchema.optional(),
});
export type ValidateDocumentInput = z.infer<typeof ValidateDocumentSchema>;

export const RejectDocumentSchema = z.object({
  reason: z.string().min(10, 'Le motif doit faire au moins 10 caractères').max(500),
});
export type RejectDocumentInput = z.infer<typeof RejectDocumentSchema>;
