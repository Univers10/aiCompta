import { ForbiddenError } from '../errors';

/**
 * Wrapper obligatoire pour tout accès Prisma métier.
 * Garantit qu'un orgId valide est fourni avant d'exécuter la fonction.
 *
 * @example
 * const docs = await withOrg(orgId, (id) =>
 *   prisma.document.findMany({ where: { organizationId: id } })
 * );
 */
export async function withOrg<T>(
  orgId: string | undefined | null,
  fn: (orgId: string) => Promise<T>,
): Promise<T> {
  if (typeof orgId !== 'string' || orgId.trim() === '') {
    throw new ForbiddenError('Contexte organisation manquant');
  }
  return fn(orgId);
}
