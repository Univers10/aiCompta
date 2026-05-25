import { Router } from 'express';
import authRoutes from './auth';
import documentRoutes from './documents';
import journalRoutes from './journal';
import reportsRoutes from './reports';
import chatRoutes from './chat';
import webhookRoutes from './webhooks';
import settingsRoutes from './settings';

const router = Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/journal-entries', journalRoutes);
router.use('/reports', reportsRoutes);
router.use('/chat', chatRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/settings', settingsRoutes);

export default router;
