/**
 * Gestion de la numérotation séquentielle SYSCOHADA 2025
 * Format : {PREFIX}-{YEAR}-{NUMBER}
 * Exemple : ACH-2025-00001
 */

import { PrismaClient, JournalType } from '@prisma/client';

const prisma = new PrismaClient();

// Préfixes par type de journal
const JOURNAL_PREFIXES: Record<JournalType, string> = {
  PURCHASE: 'ACH',
  SALES: 'VTE',
  BANK: 'BQ',
  CASH: 'CA',
  MISC: 'OD',
};

/**
 * Génère le prochain numéro de séquence pour un journal
 * SYSCOHADA exige une numérotation séquentielle, continue et sans trou
 */
export async function getNextSequenceNumber(
  organizationId: string,
  fiscalYearId: string,
  journal: JournalType
): Promise<{ sequenceNumber: number; reference: string }> {
  const year = new Date().getFullYear();
  const prefix = JOURNAL_PREFIXES[journal];

  // Récupérer ou créer la séquence
  let sequence = await prisma.journalSequence.findUnique({
    where: {
      organizationId_journal_year: {
        organizationId,
        journal,
        year,
      },
    },
  });

  if (!sequence) {
    // Créer une nouvelle séquence pour cette année
    sequence = await prisma.journalSequence.create({
      data: {
        organizationId,
        fiscalYearId,
        journal,
        prefix,
        currentNumber: 0,
        year,
      },
    });
  }

  // Incrémenter le numéro (transaction atomique)
  const updated = await prisma.journalSequence.update({
    where: {
      id: sequence.id,
    },
    data: {
      currentNumber: {
        increment: 1,
      },
    },
  });

  const sequenceNumber = updated.currentNumber;
  const paddedNumber = sequenceNumber.toString().padStart(5, '0');
  const reference = `${prefix}-${year}-${paddedNumber}`;

  return {
    sequenceNumber,
    reference,
  };
}

/**
 * Vérifie la continuité de la numérotation (audit SYSCOHADA)
 * Retourne les trous éventuels dans la séquence
 */
export async function checkSequenceContinuity(
  organizationId: string,
  journal: JournalType,
  year: number
): Promise<{ isContinuous: boolean; gaps: number[] }> {
  const entries = await prisma.journalEntry.findMany({
    where: {
      organizationId,
      journal,
      date: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    select: {
      sequenceNumber: true,
    },
    orderBy: {
      sequenceNumber: 'asc',
    },
  });

  const numbers = entries.map((e) => e.sequenceNumber);
  const gaps: number[] = [];

  for (let i = 1; i < numbers.length; i++) {
    const expected = numbers[i - 1] + 1;
    const actual = numbers[i];

    if (actual !== expected) {
      // Trou détecté
      for (let missing = expected; missing < actual; missing++) {
        gaps.push(missing);
      }
    }
  }

  return {
    isContinuous: gaps.length === 0,
    gaps,
  };
}

/**
 * Obtient le dernier numéro utilisé pour un journal
 */
export async function getLastSequenceNumber(
  organizationId: string,
  journal: JournalType,
  year: number
): Promise<number | null> {
  const sequence = await prisma.journalSequence.findUnique({
    where: {
      organizationId_journal_year: {
        organizationId,
        journal,
        year,
      },
    },
  });

  return sequence?.currentNumber || null;
}

/**
 * Réinitialise la séquence pour une nouvelle année
 * (À appeler lors de la clôture annuelle)
 */
export async function resetSequenceForNewYear(
  organizationId: string,
  fiscalYearId: string,
  newYear: number
): Promise<void> {
  const journals: JournalType[] = ['PURCHASE', 'SALES', 'BANK', 'CASH', 'MISC'];

  for (const journal of journals) {
    await prisma.journalSequence.create({
      data: {
        organizationId,
        fiscalYearId,
        journal,
        prefix: JOURNAL_PREFIXES[journal],
        currentNumber: 0,
        year: newYear,
      },
    });
  }
}

/**
 * Génère un rapport de numérotation pour audit
 */
export async function getSequenceReport(
  organizationId: string,
  year: number
): Promise<{
  journal: JournalType;
  prefix: string;
  lastNumber: number;
  totalEntries: number;
  isContinuous: boolean;
  gaps: number[];
}[]> {
  const journals: JournalType[] = ['PURCHASE', 'SALES', 'BANK', 'CASH', 'MISC'];
  const report: any[] = [];

  for (const journal of journals) {
    const sequence = await prisma.journalSequence.findUnique({
      where: {
        organizationId_journal_year: {
          organizationId,
          journal,
          year,
        },
      },
    });

    const totalEntries = await prisma.journalEntry.count({
      where: {
        organizationId,
        journal,
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });

    const continuity = await checkSequenceContinuity(organizationId, journal, year);

    report.push({
      journal,
      prefix: JOURNAL_PREFIXES[journal],
      lastNumber: sequence?.currentNumber || 0,
      totalEntries,
      isContinuous: continuity.isContinuous,
      gaps: continuity.gaps,
    });
  }

  return report;
}
