import { Router } from 'express';
import bcrypt from 'bcrypt';
import { SignupSchema, LoginSchema, MagicLinkSchema, VerifyTokenSchema, InviteMemberSchema, SlugSchema } from '@aicompta/validators';
import { prisma } from '../lib/db/prisma';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError, ForbiddenError } from '../lib/errors';
import { success } from '../lib/response';
import { validateBody, validateQuery } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { requireAuth, requireRole } from '../middleware/auth';
import { generateRandomToken, signSessionJwt, SESSION_DURATION_MS, MAGIC_LINK_DURATION_MS } from '../lib/auth/tokens';
import { sendMagicLinkEmail, sendInvitationEmail } from '../lib/auth/email';
import { env } from '../config/env';
import { audit } from '../lib/audit';
import { z } from 'zod';

const router = Router();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

router.post('/signup', authLimiter, validateBody(SignupSchema), async (req, res) => {
  const { email, password, organizationName } = req.body as { email: string; password: string; organizationName: string };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('Un compte existe déjà avec cet email');
  
  const passwordHash = await bcrypt.hash(password, 10);

  const baseSlug = slugify(organizationName) || 'org';
  const slug = await uniqueSlug(baseSlug);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      memberships: {
        create: {
          role: 'OWNER',
          organization: { create: { name: organizationName, slug } },
        },
      },
    },
    include: { memberships: true },
  });

  // Mode dev: connexion directe sans email
  const membership = user.memberships[0];
  if (!membership) throw new Error('No membership created');
  
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: generateRandomToken(),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });
  
  const sessionToken = signSessionJwt(session.id, user.id, membership.organizationId);
  
  console.log('[SIGNUP] Setting cookie for user:', user.email, 'session:', session.id);
  
  res.cookie('aicompta_session', sessionToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
  });
  
  await audit(membership.organizationId, user.id, {
    action: 'user.signup',
    targetType: 'User',
    targetId: user.id,
    req,
  });

  success(res, { email, organizationName, message: 'Compte créé et connecté' }, 201);
});

router.post('/login', authLimiter, validateBody(LoginSchema), async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { memberships: true }
  });
  
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Email ou mot de passe incorrect');
  }
  
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw new UnauthorizedError('Email ou mot de passe incorrect');
  }
  
  const membership = user.memberships[0];
  if (!membership) throw new Error('No membership found');
  
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: generateRandomToken(),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });
  
  const sessionToken = signSessionJwt(session.id, user.id, membership.organizationId);
  
  res.cookie('aicompta_session', sessionToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
  });
  
  await audit(membership.organizationId, user.id, {
    action: 'user.login',
    targetType: 'User',
    targetId: user.id,
    req,
  });
  
  success(res, { message: 'Connecté avec succès' });
});

router.get('/verify', validateQuery(VerifyTokenSchema), async (req, res) => {
  const { token } = req.query as unknown as { token: string };
  const link = await prisma.magicLink.findUnique({ where: { token } });
  if (!link || link.usedAt || link.expiresAt < new Date()) {
    throw new UnauthorizedError('Lien expiré ou invalide');
  }

  const session = await prisma.$transaction(async (tx) => {
    await tx.magicLink.update({ where: { id: link.id }, data: { usedAt: new Date() } });
    return tx.session.create({
      data: {
        userId: link.userId,
        token: generateRandomToken(),
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });
  });

  const membership = await prisma.membership.findFirst({ where: { userId: link.userId } });
  const jwt = signSessionJwt(session.id, link.userId, membership?.organizationId);

  res.cookie?.('aicompta_session', jwt, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
  });

  success(res, { token: jwt, expiresAt: session.expiresAt.toISOString() });
});

router.get('/me', requireAuth, async (req, res) => {
  const auth = req.auth!;
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: {
      memberships: { include: { organization: true } },
    },
  });
  if (!user) throw new NotFoundError('Utilisateur introuvable');
  success(res, {
    user: { id: user.id, email: user.email, name: user.name },
    currentOrganizationId: auth.organizationId,
    role: auth.role,
    memberships: user.memberships.map((m) => ({
      organizationId: m.organizationId,
      organization: { id: m.organization.id, name: m.organization.name, slug: m.organization.slug },
      role: m.role,
    })),
  });
});

router.post('/logout', requireAuth, async (req, res) => {
  const auth = req.auth!;
  await prisma.session.deleteMany({ where: { id: auth.sessionId } });
  res.clearCookie?.('aicompta_session');
  success(res, { ok: true });
});

router.post(
  '/invite',
  requireAuth,
  requireRole('OWNER'),
  validateBody(InviteMemberSchema),
  async (req, res) => {
    const auth = req.auth!;
    const { email, role } = req.body as { email: string; role: 'OWNER' | 'ACCOUNTANT' | 'VIEWER' };
    const org = await prisma.organization.findUnique({ where: { id: auth.organizationId } });
    if (!org) throw new NotFoundError('Organisation introuvable');

    const token = generateRandomToken();
    const inv = await prisma.invitation.upsert({
      where: { organizationId_email: { organizationId: auth.organizationId, email } },
      update: {
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        organizationId: auth.organizationId,
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const url = `${env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`;
    await sendInvitationEmail(email, url, org.name);
    await audit(auth.organizationId, auth.userId, {
      action: 'member.invited',
      targetType: 'invitation',
      targetId: inv.id,
      metadata: { email, role },
      req,
    });
    success(res, { ok: true });
  },
);

router.post('/accept-invite', validateBody(z.object({ token: z.string() })), async (req, res) => {
  const { token } = req.body as { token: string };
  const inv = await prisma.invitation.findUnique({ where: { token } });
  if (!inv || inv.acceptedAt || inv.expiresAt < new Date()) {
    throw new UnauthorizedError('Invitation invalide');
  }
  const user = await prisma.user.upsert({
    where: { email: inv.email },
    update: {},
    create: { email: inv.email },
  });
  await prisma.$transaction(async (tx) => {
    await tx.invitation.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } });
    await tx.membership.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: inv.organizationId } },
      update: { role: inv.role },
      create: { userId: user.id, organizationId: inv.organizationId, role: inv.role },
    });
  });
  // Envoie ensuite un magic link
  const linkToken = generateRandomToken();
  await prisma.magicLink.create({
    data: {
      userId: user.id,
      token: linkToken,
      expiresAt: new Date(Date.now() + MAGIC_LINK_DURATION_MS),
    },
  });
  await sendMagicLinkEmail(user.email, `${env.NEXT_PUBLIC_APP_URL}/verify?token=${linkToken}`);
  success(res, { ok: true });
});

router.delete('/members/:userId', requireAuth, requireRole('OWNER'), async (req, res) => {
  const auth = req.auth!;
  const targetId = req.params.userId;
  if (!targetId) throw new ValidationError('userId requis');
  if (targetId === auth.userId) throw new ValidationError('Impossible de se révoquer soi-même');
  const m = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: targetId, organizationId: auth.organizationId } },
  });
  if (!m) throw new NotFoundError('Membre introuvable');
  await prisma.membership.delete({ where: { id: m.id } });
  await audit(auth.organizationId, auth.userId, {
    action: 'member.revoked',
    targetType: 'membership',
    targetId: m.id,
    metadata: { revokedUserId: targetId },
    req,
  });
  success(res, { ok: true });
});

router.get('/check-slug', async (req, res) => {
  const parse = SlugSchema.safeParse(req.query.slug);
  if (!parse.success) {
    success(res, { available: false, reason: 'invalid' });
    return;
  }
  const exists = await prisma.organization.findUnique({ where: { slug: parse.data } });
  success(res, { available: !exists });
});

// Used in next middleware order: prevent accidental cross-org switching
router.post('/switch-org', requireAuth, validateBody(z.object({ organizationId: z.string().uuid() })), async (req, res) => {
  const auth = req.auth!;
  const { organizationId } = req.body as { organizationId: string };
  const m = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: auth.userId, organizationId } },
  });
  if (!m) throw new ForbiddenError('Aucun accès à cette organisation');
  const jwt = signSessionJwt(auth.sessionId, auth.userId, organizationId);
  res.cookie?.('aicompta_session', jwt, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
  });
  success(res, { token: jwt, organizationId });
});

export default router;
