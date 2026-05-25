import type { ExtractionResult, IExtractor } from '@aicompta/types';

/**
 * Extracteur factice utilisé en dev/test quand ANTHROPIC_API_KEY est absente.
 * Retourne toujours une facture cohérente (HT + TVA = TTC) pour permettre
 * de tester le pipeline complet sans clé API.
 */
export class MockExtractor implements IExtractor {
  public readonly model = 'mock-extractor';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async extract(_fileBuffer: Uint8Array, _mimeType: string, _orgId: string): Promise<ExtractionResult> {
    const today = new Date().toISOString().slice(0, 10);
    const ht = 100000;
    const tva = 18000;
    const ttc = 118000;
    return {
      supplier: 'Fournisseur Mock SARL',
      customer: null,
      date: today,
      invoiceNumber: `MOCK-${Date.now().toString().slice(-6)}`,
      lines: [
        {
          description: 'Prestation de service (mock)',
          accountCode: '6324',
          amountHT: ht.toString(),
          tvaRate: '18',
          amountTVA: tva.toString(),
          amountTTC: ttc.toString(),
        },
      ],
      totalHT: ht.toString(),
      totalTVA: tva.toString(),
      totalTTC: ttc.toString(),
      currency: 'XOF',
      confidence: 0.92,
      rawResponse: { mock: true, timestamp: new Date().toISOString() },
    };
  }
}
