/**
 * Routes API pour la gestion des périodes comptables SYSCOHADA 2025
 * Clôture mensuelle et annuelle
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  closePeriod,
  reopenPeriod,
  closeFiscalYear,
  getCurrentOpenPeriod,
  getFiscalYearClosingStatus,
} from '../lib/accounting/closing';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/accounting-periods
 * Liste toutes les périodes comptables d'une organisation
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId, fiscalYearId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId requis' });
    }

    const where: any = {
      organizationId: organizationId as string,
    };

    if (fiscalYearId) {
      where.fiscalYearId = fiscalYearId as string;
    }

    const periods = await prisma.accountingPeriod.findMany({
      where,
      include: {
        fiscalYear: true,
        closedBy: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    res.json(periods);
  } catch (error) {
    console.error('Error fetching periods:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des périodes' });
  }
});

/**
 * GET /api/accounting-periods/current
 * Obtient la période ouverte actuelle
 */
router.get('/current', async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId requis' });
    }

    const currentPeriod = await getCurrentOpenPeriod(organizationId as string);

    if (!currentPeriod) {
      return res.status(404).json({ error: 'Aucune période ouverte trouvée' });
    }

    res.json(currentPeriod);
  } catch (error) {
    console.error('Error fetching current period:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la période actuelle' });
  }
});

/**
 * POST /api/accounting-periods/:id/close
 * Clôture une période comptable mensuelle
 */
router.post('/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const result = await closePeriod(id, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const closedPeriod = await prisma.accountingPeriod.findUnique({
      where: { id },
      include: {
        closedBy: true,
      },
    });

    res.json({
      success: true,
      period: closedPeriod,
    });
  } catch (error) {
    console.error('Error closing period:', error);
    res.status(500).json({ error: 'Erreur lors de la clôture de la période' });
  }
});

/**
 * POST /api/accounting-periods/:id/reopen
 * Réouvre une période clôturée (exceptionnel)
 */
router.post('/:id/reopen', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Vérifier les permissions (seul le propriétaire peut réouvrir)
    const period = await prisma.accountingPeriod.findUnique({
      where: { id },
      include: {
        organization: {
          include: {
            memberships: {
              where: {
                userId,
                role: 'OWNER',
              },
            },
          },
        },
      },
    });

    if (!period) {
      return res.status(404).json({ error: 'Période introuvable' });
    }

    if (period.organization.memberships.length === 0) {
      return res.status(403).json({ error: 'Seul le propriétaire peut réouvrir une période' });
    }

    const result = await reopenPeriod(id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const reopenedPeriod = await prisma.accountingPeriod.findUnique({
      where: { id },
    });

    res.json({
      success: true,
      period: reopenedPeriod,
    });
  } catch (error) {
    console.error('Error reopening period:', error);
    res.status(500).json({ error: 'Erreur lors de la réouverture de la période' });
  }
});

/**
 * GET /api/accounting-periods/:id/stats
 * Statistiques d'une période
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const [period, draftCount, validatedCount] = await Promise.all([
      prisma.accountingPeriod.findUnique({
        where: { id },
      }),
      prisma.journalEntry.count({
        where: {
          accountingPeriodId: id,
          status: 'DRAFT',
        },
      }),
      prisma.journalEntry.count({
        where: {
          accountingPeriodId: id,
          status: 'VALIDATED',
        },
      }),
    ]);

    if (!period) {
      return res.status(404).json({ error: 'Période introuvable' });
    }

    res.json({
      period,
      stats: {
        draftEntries: draftCount,
        validatedEntries: validatedCount,
        totalEntries: draftCount + validatedCount,
        canClose: draftCount === 0 && period.status === 'OPEN',
      },
    });
  } catch (error) {
    console.error('Error fetching period stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

/**
 * POST /api/fiscal-years/:id/close
 * Clôture annuelle d'un exercice
 */
router.post('/fiscal-years/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const result = await closeFiscalYear(id, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const closedFiscalYear = await prisma.fiscalYear.findUnique({
      where: { id },
      include: {
        closedBy: true,
        accountingPeriods: true,
      },
    });

    res.json({
      success: true,
      fiscalYear: closedFiscalYear,
    });
  } catch (error) {
    console.error('Error closing fiscal year:', error);
    res.status(500).json({ error: 'Erreur lors de la clôture de l\'exercice' });
  }
});

/**
 * GET /api/fiscal-years/:id/closing-status
 * Obtient le statut de clôture d'un exercice
 */
router.get('/fiscal-years/:id/closing-status', async (req, res) => {
  try {
    const { id } = req.params;

    const status = await getFiscalYearClosingStatus(id);

    res.json(status);
  } catch (error) {
    console.error('Error fetching closing status:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
  }
});

export default router;
