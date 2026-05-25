export const AI_TOOLS = [
  {
    name: 'search_documents',
    description: 'Recherche des pièces justificatives (factures, reçus...) selon des critères',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['PURCHASE_INVOICE', 'SALES_INVOICE', 'RECEIPT', 'EXPENSE_NOTE', 'CREDIT_NOTE'],
        },
        supplierId: { type: 'string' },
        dateFrom: { type: 'string' },
        dateTo: { type: 'string' },
        amountMin: { type: 'number' },
        amountMax: { type: 'number' },
      },
    },
  },
  {
    name: 'search_journal_entries',
    description: 'Recherche des écritures comptables selon des critères',
    input_schema: {
      type: 'object',
      properties: {
        journal: { type: 'string', enum: ['PURCHASE', 'SALES', 'BANK', 'MISC'] },
        accountCode: { type: 'string' },
        dateFrom: { type: 'string' },
        dateTo: { type: 'string' },
        amountMin: { type: 'number' },
        amountMax: { type: 'number' },
      },
    },
  },
  {
    name: 'get_balance',
    description: 'Récupère le solde d\'un compte à une date donnée',
    input_schema: {
      type: 'object',
      properties: {
        accountCode: { type: 'string' },
        date: { type: 'string' },
      },
      required: ['accountCode', 'date'],
    },
  },
  {
    name: 'get_pnl',
    description: 'Calcule le compte de résultat sur une période',
    input_schema: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string' },
        dateTo: { type: 'string' },
      },
      required: ['dateFrom', 'dateTo'],
    },
  },
  {
    name: 'get_top',
    description: 'Top N par fournisseur / compte / dimension analytique',
    input_schema: {
      type: 'object',
      properties: {
        dimension: { type: 'string', enum: ['supplier', 'account', 'analytic'] },
        metric: { type: 'string', enum: ['amount', 'count'] },
        dateFrom: { type: 'string' },
        dateTo: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['dimension', 'metric', 'dateFrom', 'dateTo'],
    },
  },
  {
    name: 'get_trend',
    description: 'Tendance mensuelle / trimestrielle d\'une métrique',
    input_schema: {
      type: 'object',
      properties: {
        metric: { type: 'string' },
        granularity: { type: 'string', enum: ['month', 'quarter'] },
        dateFrom: { type: 'string' },
        dateTo: { type: 'string' },
      },
      required: ['metric', 'granularity', 'dateFrom', 'dateTo'],
    },
  },
  {
    name: 'compare_to_budget',
    description: 'Compare une catégorie de charges à son budget (non implémenté pour v1, retourne stub)',
    input_schema: {
      type: 'object',
      properties: {
        categoryId: { type: 'string' },
        dateFrom: { type: 'string' },
        dateTo: { type: 'string' },
      },
      required: ['categoryId', 'dateFrom', 'dateTo'],
    },
  },
  {
    name: 'forecast',
    description: 'Projection linéaire ou saisonnière d\'une métrique',
    input_schema: {
      type: 'object',
      properties: {
        metric: { type: 'string' },
        method: { type: 'string', enum: ['linear', 'seasonal'] },
        months: { type: 'number' },
      },
      required: ['metric', 'method', 'months'],
    },
  },
] as const;

export type AiToolName = (typeof AI_TOOLS)[number]['name'];
