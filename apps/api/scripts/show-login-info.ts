import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📋 Informations de connexion\n');

  const orgs = await prisma.organization.findMany({
    include: {
      memberships: {
        include: {
          user: true,
        },
      },
    },
  });

  for (const org of orgs) {
    console.log(`🏢 Organisation: ${org.name}`);
    console.log(`   ID: ${org.id}`);
    console.log(`   Slug: ${org.slug}`);
    console.log(`   Membres:`);
    
    for (const membership of org.memberships) {
      console.log(`   - ${membership.user.email} (${membership.role})`);
      console.log(`     User ID: ${membership.user.id}`);
    }
    console.log('');
  }

  const fiscalYears = await prisma.fiscalYear.findMany({
    include: {
      organization: true,
    },
  });

  console.log('📅 Exercices fiscaux:');
  for (const fy of fiscalYears) {
    console.log(`   ${fy.name} - ${fy.organization.name}`);
    console.log(`   Du ${fy.startDate.toISOString().split('T')[0]} au ${fy.endDate.toISOString().split('T')[0]}`);
    console.log(`   ID: ${fy.id}`);
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
