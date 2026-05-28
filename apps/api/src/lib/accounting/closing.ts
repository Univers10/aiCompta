/**
 * Gestion de la clôture des périodes comptables SYSCOHADA 2025
 * Clôture mensuelle + Clôture annuelle
 */

import { PrismaClient, PeriodStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clôture une période comptable mensuelle
 * Une fois clôturée, aucune écriture ne peut être créée/modifiée dans cette période
 */
export async function closePeriod(
  periodId: string,
  closedById: string
): Promise<{ success: boolean; error?: string }> {
  const period = await prisma.accountingPeriod.findUnique({
    where: { id: periodId },
    include: {
      journalEntries: {
        where: {
          status: 'DRAFT',
        },
      },
    },
  });

  if (!period) {
    return { success: false, error: 'Période introuvable' };
  }

  // Vérifications

  // 1. La période doit être ouverte
  if (period.status !== 'OPEN') {
    return { success: false, error: 'Cette période est déjà clôturée' };
  }

  // 2. Aucune écriture en brouillard ne doit subsister
  if (period.journalEntries.length > 0) {
    return {
      success: false,
      error: `${period.journalEntries.length} écriture(s) en brouillard doivent être validées avant clôture`,
    };
  }

  // 3. Vérifier l'équilibre de la période
  const balance = await getPeriodBalance(periodId);
  if (!balance.isBalanced) {
    return {
      success: false,
      error: `Période déséquilibrée : Débit=${balance.totalDebit} XOF, Crédit=${balance.totalCredit} XOF`,
    };
  }

  // Clôture
  await prisma.accountingPeriod.update({
    where: { id: periodId },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
      closedById,
    },
  });

  return { success: true };
}

/**
 * Réouvre une période clôturée (exceptionnel, nécessite autorisation)
 */
export async function reopenPeriod(
  periodId: string
): Promise<{ success: boolean; error?: string }> {
  const period = await prisma.accountingPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    return { success: false, error: 'Période introuvable' };
  }

  if (period.status !== 'CLOSED') {
    return { success: false, error: 'Cette période n\'est pas clôturée' };
  }

  if (period.status === 'ARCHIVED') {
    return {
      success: false,
      error: 'Impossible de réouvrir une période archivée (exercice clos)',
    };
  }

  await prisma.accountingPeriod.update({
    where: { id: periodId },
    data: {
      status: 'OPEN',
      closedAt: null,
      closedById: null,
    },
  });

  return { success: true };
}

/**
 * Clôture un exercice comptable (annuel)
 * Archive toutes les périodes et empêche toute modification
 */
export async function closeFiscalYear(
  fiscalYearId: string,
  closedById: string
): Promise<{ success: boolean; error?: string }> {
  const fiscalYear = await prisma.fiscalYear.findUnique({
    where: { id: fiscalYearId },
    include: {
      accountingPeriods: true,
      journalEntries: {
        where: {
          status: 'DRAFT',
        },
      },
    },
  });

  if (!fiscalYear) {
    return { success: false, error: 'Exercice introuvable' };
  }

  // Vérifications

  // 1. L'exercice ne doit pas être déjà clos
  if (fiscalYear.isClosed) {
    return { success: false, error: 'Cet exercice est déjà clos' };
  }

  // 2. Toutes les périodes doivent être clôturées
  const openPeriods = fiscalYear.accountingPeriods.filter((p) => p.status === 'OPEN');
  if (openPeriods.length > 0) {
    return {
      success: false,
      error: `${openPeriods.length} période(s) doivent être clôturées avant la clôture annuelle`,
    };
  }

  // 3. Aucune écriture en brouillard
  if (fiscalYear.journalEntries.length > 0) {
    return {
      success: false,
      error: `${fiscalYear.journalEntries.length} écriture(s) en brouillard doivent être validées`,
    };
  }

  // 4. Vérifier l'équilibre global de l'exercice
  const balance = await getFiscalYearBalance(fiscalYearId);
  if (!balance.isBalanced) {
    return {
      success: false,
      error: `Exercice déséquilibré : Débit=${balance.totalDebit} XOF, Crédit=${balance.totalCredit} XOF`,
    };
  }

  // Clôture de l'exercice
  await prisma.fiscalYear.update({
    where: { id: fiscalYearId },
    data: {
      isClosed: true,
      closedAt: new Date(),
      closedById,
    },
  });

  // Archiver toutes les périodes
  await prisma.accountingPeriod.updateMany({
    where: {
      fiscalYearId,
    },
    data: {
      status: 'ARCHIVED',
    },
  });

  return { success: true };
}

/**
 * Calcule la balance d'une période
 */
async function getPeriodBalance(periodId: string): Promise<{
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}> {
  const lines = await prisma.journalLine.findMany({
    where: {
      entry: {
        accountingPeriodId: periodId,
        status: 'VALIDATED',
      },
    },
  });

  const totalDebit = lines
    .filter((l) => l.lineType === 'DEBIT')
    .reduce((sum, l) => sum + Number(l.amountXof), 0);

  const totalCredit = lines
    .filter((l) => l.lineType === 'CREDIT')
    .reduce((sum, l) => sum + Number(l.amountXof), 0);

  return {
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
}

/**
 * Calcule la balance d'un exercice
 */
async function getFiscalYearBalance(fiscalYearId: string): Promise<{
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}> {
  const lines = await prisma.journalLine.findMany({
    where: {
      entry: {
        fiscalYearId,
        status: 'VALIDATED',
      },
    },
  });

  const totalDebit = lines
    .filter((l) => l.lineType === 'DEBIT')
    .reduce((sum, l) => sum + Number(l.amountXof), 0);

  const totalCredit = lines
    .filter((l) => l.lineType === 'CREDIT')
    .reduce((sum, l) => sum + Number(l.amountXof), 0);

  return {
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
}

/**
 * Vérifie si une période peut recevoir de nouvelles écritures
 */
export async function canPostToperiod(periodId: string): Promise<boolean> {
  const period = await prisma.accountingPeriod.findUnique({
    where: { id: periodId },
  });

  return period?.status === 'OPEN';
}

/**
 * Obtient la période ouverte actuelle pour une organisation
 */
export async function getCurrentOpenPeriod(
  organizationId: string
): Promise<any | null> {
  return await prisma.accountingPeriod.findFirst({
    where: {
      organizationId,
      status: 'OPEN',
    },
    orderBy: {
      startDate: 'desc',
    },
  });
}

/**
 * Obtient le statut de clôture d'un exercice
 */
export async function getFiscalYearClosingStatus(fiscalYearId: string): Promise<{
  isClosed: boolean;
  totalPeriods: number;
  closedPeriods: number;
  openPeriods: number;
  draftEntries: number;
  canClose: boolean;
  blockingReasons: string[];
}> {
  const fiscalYear = await prisma.fiscalYear.findUnique({
    where: { id: fiscalYearId },
    include: {
      accountingPeriods: true,
      journalEntries: {
        where: {
          status: 'DRAFT',
        },
      },
    },
  });

  if (!fiscalYear) {
    throw new Error('Exercice introuvable');
  }

  const totalPeriods = fiscalYear.accountingPeriods.length;
  const closedPeriods = fiscalYear.accountingPeriods.filter((p) => p.status === 'CLOSED').length;
  const openPeriods = fiscalYear.accountingPeriods.filter((p) => p.status === 'OPEN').length;
  const draftEntries = fiscalYear.journalEntries.length;

  const blockingReasons: string[] = [];

  if (openPeriods > 0) {
    blockingReasons.push(`${openPeriods} période(s) ouverte(s)`);
  }

  if (draftEntries > 0) {
    blockingReasons.push(`${draftEntries} écriture(s) en brouillard`);
  }

  return {
    isClosed: fiscalYear.isClosed,
    totalPeriods,
    closedPeriods,
    openPeriods,
    draftEntries,
    canClose: blockingReasons.length === 0,
    blockingReasons,
  };
}
