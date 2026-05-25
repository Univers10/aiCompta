-- Trigger PostgreSQL : vérifie que chaque JournalEntry est équilibrée (ΣDEBIT = ΣCREDIT)
-- Exécuté à la fin de la transaction (DEFERRABLE INITIALLY DEFERRED) pour permettre
-- l'insertion progressive des lignes dans une même transaction Prisma.

CREATE OR REPLACE FUNCTION check_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit  NUMERIC(20, 4);
  total_credit NUMERIC(20, 4);
  entry_id     TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    entry_id := OLD."journalEntryId";
  ELSE
    entry_id := NEW."journalEntryId";
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN "lineType" = 'DEBIT'  THEN "amountXof" ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN "lineType" = 'CREDIT' THEN "amountXof" ELSE 0 END), 0)
  INTO total_debit, total_credit
  FROM "JournalLine"
  WHERE "journalEntryId" = entry_id;

  IF ABS(total_debit - total_credit) > 0.01 THEN
    RAISE EXCEPTION 'Écriture % déséquilibrée : Débit=% Crédit=%', entry_id, total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS journal_line_balance_check ON "JournalLine";

CREATE CONSTRAINT TRIGGER journal_line_balance_check
AFTER INSERT OR UPDATE OR DELETE ON "JournalLine"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_journal_entry_balance();
