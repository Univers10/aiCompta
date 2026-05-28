/**
 * Énumérations partagées entre l'API et le frontend.
 * Les valeurs string correspondent aux enums Prisma côté DB.
 * SYSCOHADA 2025 - Conformité complète
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
  CASH_RECEIPT: 'CASH_RECEIPT',
  PAYMENT_ORDER: 'PAYMENT_ORDER',
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

// Journaux SYSCOHADA 2025
export const JournalType = {
  PURCHASE: 'PURCHASE', // AC - Journal des Achats
  SALES: 'SALES',       // VE - Journal des Ventes
  BANK: 'BANK',         // BQ - Journal de Banque
  CASH: 'CASH',         // CA - Journal de Caisse (nouveau)
  MISC: 'MISC',         // OD - Journal des Opérations Diverses
} as const;
export type JournalType = (typeof JournalType)[keyof typeof JournalType];

// Préfixes de numérotation par journal
export const JOURNAL_PREFIX: Record<JournalType, string> = {
  PURCHASE: 'ACH',
  SALES: 'VTE',
  BANK: 'BQ',
  CASH: 'CA',
  MISC: 'OD',
};

// Labels des journaux
export const JOURNAL_LABEL: Record<JournalType, string> = {
  PURCHASE: 'Journal des Achats',
  SALES: 'Journal des Ventes',
  BANK: 'Journal de Banque',
  CASH: 'Journal de Caisse',
  MISC: 'Journal des Opérations Diverses',
};

export const LineType = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT',
} as const;
export type LineType = (typeof LineType)[keyof typeof LineType];

// Classification SYSCOHADA (Classes 1-8)
export const AccountClass = {
  CLASS_1: 'CLASS_1', // Comptes de ressources durables
  CLASS_2: 'CLASS_2', // Comptes d'actif immobilisé
  CLASS_3: 'CLASS_3', // Comptes de stocks
  CLASS_4: 'CLASS_4', // Comptes de tiers
  CLASS_5: 'CLASS_5', // Comptes de trésorerie
  CLASS_6: 'CLASS_6', // Comptes de charges
  CLASS_7: 'CLASS_7', // Comptes de produits
  CLASS_8: 'CLASS_8', // Comptes HAO
} as const;
export type AccountClass = (typeof AccountClass)[keyof typeof AccountClass];

// Labels des classes SYSCOHADA
export const ACCOUNT_CLASS_LABEL: Record<AccountClass, string> = {
  CLASS_1: 'Comptes de ressources durables',
  CLASS_2: 'Comptes d\'actif immobilisé',
  CLASS_3: 'Comptes de stocks',
  CLASS_4: 'Comptes de tiers',
  CLASS_5: 'Comptes de trésorerie',
  CLASS_6: 'Comptes de charges',
  CLASS_7: 'Comptes de produits',
  CLASS_8: 'Comptes HAO',
};

// Déprécié - Gardé pour compatibilité, à migrer vers AccountClass
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

// Statut des écritures SYSCOHADA
export const EntryStatus = {
  DRAFT: 'DRAFT',         // Brouillard (provisoire, modifiable)
  VALIDATED: 'VALIDATED', // Validée (définitive, immuable)
  REVERSED: 'REVERSED',   // Extournée (annulée par contrepassation)
} as const;
export type EntryStatus = (typeof EntryStatus)[keyof typeof EntryStatus];

// Labels des statuts d'écriture
export const ENTRY_STATUS_LABEL: Record<EntryStatus, string> = {
  DRAFT: 'Brouillard',
  VALIDATED: 'Validée',
  REVERSED: 'Extournée',
};

// Statut des périodes comptables
export const PeriodStatus = {
  OPEN: 'OPEN',         // Ouverte (écritures autorisées)
  CLOSED: 'CLOSED',     // Clôturée (écritures interdites)
  ARCHIVED: 'ARCHIVED', // Archivée (exercice clos définitivement)
} as const;
export type PeriodStatus = (typeof PeriodStatus)[keyof typeof PeriodStatus];

// Labels des statuts de période
export const PERIOD_STATUS_LABEL: Record<PeriodStatus, string> = {
  OPEN: 'Ouverte',
  CLOSED: 'Clôturée',
  ARCHIVED: 'Archivée',
};

/** Dimension analytique — string enum ouvert pour permettre des axes custom par org. */
export type AnalyticDimension = string;

// Devises supportées (SYSCOHADA)
export const Currency = {
  XOF: 'XOF', // Franc CFA (UEMOA)
  XAF: 'XAF', // Franc CFA (CEMAC)
  EUR: 'EUR', // Euro
  USD: 'USD', // Dollar américain
  GBP: 'GBP', // Livre sterling
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];

// Labels des devises
export const CURRENCY_LABEL: Record<Currency, string> = {
  XOF: 'Franc CFA (UEMOA)',
  XAF: 'Franc CFA (CEMAC)',
  EUR: 'Euro',
  USD: 'Dollar américain',
  GBP: 'Livre sterling',
};
