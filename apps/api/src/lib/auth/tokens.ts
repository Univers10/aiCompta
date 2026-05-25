import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function signSessionJwt(sessionId: string, userId: string, organizationId?: string): string {
  return jwt.sign(
    { sub: userId, sid: sessionId, org: organizationId },
    env.AUTH_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' },
  );
}

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const MAGIC_LINK_DURATION_MS = 15 * 60 * 1000;
