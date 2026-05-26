import { prisma } from '../src/lib/db/prisma';

async function main() {
  console.log('🔧 Initialisation des exercices fiscaux...');

  // Vérifier si l'exercice 2026 existe
  const existing2026 = await prisma.fiscalYear.findFirst({
    where: {
      organizationId: 'dev-org',
      startDate: new Date('2026-01-01'),
    },
  });

  if (existing2026) {
    console.log('✅ Exercice fiscal 2026 existe déjà:', existing2026);
    return;
  }

  // Créer un exercice fiscal pour 2026
  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      organizationId: 'dev-org',
      name: 'Exercice 2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isClosed: false,
    },
  });

  console.log('✅ Exercice fiscal 2026 créé:', fiscalYear);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
