/**
 * Workflow de validation des écritures SYSCOHADA 2025
 * Brouillard → Validation → Extourne
 */

import { PrismaClient, EntryStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Valide une écriture en brouillard
 * Une fois validée, l'écriture devient immuable (SYSCOHADA)
 */
export async function validateEntry(
  entryId: string,
  validatedById: string
): Promise<{ success: boolean; error?: string }> {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    include: {
      lines: true,
      accountingPeriod: true,
    },
  });

  if (!entry) {
    return { success: false, error: 'Écriture introuvable' };
  }

  // Vérifications SYSCOHADA
  
  // 1. L'écriture doit être en brouillard
  if (entry.status !== 'DRAFT') {
    return { success: false, error: 'Seules les écritures en brouillard peuvent être validées' };
  }

  // 2. La période comptable doit être ouverte
  if (entry.accountingPeriod && entry.accountingPeriod.status !== 'OPEN') {
    return {
      success: false,
      error: `La période ${entry.accountingPeriod.name} est clôturée`,
    };
  }

  // 3. Vérifier l'équilibre débit/crédit
  const totalDebit = entry.lines
    .filter((l) => l.lineType === 'DEBIT')
    .reduce((sum, l) => sum + Number(l.amountXof), 0);

  const totalCredit = entry.lines
    .filter((l) => l.lineType === 'CREDIT')
    .reduce((sum, l) => sum + Number(l.amountXof), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return {
      success: false,
      error: `Écriture déséquilibrée : Débit=${totalDebit} XOF, Crédit=${totalCredit} XOF`,
    };
  }

  // 4. Vérifier qu'il y a au moins 2 lignes
  if (entry.lines.length < 2) {
    return {
      success: false,
      error: 'Une écriture doit comporter au moins 2 lignes (partie double)',
    };
  }

  // 5. Vérifier la pièce justificative (SYSCOHADA)
  if (!entry.documentId && !entry.externalRef) {
    return {
      success: false,
      error: 'Pièce justificative obligatoire (document scanné ou référence externe)',
    };
  }

  // Validation
  await prisma.journalEntry.update({
    where: { id: entryId },
    data: {
      status: 'VALIDATED',
      validatedAt: new Date(),
      validatedById,
    },
  });

  return { success: true };
}

/**
 * Extourne une écriture validée (contrepassation SYSCOHADA)
 * Crée une écriture inverse + permet de créer une nouvelle écriture correcte
 */
export async function reverseEntry(
  entryId: string,
  reason: string,
  createdById: string
): Promise<{ success: boolean; reversalEntryId?: string; error?: string }> {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    include: {
      lines: true,
      accountingPeriod: true,
    },
  });

  if (!entry) {
    return { success: false, error: 'Écriture introuvable' };
  }

  // Vérifications

  // 1. L'écriture doit être validée
  if (entry.status !== 'VALIDATED') {
    return { success: false, error: 'Seules les écritures validées peuvent être extournées' };
  }

  // 2. L'écriture ne doit pas déjà être extournée
  if (entry.status === 'REVERSED') {
    return { success: false, error: 'Cette écriture a déjà été extournée' };
  }

  // 3. La période actuelle doit être ouverte (on extourne dans la période actuelle)
  const currentPeriod = await prisma.accountingPeriod.findFirst({
    where: {
      organizationId: entry.organizationId,
      status: 'OPEN',
    },
    orderBy: {
      startDate: 'desc',
    },
  });

  if (!currentPeriod) {
    return { success: false, error: 'Aucune période ouverte pour créer l\'extourne' };
  }

  // Créer l'écriture d'extourne (inverse)
  const reversalEntry = await prisma.journalEntry.create({
    data: {
      organizationId: entry.organizationId,
      fiscalYearId: entry.fiscalYearId,
      accountingPeriodId: currentPeriod.id,
      journal: entry.journal,
      sequenceNumber: 0, // Sera mis à jour par getNextSequenceNumber
      reference: '', // Sera mis à jour
      date: new Date(),
      description: `EXTOURNE - ${entry.description}`,
      documentId: entry.documentId,
      externalRef: entry.externalRef,
      isReversal: true,
      reversalOfId: entryId,
      reversalReason: reason,
      status: 'VALIDATED', // Extourne directement validée
      validatedAt: new Date(),
      validatedById: createdById,
      createdById,
      lines: {
        create: entry.lines.map((line, index) => ({
          organizationId: entry.organizationId,
          lineNumber: index + 1,
          accountCode: line.accountCode,
          accountLabel: line.accountLabel,
          // Inverser débit/crédit
          lineType: line.lineType === 'DEBIT' ? 'CREDIT' : 'DEBIT',
          amount: line.amount,
          currency: line.currency,
          fxRate: line.fxRate,
          amountXof: line.amountXof,
          description: line.description,
          supplierId: line.supplierId,
          customerId: line.customerId,
        })),
      },
    },
  });

  // Marquer l'écriture originale comme extournée
  await prisma.journalEntry.update({
    where: { id: entryId },
    data: {
      status: 'REVERSED',
    },
  });

  return {
    success: true,
    reversalEntryId: reversalEntry.id,
  };
}

/**
 * Vérifie si une écriture peut être modifiée
 */
export function canModifyEntry(status: EntryStatus): boolean {
  return status === 'DRAFT';
}

/**
 * Vérifie si une écriture peut être supprimée
 */
export function canDeleteEntry(status: EntryStatus): boolean {
  return status === 'DRAFT';
}

/**
 * Vérifie si une écriture peut être validée
 */
export function canValidateEntry(status: EntryStatus): boolean {
  return status === 'DRAFT';
}

/**
 * Vérifie si une écriture peut être extournée
 */
export function canReverseEntry(status: EntryStatus): boolean {
  return status === 'VALIDATED';
}

/**
 * Obtient le statut d'une écriture avec ses permissions
 */
export function getEntryPermissions(status: EntryStatus) {
  return {
    canModify: canModifyEntry(status),
    canDelete: canDeleteEntry(status),
    canValidate: canValidateEntry(status),
    canReverse: canReverseEntry(status),
  };
}
