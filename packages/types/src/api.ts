/**
 * Types partagés pour la couche API REST.
 */

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface DocumentQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface JournalEntryQueryParams {
  page?: number;
  limit?: number;
  journal?: string;
  accountCode?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
}

export interface BalanceQueryParams {
  date: string;
  analyticValueId?: string;
}

export interface PnlQueryParams {
  dateFrom: string;
  dateTo: string;
  analyticValueId?: string;
}

export interface ReportFormatParam {
  format?: 'json' | 'csv' | 'xlsx';
}

export interface BalanceReportRow extends Record<string, unknown> {
  code: string;
  label: string;
  totalDebit: string;
  totalCredit: string;
  solde: string;
}

export interface BalanceReport {
  date: string;
  rows: BalanceReportRow[];
  totalDebit: string;
  totalCredit: string;
  totalSoldeDebiteur: string;
  totalSoldeCrediteur: string;
  isBalanced: boolean;
}

export interface PnLSection {
  label: string;
  accountClass: string;
  rows: BalanceReportRow[];
  total: string;
}

export interface PnLReport {
  dateFrom: string;
  dateTo: string;
  charges: PnLSection[];
  produits: PnLSection[];
  resultatExploitation: string;
  chargesFinancieres: string;
  produitsFinanciers: string;
  resultatNet: string;
}

export interface BalanceSheetReport {
  date: string;
  actif: BalanceReportRow[];
  passif: BalanceReportRow[];
  totalActif: string;
  totalPassif: string;
}

export interface GeneralLedgerMove extends Record<string, unknown> {
  date: string;
  reference: string;
  description: string;
  debit: string;
  credit: string;
  solde: string;
  documentId: string | null;
  journalEntryId: string;
}

export interface GeneralLedgerReport {
  accountCode: string;
  accountLabel: string;
  dateFrom: string;
  dateTo: string;
  soldeInitial: string;
  moves: GeneralLedgerMove[];
  soldeFinal: string;
  totalDebit: string;
  totalCredit: string;
}
