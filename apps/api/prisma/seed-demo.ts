import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  const orgId = 'dev-org';
  const userId = 'dev-user';

  // Mettre à jour l'organisation
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: 'SARL TechCorp',
      slug: 'techcorp',
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: 'Marie Dupont',
    },
  });

  // Exercice fiscal
  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      organizationId: orgId,
      name: 'Exercice 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isClosed: false,
    },
  });

  console.log('✅ Fiscal year created');

  // Document 1: Achat
  const doc1 = await prisma.document.create({
    data: {
      organizationId: orgId,
      fileName: 'facture_fournisseur_001.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 125000,
      fileHash: 'abc123',
      fileUrl: '/uploads/demo/facture_001.pdf',
      status: 'VALIDATED',
      totalHT: new Decimal('250000'),
      totalTVA: new Decimal('45000'),
      totalTTC: new Decimal('295000'),
      invoiceDate: new Date('2024-01-15'),
      invoiceNumber: 'FAC-001',
    },
  });

  const entry1 = await prisma.journalEntry.create({
    data: {
      organizationId: orgId,
      fiscalYearId: fiscalYear.id,
      documentId: doc1.id,
      createdById: userId,
      journal: 'PURCHASE',
      date: new Date('2024-01-15'),
      reference: 'ACH001',
      description: 'Achat matériel informatique',
    },
  });

  await prisma.journalLine.create({
    data: {
      journalEntryId: entry1.id,
      organizationId: orgId,
      accountCode: '604000',
      accountLabel: 'Achats de matières',
      lineType: 'DEBIT',
      amount: new Decimal('250000'),
      amountXof: new Decimal('250000'),
    },
  });

  await prisma.journalLine.create({
    data: {
      journalEntryId: entry1.id,
      organizationId: orgId,
      accountCode: '445200',
      accountLabel: 'TVA déductible',
      lineType: 'DEBIT',
      amount: new Decimal('45000'),
      amountXof: new Decimal('45000'),
    },
  });

  await prisma.journalLine.create({
    data: {
      journalEntryId: entry1.id,
      organizationId: orgId,
      accountCode: '401000',
      accountLabel: 'Fournisseurs',
      lineType: 'CREDIT',
      amount: new Decimal('295000'),
      amountXof: new Decimal('295000'),
    },
  });

  console.log('✅ Document 1 created');

  // Document 2: Vente
  const doc2 = await prisma.document.create({
    data: {
      organizationId: orgId,
      fileName: 'facture_client_002.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 98000,
      fileHash: 'def456',
      fileUrl: '/uploads/demo/facture_002.pdf',
      status: 'VALIDATED',
      totalHT: new Decimal('500000'),
      totalTVA: new Decimal('90000'),
      totalTTC: new Decimal('590000'),
      invoiceDate: new Date('2024-01-20'),
      invoiceNumber: 'VTE-001',
    },
  });

  const entry2 = await prisma.journalEntry.create({
    data: {
      organizationId: orgId,
      fiscalYearId: fiscalYear.id,
      documentId: doc2.id,
      createdById: userId,
      journal: 'SALES',
      date: new Date('2024-01-20'),
      reference: 'VTE001',
      description: 'Prestation de services',
    },
  });

  await prisma.journalLine.create({
    data: {
      journalEntryId: entry2.id,
      organizationId: orgId,
      accountCode: '411000',
      accountLabel: 'Clients',
      lineType: 'DEBIT',
      amount: new Decimal('590000'),
      amountXof: new Decimal('590000'),
    },
  });

  await prisma.journalLine.create({
    data: {
      journalEntryId: entry2.id,
      organizationId: orgId,
      accountCode: '706000',
      accountLabel: 'Prestations de services',
      lineType: 'CREDIT',
      amount: new Decimal('500000'),
      amountXof: new Decimal('500000'),
    },
  });

  await prisma.journalLine.create({
    data: {
      journalEntryId: entry2.id,
      organizationId: orgId,
      accountCode: '445100',
      accountLabel: 'TVA collectée',
      lineType: 'CREDIT',
      amount: new Decimal('90000'),
      amountXof: new Decimal('90000'),
    },
  });

  console.log('✅ Document 2 created');

  // Document 3: Loyer
  const doc3 = await prisma.document.create({
    data: {
      organizationId: orgId,
      fileName: 'loyer_fevrier_2024.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 75000,
      fileHash: 'ghi789',
      fileUrl: '/uploads/demo/loyer.pdf',
      status: 'VALIDATED',
      totalHT: new Decimal('150000'),
      totalTVA: new Decimal('0'),
      totalTTC: new Decimal('150000'),
      invoiceDate: new Date('2024-02-01'),
      invoiceNumber: 'LOYER-02',
    },
  });

  const entry3 = await prisma.journalEntry.create({
    data: {
      organizationId: orgId,
      fiscalYearId: fiscalYear.id,
      documentId: doc3.id,
      createdById: userId,
      journal: 'PURCHASE',
      date: new Date('2024-02-01'),
      reference: 'ACH002',
      description: 'Loyer février 2024',
    },
  });

  await prisma.journalLine.create({
    data: {
      journalEntryId: entry3.id,
      organizationId: orgId,
      accountCode: '613000',
      accountLabel: 'Locations',
      lineType: 'DEBIT',
      amount: new Decimal('150000'),
      amountXof: new Decimal('150000'),
    },
  });

  await prisma.journalLine.create({
    data: {
      journalEntryId: entry3.id,
      organizationId: orgId,
      accountCode: '512000',
      accountLabel: 'Banque',
      lineType: 'CREDIT',
      amount: new Decimal('150000'),
      amountXof: new Decimal('150000'),
    },
  });

  console.log('✅ Document 3 created');

  // Chat thread
  const chatThread = await prisma.chatThread.create({
    data: {
      organizationId: orgId,
      userId: userId,
      title: 'Questions sur la TVA',
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        threadId: chatThread.id,
        organizationId: orgId,
        role: 'user',
        content: 'Comment calculer la TVA déductible sur mes achats ?',
      },
      {
        threadId: chatThread.id,
        organizationId: orgId,
        role: 'assistant',
        content: 'La TVA déductible se calcule sur vos achats professionnels. En SYSCOHADA, elle est enregistrée au compte 445200. Le taux standard est de 18%. Pour un achat de 100 000 FCFA HT, la TVA déductible sera de 18 000 FCFA.',
      },
    ],
  });

  console.log('✅ Chat thread created');
  console.log('');
  console.log('📊 Demo data summary:');
  console.log('  - Organization: SARL TechCorp');
  console.log('  - User: Marie Dupont');
  console.log('  - Fiscal year: 2024');
  console.log('  - 3 documents with journal entries');
  console.log('  - 1 chat thread');
  console.log('');
  console.log('💰 Financial data:');
  console.log('  - Purchases: 400,000 FCFA');
  console.log('  - Sales: 500,000 FCFA');
  console.log('  - TVA collected: 90,000 FCFA');
  console.log('  - TVA deductible: 45,000 FCFA');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
