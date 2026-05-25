import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db/prisma';
import { success } from '../lib/response';
import { validateBody, validateParams } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../lib/errors';
import { audit } from '../lib/audit';

const router = Router();
const IdParam = z.object({ id: z.string().uuid() });

// --- Organisation ---
router.get('/organization', requireAuth, async (req, res) => {
  const auth = req.auth!;
  const org = await prisma.organization.findUnique({ where: { id: auth.organizationId } });
  if (!org) throw new NotFoundError();
  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: { organizationId: auth.organizationId, isClosed: false },
    orderBy: { startDate: 'desc' },
  });
  success(res, { ...org, fiscalYear });
});

router.patch(
  '/organization',
  requireAuth,
  requireRole('OWNER'),
  validateBody(z.object({ name: z.string().min(2).max(100) })),
  async (req, res) => {
    const auth = req.auth!;
    const { name } = req.body as { name: string };
    const org = await prisma.organization.update({
      where: { id: auth.organizationId },
      data: { name },
    });
    success(res, org);
  },
);

// --- Members ---
router.get('/members', requireAuth, async (req, res) => {
  const auth = req.auth!;
  const members = await prisma.membership.findMany({
    where: { organizationId: auth.organizationId },
    include: { user: true },
  });
  const invitations = await prisma.invitation.findMany({
    where: { organizationId: auth.organizationId, acceptedAt: null },
  });
  success(res, { members, invitations });
});

// --- Chart of Accounts ---
router.get('/chart-of-accounts', requireAuth, async (req, res) => {
  const auth = req.auth!;
  const accounts = await prisma.chartOfAccount.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { code: 'asc' },
  });
  success(res, accounts);
});

router.post(
  '/chart-of-accounts',
  requireAuth,
  requireRole('ACCOUNTANT'),
  validateBody(
    z.object({
      code: z.string().min(1).max(20),
      label: z.string().min(1).max(200),
      type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
      parentCode: z.string().optional(),
    }),
  ),
  async (req, res) => {
    const auth = req.auth!;
    const body = req.body as { code: string; label: string; type: 'ASSET'|'LIABILITY'|'EQUITY'|'REVENUE'|'EXPENSE'; parentCode?: string };
    const account = await prisma.chartOfAccount.create({
      data: {
        organizationId: auth.organizationId,
        code: body.code,
        label: body.label,
        type: body.type,
        parentCode: body.parentCode ?? null,
        isSystem: false,
      },
    });
    await audit(auth.organizationId, auth.userId, {
      action: 'account.created',
      targetType: 'chartOfAccount',
      targetId: account.id,
      req,
    });
    success(res, account, 201);
  },
);

// --- Analytic axes ---
router.get('/analytics/axes', requireAuth, async (req, res) => {
  const auth = req.auth!;
  const axes = await prisma.analyticAxis.findMany({
    where: { organizationId: auth.organizationId },
    include: { values: true },
  });
  success(res, axes);
});

router.post(
  '/analytics/axes',
  requireAuth,
  requireRole('ACCOUNTANT'),
  validateBody(z.object({ name: z.string().min(1).max(100), description: z.string().optional() })),
  async (req, res) => {
    const auth = req.auth!;
    const body = req.body as { name: string; description?: string };
    const axis = await prisma.analyticAxis.create({
      data: { organizationId: auth.organizationId, name: body.name, description: body.description ?? null },
    });
    success(res, axis, 201);
  },
);

router.post(
  '/analytics/axes/:id/values',
  requireAuth,
  requireRole('ACCOUNTANT'),
  validateParams(IdParam),
  validateBody(z.object({ label: z.string().min(1).max(100) })),
  async (req, res) => {
    const auth = req.auth!;
    const { id } = req.params as unknown as { id: string };
    const { label } = req.body as { label: string };
    const axis = await prisma.analyticAxis.findFirst({
      where: { id, organizationId: auth.organizationId },
    });
    if (!axis) throw new NotFoundError("Axe analytique introuvable");
    const value = await prisma.analyticValue.create({
      data: { analyticAxisId: axis.id, organizationId: auth.organizationId, label },
    });
    success(res, value, 201);
  },
);

// --- Suppliers / Customers (minimal CRUD) ---
const PartyBody = z.object({
  name: z.string().min(1).max(200),
  taxId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

router.get('/suppliers', requireAuth, async (req, res) => {
  const auth = req.auth!;
  const items = await prisma.supplier.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { name: 'asc' },
  });
  success(res, items);
});

router.post(
  '/suppliers',
  requireAuth,
  requireRole('ACCOUNTANT'),
  validateBody(PartyBody),
  async (req, res) => {
    const auth = req.auth!;
    const body = req.body as z.infer<typeof PartyBody>;
    const s = await prisma.supplier.create({
      data: {
        organizationId: auth.organizationId,
        name: body.name,
        taxId: body.taxId ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
      },
    });
    success(res, s, 201);
  },
);

router.get('/customers', requireAuth, async (req, res) => {
  const auth = req.auth!;
  const items = await prisma.customer.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { name: 'asc' },
  });
  success(res, items);
});

router.post(
  '/customers',
  requireAuth,
  requireRole('ACCOUNTANT'),
  validateBody(PartyBody),
  async (req, res) => {
    const auth = req.auth!;
    const body = req.body as z.infer<typeof PartyBody>;
    if (!body.name) throw new ValidationError('Nom requis');
    const c = await prisma.customer.create({
      data: {
        organizationId: auth.organizationId,
        name: body.name,
        taxId: body.taxId ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
      },
    });
    success(res, c, 201);
  },
);

export default router;
