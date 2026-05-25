import { prisma } from '../db/prisma';
import { env } from '../../config/env';
import { TooManyRequestsError } from '../errors';

export function injectOrgId(
  _toolName: string,
  params: Record<string, unknown>,
  _orgId: string,
): Record<string, unknown> {
  // L'orgId n'est jamais passé au LLM ; il est utilisé directement par les handlers.
  // Cette fonction sanitize les paramètres (retire toute clé suspecte).
  const { organizationId: _org, orgId: _o, ...safe } = params;
  return safe;
}

/**
 * Vérifie que le quota mensuel de tokens n'est pas dépassé pour l'organisation.
 */
export async function validateTokenBudget(orgId: string, inputTokens: number): Promise<void> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const agg = await prisma.chatMessage.aggregate({
    where: { organizationId: orgId, createdAt: { gte: monthStart } },
    _sum: { inputTokens: true, outputTokens: true },
  });
  const consumed = (agg._sum.inputTokens ?? 0) + (agg._sum.outputTokens ?? 0);
  if (consumed + inputTokens > env.AI_TOKEN_BUDGET_MONTHLY) {
    throw new TooManyRequestsError('Quota IA mensuel atteint');
  }
}

export function sanitizeToolError(err: unknown): string {
  if (err instanceof Error) {
    return err.message.length > 200 ? 'Erreur outil interne' : err.message;
  }
  return 'Erreur outil inconnue';
}
