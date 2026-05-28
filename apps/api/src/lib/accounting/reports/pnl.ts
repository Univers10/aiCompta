import Decimal from 'decimal.js';
import type { PnLReport, PnLSection, BalanceReportRow } from '@aicompta/types';
import { prisma } from '../../db/prisma';
import { withOrg } from '../../db/tenant';

interface AccountAgg {
  code: string;
  label: string;
  debit: Decimal;
  credit: Decimal;
}

function aggregateByClass(rows: AccountAgg[], prefix: string): {
  section: PnLSection;
  total: Decimal;
} {
  const filtered = rows.filter((r) => r.code.startsWith(prefix));
  const reportRows: BalanceReportRow[] = filtered.map((r) => ({
    code: r.code,
    label: r.label,
    totalDebit: r.debit.toFixed(2),
    totalCredit: r.credit.toFixed(2),
    solde: r.credit.minus(r.debit).toFixed(2),
  }));
  let total = new Decimal(0);
  for (const r of filtered) total = total.plus(r.credit.minus(r.debit));
  return {
    section: {
      label: prefix === '6' ? 'Charges' : prefix === '7' ? 'Produits' : `Classe ${prefix}`,
      accountClass: prefix,
      rows: reportRows,
      total: total.abs().toFixed(2),
    },
    total,
  };
}

/**
 * Compte de Résultat (P&L) SYSCOHADA 2025
 * Classe 6 : Charges
 * Classe 7 : Produits
 * Résultat = Produits - Charges
 * 
 * SYSCOHADA 2025 : Seules les écritures VALIDÉES sont incluses.
 */
export async function getPnL(
  orgId: string,
  dateFrom: Date,
  dateTo: Date,
  analyticValueId?: string,
): Promise<PnLReport> {
  return withOrg(orgId, async (id) => {
    // SYSCOHADA 2025 : Seulement les écritures validées
    const lines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        accountCode: { startsWith: '6' },
        entry: { 
          date: { gte: dateFrom, lte: dateTo },
          status: 'VALIDATED', // SYSCOHADA 2025
        },
        ...(analyticValueId ? { allocations: { some: { analyticValueId } } } : {}),
      },
      select: { accountCode: true, accountLabel: true, lineType: true, amountXof: true },
    });

    const productLines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        accountCode: { startsWith: '7' },
        entry: { 
          date: { gte: dateFrom, lte: dateTo },
          status: 'VALIDATED', // SYSCOHADA 2025
        },
        ...(analyticValueId ? { allocations: { some: { analyticValueId } } } : {}),
      },
      select: { accountCode: true, accountLabel: true, lineType: true, amountXof: true },
    });

    const all = [...lines, ...productLines];
    const byAccount = new Map<string, AccountAgg>();
    for (const l of all) {
      const cur = byAccount.get(l.accountCode) ?? {
        code: l.accountCode,
        label: l.accountLabel,
        debit: new Decimal(0),
        credit: new Decimal(0),
      };
      const amt = new Decimal(l.amountXof.toString());
      if (l.lineType === 'DEBIT') cur.debit = cur.debit.plus(amt);
      else cur.credit = cur.credit.plus(amt);
      byAccount.set(l.accountCode, cur);
    }
    const rows = Array.from(byAccount.values()).sort((a, b) => a.code.localeCompare(b.code));

    const charges6 = aggregateByClass(rows, '6');
    const produits7 = aggregateByClass(rows, '7');

    // Sections financières (67 charges fin, 77 produits fin)
    const chargesFin = rows.filter((r) => r.code.startsWith('67'));
    const produitsFin = rows.filter((r) => r.code.startsWith('77'));
    const totalChargesFin = chargesFin.reduce(
      (acc, r) => acc.plus(r.debit.minus(r.credit)),
      new Decimal(0),
    );
    const totalProduitsFin = produitsFin.reduce(
      (acc, r) => acc.plus(r.credit.minus(r.debit)),
      new Decimal(0),
    );

    const resultatExploitation = produits7.total.minus(charges6.total);
    const resultatNet = resultatExploitation.plus(totalProduitsFin).minus(totalChargesFin);

    return {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      charges: [charges6.section],
      produits: [produits7.section],
      resultatExploitation: resultatExploitation.toFixed(2),
      chargesFinancieres: totalChargesFin.toFixed(2),
      produitsFinanciers: totalProduitsFin.toFixed(2),
      resultatNet: resultatNet.toFixed(2),
    };
  });
}
