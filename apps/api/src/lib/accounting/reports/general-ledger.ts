import Decimal from 'decimal.js';
import type { GeneralLedgerReport, GeneralLedgerMove } from '@aicompta/types';
import { prisma } from '../../db/prisma';
import { withOrg } from '../../db/tenant';
import { getAccountByCode } from '../chart-of-accounts';
import { NotFoundError } from '../../errors';

export async function getGeneralLedger(
  orgId: string,
  accountCode: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<GeneralLedgerReport> {
  return withOrg(orgId, async (id) => {
    const account = await getAccountByCode(id, accountCode);
    if (!account) throw new NotFoundError(`Compte ${accountCode} introuvable`);

    // Solde initial = somme des mouvements avant dateFrom
    const initialLines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        accountCode,
        entry: { date: { lt: dateFrom } },
      },
      select: { lineType: true, amountXof: true },
    });
    let solde = new Decimal(0);
    for (const l of initialLines) {
      const amt = new Decimal(l.amountXof.toString());
      solde = l.lineType === 'DEBIT' ? solde.plus(amt) : solde.minus(amt);
    }
    const soldeInitial = solde;

    const lines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        accountCode,
        entry: { date: { gte: dateFrom, lte: dateTo } },
      },
      include: { entry: true },
      orderBy: { entry: { date: 'asc' } },
    });

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);
    const moves: GeneralLedgerMove[] = lines.map((l) => {
      const amt = new Decimal(l.amountXof.toString());
      if (l.lineType === 'DEBIT') {
        solde = solde.plus(amt);
        totalDebit = totalDebit.plus(amt);
      } else {
        solde = solde.minus(amt);
        totalCredit = totalCredit.plus(amt);
      }
      return {
        date: l.entry.date.toISOString(),
        reference: l.entry.reference,
        description: l.description ?? l.entry.description,
        debit: l.lineType === 'DEBIT' ? amt.toFixed(2) : '0.00',
        credit: l.lineType === 'CREDIT' ? amt.toFixed(2) : '0.00',
        solde: solde.toFixed(2),
        documentId: l.entry.documentId,
        journalEntryId: l.entry.id,
      };
    });

    return {
      accountCode,
      accountLabel: account.label,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      soldeInitial: soldeInitial.toFixed(2),
      moves,
      soldeFinal: solde.toFixed(2),
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
    };
  });
}
