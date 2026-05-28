import Decimal from 'decimal.js';
import type { BalanceSheetReport, BalanceReportRow } from '@aicompta/types';
import { prisma } from '../../db/prisma';
import { withOrg } from '../../db/tenant';

/**
 * Bilan SYSCOHADA 2025 conforme au référentiel OHADA
 * 
 * ACTIF (emplois) :
 * - CLASS_2 : Immobilisations (solde débiteur)
 * - CLASS_3 : Stocks (solde débiteur)
 * - CLASS_4 : Tiers avec solde débiteur (clients, TVA déductible)
 * - CLASS_5 : Trésorerie (solde débiteur)
 * 
 * PASSIF (ressources) :
 * - CLASS_1 : Capitaux propres et dettes financières (solde créditeur)
 * - CLASS_4 : Tiers avec solde créditeur (fournisseurs, TVA collectée)
 * - Résultat net (13) : Bénéfice au Passif, Perte en déduction du Passif
 * 
 * Équation fondamentale : ACTIF = PASSIF
 * 
 * SYSCOHADA 2025 : Seules les écritures VALIDÉES sont incluses.
 */
export async function getBalanceSheet(orgId: string, date: Date): Promise<BalanceSheetReport> {
  return withOrg(orgId, async (id) => {
    // Récupérer toutes les lignes comptables des classes 1 à 5 (bilan)
    // SYSCOHADA 2025 : Seulement les écritures validées
    const lines = await prisma.journalLine.findMany({
      where: {
        organizationId: id,
        entry: { 
          date: { lte: date },
          status: 'VALIDATED', // SYSCOHADA 2025
        },
        OR: [
          { accountCode: { startsWith: '1' } },
          { accountCode: { startsWith: '2' } },
          { accountCode: { startsWith: '3' } },
          { accountCode: { startsWith: '4' } },
          { accountCode: { startsWith: '5' } },
        ],
      },
      select: { accountCode: true, accountLabel: true, lineType: true, amountXof: true },
    });

    // Agréger les mouvements par compte
    const byAccount = new Map<string, { label: string; debit: Decimal; credit: Decimal }>();
    for (const l of lines) {
      const cur = byAccount.get(l.accountCode) ?? {
        label: l.accountLabel,
        debit: new Decimal(0),
        credit: new Decimal(0),
      };
      const amt = new Decimal(l.amountXof.toString());
      if (l.lineType === 'DEBIT') cur.debit = cur.debit.plus(amt);
      else cur.credit = cur.credit.plus(amt);
      byAccount.set(l.accountCode, cur);
    }

    const actif: BalanceReportRow[] = [];
    const passif: BalanceReportRow[] = [];
    let totalActif = new Decimal(0);
    let totalPassif = new Decimal(0);

    // Classification SYSCOHADA stricte
    for (const [code, v] of byAccount.entries()) {
      // Solde = Débit - Crédit
      const solde = v.debit.minus(v.credit);
      
      // Ignorer les comptes soldés
      if (solde.isZero()) continue;
      
      const row: BalanceReportRow = {
        code,
        label: v.label,
        totalDebit: v.debit.toFixed(2),
        totalCredit: v.credit.toFixed(2),
        solde: solde.abs().toFixed(2),
      };
      
      // ACTIF : Classes 2, 3, 5 (solde normalement débiteur)
      // Classe 2 : Immobilisations
      // Classe 3 : Stocks
      // Classe 5 : Trésorerie
      if (code.startsWith('2') || code.startsWith('3') || code.startsWith('5')) {
        actif.push(row);
        // Prendre la valeur absolue du solde pour l'actif
        totalActif = totalActif.plus(solde.abs());
      }
      
      // PASSIF : Classe 1 (solde normalement créditeur)
      // Capitaux propres, réserves, emprunts
      else if (code.startsWith('1')) {
        passif.push(row);
        // Prendre la valeur absolue du solde pour le passif
        totalPassif = totalPassif.plus(solde.abs());
      }
      
      // CLASSE 4 : Tiers - classification SYSCOHADA stricte
      else if (code.startsWith('4')) {
        // Comptes FOURNISSEURS (401-408) : TOUJOURS au Passif
        // Même si solde débiteur (acompte versé ou erreur), ils restent au Passif
        if (code.startsWith('401') || code.startsWith('402') || code.startsWith('403') || 
            code.startsWith('404') || code.startsWith('405') || code.startsWith('408')) {
          passif.push(row);
          // Si solde débiteur (anormal), on l'ajoute quand même au passif
          // Cela indique un acompte versé ou une erreur comptable
          if (solde.isPositive()) {
            // Solde débiteur anormal pour un fournisseur
            totalPassif = totalPassif.minus(solde); // Diminue le passif
          } else {
            // Solde créditeur normal
            totalPassif = totalPassif.plus(solde.abs());
          }
        }
        // Comptes CLIENTS (411-419) : TOUJOURS à l'Actif
        // Même si solde créditeur (avance reçue), ils restent à l'Actif
        else if (code.startsWith('411') || code.startsWith('416') || code.startsWith('419')) {
          actif.push(row);
          if (solde.isNegative()) {
            // Solde créditeur anormal pour un client (avance reçue)
            totalActif = totalActif.minus(solde.abs()); // Diminue l'actif
          } else {
            // Solde débiteur normal
            totalActif = totalActif.plus(solde);
          }
        }
        // Comptes TVA et autres tiers : selon le signe
        else {
          // TVA déductible (4452, 4456) : normalement débiteur → Actif
          // TVA collectée (4431, 4435) : normalement créditeur → Passif
          // Personnel, Sécurité sociale, État : selon le signe
          if (solde.isPositive()) {
            actif.push(row);
            totalActif = totalActif.plus(solde);
          } else if (solde.isNegative()) {
            passif.push(row);
            totalPassif = totalPassif.plus(solde.abs());
          }
        }
      }
    }

    // Calcul du RÉSULTAT NET selon SYSCOHADA
    // Résultat = Produits (classe 7) - Charges (classe 6)
    let totalCharges = new Decimal(0);
    let totalProduits = new Decimal(0);
    
    const allCharges = await prisma.journalLine.findMany({
      where: { 
        organizationId: id, 
        accountCode: { startsWith: '6' }, 
        entry: { date: { lte: date }, status: 'VALIDATED' } // SYSCOHADA 2025
      },
      select: { lineType: true, amountXof: true },
    });
    const allProduits = await prisma.journalLine.findMany({
      where: { 
        organizationId: id, 
        accountCode: { startsWith: '7' }, 
        entry: { date: { lte: date }, status: 'VALIDATED' } // SYSCOHADA 2025
      },
      select: { lineType: true, amountXof: true },
    });
    
    // Charges (classe 6) : solde débiteur normal
    for (const l of allCharges) {
      const amt = new Decimal(l.amountXof.toString());
      totalCharges = l.lineType === 'DEBIT' ? totalCharges.plus(amt) : totalCharges.minus(amt);
    }
    
    // Produits (classe 7) : solde créditeur normal
    for (const l of allProduits) {
      const amt = new Decimal(l.amountXof.toString());
      totalProduits = l.lineType === 'CREDIT' ? totalProduits.plus(amt) : totalProduits.minus(amt);
    }
    
    // Résultat Net = Produits - Charges
    const resultat = totalProduits.minus(totalCharges);
    
    if (!resultat.isZero()) {
      if (resultat.isPositive()) {
        // BÉNÉFICE (résultat > 0) → PASSIF (compte 13)
        // Augmente les capitaux propres
        passif.push({
          code: '13',
          label: "Résultat net de l'exercice (Bénéfice)",
          totalDebit: '0.00',
          totalCredit: resultat.toFixed(2),
          solde: resultat.toFixed(2),
        });
        totalPassif = totalPassif.plus(resultat);
      } else {
        // PERTE (résultat < 0) → PASSIF en DÉDUCTION (compte 139)
        // Diminue les capitaux propres
        // En SYSCOHADA, la perte reste au Passif mais en négatif
        passif.push({
          code: '139',
          label: "Résultat net de l'exercice (Perte)",
          totalDebit: resultat.abs().toFixed(2),
          totalCredit: '0.00',
          solde: resultat.abs().toFixed(2),
        });
        // La perte DIMINUE le total Passif
        totalPassif = totalPassif.minus(resultat.abs());
      }
    }

    actif.sort((a, b) => a.code.localeCompare(b.code));
    passif.sort((a, b) => a.code.localeCompare(b.code));

    return {
      date: date.toISOString(),
      actif,
      passif,
      totalActif: totalActif.toFixed(2),
      totalPassif: totalPassif.toFixed(2),
    };
  });
}
