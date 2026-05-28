import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Créer l'organisation dev
  const org = await prisma.organization.upsert({
    where: { slug: 'dev-org' },
    update: {},
    create: {
      id: 'dev-org',
      name: 'Dev Organization',
      slug: 'dev-org',
    },
  });
  console.log('✅ Organisation dev créée:', org.id);

  // Créer l'utilisateur dev
  const user = await prisma.user.upsert({
    where: { email: 'dev@test.com' },
    update: {},
    create: {
      id: 'dev-user',
      email: 'dev@test.com',
      name: 'Dev User',
    },
  });
  console.log('✅ Utilisateur dev créé:', user.id);

  // Créer le membership
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  });
  console.log('✅ Membership créé');

  // Créer un exercice fiscal pour 2026
  const fiscalYear = await prisma.fiscalYear.upsert({
    where: { organizationId_name: { organizationId: org.id, name: '2026' } },
    update: {},
    create: {
      organizationId: org.id,
      name: '2026',
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-12-31T23:59:59Z'),
      isClosed: false,
    },
  });
  console.log('✅ Exercice fiscal 2026 créé:', fiscalYear.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
