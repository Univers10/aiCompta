import { PrismaClient } from '@prisma/client';
import { SYSCOHADA_ACCOUNTS } from './syscohada-accounts';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed AI Compta...');

  const org = await prisma.organization.upsert({
    where: { slug: 'demo-sarl' },
    update: {},
    create: {
      name: 'Demo SARL',
      slug: 'demo-sarl',
    },
  });
  console.log(`  ✓ Organisation : ${org.name} (${org.slug})`);

  const user = await prisma.user.upsert({
    where: { email: 'demo@aicompta.app' },
    update: {},
    create: {
      email: 'demo@aicompta.app',
      name: 'Demo Admin',
    },
  });
  console.log(`  ✓ Utilisateur : ${user.email}`);

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  });
  console.log('  ✓ Membership OWNER créée');

  let inserted = 0;
  for (const account of SYSCOHADA_ACCOUNTS) {
    await prisma.chartOfAccount.upsert({
      where: { organizationId_code: { organizationId: org.id, code: account.code } },
      update: { label: account.label, type: account.type, parentCode: account.parentCode ?? null },
      create: {
        organizationId: org.id,
        code: account.code,
        label: account.label,
        type: account.type,
        parentCode: account.parentCode ?? null,
        isSystem: true,
      },
    });
    inserted++;
  }
  console.log(`  ✓ Plan comptable SYSCOHADA : ${inserted} comptes`);

  const year = new Date().getFullYear();
  await prisma.fiscalYear.upsert({
    where: { organizationId_name: { organizationId: org.id, name: `${year}` } },
    update: {},
    create: {
      organizationId: org.id,
      name: `${year}`,
      startDate: new Date(`${year}-01-01T00:00:00Z`),
      endDate: new Date(`${year}-12-31T23:59:59Z`),
      isClosed: false,
    },
  });
  console.log(`  ✓ Exercice fiscal ${year}`);

  console.log('✅ Seed terminé');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
