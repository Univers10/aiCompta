/**
 * Seed SYSCOHADA 2025
 * Pré-charge le plan comptable SYSCOHADA (120 comptes essentiels)
 * et les configurations de base pour une nouvelle organisation
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Plan comptable SYSCOHADA 2025 - 120 comptes essentiels
const SYSCOHADA_CHART_OF_ACCOUNTS = [
  // CLASSE 1 - COMPTES DE RESSOURCES DURABLES
  { code: '101', label: 'Capital social', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '104', label: 'Compte de l\'exploitant', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '105', label: 'Primes liées aux capitaux propres', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '111', label: 'Réserve légale', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '118', label: 'Autres réserves', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '121', label: 'Report à nouveau créditeur', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '129', label: 'Report à nouveau débiteur', class: 'CLASS_1', normalBalance: 'DEBIT', parentCode: null },
  { code: '130', label: 'Résultat en instance d\'affectation', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '131', label: 'Résultat net : Bénéfice', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '139', label: 'Résultat net : Perte', class: 'CLASS_1', normalBalance: 'DEBIT', parentCode: null },
  { code: '141', label: 'Subventions d\'équipement', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '162', label: 'Emprunts auprès des établissements de crédit', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '164', label: 'Avances reçues et comptes courants bloqués', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '165', label: 'Dépôts et cautionnements reçus', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '166', label: 'Intérêts courus', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '168', label: 'Autres emprunts et dettes', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '191', label: 'Provisions pour litiges', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },
  { code: '198', label: 'Autres provisions financières', class: 'CLASS_1', normalBalance: 'CREDIT', parentCode: null },

  // CLASSE 2 - COMPTES D'ACTIF IMMOBILISÉ
  { code: '211', label: 'Frais de recherche et de développement', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '212', label: 'Brevets, licences, concessions et droits similaires', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '213', label: 'Logiciels', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '215', label: 'Fonds commercial', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '221', label: 'Terrains agricoles et forestiers', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '222', label: 'Terrains nus', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '223', label: 'Terrains bâtis', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '231', label: 'Bâtiments industriels, agricoles, administratifs sur sol propre', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '233', label: 'Ouvrages d\'infrastructure', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '234', label: 'Installations techniques', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '241', label: 'Matériel et outillage industriel et commercial', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '244', label: 'Matériel et mobilier de bureau', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '245', label: 'Matériel de transport', class: 'CLASS_2', normalBalance: 'DEBIT', parentCode: null },
  { code: '281', label: 'Amortissements des immobilisations incorporelles', class: 'CLASS_2', normalBalance: 'CREDIT', parentCode: null },
  { code: '283', label: 'Amortissements des bâtiments', class: 'CLASS_2', normalBalance: 'CREDIT', parentCode: null },
  { code: '284', label: 'Amortissements du matériel', class: 'CLASS_2', normalBalance: 'CREDIT', parentCode: null },

  // CLASSE 3 - COMPTES DE STOCKS
  { code: '311', label: 'Marchandises A', class: 'CLASS_3', normalBalance: 'DEBIT', parentCode: null },
  { code: '312', label: 'Marchandises B', class: 'CLASS_3', normalBalance: 'DEBIT', parentCode: null },
  { code: '321', label: 'Matières A', class: 'CLASS_3', normalBalance: 'DEBIT', parentCode: null },
  { code: '322', label: 'Matières B', class: 'CLASS_3', normalBalance: 'DEBIT', parentCode: null },
  { code: '331', label: 'Matières consommables', class: 'CLASS_3', normalBalance: 'DEBIT', parentCode: null },
  { code: '335', label: 'Emballages', class: 'CLASS_3', normalBalance: 'DEBIT', parentCode: null },
  { code: '361', label: 'Produits finis A', class: 'CLASS_3', normalBalance: 'DEBIT', parentCode: null },
  { code: '362', label: 'Produits finis B', class: 'CLASS_3', normalBalance: 'DEBIT', parentCode: null },
  { code: '391', label: 'Dépréciations des stocks de marchandises', class: 'CLASS_3', normalBalance: 'CREDIT', parentCode: null },
  { code: '392', label: 'Dépréciations des stocks de matières premières', class: 'CLASS_3', normalBalance: 'CREDIT', parentCode: null },

  // CLASSE 4 - COMPTES DE TIERS
  { code: '401', label: 'Fournisseurs, dettes en compte', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null, isTiers: true, requiresTiers: true },
  { code: '402', label: 'Fournisseurs, effets à payer', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null, isTiers: true },
  { code: '408', label: 'Fournisseurs, factures non parvenues', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null, isTiers: true },
  { code: '409', label: 'Fournisseurs débiteurs (avances versées)', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: null, isTiers: true },
  { code: '411', label: 'Clients', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: null, isTiers: true, requiresTiers: true },
  { code: '412', label: 'Clients, effets à recevoir', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: null, isTiers: true },
  { code: '416', label: 'Créances clients litigieuses ou douteuses', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: null, isTiers: true },
  { code: '418', label: 'Clients, produits à recevoir', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: null, isTiers: true },
  { code: '419', label: 'Clients créditeurs (avances reçues)', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null, isTiers: true },
  { code: '421', label: 'Personnel, avances et acomptes', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: null },
  { code: '422', label: 'Personnel, rémunérations dues', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '428', label: 'Personnel, charges à payer', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '431', label: 'Sécurité sociale', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '438', label: 'Organismes sociaux, charges à payer', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '441', label: 'État, impôt sur les bénéfices', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '442', label: 'État, autres impôts et taxes', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '4431', label: 'État, TVA facturée sur ventes', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: '443' },
  { code: '4441', label: 'État, TVA due', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: '444' },
  { code: '4449', label: 'État, crédit de TVA à reporter', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: '444' },
  { code: '4452', label: 'État, TVA récupérable sur achats', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: '445' },
  { code: '447', label: 'État, impôts retenus à la source', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '449', label: 'État, créances et dettes diverses', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '471', label: 'Comptes d\'attente', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: null },
  { code: '476', label: 'Charges constatées d\'avance', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: null },
  { code: '477', label: 'Produits constatés d\'avance', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '478', label: 'Écarts de conversion - Actif', class: 'CLASS_4', normalBalance: 'DEBIT', parentCode: null },
  { code: '479', label: 'Écarts de conversion - Passif', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '491', label: 'Dépréciations des comptes clients', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },
  { code: '499', label: 'Risques provisionnés', class: 'CLASS_4', normalBalance: 'CREDIT', parentCode: null },

  // CLASSE 5 - COMPTES DE TRÉSORERIE
  { code: '521', label: 'Banques locales', class: 'CLASS_5', normalBalance: 'DEBIT', parentCode: null },
  { code: '522', label: 'Banques autres États région', class: 'CLASS_5', normalBalance: 'DEBIT', parentCode: null },
  { code: '526', label: 'Banques, intérêts courus', class: 'CLASS_5', normalBalance: 'DEBIT', parentCode: null },
  { code: '531', label: 'Chèques postaux', class: 'CLASS_5', normalBalance: 'DEBIT', parentCode: null },
  { code: '532', label: 'Trésor', class: 'CLASS_5', normalBalance: 'DEBIT', parentCode: null },
  { code: '561', label: 'Crédits de trésorerie', class: 'CLASS_5', normalBalance: 'CREDIT', parentCode: null },
  { code: '565', label: 'Escompte de crédits ordinaires', class: 'CLASS_5', normalBalance: 'CREDIT', parentCode: null },
  { code: '571', label: 'Caisse siège social', class: 'CLASS_5', normalBalance: 'DEBIT', parentCode: null },
  { code: '572', label: 'Caisse succursale', class: 'CLASS_5', normalBalance: 'DEBIT', parentCode: null },

  // CLASSE 6 - COMPTES DE CHARGES
  { code: '601', label: 'Achats de marchandises', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '602', label: 'Achats de matières premières', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '603', label: 'Variations des stocks de biens achetés', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '604', label: 'Achats stockés de matières et fournitures consommables', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '605', label: 'Autres achats', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '608', label: 'Achats d\'emballages', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '611', label: 'Transports sur achats', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '612', label: 'Transports sur ventes', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '614', label: 'Transports du personnel', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '618', label: 'Autres frais de transport', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '621', label: 'Sous-traitance générale', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '622', label: 'Locations et charges locatives', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '624', label: 'Entretien, réparations et maintenance', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '625', label: 'Primes d\'assurance', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '626', label: 'Études, recherches et documentation', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '627', label: 'Publicité, publications, relations publiques', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '628', label: 'Frais de télécommunications', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '631', label: 'Frais bancaires', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '632', label: 'Rémunérations d\'intermédiaires et de conseils', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '633', label: 'Frais de formation du personnel', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '634', label: 'Redevances pour brevets, licences, logiciels', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '635', label: 'Cotisations', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '637', label: 'Rémunérations de personnel extérieur', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '641', label: 'Impôts et taxes directs', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '645', label: 'Impôts et taxes indirects', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '646', label: 'Droits d\'enregistrement', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '651', label: 'Pertes sur créances clients', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '658', label: 'Charges diverses', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '661', label: 'Rémunérations directes versées au personnel national', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '664', label: 'Charges sociales', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '668', label: 'Autres charges sociales', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '671', label: 'Intérêts des emprunts', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '673', label: 'Escomptes accordés', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '676', label: 'Pertes de change', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '677', label: 'Pertes sur cessions de titres de placement', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '681', label: 'Dotations aux amortissements d\'exploitation', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '691', label: 'Dotations aux provisions d\'exploitation', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },
  { code: '697', label: 'Dotations aux provisions financières', class: 'CLASS_6', normalBalance: 'DEBIT', parentCode: null },

  // CLASSE 7 - COMPTES DE PRODUITS
  { code: '701', label: 'Ventes de marchandises', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '702', label: 'Ventes de produits finis', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '706', label: 'Services vendus', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '707', label: 'Produits accessoires', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '718', label: 'Autres subventions d\'exploitation', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '721', label: 'Immobilisations incorporelles', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '722', label: 'Immobilisations corporelles', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '736', label: 'Variations des stocks de produits finis', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '758', label: 'Produits divers', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '759', label: 'Reprises de charges provisionnées d\'exploitation', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '771', label: 'Intérêts de prêts', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '773', label: 'Escomptes obtenus', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '776', label: 'Gains de change', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '777', label: 'Gains sur cessions de titres de placement', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '781', label: 'Transferts de charges d\'exploitation', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '787', label: 'Transferts de charges financières', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '791', label: 'Reprises de provisions d\'exploitation', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },
  { code: '797', label: 'Reprises de provisions financières', class: 'CLASS_7', normalBalance: 'CREDIT', parentCode: null },

  // CLASSE 8 - COMPTES HAO
  { code: '811', label: 'Immobilisations incorporelles', class: 'CLASS_8', normalBalance: 'DEBIT', parentCode: null },
  { code: '812', label: 'Immobilisations corporelles', class: 'CLASS_8', normalBalance: 'DEBIT', parentCode: null },
  { code: '816', label: 'Immobilisations financières', class: 'CLASS_8', normalBalance: 'DEBIT', parentCode: null },
  { code: '821', label: 'Immobilisations incorporelles', class: 'CLASS_8', normalBalance: 'CREDIT', parentCode: null },
  { code: '822', label: 'Immobilisations corporelles', class: 'CLASS_8', normalBalance: 'CREDIT', parentCode: null },
  { code: '826', label: 'Immobilisations financières', class: 'CLASS_8', normalBalance: 'CREDIT', parentCode: null },
  { code: '831', label: 'Charges HAO constatées', class: 'CLASS_8', normalBalance: 'DEBIT', parentCode: null },
  { code: '835', label: 'Dons et libéralités accordés', class: 'CLASS_8', normalBalance: 'DEBIT', parentCode: null },
  { code: '841', label: 'Produits HAO constatés', class: 'CLASS_8', normalBalance: 'CREDIT', parentCode: null },
  { code: '845', label: 'Dons et libéralités obtenus', class: 'CLASS_8', normalBalance: 'CREDIT', parentCode: null },
  { code: '852', label: 'Dotations aux amortissements HAO', class: 'CLASS_8', normalBalance: 'DEBIT', parentCode: null },
  { code: '854', label: 'Dotations aux provisions pour risques HAO', class: 'CLASS_8', normalBalance: 'DEBIT', parentCode: null },
  { code: '862', label: 'Reprises d\'amortissements', class: 'CLASS_8', normalBalance: 'CREDIT', parentCode: null },
  { code: '864', label: 'Reprises de provisions pour risques HAO', class: 'CLASS_8', normalBalance: 'CREDIT', parentCode: null },
  { code: '891', label: 'Impôts sur les bénéfices de l\'exercice', class: 'CLASS_8', normalBalance: 'DEBIT', parentCode: null },
  { code: '895', label: 'Impôt minimum forfaitaire (IMF)', class: 'CLASS_8', normalBalance: 'DEBIT', parentCode: null },
];

// Axes analytiques prédéfinis
const ANALYTIC_AXES = [
  { code: 'PROJ', name: 'Projets', description: 'Suivi par projet' },
  { code: 'DEPT', name: 'Départements', description: 'Suivi par département' },
  { code: 'GEO', name: 'Zones géographiques', description: 'Suivi par zone géographique' },
];

async function seedChartOfAccounts(organizationId: string) {
  console.log(`📊 Chargement du plan comptable SYSCOHADA (${SYSCOHADA_CHART_OF_ACCOUNTS.length} comptes)...`);

  for (const account of SYSCOHADA_CHART_OF_ACCOUNTS) {
    await prisma.chartOfAccount.create({
      data: {
        organizationId,
        code: account.code,
        label: account.label,
        class: account.class as any,
        normalBalance: account.normalBalance as any,
        parentCode: account.parentCode,
        isTiers: account.isTiers || false,
        requiresTiers: account.requiresTiers || false,
        isSystem: true, // Comptes système (non modifiables)
        isActive: true,
      },
    });
  }

  console.log(`✅ Plan comptable SYSCOHADA chargé avec succès`);
}

async function seedAnalyticAxes(organizationId: string) {
  console.log(`📈 Création des axes analytiques prédéfinis...`);

  for (const axis of ANALYTIC_AXES) {
    await prisma.analyticAxis.create({
      data: {
        organizationId,
        code: axis.code,
        name: axis.name,
        description: axis.description,
        isActive: true,
      },
    });
  }

  console.log(`✅ Axes analytiques créés avec succès`);
}

async function seedJournalSequences(organizationId: string, fiscalYearId: string) {
  console.log(`🔢 Initialisation des séquences de numérotation...`);

  const currentYear = new Date().getFullYear();
  const journals = [
    { journal: 'PURCHASE', prefix: 'ACH' },
    { journal: 'SALES', prefix: 'VTE' },
    { journal: 'BANK', prefix: 'BQ' },
    { journal: 'CASH', prefix: 'CA' },
    { journal: 'MISC', prefix: 'OD' },
  ];

  for (const j of journals) {
    await prisma.journalSequence.create({
      data: {
        organizationId,
        fiscalYearId,
        journal: j.journal as any,
        prefix: j.prefix,
        currentNumber: 0,
        year: currentYear,
      },
    });
  }

  console.log(`✅ Séquences de numérotation initialisées`);
}

async function seedAccountingPeriods(organizationId: string, fiscalYearId: string, startDate: Date, endDate: Date) {
  console.log(`📅 Création des périodes comptables mensuelles...`);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const periods: any[] = [];

  let current = new Date(start);
  while (current <= end) {
    const periodStart = new Date(current);
    const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    
    if (periodEnd > end) {
      periodEnd.setTime(end.getTime());
    }

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const name = `${monthNames[current.getMonth()]} ${current.getFullYear()}`;

    periods.push({
      organizationId,
      fiscalYearId,
      name,
      startDate: periodStart,
      endDate: periodEnd,
      status: 'OPEN',
    });

    current.setMonth(current.getMonth() + 1);
  }

  await prisma.accountingPeriod.createMany({
    data: periods,
  });

  console.log(`✅ ${periods.length} périodes comptables créées`);
}

/**
 * Seed une nouvelle organisation avec la configuration SYSCOHADA complète
 */
export async function seedOrganizationSYSCOHADA(
  organizationId: string,
  fiscalYearId: string,
  fiscalYearStart: Date,
  fiscalYearEnd: Date
) {
  console.log(`\n🚀 Initialisation SYSCOHADA 2025 pour l'organisation ${organizationId}...\n`);

  try {
    await seedChartOfAccounts(organizationId);
    await seedAnalyticAxes(organizationId);
    await seedJournalSequences(organizationId, fiscalYearId);
    await seedAccountingPeriods(organizationId, fiscalYearId, fiscalYearStart, fiscalYearEnd);

    console.log(`\n✅ Organisation ${organizationId} initialisée avec succès !`);
    console.log(`📊 ${SYSCOHADA_CHART_OF_ACCOUNTS.length} comptes chargés`);
    console.log(`📈 ${ANALYTIC_AXES.length} axes analytiques créés`);
    console.log(`🔢 5 journaux initialisés`);
    console.log(`📅 Périodes comptables créées\n`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'initialisation :`, error);
    throw error;
  }
}

// Export pour utilisation dans d'autres scripts
export { SYSCOHADA_CHART_OF_ACCOUNTS, ANALYTIC_AXES };
