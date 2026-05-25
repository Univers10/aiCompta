/**
 * Énumérations partagées entre l'API et le frontend.
 * Les valeurs string correspondent aux enums Prisma côté DB.
 */

export const DocumentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  EXTRACTED: 'EXTRACTED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  VALIDATED: 'VALIDATED',
  POSTED: 'POSTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const DocumentType = {
  PURCHASE_INVOICE: 'PURCHASE_INVOICE',
  SALES_INVOICE: 'SALES_INVOICE',
  RECEIPT: 'RECEIPT',
  EXPENSE_NOTE: 'EXPENSE_NOTE',
  BANK_STATEMENT: 'BANK_STATEMENT',
  CREDIT_NOTE: 'CREDIT_NOTE',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const UserRole = {
  OWNER: 'OWNER',
  ACCOUNTANT: 'ACCOUNTANT',
  VIEWER: 'VIEWER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLE_LEVEL: Record<UserRole, number> = {
  VIEWER: 1,
  ACCOUNTANT: 2,
  OWNER: 3,
};

export const JournalType = {
  PURCHASE: 'PURCHASE',
  SALES: 'SALES',
  BANK: 'BANK',
  MISC: 'MISC',
} as const;
export type JournalType = (typeof JournalType)[keyof typeof JournalType];

export const LineType = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT',
} as const;
export type LineType = (typeof LineType)[keyof typeof LineType];

export const AccountType = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE',
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const ChatRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  TOOL: 'tool',
} as const;
export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];

/** Dimension analytique — string enum ouvert pour permettre des axes custom par org. */
export type AnalyticDimension = string;
