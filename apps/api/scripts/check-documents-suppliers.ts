import { prisma } from '../src/lib/db/prisma';

async function main() {
  console.log('🔍 Vérification des documents et leurs fournisseurs...\n');

  const documents = await prisma.document.findMany({
    where: {
      organizationId: 'dev-org',
    },
    include: {
      supplier: true,
      journalEntries: true,
    },
  });

  console.log(`📄 Documents: ${documents.length}\n`);

  documents.forEach(doc => {
    console.log(`- ${doc.fileName}`);
    console.log(`  Fournisseur: ${doc.supplier?.name || 'AUCUN'}`);
    console.log(`  Écritures: ${doc.journalEntries.length}`);
    console.log(`  supplierId dans doc: ${doc.supplierId || 'null'}\n`);
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
