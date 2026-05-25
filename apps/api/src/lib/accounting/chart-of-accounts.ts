import type { DocumentType } from '@aicompta/types';
import { prisma } from '../db/prisma';
import { withOrg } from '../db/tenant';

/**
 * Mapping par défaut de mots-clés vers des codes SYSCOHADA.
 * Ordre = priorité (les patterns plus spécifiques en premier).
 */
export const SYSCOHADA_DEFAULT_MAPPING: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /honoraire|consultant|conseil/i, code: '6324' },
  { pattern: /télécom|telecom|internet|saas|abonnement logiciel|hosting/i, code: '628' },
  { pattern: /transport|déplacement|deplacement|taxi|carburant|essence/i, code: '614' },
  { pattern: /loyer|location/i, code: '622' },
  { pattern: /assurance/i, code: '625' },
  { pattern: /publicit|marketing|annonce/i, code: '627' },
  { pattern: /fourniture.*bureau|papeterie/i, code: '6051' },
  { pattern: /maintenance|entretien|réparation|reparation/i, code: '624' },
  { pattern: /formation/i, code: '633' },
  { pattern: /frais bancaire|commission bancaire/i, code: '631' },
  { pattern: /électricité|electricite|eau|gaz/i, code: '605' },
  { pattern: /marchandise/i, code: '601' },
  { pattern: /matière première|matiere premiere/i, code: '604' },
  { pattern: /salaire|paie|rémunération|remuneration/i, code: '661' },
];

/**
 * Récupère un compte du plan comptable de l'organisation.
 */
export async function getAccountByCode(orgId: string, code: string) {
  return withOrg(orgId, (id) =>
    prisma.chartOfAccount.findUnique({
      where: { organizationId_code: { organizationId: id, code } },
    }),
  );
}

/**
 * Résout le code de compte le plus probable selon des mots-clés et le type de pièce.
 * Fallback : compte générique selon le type de document.
 */
export async function resolveAccountForDocument(
  orgId: string,
  keywords: string[],
  documentType: DocumentType | null,
): Promise<string> {
  const text = keywords.join(' ').toLowerCase();
  for (const { pattern, code } of SYSCOHADA_DEFAULT_MAPPING) {
    if (pattern.test(text)) {
      const acc = await getAccountByCode(orgId, code);
      if (acc) return code;
    }
  }

  // Fallback selon le type de document
  switch (documentType) {
    case 'PURCHASE_INVOICE':
    case 'RECEIPT':
    case 'EXPENSE_NOTE':
      return '605';
    case 'SALES_INVOICE':
      return '706';
    case 'CREDIT_NOTE':
      return '658';
    default:
      return '605';
  }
}

export async function getAccountLabel(orgId: string, code: string): Promise<string> {
  const acc = await getAccountByCode(orgId, code);
  return acc?.label ?? code;
}
