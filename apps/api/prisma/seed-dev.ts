import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating dev user and organization...');
  
  // Créer l'organisation dev
  const org = await prisma.organization.upsert({
    where: { id: 'dev-org' },
    update: {},
    create: {
      id: 'dev-org',
      name: 'Dev Organization',
      slug: 'dev-org',
    },
  });

  // Créer l'utilisateur dev
  const user = await prisma.user.upsert({
    where: { id: 'dev-user' },
    update: {},
    create: {
      id: 'dev-user',
      email: 'dev@test.com',
      name: 'Dev User',
    },
  });

  // Créer le membership
  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  });

  console.log('✅ Dev user and organization created!');
  console.log('User:', user.email);
  console.log('Organization:', org.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
