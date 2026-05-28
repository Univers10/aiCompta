import { PrismaClient } from '@prisma/client';
import { SYSCOHADA_ACCOUNTS } from '../prisma/syscohada-accounts';

const prisma = new PrismaClient();

async function main() {
  const orgId = 'dev-org';

  console.log('📋 Import du plan comptable SYSCOHADA pour dev-org...');

  let inserted = 0;
  for (const account of SYSCOHADA_ACCOUNTS) {
    await prisma.chartOfAccount.upsert({
      where: { organizationId_code: { organizationId: orgId, code: account.code } },
      update: { label: account.label, type: account.type, parentCode: account.parentCode ?? null },
      create: {
        organizationId: orgId,
        code: account.code,
        label: account.label,
        type: account.type,
        parentCode: account.parentCode ?? null,
        isSystem: true,
      },
    });
    inserted++;
  }

  console.log(`✅ ${inserted} comptes importés pour dev-org`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
