import { prisma } from '../src/lib/db/prisma';
import { generateBalance } from '../src/lib/accounting/reports';

async function main() {
  console.log('🧪 Test de la balance...\n');

  // Trouver l'exercice 2026
  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: {
      organizationId: 'dev-org',
      startDate: new Date('2026-01-01'),
    },
  });

  if (!fiscalYear) {
    console.error('❌ Exercice fiscal 2026 non trouvé');
    return;
  }

  console.log(`📅 Exercice fiscal: ${fiscalYear.name} (${fiscalYear.id})`);
  console.log(`   Du ${fiscalYear.startDate.toISOString().split('T')[0]} au ${fiscalYear.endDate.toISOString().split('T')[0]}\n`);

  // Vérifier les écritures dans cet exercice
  const entries = await prisma.journalEntry.findMany({
    where: {
      organizationId: 'dev-org',
      fiscalYearId: fiscalYear.id,
    },
    include: { lines: true },
  });

  console.log(`📝 Écritures dans l'exercice 2026: ${entries.length}`);
  entries.forEach(entry => {
    console.log(`   - ${entry.date.toISOString().split('T')[0]} ${entry.reference} (${entry.lines.length} lignes)`);
  });

  // Vérifier les lignes
  const lines = await prisma.journalLine.findMany({
    where: {
      organizationId: 'dev-org',
      entry: {
        fiscalYearId: fiscalYear.id,
      },
    },
  });

  console.log(`\n📊 Lignes comptables dans l'exercice 2026: ${lines.length}`);

  // Générer la balance
  console.log('\n🔄 Génération de la balance...');
  const balance = await generateBalance('dev-org', fiscalYear.id);

  console.log(`\n✅ Balance générée: ${balance.length} comptes`);
  balance.forEach(acc => {
    console.log(`   - ${acc.accountCode} ${acc.accountLabel}: Débit ${acc.debit}, Crédit ${acc.credit}, Solde ${acc.balance}`);
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
