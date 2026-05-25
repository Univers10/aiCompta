import Decimal from 'decimal.js';
import { ValidationError } from '../errors';

export type LineType = 'DEBIT' | 'CREDIT';

const VALID_TVA_RATES = new Set(['0', '9', '18', 'exonere']);
const DEFAULT_TOLERANCE = new Decimal('0.01');

/** Lève une ValidationError si HT + TVA ≠ TTC (avec tolérance). */
export function validateAmounts(
  ht: Decimal,
  tva: Decimal,
  ttc: Decimal,
  tolerance: Decimal = DEFAULT_TOLERANCE,
): void {
  const diff = ht.plus(tva).minus(ttc).abs();
  if (diff.greaterThan(tolerance)) {
    throw new ValidationError(
      `Montants incohérents : HT (${ht.toFixed(2)}) + TVA (${tva.toFixed(2)}) ≠ TTC (${ttc.toFixed(2)})`,
      { ht: ht.toString(), tva: tva.toString(), ttc: ttc.toString(), diff: diff.toString() },
    );
  }
}

/** Lève une ValidationError si la somme des débits ≠ somme des crédits. */
export function validateJournalBalance(
  lines: ReadonlyArray<{ lineType: LineType; amount: Decimal | string | number }>,
  tolerance: Decimal = DEFAULT_TOLERANCE,
): void {
  if (lines.length === 0) {
    throw new ValidationError('Écriture vide : au moins une ligne requise');
  }
  let debit = new Decimal(0);
  let credit = new Decimal(0);
  for (const line of lines) {
    const amount = new Decimal(line.amount.toString());
    if (amount.isNegative()) {
      throw new ValidationError('Les montants doivent être positifs (utilisez lineType pour le signe)');
    }
    if (line.lineType === 'DEBIT') debit = debit.plus(amount);
    else credit = credit.plus(amount);
  }
  if (debit.minus(credit).abs().greaterThan(tolerance)) {
    throw new ValidationError(
      `Écriture déséquilibrée : Débit=${debit.toFixed(2)} Crédit=${credit.toFixed(2)}`,
      { debit: debit.toString(), credit: credit.toString() },
    );
  }
}

/** Lève une ValidationError si le taux de TVA n'est pas dans la liste autorisée. */
export function validateTvaRate(rate: Decimal | string | number): void {
  if (typeof rate === 'string' && rate.trim().toLowerCase() === 'exonere') return;
  let value: Decimal;
  try {
    value = new Decimal(rate.toString());
  } catch {
    throw new ValidationError(
      `Taux de TVA invalide : ${String(rate)}. Valeurs autorisées : 0, 9, 18 ou 'exonere'`,
      { rate: String(rate) },
    );
  }
  const normalized = value.toFixed(0);
  if (!VALID_TVA_RATES.has(normalized)) {
    throw new ValidationError(
      `Taux de TVA invalide : ${value.toString()}. Valeurs autorisées : 0, 9, 18 ou 'exonere'`,
      { rate: value.toString() },
    );
  }
}

export { VALID_TVA_RATES, DEFAULT_TOLERANCE };
