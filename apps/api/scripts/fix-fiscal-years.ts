import { prisma } from '../src/lib/db/prisma';

async function main() {
  console.log('🔧 Correction des exercices fiscaux des écritures...\n');

  // Trouver l'exercice 2026
  const fiscalYear2026 = await prisma.fiscalYear.findFirst({
    where: {
      organizationId: 'dev-org',
      startDate: new Date('2026-01-01'),
    },
  });

  if (!fiscalYear2026) {
    console.error('❌ Exercice fiscal 2026 non trouvé');
    return;
  }

  console.log(`📅 Exercice fiscal 2026: ${fiscalYear2026.name} (${fiscalYear2026.id})\n`);

  // Trouver les écritures de 2026 dans le mauvais exercice
  const entries = await prisma.journalEntry.findMany({
    where: {
      organizationId: 'dev-org',
      date: {
        gte: new Date('2026-01-01'),
        lte: new Date('2026-12-31'),
      },
      fiscalYearId: { not: fiscalYear2026.id },
    },
  });

  console.log(`📝 Écritures à corriger: ${entries.length}\n`);

  if (entries.length === 0) {
    console.log('✅ Aucune écriture à corriger');
    return;
  }

  // Corriger chaque écriture
  for (const entry of entries) {
    console.log(`   Correction: ${entry.date.toISOString().split('T')[0]} ${entry.reference}`);
    await prisma.journalEntry.update({
      where: { id: entry.id },
      data: { fiscalYearId: fiscalYear2026.id },
    });
  }

  console.log(`\n✅ ${entries.length} écritures corrigées`);

  // Vérification
  const correctedEntries = await prisma.journalEntry.findMany({
    where: {
      organizationId: 'dev-org',
      fiscalYearId: fiscalYear2026.id,
    },
  });

  console.log(`\n✅ Total des écritures dans l'exercice 2026: ${correctedEntries.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
