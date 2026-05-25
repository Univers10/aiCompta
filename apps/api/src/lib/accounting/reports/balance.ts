import Decimal from 'decimal.js';
import type { BalanceReport, BalanceReportRow } from '@aicompta/types';
import { prisma } from '../../db/prisma';
import { withOrg } from '../../db/tenant';

/**
 * Balance générale à une date donnée.
 * Agrège les mouvements XOF par compte (Débit / Crédit / Solde).
 */
export async function getBalance(
  orgId: string,
  date: Date,
  analyticValueId?: string,
): Promise<BalanceReport> {
  return withOrg(orgId, async (id) => {
    const lines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        entry: { date: { lte: date } },
        ...(analyticValueId
          ? { allocations: { some: { analyticValueId } } }
          : {}),
      },
      select: {
        accountCode: true,
        accountLabel: true,
        lineType: true,
        amountXof: true,
      },
    });

    const byAccount = new Map<string, { label: string; debit: Decimal; credit: Decimal }>();
    for (const line of lines) {
      const existing = byAccount.get(line.accountCode) ?? {
        label: line.accountLabel,
        debit: new Decimal(0),
        credit: new Decimal(0),
      };
      const amount = new Decimal(line.amountXof.toString());
      if (line.lineType === 'DEBIT') existing.debit = existing.debit.plus(amount);
      else existing.credit = existing.credit.plus(amount);
      byAccount.set(line.accountCode, existing);
    }

    const rows: BalanceReportRow[] = Array.from(byAccount.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, v]) => ({
        code,
        label: v.label,
        totalDebit: v.debit.toFixed(2),
        totalCredit: v.credit.toFixed(2),
        solde: v.debit.minus(v.credit).toFixed(2),
      }));

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);
    for (const r of rows) {
      totalDebit = totalDebit.plus(r.totalDebit);
      totalCredit = totalCredit.plus(r.totalCredit);
    }

    return {
      date: date.toISOString(),
      rows,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
    };
  });
}
