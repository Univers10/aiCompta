import { prisma } from '../src/lib/db/prisma';

async function main() {
  console.log('🔧 Ajout des liens fournisseurs aux lignes comptables...\n');

  // Récupérer toutes les écritures avec leurs documents
  const entries = await prisma.journalEntry.findMany({
    where: {
      organizationId: 'dev-org',
    },
    include: {
      document: {
        include: {
          supplier: true,
        },
      },
      lines: true,
    },
  });

  console.log(`📝 Écritures trouvées: ${entries.length}\n`);

  let updated = 0;

  for (const entry of entries) {
    if (!entry.document?.supplier) {
      console.log(`⏭️  Écriture ${entry.reference}: pas de fournisseur lié`);
      continue;
    }

    const supplierId = entry.document.supplier.id;
    const supplierName = entry.document.supplier.name;

    console.log(`🔄 Écriture ${entry.reference}: ${supplierName}`);

    // Mettre à jour toutes les lignes de cette écriture
    const result = await prisma.journalLine.updateMany({
      where: {
        journalEntryId: entry.id,
      },
      data: {
        supplierId: supplierId,
      },
    });

    console.log(`   ✅ ${result.count} lignes mises à jour`);
    updated += result.count;
  }

  console.log(`\n✅ Total: ${updated} lignes mises à jour`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
