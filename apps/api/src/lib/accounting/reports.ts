import { prisma } from '../db/prisma';
import { Prisma } from '@prisma/client';

/**
 * Balance : Liste de tous les comptes avec leurs soldes
 */
export async function generateBalance(
  organizationId: string,
  fiscalYearId: string,
  startDate?: Date,
  endDate?: Date
) {
  const whereClause: Prisma.JournalLineWhereInput = {
    organizationId,
    entry: {
      fiscalYearId,
      ...(startDate && endDate
        ? { date: { gte: startDate, lte: endDate } }
        : {}),
    },
  };

  const lines = await prisma.journalLine.findMany({
    where: whereClause,
    include: {
      entry: true,
      supplier: true,
      customer: true,
    },
    orderBy: {
      accountCode: 'asc',
    },
  });

  // Agréger par compte + fournisseur/client
  const accountMap = new Map<string, {
    accountCode: string;
    accountLabel: string;
    debit: number;
    credit: number;
    balance: number;
    supplierId?: string | null;
    customerId?: string | null;
    thirdPartyName?: string;
  }>();

  lines.forEach((line) => {
    // Créer une clé unique : compte + fournisseur/client
    const thirdPartyId = line.supplierId || line.customerId || 'none';
    const key = `${line.accountCode}-${thirdPartyId}`;
    
    // Nom du tiers (fournisseur ou client)
    const thirdPartyName = line.supplier?.name || line.customer?.name;
    
    // Construire le libellé avec le nom du tiers si disponible
    let label = line.accountLabel;
    if (thirdPartyName) {
      // Enlever l'ancien nom du tiers s'il existe déjà dans le libellé
      const baseLabel = label.split(' - ')[0];
      label = `${baseLabel} - ${thirdPartyName}`;
    }
    
    const existing = accountMap.get(key) || {
      accountCode: line.accountCode,
      accountLabel: label,
      debit: 0,
      credit: 0,
      balance: 0,
      supplierId: line.supplierId,
      customerId: line.customerId,
      thirdPartyName,
    };

    const amount = parseFloat(line.amountXof.toString());
    
    if (line.lineType === 'DEBIT') {
      existing.debit += amount;
    } else {
      existing.credit += amount;
    }
    
    existing.balance = existing.debit - existing.credit;
    accountMap.set(key, existing);
  });

  return Array.from(accountMap.values()).sort((a, b) => {
    const codeCompare = a.accountCode.localeCompare(b.accountCode);
    if (codeCompare !== 0) return codeCompare;
    // Si même compte, trier par nom du tiers
    return (a.thirdPartyName || '').localeCompare(b.thirdPartyName || '');
  });
}

/**
 * Grand Livre : Détail de tous les mouvements par compte
 */
export async function generateGrandLivre(
  organizationId: string,
  fiscalYearId: string,
  accountCode?: string,
  startDate?: Date,
  endDate?: Date
) {
  const whereClause: Prisma.JournalLineWhereInput = {
    organizationId,
    entry: {
      fiscalYearId,
      ...(startDate && endDate
        ? { date: { gte: startDate, lte: endDate } }
        : {}),
    },
    ...(accountCode ? { accountCode } : {}),
  };

  const lines = await prisma.journalLine.findMany({
    where: whereClause,
    include: {
      entry: {
        select: {
          id: true,
          date: true,
          reference: true,
          description: true,
          journal: true,
        },
      },
    },
    orderBy: [
      { accountCode: 'asc' },
      { entry: { date: 'asc' } },
    ],
  });

  // Grouper par compte
  const accountGroups = new Map<string, typeof lines>();
  
  lines.forEach((line) => {
    const existing = accountGroups.get(line.accountCode) || [];
    existing.push(line);
    accountGroups.set(line.accountCode, existing);
  });

  // Calculer les soldes cumulés
  const result = Array.from(accountGroups.entries()).map(([code, accountLines]) => {
    let cumulativeBalance = 0;
    
    const movements = accountLines.map((line) => {
      const amount = parseFloat(line.amountXof.toString());
      const debit = line.lineType === 'DEBIT' ? amount : 0;
      const credit = line.lineType === 'CREDIT' ? amount : 0;
      cumulativeBalance += debit - credit;

      return {
        date: line.entry.date,
        reference: line.entry.reference,
        description: line.description || line.entry.description,
        journal: line.entry.journal,
        debit,
        credit,
        balance: cumulativeBalance,
      };
    });

    return {
      accountCode: code,
      accountLabel: accountLines[0]?.accountLabel || '',
      movements,
      totalDebit: movements.reduce((sum, m) => sum + m.debit, 0),
      totalCredit: movements.reduce((sum, m) => sum + m.credit, 0),
      finalBalance: cumulativeBalance,
    };
  });

  return result;
}

/**
 * Compte de Résultat : Produits - Charges = Résultat
 */
export async function generateCompteResultat(
  organizationId: string,
  fiscalYearId: string,
  startDate?: Date,
  endDate?: Date
) {
  const balance = await generateBalance(organizationId, fiscalYearId, startDate, endDate);

  // Classe 6 : Charges (groupées par sous-classe)
  const chargesAccounts = balance.filter((account) => account.accountCode.startsWith('6'));
  const chargesGroups = [
    {
      label: 'Achats',
      accountClass: '60',
      rows: chargesAccounts
        .filter(acc => acc.accountCode.startsWith('60'))
        .map(acc => ({
          code: acc.accountCode,
          label: acc.accountLabel,
          solde: Math.abs(acc.balance),
        })),
      total: chargesAccounts
        .filter(acc => acc.accountCode.startsWith('60'))
        .reduce((sum, acc) => sum + Math.abs(acc.balance), 0),
    },
    {
      label: 'Services extérieurs',
      accountClass: '61-62',
      rows: chargesAccounts
        .filter(acc => acc.accountCode.startsWith('61') || acc.accountCode.startsWith('62'))
        .map(acc => ({
          code: acc.accountCode,
          label: acc.accountLabel,
          solde: Math.abs(acc.balance),
        })),
      total: chargesAccounts
        .filter(acc => acc.accountCode.startsWith('61') || acc.accountCode.startsWith('62'))
        .reduce((sum, acc) => sum + Math.abs(acc.balance), 0),
    },
    {
      label: 'Autres charges',
      accountClass: '63-69',
      rows: chargesAccounts
        .filter(acc => !acc.accountCode.startsWith('60') && !acc.accountCode.startsWith('61') && !acc.accountCode.startsWith('62'))
        .map(acc => ({
          code: acc.accountCode,
          label: acc.accountLabel,
          solde: Math.abs(acc.balance),
        })),
      total: chargesAccounts
        .filter(acc => !acc.accountCode.startsWith('60') && !acc.accountCode.startsWith('61') && !acc.accountCode.startsWith('62'))
        .reduce((sum, acc) => sum + Math.abs(acc.balance), 0),
    },
  ].filter(group => group.rows.length > 0);

  const totalCharges = chargesAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

  // Classe 7 : Produits (groupées par sous-classe)
  const produitsAccounts = balance.filter((account) => account.accountCode.startsWith('7'));
  const produitsGroups = [
    {
      label: 'Ventes',
      accountClass: '70',
      rows: produitsAccounts
        .filter(acc => acc.accountCode.startsWith('70'))
        .map(acc => ({
          code: acc.accountCode,
          label: acc.accountLabel,
          solde: Math.abs(acc.balance),
        })),
      total: produitsAccounts
        .filter(acc => acc.accountCode.startsWith('70'))
        .reduce((sum, acc) => sum + Math.abs(acc.balance), 0),
    },
    {
      label: 'Autres produits',
      accountClass: '71-79',
      rows: produitsAccounts
        .filter(acc => !acc.accountCode.startsWith('70'))
        .map(acc => ({
          code: acc.accountCode,
          label: acc.accountLabel,
          solde: Math.abs(acc.balance),
        })),
      total: produitsAccounts
        .filter(acc => !acc.accountCode.startsWith('70'))
        .reduce((sum, acc) => sum + Math.abs(acc.balance), 0),
    },
  ].filter(group => group.rows.length > 0);

  const totalProduits = produitsAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

  // Résultat
  const resultat = totalProduits - totalCharges;

  return {
    charges: chargesGroups,
    produits: produitsGroups,
    totalCharges,
    totalProduits,
    resultat,
    resultatType: resultat >= 0 ? 'BENEFICE' : 'PERTE',
  };
}

/**
 * Bilan : Actif = Passif
 */
export async function generateBilan(
  organizationId: string,
  fiscalYearId: string,
  endDate?: Date
) {
  const balance = await generateBalance(organizationId, fiscalYearId, undefined, endDate);

  // Actif : Classe 1 à 5 (soldes débiteurs)
  const actifImmobilise = balance.filter((acc) => acc.accountCode.startsWith('2'));
  const actifCirculant = balance.filter((acc) => 
    acc.accountCode.startsWith('3') || 
    acc.accountCode.startsWith('4') || 
    acc.accountCode.startsWith('5')
  );

  const totalActifImmobilise = actifImmobilise.reduce((sum, acc) => sum + Math.max(0, acc.balance), 0);
  const totalActifCirculant = actifCirculant.reduce((sum, acc) => sum + Math.max(0, acc.balance), 0);
  const totalActif = totalActifImmobilise + totalActifCirculant;

  // Passif : Classe 1 (capitaux propres) et dettes
  const capitauxPropres = balance.filter((acc) => acc.accountCode.startsWith('1'));
  const dettes = balance.filter((acc) => 
    acc.accountCode.startsWith('4') && parseFloat(acc.accountCode) >= 40
  );

  const totalCapitauxPropres = capitauxPropres.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
  const totalDettes = dettes.reduce((sum, acc) => sum + Math.max(0, -acc.balance), 0);
  const totalPassif = totalCapitauxPropres + totalDettes;

  return {
    actif: {
      immobilise: {
        accounts: actifImmobilise,
        total: totalActifImmobilise,
      },
      circulant: {
        accounts: actifCirculant,
        total: totalActifCirculant,
      },
      total: totalActif,
    },
    passif: {
      capitauxPropres: {
        accounts: capitauxPropres,
        total: totalCapitauxPropres,
      },
      dettes: {
        accounts: dettes,
        total: totalDettes,
      },
      total: totalPassif,
    },
    equilibre: Math.abs(totalActif - totalPassif) < 0.01,
  };
}
