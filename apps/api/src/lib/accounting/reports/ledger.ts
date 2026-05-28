/**
 * Grand Livre (General Ledger) SYSCOHADA 2025
 * Détail de tous les mouvements d'un compte sur une période
 */

import Decimal from 'decimal.js';
import { prisma } from '../../db/prisma';
import { withOrg } from '../../db/tenant';

export interface LedgerLine {
  date: string;
  reference: string;
  description: string;
  debit: string;
  credit: string;
  solde: string;
  status: 'DRAFT' | 'VALIDATED' | 'REVERSED';
  journal: string;
  pieceRef?: string | null;
}

export interface LedgerReport {
  accountCode: string;
  accountLabel: string;
  dateFrom: string;
  dateTo: string;
  soldeInitial: string;
  soldeFinal: string;
  totalDebit: string;
  totalCredit: string;
  lines: LedgerLine[];
}

/**
 * Génère le grand livre pour un compte donné
 * SYSCOHADA 2025 : Seules les écritures VALIDÉES sont incluses par défaut
 */
export async function getLedger(
  orgId: string,
  accountCode: string,
  dateFrom: Date,
  dateTo: Date,
  includeDraft: boolean = false, // Option pour inclure les brouillards
): Promise<LedgerReport> {
  return withOrg(orgId, async (id) => {
    // Récupérer le compte
    const account = await prisma.chartOfAccount.findFirst({
      where: {
        organizationId: id,
        code: accountCode,
      },
    });

    if (!account) {
      throw new Error(`Compte ${accountCode} introuvable`);
    }

    // Calculer le solde initial (avant dateFrom)
    const initialLines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        accountCode,
        entry: {
          date: { lt: dateFrom },
          status: 'VALIDATED', // Toujours validées pour le solde initial
        },
      },
      select: {
        lineType: true,
        amountXof: true,
      },
    });

    let soldeInitial = new Decimal(0);
    for (const line of initialLines) {
      const amount = new Decimal(line.amountXof.toString());
      if (line.lineType === 'DEBIT') {
        soldeInitial = soldeInitial.plus(amount);
      } else {
        soldeInitial = soldeInitial.minus(amount);
      }
    }

    // Récupérer les mouvements de la période
    const statusFilter = includeDraft
      ? { in: ['DRAFT', 'VALIDATED'] }
      : 'VALIDATED';

    const lines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        accountCode,
        entry: {
          date: { gte: dateFrom, lte: dateTo },
          status: statusFilter,
        },
      },
      include: {
        entry: {
          select: {
            date: true,
            reference: true,
            description: true,
            status: true,
            journal: true,
            externalRef: true,
          },
        },
      },
      orderBy: [
        { entry: { date: 'asc' } },
        { entry: { createdAt: 'asc' } },
      ],
    });

    // Construire les lignes du grand livre
    let soldeCourant = soldeInitial;
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    const ledgerLines: LedgerLine[] = lines.map((line) => {
      const amount = new Decimal(line.amountXof.toString());
      const debit = line.lineType === 'DEBIT' ? amount : new Decimal(0);
      const credit = line.lineType === 'CREDIT' ? amount : new Decimal(0);

      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);

      soldeCourant = soldeCourant.plus(debit).minus(credit);

      return {
        date: line.entry.date.toISOString().split('T')[0],
        reference: line.entry.reference,
        description: line.entry.description,
        debit: debit.toFixed(2),
        credit: credit.toFixed(2),
        solde: soldeCourant.toFixed(2),
        status: line.entry.status as 'DRAFT' | 'VALIDATED' | 'REVERSED',
        journal: line.entry.journal,
        pieceRef: line.entry.externalRef,
      };
    });

    return {
      accountCode,
      accountLabel: account.label,
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      soldeInitial: soldeInitial.toFixed(2),
      soldeFinal: soldeCourant.toFixed(2),
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      lines: ledgerLines,
    };
  });
}

/**
 * Génère le grand livre auxiliaire pour un tiers (fournisseur ou client)
 * SYSCOHADA 2025 : Détail des mouvements d'un compte auxiliaire
 */
export async function getAuxiliaryLedger(
  orgId: string,
  accountCode: string,
  tiersId: string,
  tiersType: 'supplier' | 'customer',
  dateFrom: Date,
  dateTo: Date,
): Promise<LedgerReport> {
  return withOrg(orgId, async (id) => {
    const account = await prisma.chartOfAccount.findFirst({
      where: {
        organizationId: id,
        code: accountCode,
      },
    });

    if (!account) {
      throw new Error(`Compte ${accountCode} introuvable`);
    }

    // Filtre par tiers
    const tiersFilter =
      tiersType === 'supplier'
        ? { supplierId: tiersId }
        : { customerId: tiersId };

    // Solde initial
    const initialLines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        accountCode,
        ...tiersFilter,
        entry: {
          date: { lt: dateFrom },
          status: 'VALIDATED',
        },
      },
      select: {
        lineType: true,
        amountXof: true,
      },
    });

    let soldeInitial = new Decimal(0);
    for (const line of initialLines) {
      const amount = new Decimal(line.amountXof.toString());
      if (line.lineType === 'DEBIT') {
        soldeInitial = soldeInitial.plus(amount);
      } else {
        soldeInitial = soldeInitial.minus(amount);
      }
    }

    // Mouvements de la période
    const lines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        accountCode,
        ...tiersFilter,
        entry: {
          date: { gte: dateFrom, lte: dateTo },
          status: 'VALIDATED',
        },
      },
      include: {
        entry: {
          select: {
            date: true,
            reference: true,
            description: true,
            status: true,
            journal: true,
            externalRef: true,
          },
        },
      },
      orderBy: [
        { entry: { date: 'asc' } },
        { entry: { createdAt: 'asc' } },
      ],
    });

    let soldeCourant = soldeInitial;
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    const ledgerLines: LedgerLine[] = lines.map((line) => {
      const amount = new Decimal(line.amountXof.toString());
      const debit = line.lineType === 'DEBIT' ? amount : new Decimal(0);
      const credit = line.lineType === 'CREDIT' ? amount : new Decimal(0);

      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);

      soldeCourant = soldeCourant.plus(debit).minus(credit);

      return {
        date: line.entry.date.toISOString().split('T')[0],
        reference: line.entry.reference,
        description: line.entry.description,
        debit: debit.toFixed(2),
        credit: credit.toFixed(2),
        solde: soldeCourant.toFixed(2),
        status: line.entry.status as 'DRAFT' | 'VALIDATED' | 'REVERSED',
        journal: line.entry.journal,
        pieceRef: line.entry.externalRef,
      };
    });

    // Récupérer le nom du tiers
    let tiersLabel = '';
    if (tiersType === 'supplier') {
      const supplier = await prisma.supplier.findUnique({
        where: { id: tiersId },
      });
      tiersLabel = supplier?.name ?? 'Fournisseur inconnu';
    } else {
      const customer = await prisma.customer.findUnique({
        where: { id: tiersId },
      });
      tiersLabel = customer?.name ?? 'Client inconnu';
    }

    return {
      accountCode,
      accountLabel: `${account.label} - ${tiersLabel}`,
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      soldeInitial: soldeInitial.toFixed(2),
      soldeFinal: soldeCourant.toFixed(2),
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      lines: ledgerLines,
    };
  });
}
