import { Router } from 'express';
import {
  BalanceQuerySchema,
  PnlQuerySchema,
  BalanceSheetQuerySchema,
  GeneralLedgerQuerySchema,
} from '@aicompta/validators';
import { 
  generateBalance,
  generateGrandLivre,
  generateCompteResultat,
  generateBilan
} from '../lib/accounting/reports';
import { success } from '../lib/response';
import { validateQuery } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { exportCsv, exportXlsx } from '../lib/export';
import { prisma } from '../lib/db/prisma';

const router = Router();

router.get('/balance', requireAuth, validateQuery(BalanceQuerySchema), async (req, res) => {
  const auth = req.auth!;
  const { date, format } = req.query as unknown as {
    date: string;
    format: 'json' | 'csv' | 'xlsx';
  };
  
  // Trouver l'exercice fiscal
  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: {
      organizationId: auth.organizationId,
      startDate: { lte: new Date(date) },
      endDate: { gte: new Date(date) },
    },
  });
  
  if (!fiscalYear) {
    return res.status(404).json({ error: 'Aucun exercice fiscal trouvé pour cette date' });
  }
  
  const balance = await generateBalance(auth.organizationId, fiscalYear.id, undefined, new Date(date));
  
  // Transformer pour le frontend
  const rows = balance.map(acc => ({
    code: acc.accountCode,
    label: acc.accountLabel,
    totalDebit: acc.debit,
    totalCredit: acc.credit,
    solde: acc.balance,
  }));
  
  const totalDebit = balance.reduce((sum, acc) => sum + acc.debit, 0);
  const totalCredit = balance.reduce((sum, acc) => sum + acc.credit, 0);
  
  if (format === 'json') {
    success(res, { rows, totalDebit, totalCredit });
    return;
  }
  const columns = [
    { header: 'Code', key: 'code' },
    { header: 'Libellé', key: 'label' },
    { header: 'Débit', key: 'totalDebit' },
    { header: 'Crédit', key: 'totalCredit' },
    { header: 'Solde', key: 'solde' },
  ];
  if (format === 'csv') exportCsv(res, 'balance', columns, rows);
  else await exportXlsx(res, 'balance', 'Balance', columns, rows);
});

router.get('/pnl', requireAuth, validateQuery(PnlQuerySchema), async (req, res) => {
  const auth = req.auth!;
  const { dateFrom, dateTo, format } = req.query as unknown as {
    dateFrom: string;
    dateTo: string;
    format: 'json' | 'csv' | 'xlsx';
  };
  
  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: {
      organizationId: auth.organizationId,
      startDate: { lte: new Date(dateFrom) },
      endDate: { gte: new Date(dateTo) },
    },
  });
  
  if (!fiscalYear) {
    return res.status(404).json({ error: 'Aucun exercice fiscal trouvé' });
  }
  
  const report = await generateCompteResultat(
    auth.organizationId,
    fiscalYear.id,
    new Date(dateFrom),
    new Date(dateTo)
  );
  
  if (format === 'json') {
    success(res, report);
    return;
  }
  
  const rows = [
    ...report.charges.flatMap(group => group.rows),
    ...report.produits.flatMap(group => group.rows),
  ];
  const columns = [
    { header: 'Code', key: 'code' },
    { header: 'Libellé', key: 'label' },
    { header: 'Solde', key: 'solde' },
  ];
  if (format === 'csv') exportCsv(res, 'pnl', columns, rows);
  else await exportXlsx(res, 'pnl', 'P&L', columns, rows);
});

router.get('/balance-sheet', requireAuth, validateQuery(BalanceSheetQuerySchema), async (req, res) => {
  const auth = req.auth!;
  const { date, format } = req.query as unknown as { date: string; format: 'json' | 'csv' | 'xlsx' };
  
  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: {
      organizationId: auth.organizationId,
      startDate: { lte: new Date(date) },
      endDate: { gte: new Date(date) },
    },
  });
  
  if (!fiscalYear) {
    return res.status(404).json({ error: 'Aucun exercice fiscal trouvé' });
  }
  
  const bilanData = await generateBilan(auth.organizationId, fiscalYear.id, new Date(date));
  
  // Transform for frontend: flatten actif and passif into arrays
  const actif = [
    ...bilanData.actif.immobilise.accounts.map(acc => ({
      code: acc.accountCode,
      label: acc.accountLabel,
      solde: acc.balance,
    })),
    ...bilanData.actif.circulant.accounts.map(acc => ({
      code: acc.accountCode,
      label: acc.accountLabel,
      solde: acc.balance,
    })),
  ];
  
  const passif = [
    ...bilanData.passif.capitauxPropres.accounts.map(acc => ({
      code: acc.accountCode,
      label: acc.accountLabel,
      solde: acc.balance,
    })),
    ...bilanData.passif.dettes.accounts.map(acc => ({
      code: acc.accountCode,
      label: acc.accountLabel,
      solde: acc.balance,
    })),
  ];
  
  const report = {
    date,
    actif,
    passif,
    totalActif: bilanData.actif.total,
    totalPassif: bilanData.passif.total,
    equilibre: bilanData.equilibre,
  };
  
  if (format === 'json') {
    success(res, report);
    return;
  }
  
  const rows = [
    ...actif.map((r) => ({ section: 'Actif', ...r })),
    ...passif.map((r) => ({ section: 'Passif', ...r })),
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
    
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        organizationId: auth.organizationId,
        startDate: { lte: new Date(dateFrom) },
        endDate: { gte: new Date(dateTo) },
      },
    });
    
    if (!fiscalYear) {
      return res.status(404).json({ error: 'Aucun exercice fiscal trouvé' });
    }
    
    const report = await generateGrandLivre(
      auth.organizationId,
      fiscalYear.id,
      accountCode,
      new Date(dateFrom),
      new Date(dateTo)
    );
    
    if (format === 'json') {
      success(res, report);
      return;
    }
    
    const allMovements = report.flatMap(account => 
      account.movements.map(m => ({
        accountCode: account.accountCode,
        accountLabel: account.accountLabel,
        ...m
      }))
    );
    
    const columns = [
      { header: 'Compte', key: 'accountCode' },
      { header: 'Date', key: 'date' },
      { header: 'Pièce', key: 'reference' },
      { header: 'Libellé', key: 'description' },
      { header: 'Débit', key: 'debit' },
      { header: 'Crédit', key: 'credit' },
      { header: 'Solde', key: 'balance' },
    ];
    if (format === 'csv') exportCsv(res, `grand-livre-${accountCode}`, columns, allMovements);
    else await exportXlsx(res, `grand-livre-${accountCode}`, 'Grand Livre', columns, allMovements);
  },
);

export default router;
