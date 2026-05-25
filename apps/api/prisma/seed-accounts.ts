import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding chart of accounts...');

  const orgId = 'dev-org';

  // Plan comptable SYSCOHADA complet
  const accounts = [
    // Classe 1 - Capitaux
    { code: '101000', label: 'Capital social', type: 'EQUITY' as const },
    { code: '106000', label: 'Réserves', type: 'EQUITY' },
    { code: '110000', label: 'Report à nouveau créditeur', type: 'EQUITY' },
    { code: '120000', label: 'Résultat de l\'exercice', type: 'EQUITY' },
    { code: '161000', label: 'Emprunts bancaires', type: 'LIABILITY' },
    
    // Classe 2 - Immobilisations
    { code: '211000', label: 'Terrains', type: 'ASSET' },
    { code: '231000', label: 'Bâtiments', type: 'ASSET' },
    { code: '241000', label: 'Matériel et outillage', type: 'ASSET' },
    { code: '244000', label: 'Matériel de bureau', type: 'ASSET' },
    { code: '245000', label: 'Matériel informatique', type: 'ASSET' },
    { code: '281000', label: 'Amortissements des immobilisations', type: 'ASSET' },
    
    // Classe 3 - Stocks
    { code: '311000', label: 'Marchandises', type: 'ASSET' },
    { code: '321000', label: 'Matières premières', type: 'ASSET' },
    
    // Classe 4 - Tiers
    { code: '401000', label: 'Fournisseurs', type: 'LIABILITY' },
    { code: '411000', label: 'Clients', type: 'ASSET' },
    { code: '421000', label: 'Personnel - Rémunérations dues', type: 'LIABILITY' },
    { code: '431000', label: 'Sécurité sociale', type: 'LIABILITY' },
    { code: '441000', label: 'État - Impôts sur les bénéfices', type: 'LIABILITY' },
    { code: '445100', label: 'État - TVA collectée', type: 'LIABILITY' },
    { code: '445200', label: 'État - TVA déductible', type: 'ASSET' },
    { code: '445700', label: 'État - TVA à payer', type: 'LIABILITY' },
    { code: '471000', label: 'Débiteurs divers', type: 'ASSET' },
    { code: '472000', label: 'Créditeurs divers', type: 'LIABILITY' },
    
    // Classe 5 - Trésorerie
    { code: '512000', label: 'Banque', type: 'ASSET' },
    { code: '531000', label: 'Caisse', type: 'ASSET' },
    { code: '581000', label: 'Virements internes', type: 'ASSET' },
    
    // Classe 6 - Charges
    { code: '601000', label: 'Achats de marchandises', type: 'EXPENSE' },
    { code: '602000', label: 'Achats de matières premières', type: 'EXPENSE' },
    { code: '604000', label: 'Achats de matières et fournitures', type: 'EXPENSE' },
    { code: '605000', label: 'Autres achats', type: 'EXPENSE' },
    { code: '611000', label: 'Transports', type: 'EXPENSE' },
    { code: '613000', label: 'Locations', type: 'EXPENSE' },
    { code: '615000', label: 'Entretien et réparations', type: 'EXPENSE' },
    { code: '618000', label: 'Documentation', type: 'EXPENSE' },
    { code: '622000', label: 'Rémunérations du personnel', type: 'EXPENSE' },
    { code: '624000', label: 'Charges sociales', type: 'EXPENSE' },
    { code: '627000', label: 'Services bancaires', type: 'EXPENSE' },
    { code: '631000', label: 'Impôts et taxes', type: 'EXPENSE' },
    { code: '661000', label: 'Charges d\'intérêts', type: 'EXPENSE' },
    { code: '681000', label: 'Dotations aux amortissements', type: 'EXPENSE' },
    
    // Classe 7 - Produits
    { code: '701000', label: 'Ventes de marchandises', type: 'REVENUE' },
    { code: '702000', label: 'Ventes de produits finis', type: 'REVENUE' },
    { code: '706000', label: 'Prestations de services', type: 'REVENUE' },
    { code: '707000', label: 'Produits accessoires', type: 'REVENUE' },
    { code: '771000', label: 'Produits financiers', type: 'REVENUE' },
    { code: '781000', label: 'Reprises sur amortissements', type: 'REVENUE' },
  ];

  for (const acc of accounts) {
    await prisma.chartOfAccount.upsert({
      where: {
        organizationId_code: {
          organizationId: orgId,
          code: acc.code,
        },
      },
      update: {},
      create: {
        organizationId: orgId,
        code: acc.code,
        label: acc.label,
        type: acc.type,
      },
    });
  }

  console.log(`✅ Created ${accounts.length} accounts in chart of accounts`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
