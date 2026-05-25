import type { Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from './db/prisma';

interface AuditArgs {
  action: string;
  targetType: string;
  targetId: string;
  metadata?: unknown;
  req?: Request;
}

export async function audit(orgId: string, userId: string | null, args: AuditArgs): Promise<void> {
  const ip = args.req?.ip ?? null;
  const userAgent = args.req?.headers['user-agent'] ?? null;
  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      userId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      metadata: args.metadata ? (args.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      ip,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
    },
  });
}
