import { prisma } from '../src/lib/db/prisma';

async function main() {
  console.log('🔍 Vérification des données...\n');

  // Exercices fiscaux
  const fiscalYears = await prisma.fiscalYear.findMany({
    where: { organizationId: 'dev-org' },
  });
  console.log(`📅 Exercices fiscaux: ${fiscalYears.length}`);
  fiscalYears.forEach(fy => {
    console.log(`   - ${fy.name}: ${fy.startDate.toISOString().split('T')[0]} → ${fy.endDate.toISOString().split('T')[0]}`);
  });

  // Documents
  const documents = await prisma.document.findMany({
    where: { organizationId: 'dev-org' },
  });
  console.log(`\n📄 Documents: ${documents.length}`);
  documents.forEach(doc => {
    console.log(`   - ${doc.fileName} (${doc.status})`);
  });

  // Écritures comptables
  const entries = await prisma.journalEntry.findMany({
    where: { organizationId: 'dev-org' },
    include: { lines: true },
  });
  console.log(`\n📝 Écritures comptables: ${entries.length}`);
  entries.forEach(entry => {
    console.log(`   - ${entry.date.toISOString().split('T')[0]} ${entry.reference} (${entry.lines.length} lignes)`);
  });

  // Lignes comptables
  const lines = await prisma.journalLine.findMany({
    where: { organizationId: 'dev-org' },
  });
  console.log(`\n📊 Lignes comptables: ${lines.length}`);
  
  if (lines.length > 0) {
    console.log('\n   Comptes utilisés:');
    const accounts = new Map<string, number>();
    lines.forEach(line => {
      accounts.set(line.accountCode, (accounts.get(line.accountCode) || 0) + 1);
    });
    accounts.forEach((count, code) => {
      console.log(`   - ${code}: ${count} lignes`);
    });
  }

  // Fournisseurs
  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: 'dev-org' },
  });
  console.log(`\n🏢 Fournisseurs: ${suppliers.length}`);
  suppliers.forEach(s => {
    console.log(`   - ${s.name} (${s.taxId || 'sans TVA'})`);
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
