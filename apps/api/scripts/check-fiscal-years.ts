import { prisma } from '../src/lib/db/prisma';

async function main() {
  console.log('🔍 Vérification des exercices fiscaux des écritures...\n');

  const entries = await prisma.journalEntry.findMany({
    where: {
      date: { gte: new Date('2026-01-01') },
    },
    include: { fiscalYear: true },
  });

  console.log(`📝 Écritures avec date >= 2026-01-01: ${entries.length}\n`);
  
  entries.forEach(e => {
    console.log(`- ${e.date.toISOString().split('T')[0]} ${e.reference}`);
    console.log(`  Exercice fiscal: ${e.fiscalYear.name} (${e.fiscalYear.startDate.toISOString().split('T')[0]} → ${e.fiscalYear.endDate.toISOString().split('T')[0]})`);
    console.log(`  ID exercice: ${e.fiscalYearId}\n`);
  });

  // Exercices fiscaux disponibles
  const fiscalYears = await prisma.fiscalYear.findMany({
    where: { organizationId: 'dev-org' },
  });

  console.log(`\n📅 Exercices fiscaux disponibles:`);
  fiscalYears.forEach(fy => {
    console.log(`- ${fy.name} (ID: ${fy.id})`);
    console.log(`  ${fy.startDate.toISOString().split('T')[0]} → ${fy.endDate.toISOString().split('T')[0]}\n`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
