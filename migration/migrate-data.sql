-- Migration des données SYSCOHADA 2025
-- Ce script migre les données de l'ancien schéma vers le nouveau

-- =====================================================
-- 1. MIGRATION DES COMPTES VERS AccountClass
-- =====================================================

-- Ajouter la colonne class si elle n'existe pas encore
-- (sera créée par Prisma migrate, mais on s'assure)

-- Migrer les comptes existants vers la classification SYSCOHADA
UPDATE "ChartOfAccount"
SET 
  "class" = CASE 
    WHEN "code" LIKE '1%' THEN 'CLASS_1'
    WHEN "code" LIKE '2%' THEN 'CLASS_2'
    WHEN "code" LIKE '3%' THEN 'CLASS_3'
    WHEN "code" LIKE '4%' THEN 'CLASS_4'
    WHEN "code" LIKE '5%' THEN 'CLASS_5'
    WHEN "code" LIKE '6%' THEN 'CLASS_6'
    WHEN "code" LIKE '7%' THEN 'CLASS_7'
    WHEN "code" LIKE '8%' THEN 'CLASS_8'
    ELSE 'CLASS_6' -- Par défaut
  END,
  "normalBalance" = CASE
    -- Comptes normalement créditeurs
    WHEN "code" LIKE '1%' THEN 'CREDIT'  -- Ressources durables
    WHEN "code" LIKE '4%' AND "code" LIKE '40%' THEN 'CREDIT'  -- Fournisseurs
    WHEN "code" LIKE '4%' AND "code" LIKE '43%' THEN 'CREDIT'  -- Organismes sociaux
    WHEN "code" LIKE '4%' AND "code" LIKE '44%' THEN 'CREDIT'  -- État
    WHEN "code" LIKE '7%' THEN 'CREDIT'  -- Produits
    -- Comptes normalement débiteurs
    WHEN "code" LIKE '2%' THEN 'DEBIT'   -- Immobilisations
    WHEN "code" LIKE '3%' THEN 'DEBIT'   -- Stocks
    WHEN "code" LIKE '4%' AND "code" LIKE '41%' THEN 'DEBIT'  -- Clients
    WHEN "code" LIKE '4%' AND "code" LIKE '445%' THEN 'DEBIT' -- TVA déductible
    WHEN "code" LIKE '5%' THEN 'DEBIT'   -- Trésorerie
    WHEN "code" LIKE '6%' THEN 'DEBIT'   -- Charges
    WHEN "code" LIKE '8%' THEN 'DEBIT'   -- HAO (variable)
    ELSE 'DEBIT' -- Par défaut
  END,
  "isTiers" = CASE
    WHEN "code" LIKE '40%' OR "code" LIKE '41%' THEN true
    ELSE false
  END,
  "requiresTiers" = CASE
    WHEN "code" = '401' OR "code" = '411' THEN true
    ELSE false
  END,
  "isActive" = true
WHERE "class" IS NULL;

-- =====================================================
-- 2. MIGRATION DES ÉCRITURES VERS EntryStatus
-- =====================================================

-- Toutes les écritures existantes passent en DRAFT
UPDATE "JournalEntry"
SET 
  "status" = 'DRAFT',
  "sequenceNumber" = 0  -- Sera recalculé
WHERE "status" IS NULL;

-- =====================================================
-- 3. CRÉATION DES PÉRIODES COMPTABLES
-- =====================================================

-- Pour chaque exercice fiscal, créer les périodes mensuelles
DO $$
DECLARE
  fiscal_year RECORD;
  period_start DATE;
  period_end DATE;
  period_name TEXT;
  month_names TEXT[] := ARRAY[
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  current_month INT;
BEGIN
  FOR fiscal_year IN 
    SELECT * FROM "FiscalYear" WHERE "isClosed" = false
  LOOP
    period_start := fiscal_year."startDate";
    
    WHILE period_start <= fiscal_year."endDate" LOOP
      -- Calculer la fin du mois
      period_end := (DATE_TRUNC('month', period_start) + INTERVAL '1 month - 1 day')::DATE;
      
      -- Ne pas dépasser la fin de l'exercice
      IF period_end > fiscal_year."endDate" THEN
        period_end := fiscal_year."endDate";
      END IF;
      
      -- Nom de la période
      current_month := EXTRACT(MONTH FROM period_start);
      period_name := month_names[current_month] || ' ' || EXTRACT(YEAR FROM period_start);
      
      -- Insérer la période si elle n'existe pas
      INSERT INTO "AccountingPeriod" (
        "id",
        "organizationId",
        "fiscalYearId",
        "name",
        "startDate",
        "endDate",
        "status",
        "createdAt"
      )
      SELECT 
        gen_random_uuid(),
        fiscal_year."organizationId",
        fiscal_year."id",
        period_name,
        period_start,
        period_end,
        'OPEN',
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "AccountingPeriod"
        WHERE "fiscalYearId" = fiscal_year."id"
        AND "name" = period_name
      );
      
      -- Passer au mois suivant
      period_start := (DATE_TRUNC('month', period_start) + INTERVAL '1 month')::DATE;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- 4. ASSOCIATION DES ÉCRITURES AUX PÉRIODES
-- =====================================================

-- Associer chaque écriture à sa période comptable
UPDATE "JournalEntry" je
SET "accountingPeriodId" = ap."id"
FROM "AccountingPeriod" ap
WHERE je."fiscalYearId" = ap."fiscalYearId"
  AND je."date" >= ap."startDate"
  AND je."date" <= ap."endDate"
  AND je."accountingPeriodId" IS NULL;

-- =====================================================
-- 5. INITIALISATION DES SÉQUENCES DE NUMÉROTATION
-- =====================================================

-- Pour chaque organisation et exercice, créer les séquences
DO $$
DECLARE
  org RECORD;
  fiscal_year RECORD;
  current_year INT;
  journal_types TEXT[] := ARRAY['PURCHASE', 'SALES', 'BANK', 'CASH', 'MISC'];
  journal_prefixes TEXT[] := ARRAY['ACH', 'VTE', 'BQ', 'CA', 'OD'];
  i INT;
BEGIN
  FOR org IN SELECT DISTINCT "organizationId" FROM "FiscalYear" LOOP
    FOR fiscal_year IN 
      SELECT * FROM "FiscalYear" 
      WHERE "organizationId" = org."organizationId"
    LOOP
      current_year := EXTRACT(YEAR FROM fiscal_year."startDate");
      
      FOR i IN 1..5 LOOP
        INSERT INTO "JournalSequence" (
          "id",
          "organizationId",
          "fiscalYearId",
          "journal",
          "prefix",
          "currentNumber",
          "year",
          "createdAt",
          "updatedAt"
        )
        SELECT
          gen_random_uuid(),
          org."organizationId",
          fiscal_year."id",
          journal_types[i],
          journal_prefixes[i],
          0,
          current_year,
          NOW(),
          NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM "JournalSequence"
          WHERE "organizationId" = org."organizationId"
          AND "journal" = journal_types[i]
          AND "year" = current_year
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- 6. GÉNÉRATION DES RÉFÉRENCES POUR LES ÉCRITURES EXISTANTES
-- =====================================================

-- Générer des références pour les écritures qui n'en ont pas
DO $$
DECLARE
  entry RECORD;
  seq RECORD;
  new_seq_number INT;
  prefix TEXT;
  year_val INT;
  new_reference TEXT;
BEGIN
  FOR entry IN 
    SELECT * FROM "JournalEntry" 
    WHERE "sequenceNumber" = 0 OR "sequenceNumber" IS NULL
    ORDER BY "date", "createdAt"
  LOOP
    year_val := EXTRACT(YEAR FROM entry."date");
    
    -- Récupérer la séquence appropriée
    SELECT * INTO seq
    FROM "JournalSequence"
    WHERE "organizationId" = entry."organizationId"
      AND "journal" = entry."journal"
      AND "year" = year_val
    LIMIT 1;
    
    IF FOUND THEN
      -- Incrémenter la séquence
      new_seq_number := seq."currentNumber" + 1;
      
      UPDATE "JournalSequence"
      SET "currentNumber" = new_seq_number,
          "updatedAt" = NOW()
      WHERE "id" = seq."id";
      
      -- Générer la référence
      new_reference := seq."prefix" || '-' || year_val || '-' || LPAD(new_seq_number::TEXT, 5, '0');
      
      -- Mettre à jour l'écriture
      UPDATE "JournalEntry"
      SET "sequenceNumber" = new_seq_number,
          "reference" = new_reference
      WHERE "id" = entry."id";
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- 7. AJOUT DES NUMÉROS DE LIGNE
-- =====================================================

-- Ajouter des numéros de ligne aux lignes d'écriture
DO $$
DECLARE
  entry RECORD;
  line RECORD;
  line_num INT;
BEGIN
  FOR entry IN SELECT "id" FROM "JournalEntry" LOOP
    line_num := 1;
    FOR line IN 
      SELECT "id" FROM "JournalLine" 
      WHERE "journalEntryId" = entry."id"
      ORDER BY "id"
    LOOP
      UPDATE "JournalLine"
      SET "lineNumber" = line_num
      WHERE "id" = line."id";
      
      line_num := line_num + 1;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- 8. VÉRIFICATIONS POST-MIGRATION
-- =====================================================

-- Vérifier que tous les comptes ont une classe
SELECT COUNT(*) as "Comptes sans classe"
FROM "ChartOfAccount"
WHERE "class" IS NULL;

-- Vérifier que toutes les écritures ont un statut
SELECT COUNT(*) as "Écritures sans statut"
FROM "JournalEntry"
WHERE "status" IS NULL;

-- Vérifier que toutes les écritures ont une référence
SELECT COUNT(*) as "Écritures sans référence"
FROM "JournalEntry"
WHERE "reference" IS NULL OR "reference" = '';

-- Vérifier que toutes les lignes ont un numéro
SELECT COUNT(*) as "Lignes sans numéro"
FROM "JournalLine"
WHERE "lineNumber" IS NULL OR "lineNumber" = 0;

-- Afficher un résumé
SELECT 
  'Organisations' as "Type",
  COUNT(*) as "Total"
FROM "Organization"
UNION ALL
SELECT 
  'Exercices fiscaux',
  COUNT(*)
FROM "FiscalYear"
UNION ALL
SELECT 
  'Périodes comptables',
  COUNT(*)
FROM "AccountingPeriod"
UNION ALL
SELECT 
  'Séquences de numérotation',
  COUNT(*)
FROM "JournalSequence"
UNION ALL
SELECT 
  'Comptes',
  COUNT(*)
FROM "ChartOfAccount"
UNION ALL
SELECT 
  'Écritures',
  COUNT(*)
FROM "JournalEntry"
UNION ALL
SELECT 
  'Lignes d''écriture',
  COUNT(*)
FROM "JournalLine";

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration des données SYSCOHADA 2025 terminée avec succès !';
END $$;
