/**
 * Routes API pour la gestion des écritures comptables SYSCOHADA 2025
 * Workflow : Brouillard → Validation → Extourne
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateEntry, reverseEntry, canValidateEntry, canReverseEntry } from '../lib/accounting/validation';
import { getCurrentOpenPeriod } from '../lib/accounting/closing';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/journal-entries/:id/validate
 * Valide une écriture en brouillard
 */
router.post('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Assuming auth middleware sets req.user

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Vérifier que l'écriture existe
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Écriture introuvable' });
    }

    // Valider l'écriture
    const result = await validateEntry(id, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Récupérer l'écriture mise à jour
    const updatedEntry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: true,
        document: true,
      },
    });

    res.json({
      success: true,
      entry: updatedEntry,
    });
  } catch (error) {
    console.error('Error validating entry:', error);
    res.status(500).json({ error: 'Erreur lors de la validation' });
  }
});

/**
 * POST /api/journal-entries/:id/reverse
 * Extourne une écriture validée
 */
router.post('/:id/reverse', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'La raison de l\'extourne est obligatoire' });
    }

    // Vérifier que l'écriture existe
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Écriture introuvable' });
    }

    // Extourner l'écriture
    const result = await reverseEntry(id, reason, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Récupérer l'écriture d'extourne
    const reversalEntry = await prisma.journalEntry.findUnique({
      where: { id: result.reversalEntryId },
      include: {
        lines: true,
        document: true,
      },
    });

    res.json({
      success: true,
      originalEntry: await prisma.journalEntry.findUnique({ where: { id } }),
      reversalEntry,
    });
  } catch (error) {
    console.error('Error reversing entry:', error);
    res.status(500).json({ error: 'Erreur lors de l\'extourne' });
  }
});

/**
 * GET /api/journal-entries/:id/permissions
 * Obtient les permissions pour une écriture
 */
router.get('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Écriture introuvable' });
    }

    const permissions = {
      canModify: entry.status === 'DRAFT',
      canDelete: entry.status === 'DRAFT',
      canValidate: canValidateEntry(entry.status as any),
      canReverse: canReverseEntry(entry.status as any),
    };

    res.json(permissions);
  } catch (error) {
    console.error('Error getting permissions:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des permissions' });
  }
});

/**
 * GET /api/journal-entries/draft
 * Liste toutes les écritures en brouillard
 */
router.get('/draft', async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId requis' });
    }

    const draftEntries = await prisma.journalEntry.findMany({
      where: {
        organizationId: organizationId as string,
        status: 'DRAFT',
      },
      include: {
        lines: true,
        document: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    res.json(draftEntries);
  } catch (error) {
    console.error('Error fetching draft entries:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des écritures' });
  }
});

/**
 * GET /api/journal-entries/validated
 * Liste toutes les écritures validées
 */
router.get('/validated', async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId requis' });
    }

    const validatedEntries = await prisma.journalEntry.findMany({
      where: {
        organizationId: organizationId as string,
        status: 'VALIDATED',
      },
      include: {
        lines: true,
        document: true,
        validatedBy: true,
      },
      orderBy: {
        validatedAt: 'desc',
      },
    });

    res.json(validatedEntries);
  } catch (error) {
    console.error('Error fetching validated entries:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des écritures' });
  }
});

/**
 * GET /api/journal-entries/stats
 * Statistiques des écritures par statut
 */
router.get('/stats', async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId requis' });
    }

    const [draftCount, validatedCount, reversedCount] = await Promise.all([
      prisma.journalEntry.count({
        where: { organizationId: organizationId as string, status: 'DRAFT' },
      }),
      prisma.journalEntry.count({
        where: { organizationId: organizationId as string, status: 'VALIDATED' },
      }),
      prisma.journalEntry.count({
        where: { organizationId: organizationId as string, status: 'REVERSED' },
      }),
    ]);

    res.json({
      draft: draftCount,
      validated: validatedCount,
      reversed: reversedCount,
      total: draftCount + validatedCount + reversedCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

export default router;
