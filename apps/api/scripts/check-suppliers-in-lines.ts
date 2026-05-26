import { prisma } from '../src/lib/db/prisma';

async function main() {
  console.log('🔍 Vérification des fournisseurs dans les lignes comptables...\n');

  const lines = await prisma.journalLine.findMany({
    where: {
      organizationId: 'dev-org',
      entry: {
        fiscalYearId: '50020b6a-df6e-44cc-95c7-3e6b4ce91844', // 2026
      },
    },
    include: {
      supplier: true,
      customer: true,
      entry: true,
    },
    orderBy: [
      { accountCode: 'asc' },
      { supplierId: 'asc' },
    ],
  });

  console.log(`📊 Total lignes en 2026: ${lines.length}\n`);

  // Grouper par compte
  const byAccount = new Map<string, typeof lines>();
  lines.forEach(line => {
    const existing = byAccount.get(line.accountCode) || [];
    existing.push(line);
    byAccount.set(line.accountCode, existing);
  });

  byAccount.forEach((accountLines, accountCode) => {
    console.log(`\n📌 Compte ${accountCode} : ${accountLines.length} lignes`);
    
    // Grouper par fournisseur
    const bySupplier = new Map<string, typeof accountLines>();
    accountLines.forEach(line => {
      const key = line.supplierId || line.customerId || 'none';
      const existing = bySupplier.get(key) || [];
      existing.push(line);
      bySupplier.set(key, existing);
    });

    bySupplier.forEach((supplierLines, supplierId) => {
      const supplier = supplierLines[0].supplier;
      const customer = supplierLines[0].customer;
      const name = supplier?.name || customer?.name || 'Sans tiers';
      
      const totalDebit = supplierLines
        .filter(l => l.lineType === 'DEBIT')
        .reduce((sum, l) => sum + parseFloat(l.amountXof.toString()), 0);
      
      const totalCredit = supplierLines
        .filter(l => l.lineType === 'CREDIT')
        .reduce((sum, l) => sum + parseFloat(l.amountXof.toString()), 0);

      console.log(`   - ${name} (${supplierId})`);
      console.log(`     ${supplierLines.length} lignes | Débit: ${totalDebit} | Crédit: ${totalCredit}`);
    });
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
