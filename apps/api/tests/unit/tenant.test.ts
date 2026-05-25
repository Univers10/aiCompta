import { describe, it, expect } from 'vitest';
import { withOrg } from '../../src/lib/db/tenant';
import { ForbiddenError } from '../../src/lib/errors';

describe('withOrg', () => {
  it('lève ForbiddenError si orgId undefined', async () => {
    await expect(withOrg(undefined, async (id) => id)).rejects.toThrow(ForbiddenError);
  });

  it('lève ForbiddenError si orgId vide', async () => {
    await expect(withOrg('', async (id) => id)).rejects.toThrow(ForbiddenError);
    await expect(withOrg('   ', async (id) => id)).rejects.toThrow(ForbiddenError);
  });

  it('exécute la fonction avec orgId valide', async () => {
    const res = await withOrg('org-123', async (id) => `ok:${id}`);
    expect(res).toBe('ok:org-123');
  });
});
