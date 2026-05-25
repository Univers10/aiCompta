import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import fc from 'fast-check';
import {
  validateAmounts,
  validateJournalBalance,
  validateTvaRate,
} from '../../src/lib/accounting/validators';
import { ValidationError } from '../../src/lib/errors';

describe('validateAmounts', () => {
  it('passe quand HT + TVA = TTC', () => {
    expect(() =>
      validateAmounts(new Decimal('100'), new Decimal('18'), new Decimal('118')),
    ).not.toThrow();
  });

  it('passe avec arrondi tolérable', () => {
    expect(() =>
      validateAmounts(new Decimal('100.005'), new Decimal('17.995'), new Decimal('118')),
    ).not.toThrow();
  });

  it('échoue quand HT + TVA ≠ TTC', () => {
    expect(() =>
      validateAmounts(new Decimal('100'), new Decimal('18'), new Decimal('120')),
    ).toThrow(ValidationError);
  });

  it('passe avec TVA = 0', () => {
    expect(() =>
      validateAmounts(new Decimal('100'), new Decimal('0'), new Decimal('100')),
    ).not.toThrow();
  });

  it('passe avec montants nuls', () => {
    expect(() =>
      validateAmounts(new Decimal('0'), new Decimal('0'), new Decimal('0')),
    ).not.toThrow();
  });

  it('property : si ht+tva=ttc alors validateAmounts OK', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1_000_000, noNaN: true }),
        fc.float({ min: 0, max: 200_000, noNaN: true }),
        (ht, tva) => {
          const HT = new Decimal(ht.toFixed(2));
          const TVA = new Decimal(tva.toFixed(2));
          const TTC = HT.plus(TVA);
          expect(() => validateAmounts(HT, TVA, TTC)).not.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('validateJournalBalance', () => {
  it('passe sur écriture équilibrée', () => {
    expect(() =>
      validateJournalBalance([
        { lineType: 'DEBIT', amount: '118' },
        { lineType: 'CREDIT', amount: '118' },
      ]),
    ).not.toThrow();
  });

  it('échoue sur déséquilibre', () => {
    expect(() =>
      validateJournalBalance([
        { lineType: 'DEBIT', amount: '100' },
        { lineType: 'CREDIT', amount: '118' },
      ]),
    ).toThrow(ValidationError);
  });

  it('échoue sur lignes vides', () => {
    expect(() => validateJournalBalance([])).toThrow(ValidationError);
  });

  it('échoue sur montant négatif', () => {
    expect(() =>
      validateJournalBalance([
        { lineType: 'DEBIT', amount: '-100' },
        { lineType: 'CREDIT', amount: '-100' },
      ]),
    ).toThrow(ValidationError);
  });

  it('passe sur écriture multilignes équilibrée', () => {
    expect(() =>
      validateJournalBalance([
        { lineType: 'DEBIT', amount: '100' },
        { lineType: 'DEBIT', amount: '18' },
        { lineType: 'CREDIT', amount: '118' },
      ]),
    ).not.toThrow();
  });
});

describe('validateTvaRate', () => {
  it.each(['0', '9', '18', 'exonere'])('accepte %s', (rate) => {
    expect(() => validateTvaRate(rate)).not.toThrow();
  });

  it.each(['5', '20', '7.5', 'autre'])('rejette %s', (rate) => {
    expect(() => validateTvaRate(rate)).toThrow();
  });
});
