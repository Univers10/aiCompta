import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/db/prisma';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';
import { USER_ROLE_LEVEL, type UserRole } from '@aicompta/types';

export interface AuthContext {
  userId: string;
  email: string;
  organizationId: string;
  role: UserRole;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

interface JwtPayload {
  sub: string;
  sid: string;
  org?: string;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const cookieToken = req.cookies?.aicompta_session;
  return cookieToken ?? null;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // MODE DEV: Bypass auth complètement
  req.auth = {
    userId: 'dev-user',
    email: 'dev@test.com',
    organizationId: 'dev-org',
    role: 'OWNER',
    sessionId: 'dev-session',
  };
  next();
}

export function requireRole(minRole: UserRole) {
  const minLevel = USER_ROLE_LEVEL[minRole];
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new UnauthorizedError());
      return;
    }
    if (USER_ROLE_LEVEL[req.auth.role] < minLevel) {
      next(new ForbiddenError('Permissions insuffisantes'));
      return;
    }
    next();
  };
}
