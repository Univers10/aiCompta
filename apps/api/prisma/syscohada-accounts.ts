/**
 * Plan comptable SYSCOHADA Révisé — Comptes les plus utilisés (50+).
 * Référence : Acte Uniforme OHADA portant organisation et harmonisation
 * des comptabilités des entreprises (révisé 2017).
 */

export type SyscohadaAccount = {
  code: string;
  label: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentCode?: string;
};

export const SYSCOHADA_ACCOUNTS: SyscohadaAccount[] = [
  // Classe 1 — Comptes de ressources durables
  { code: '10', label: 'Capital et réserves', type: 'EQUITY' },
  { code: '101', label: 'Capital social', type: 'EQUITY', parentCode: '10' },
  { code: '11', label: 'Réserves', type: 'EQUITY' },
  { code: '12', label: 'Report à nouveau', type: 'EQUITY' },
  { code: '13', label: 'Résultat net de l\'exercice', type: 'EQUITY' },
  { code: '16', label: 'Emprunts et dettes assimilées', type: 'LIABILITY' },
  { code: '162', label: 'Emprunts auprès des établissements de crédit', type: 'LIABILITY', parentCode: '16' },

  // Classe 2 — Comptes d'actif immobilisé
  { code: '20', label: 'Charges immobilisées', type: 'ASSET' },
  { code: '21', label: 'Immobilisations incorporelles', type: 'ASSET' },
  { code: '211', label: 'Frais de recherche et développement', type: 'ASSET', parentCode: '21' },
  { code: '213', label: 'Logiciels', type: 'ASSET', parentCode: '21' },
  { code: '22', label: 'Terrains', type: 'ASSET' },
  { code: '23', label: 'Bâtiments, installations techniques', type: 'ASSET' },
  { code: '24', label: 'Matériel', type: 'ASSET' },
  { code: '244', label: 'Matériel et mobilier de bureau', type: 'ASSET', parentCode: '24' },
  { code: '245', label: 'Matériel de transport', type: 'ASSET', parentCode: '24' },
  { code: '28', label: 'Amortissements', type: 'ASSET' },

  // Classe 3 — Comptes de stocks
  { code: '31', label: 'Marchandises', type: 'ASSET' },
  { code: '32', label: 'Matières premières et fournitures', type: 'ASSET' },
  { code: '33', label: 'Autres approvisionnements', type: 'ASSET' },
  { code: '36', label: 'Produits finis', type: 'ASSET' },

  // Classe 4 — Comptes de tiers
  { code: '40', label: 'Fournisseurs et comptes rattachés', type: 'LIABILITY' },
  { code: '401', label: 'Fournisseurs, dettes en compte', type: 'LIABILITY', parentCode: '40' },
  { code: '408', label: 'Fournisseurs, factures non parvenues', type: 'LIABILITY', parentCode: '40' },
  { code: '41', label: 'Clients et comptes rattachés', type: 'ASSET' },
  { code: '411', label: 'Clients', type: 'ASSET', parentCode: '41' },
  { code: '418', label: 'Clients, produits non encore facturés', type: 'ASSET', parentCode: '41' },
  { code: '42', label: 'Personnel', type: 'LIABILITY' },
  { code: '421', label: 'Personnel, avances et acomptes', type: 'ASSET', parentCode: '42' },
  { code: '422', label: 'Personnel, rémunérations dues', type: 'LIABILITY', parentCode: '42' },
  { code: '43', label: 'Organismes sociaux', type: 'LIABILITY' },
  { code: '431', label: 'Sécurité sociale', type: 'LIABILITY', parentCode: '43' },
  { code: '44', label: 'État et collectivités publiques', type: 'LIABILITY' },
  { code: '4451', label: 'État, TVA récupérable', type: 'ASSET', parentCode: '44' },
  { code: '4452', label: 'État, TVA récupérable sur immobilisations', type: 'ASSET', parentCode: '44' },
  { code: '4453', label: 'État, TVA récupérable sur autres biens et services', type: 'ASSET', parentCode: '44' },
  { code: '4431', label: 'État, TVA facturée sur ventes', type: 'LIABILITY', parentCode: '44' },
  { code: '447', label: 'État, impôts retenus à la source', type: 'LIABILITY', parentCode: '44' },
  { code: '47', label: 'Débiteurs et créditeurs divers', type: 'ASSET' },

  // Classe 5 — Comptes de trésorerie
  { code: '50', label: 'Titres de placement', type: 'ASSET' },
  { code: '52', label: 'Banques', type: 'ASSET' },
  { code: '521', label: 'Banques locales', type: 'ASSET', parentCode: '52' },
  { code: '53', label: 'Établissements financiers et assimilés', type: 'ASSET' },
  { code: '57', label: 'Caisse', type: 'ASSET' },
  { code: '571', label: 'Caisse siège social', type: 'ASSET', parentCode: '57' },

  // Classe 6 — Comptes de charges
  { code: '60', label: 'Achats et variations de stocks', type: 'EXPENSE' },
  { code: '601', label: 'Achats de marchandises', type: 'EXPENSE', parentCode: '60' },
  { code: '604', label: 'Achats stockés de matières et fournitures consommables', type: 'EXPENSE', parentCode: '60' },
  { code: '605', label: 'Autres achats', type: 'EXPENSE', parentCode: '60' },
  { code: '6051', label: 'Fournitures de bureau', type: 'EXPENSE', parentCode: '605' },
  { code: '61', label: 'Transports', type: 'EXPENSE' },
  { code: '611', label: 'Transports sur achats', type: 'EXPENSE', parentCode: '61' },
  { code: '612', label: 'Transports sur ventes', type: 'EXPENSE', parentCode: '61' },
  { code: '614', label: 'Transports du personnel', type: 'EXPENSE', parentCode: '61' },
  { code: '62', label: 'Services extérieurs A', type: 'EXPENSE' },
  { code: '622', label: 'Locations et charges locatives', type: 'EXPENSE', parentCode: '62' },
  { code: '624', label: 'Entretien, réparations et maintenance', type: 'EXPENSE', parentCode: '62' },
  { code: '625', label: 'Primes d\'assurance', type: 'EXPENSE', parentCode: '62' },
  { code: '626', label: 'Études, recherches et documentation', type: 'EXPENSE', parentCode: '62' },
  { code: '627', label: 'Publicité, publications, relations publiques', type: 'EXPENSE', parentCode: '62' },
  { code: '628', label: 'Frais de télécommunications', type: 'EXPENSE', parentCode: '62' },
  { code: '63', label: 'Services extérieurs B', type: 'EXPENSE' },
  { code: '631', label: 'Frais bancaires', type: 'EXPENSE', parentCode: '63' },
  { code: '632', label: 'Rémunérations d\'intermédiaires et de conseils', type: 'EXPENSE', parentCode: '63' },
  { code: '6324', label: 'Honoraires', type: 'EXPENSE', parentCode: '632' },
  { code: '633', label: 'Formation du personnel', type: 'EXPENSE', parentCode: '63' },
  { code: '64', label: 'Impôts et taxes', type: 'EXPENSE' },
  { code: '65', label: 'Autres charges', type: 'EXPENSE' },
  { code: '66', label: 'Charges de personnel', type: 'EXPENSE' },
  { code: '661', label: 'Rémunérations directes versées au personnel', type: 'EXPENSE', parentCode: '66' },
  { code: '664', label: 'Charges sociales', type: 'EXPENSE', parentCode: '66' },
  { code: '67', label: 'Frais financiers et charges assimilées', type: 'EXPENSE' },
  { code: '671', label: 'Intérêts des emprunts', type: 'EXPENSE', parentCode: '67' },
  { code: '68', label: 'Dotations aux amortissements', type: 'EXPENSE' },

  // Classe 7 — Comptes de produits
  { code: '70', label: 'Ventes', type: 'REVENUE' },
  { code: '701', label: 'Ventes de marchandises', type: 'REVENUE', parentCode: '70' },
  { code: '702', label: 'Ventes de produits finis', type: 'REVENUE', parentCode: '70' },
  { code: '706', label: 'Services vendus', type: 'REVENUE', parentCode: '70' },
  { code: '707', label: 'Produits accessoires', type: 'REVENUE', parentCode: '70' },
  { code: '71', label: 'Subventions d\'exploitation', type: 'REVENUE' },
  { code: '75', label: 'Autres produits', type: 'REVENUE' },
  { code: '77', label: 'Revenus financiers et produits assimilés', type: 'REVENUE' },
  { code: '771', label: 'Intérêts de prêts', type: 'REVENUE', parentCode: '77' },
];
