import { Router } from 'express';
import {
  BalanceQuerySchema,
  PnlQuerySchema,
  BalanceSheetQuerySchema,
  GeneralLedgerQuerySchema,
} from '@aicompta/validators';
import { getBalance } from '../lib/accounting/reports/balance';
import { getPnL } from '../lib/accounting/reports/pnl';
import { getBalanceSheet } from '../lib/accounting/reports/balance-sheet';
import { getGeneralLedger } from '../lib/accounting/reports/general-ledger';
import { success } from '../lib/response';
import { validateQuery } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { exportCsv, exportXlsx } from '../lib/export';

const router = Router();

router.get('/balance', requireAuth, validateQuery(BalanceQuerySchema), async (req, res) => {
  const auth = req.auth!;
  const { date, analyticValueId, format } = req.query as unknown as {
    date: string;
    analyticValueId?: string;
    format: 'json' | 'csv' | 'xlsx';
  };
  const report = await getBalance(auth.organizationId, new Date(date), analyticValueId);
  if (format === 'json') {
    success(res, report);
    return;
  }
  const columns = [
    { header: 'Code', key: 'code' },
    { header: 'Libellé', key: 'label' },
    { header: 'Débit', key: 'totalDebit' },
    { header: 'Crédit', key: 'totalCredit' },
    { header: 'Solde', key: 'solde' },
  ];
  if (format === 'csv') exportCsv(res, 'balance', columns, report.rows);
  else await exportXlsx(res, 'balance', 'Balance', columns, report.rows);
});

router.get('/pnl', requireAuth, validateQuery(PnlQuerySchema), async (req, res) => {
  const auth = req.auth!;
  const { dateFrom, dateTo, analyticValueId, format } = req.query as unknown as {
    dateFrom: string;
    dateTo: string;
    analyticValueId?: string;
    format: 'json' | 'csv' | 'xlsx';
  };
  const report = await getPnL(
    auth.organizationId,
    new Date(dateFrom),
    new Date(dateTo),
    analyticValueId,
  );
  if (format === 'json') {
    success(res, report);
    return;
  }
  const rows = [
    ...report.charges.flatMap((s) => s.rows),
    ...report.produits.flatMap((s) => s.rows),
  ];
  const columns = [
    { header: 'Code', key: 'code' },
    { header: 'Libellé', key: 'label' },
    { header: 'Débit', key: 'totalDebit' },
    { header: 'Crédit', key: 'totalCredit' },
    { header: 'Solde', key: 'solde' },
  ];
  if (format === 'csv') exportCsv(res, 'pnl', columns, rows);
  else await exportXlsx(res, 'pnl', 'P&L', columns, rows);
});

router.get('/balance-sheet', requireAuth, validateQuery(BalanceSheetQuerySchema), async (req, res) => {
  const auth = req.auth!;
  const { date, format } = req.query as unknown as { date: string; format: 'json' | 'csv' | 'xlsx' };
  const report = await getBalanceSheet(auth.organizationId, new Date(date));
  if (format === 'json') {
    success(res, report);
    return;
  }
  const rows = [
    ...report.actif.map((r) => ({ section: 'Actif', ...r })),
    ...report.passif.map((r) => ({ section: 'Passif', ...r })),
  ];
  const columns = [
    { header: 'Section', key: 'section' },
    { header: 'Code', key: 'code' },
    { header: 'Libellé', key: 'label' },
    { header: 'Solde', key: 'solde' },
  ];
  if (format === 'csv') exportCsv(res, 'bilan', columns, rows);
  else await exportXlsx(res, 'bilan', 'Bilan', columns, rows);
});

router.get(
  '/general-ledger',
  requireAuth,
  validateQuery(GeneralLedgerQuerySchema),
  async (req, res) => {
    const auth = req.auth!;
    const { accountCode, dateFrom, dateTo, format } = req.query as unknown as {
      accountCode: string;
      dateFrom: string;
      dateTo: string;
      format: 'json' | 'csv' | 'xlsx';
    };
    const report = await getGeneralLedger(
      auth.organizationId,
      accountCode,
      new Date(dateFrom),
      new Date(dateTo),
    );
    if (format === 'json') {
      success(res, report);
      return;
    }
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Pièce', key: 'reference' },
      { header: 'Libellé', key: 'description' },
      { header: 'Débit', key: 'debit' },
      { header: 'Crédit', key: 'credit' },
      { header: 'Solde', key: 'solde' },
    ];
    if (format === 'csv') exportCsv(res, `grand-livre-${accountCode}`, columns, report.moves);
    else await exportXlsx(res, `grand-livre-${accountCode}`, 'Grand Livre', columns, report.moves);
  },
);

export default router;
