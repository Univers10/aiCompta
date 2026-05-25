import type {
  AccountType,
  ChatRole,
  DocumentStatus,
  DocumentType,
  JournalType,
  LineType,
  UserRole,
} from './enums';

/**
 * Entités sérialisées (montants en string, dates en string ISO 8601).
 * Format échangé par l'API et consommé par le frontend.
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  createdAt: string;
}

export interface FiscalYear {
  id: string;
  organizationId: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  createdAt: string;
}

export interface ChartOfAccount {
  id: string;
  organizationId: string;
  code: string;
  label: string;
  type: AccountType;
  parentCode: string | null;
}

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

export interface AnalyticAxis {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
}

export interface AnalyticValue {
  id: string;
  analyticAxisId: string;
  organizationId: string;
  label: string;
}

export interface AnalyticAllocation {
  id: string;
  journalLineId: string;
  organizationId: string;
  analyticValueId: string;
  percentage: string;
  amountXof: string;
}

export interface Document {
  id: string;
  organizationId: string;
  status: DocumentStatus;
  type: DocumentType | null;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileHash: string;
  fileUrl: string;
  extractedData: unknown | null;
  confidence: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  supplierId: string | null;
  customerId: string | null;
  totalHT: string | null;
  totalTVA: string | null;
  totalTTC: string | null;
  currency: string;
  fxRate: string;
  validatedById: string | null;
  validatedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionAttempt {
  id: string;
  documentId: string;
  organizationId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: string;
  confidence: string;
  rawResponse: unknown;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  organizationId: string;
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
}

export interface JournalEntry {
  id: string;
  organizationId: string;
  fiscalYearId: string;
  journal: JournalType;
  date: string;
  reference: string;
  description: string;
  documentId: string | null;
  isReversal: boolean;
  reversalOfId: string | null;
  postedAt: string;
  createdById: string;
  createdAt: string;
  lines: JournalLine[];
}

export interface ChatThread {
  id: string;
  organizationId: string;
  userId: string;
  title: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  organizationId: string;
  role: ChatRole;
  content: string;
  toolCalls: unknown | null;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata: unknown | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}
