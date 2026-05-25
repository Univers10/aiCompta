import Decimal from 'decimal.js';
import type { BalanceSheetReport, BalanceReportRow } from '@aicompta/types';
import { prisma } from '../../db/prisma';
import { withOrg } from '../../db/tenant';

/**
 * Bilan simplifié SYSCOHADA : classes 1-5 ventilées en Actif / Passif selon le solde.
 * Classes 2, 3, 4 (débiteur) et 5 → Actif
 * Classes 1, 4 (créditeur) → Passif
 */
export async function getBalanceSheet(orgId: string, date: Date): Promise<BalanceSheetReport> {
  return withOrg(orgId, async (id) => {
    const lines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        entry: { date: { lte: date } },
        accountCode: { not: { startsWith: '6' } },
      },
      select: { accountCode: true, accountLabel: true, lineType: true, amountXof: true },
    });
    const productLines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        entry: { date: { lte: date } },
        accountCode: { startsWith: '7' },
      },
      select: { accountCode: true, accountLabel: true, lineType: true, amountXof: true },
    });
    // Inclure le résultat (7 - 6) côté passif/équivalent capitaux propres.

    const byAccount = new Map<string, { label: string; debit: Decimal; credit: Decimal }>();
    for (const l of [...lines, ...productLines]) {
      const cur = byAccount.get(l.accountCode) ?? {
        label: l.accountLabel,
        debit: new Decimal(0),
        credit: new Decimal(0),
      };
      const amt = new Decimal(l.amountXof.toString());
      if (l.lineType === 'DEBIT') cur.debit = cur.debit.plus(amt);
      else cur.credit = cur.credit.plus(amt);
      byAccount.set(l.accountCode, cur);
    }

    const actif: BalanceReportRow[] = [];
    const passif: BalanceReportRow[] = [];
    let totalActif = new Decimal(0);
    let totalPassif = new Decimal(0);

    for (const [code, v] of byAccount.entries()) {
      if (code.startsWith('6') || code.startsWith('7')) continue;
      const solde = v.debit.minus(v.credit);
      const row: BalanceReportRow = {
        code,
        label: v.label,
        totalDebit: v.debit.toFixed(2),
        totalCredit: v.credit.toFixed(2),
        solde: solde.abs().toFixed(2),
      };
      if (code.startsWith('2') || code.startsWith('3') || code.startsWith('5')) {
        actif.push(row);
        totalActif = totalActif.plus(solde);
      } else if (code.startsWith('1')) {
        passif.push(row);
        totalPassif = totalPassif.plus(solde.negated());
      } else if (code.startsWith('4')) {
        if (solde.isPositive()) {
          actif.push(row);
          totalActif = totalActif.plus(solde);
        } else {
          passif.push(row);
          totalPassif = totalPassif.plus(solde.negated());
        }
      }
    }

    // Résultat net = produits - charges (côté passif)
    let totalCharges = new Decimal(0);
    let totalProduits = new Decimal(0);
    const allCharges = await prisma.journalLine.findMany({
      where: { organizationId: id, accountCode: { startsWith: '6' }, entry: { date: { lte: date } } },
      select: { lineType: true, amountXof: true },
    });
    const allProduits = await prisma.journalLine.findMany({
      where: { organizationId: id, accountCode: { startsWith: '7' }, entry: { date: { lte: date } } },
      select: { lineType: true, amountXof: true },
    });
    for (const l of allCharges) {
      const amt = new Decimal(l.amountXof.toString());
      totalCharges = l.lineType === 'DEBIT' ? totalCharges.plus(amt) : totalCharges.minus(amt);
    }
    for (const l of allProduits) {
      const amt = new Decimal(l.amountXof.toString());
      totalProduits = l.lineType === 'CREDIT' ? totalProduits.plus(amt) : totalProduits.minus(amt);
    }
    const resultat = totalProduits.minus(totalCharges);
    if (!resultat.isZero()) {
      passif.push({
        code: '13',
        label: "Résultat net de l'exercice",
        totalDebit: '0.00',
        totalCredit: resultat.toFixed(2),
        solde: resultat.toFixed(2),
      });
      totalPassif = totalPassif.plus(resultat);
    }

    actif.sort((a, b) => a.code.localeCompare(b.code));
    passif.sort((a, b) => a.code.localeCompare(b.code));

    return {
      date: date.toISOString(),
      actif,
      passif,
      totalActif: totalActif.toFixed(2),
      totalPassif: totalPassif.toFixed(2),
    };
  });
}
