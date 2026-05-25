import { z } from 'zod';

const isoDate = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/));
const decimalString = z.string().regex(/^-?\d+(\.\d+)?$/, 'Doit être un nombre décimal');

export const JournalEntryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  journal: z.enum(['PURCHASE', 'SALES', 'BANK', 'MISC']).optional(),
  accountCode: z.string().min(1).max(20).optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  amountMin: decimalString.optional(),
  amountMax: decimalString.optional(),
});
export type JournalEntryQueryInput = z.infer<typeof JournalEntryQuerySchema>;

export const CancelJournalEntrySchema = z.object({
  reason: z.string().min(10, 'Le motif doit faire au moins 10 caractères').max(500),
});
export type CancelJournalEntryInput = z.infer<typeof CancelJournalEntrySchema>;
