import { z } from 'zod';

const isoDate = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/));

const formatParam = z.enum(['json', 'csv', 'xlsx']).default('json');

export const BalanceQuerySchema = z.object({
  date: isoDate,
  analyticValueId: z.string().uuid().optional(),
  format: formatParam,
});
export type BalanceQueryInput = z.infer<typeof BalanceQuerySchema>;

export const PnlQuerySchema = z.object({
  dateFrom: isoDate,
  dateTo: isoDate,
  analyticValueId: z.string().uuid().optional(),
  format: formatParam,
});
export type PnlQueryInput = z.infer<typeof PnlQuerySchema>;

export const BalanceSheetQuerySchema = z.object({
  date: isoDate,
  format: formatParam,
});
export type BalanceSheetQueryInput = z.infer<typeof BalanceSheetQuerySchema>;

export const GeneralLedgerQuerySchema = z.object({
  accountCode: z.string().min(1).max(20),
  dateFrom: isoDate,
  dateTo: isoDate,
  format: formatParam,
});
export type GeneralLedgerQueryInput = z.infer<typeof GeneralLedgerQuerySchema>;
