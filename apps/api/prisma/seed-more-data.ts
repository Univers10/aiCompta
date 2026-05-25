import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding more financial data...');

  const orgId = 'dev-org';
  const userId = 'dev-user';

  const fiscalYear = await prisma.fiscalYear.findFirst({
    where: { organizationId: orgId },
  });

  if (!fiscalYear) {
    throw new Error('Fiscal year not found');
  }

  // Salaires janvier
  const entry4 = await prisma.journalEntry.create({
    data: {
      organizationId: orgId,
      fiscalYearId: fiscalYear.id,
      createdById: userId,
      journal: 'BANK',
      date: new Date('2024-01-31'),
      reference: 'SAL001',
      description: 'Salaires janvier 2024',
    },
  });

  await prisma.journalLine.createMany({
    data: [
      {
        journalEntryId: entry4.id,
        organizationId: orgId,
        accountCode: '622000',
        accountLabel: 'Rémunérations du personnel',
        lineType: 'DEBIT',
        amount: new Decimal('800000'),
        amountXof: new Decimal('800000'),
      },
      {
        journalEntryId: entry4.id,
        organizationId: orgId,
        accountCode: '512000',
        accountLabel: 'Banque',
        lineType: 'CREDIT',
        amount: new Decimal('800000'),
        amountXof: new Decimal('800000'),
      },
    ],
  });

  // Charges sociales
  const entry5 = await prisma.journalEntry.create({
    data: {
      organizationId: orgId,
      fiscalYearId: fiscalYear.id,
      createdById: userId,
      journal: 'BANK',
      date: new Date('2024-01-31'),
      reference: 'SOC001',
      description: 'Charges sociales janvier',
    },
  });

  await prisma.journalLine.createMany({
    data: [
      {
        journalEntryId: entry5.id,
        organizationId: orgId,
        accountCode: '624000',
        accountLabel: 'Charges sociales',
        lineType: 'DEBIT',
        amount: new Decimal('200000'),
        amountXof: new Decimal('200000'),
      },
      {
        journalEntryId: entry5.id,
        organizationId: orgId,
        accountCode: '431000',
        accountLabel: 'Sécurité sociale',
        lineType: 'CREDIT',
        amount: new Decimal('200000'),
        amountXof: new Decimal('200000'),
      },
    ],
  });

  // Vente supplémentaire
  const entry6 = await prisma.journalEntry.create({
    data: {
      organizationId: orgId,
      fiscalYearId: fiscalYear.id,
      createdById: userId,
      journal: 'SALES',
      date: new Date('2024-02-15'),
      reference: 'VTE003',
      description: 'Vente marchandises février',
    },
  });

  await prisma.journalLine.createMany({
    data: [
      {
        journalEntryId: entry6.id,
        organizationId: orgId,
        accountCode: '411000',
        accountLabel: 'Clients',
        lineType: 'DEBIT',
        amount: new Decimal('1180000'),
        amountXof: new Decimal('1180000'),
      },
      {
        journalEntryId: entry6.id,
        organizationId: orgId,
        accountCode: '701000',
        accountLabel: 'Ventes de marchandises',
        lineType: 'CREDIT',
        amount: new Decimal('1000000'),
        amountXof: new Decimal('1000000'),
      },
      {
        journalEntryId: entry6.id,
        organizationId: orgId,
        accountCode: '445100',
        accountLabel: 'TVA collectée',
        lineType: 'CREDIT',
        amount: new Decimal('180000'),
        amountXof: new Decimal('180000'),
      },
    ],
  });

  // Frais bancaires
  const entry7 = await prisma.journalEntry.create({
    data: {
      organizationId: orgId,
      fiscalYearId: fiscalYear.id,
      createdById: userId,
      journal: 'BANK',
      date: new Date('2024-02-28'),
      reference: 'BNK001',
      description: 'Frais bancaires février',
    },
  });

  await prisma.journalLine.createMany({
    data: [
      {
        journalEntryId: entry7.id,
        organizationId: orgId,
        accountCode: '627000',
        accountLabel: 'Services bancaires',
        lineType: 'DEBIT',
        amount: new Decimal('15000'),
        amountXof: new Decimal('15000'),
      },
      {
        journalEntryId: entry7.id,
        organizationId: orgId,
        accountCode: '512000',
        accountLabel: 'Banque',
        lineType: 'CREDIT',
        amount: new Decimal('15000'),
        amountXof: new Decimal('15000'),
      },
    ],
  });

  // Capital social (ouverture)
  const entry8 = await prisma.journalEntry.create({
    data: {
      organizationId: orgId,
      fiscalYearId: fiscalYear.id,
      createdById: userId,
      journal: 'BANK',
      date: new Date('2024-01-01'),
      reference: 'OUV001',
      description: 'Apport en capital',
    },
  });

  await prisma.journalLine.createMany({
    data: [
      {
        journalEntryId: entry8.id,
        organizationId: orgId,
        accountCode: '512000',
        accountLabel: 'Banque',
        lineType: 'DEBIT',
        amount: new Decimal('5000000'),
        amountXof: new Decimal('5000000'),
      },
      {
        journalEntryId: entry8.id,
        organizationId: orgId,
        accountCode: '101000',
        accountLabel: 'Capital social',
        lineType: 'CREDIT',
        amount: new Decimal('5000000'),
        amountXof: new Decimal('5000000'),
      },
    ],
  });

  console.log('✅ Added 5 more journal entries');
  console.log('📊 New totals:');
  console.log('  - Capital: 5,000,000 FCFA');
  console.log('  - Sales: 1,500,000 FCFA');
  console.log('  - Purchases: 400,000 FCFA');
  console.log('  - Salaries: 800,000 FCFA');
  console.log('  - Social charges: 200,000 FCFA');
  console.log('  - Bank fees: 15,000 FCFA');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
