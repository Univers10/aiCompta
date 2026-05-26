import { anthropic, isClaudeEnabled, CLAUDE_CONFIG } from './claude';
import { env } from '../../config/env';

export interface InvoiceData {
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  supplierName: string | null;
  supplierTaxId: string | null;
  totalHT: number | null;
  totalTVA: number | null;
  totalTTC: number | null;
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalHT: number;
    tvaRate: number;
    tvaAmount: number;
  }>;
  confidence: number;
}

const EXTRACTION_PROMPT = `Tu es un expert comptable spécialisé dans l'extraction de données de factures.

Analyse cette facture et extrais les informations suivantes au format JSON :

{
  "invoiceNumber": "numéro de facture",
  "invoiceDate": "date de facture au format YYYY-MM-DD",
  "dueDate": "date d'échéance au format YYYY-MM-DD ou null",
  "supplierName": "nom du fournisseur",
  "supplierTaxId": "numéro de TVA ou SIRET du fournisseur ou null",
  "totalHT": montant hors taxes en nombre,
  "totalTVA": montant de la TVA en nombre,
  "totalTTC": montant TTC en nombre,
  "currency": "devise (XOF, EUR, etc.)",
  "items": [
    {
      "description": "description de la ligne",
      "quantity": quantité en nombre,
      "unitPrice": prix unitaire HT,
      "totalHT": total HT de la ligne,
      "tvaRate": taux de TVA en pourcentage (ex: 18 pour 18%),
      "tvaAmount": montant de TVA
    }
  ],
  "confidence": score de confiance entre 0 et 1
}

IMPORTANT:
- Retourne UNIQUEMENT le JSON, sans texte avant ou après
- Si une information n'est pas trouvée, utilise null
- Pour les montants, utilise des nombres (pas de strings)
- Pour la devise, si c'est FCFA ou F CFA, utilise "XOF"
- Le score de confiance doit refléter la qualité de l'extraction :
  * 0.95-1.0 : Toutes les données sont claires et lisibles
  * 0.85-0.94 : Données complètes mais quelques incertitudes mineures
  * 0.70-0.84 : Données partielles ou qualité d'image moyenne
  * <0.70 : Données manquantes ou image de mauvaise qualité
- Sois rigoureux sur le score de confiance, il détermine si un humain doit vérifier`;

/**
 * Données mock pour les tests sans API key
 */
function getMockInvoiceData(): InvoiceData {
  const today = new Date().toISOString().split('T')[0];
  return {
    invoiceNumber: 'MOCK-2024-001',
    invoiceDate: today,
    dueDate: null,
    supplierName: 'Fournisseur Test SARL',
    supplierTaxId: 'FR12345678901',
    totalHT: 100000,
    totalTVA: 18000,
    totalTTC: 118000,
    currency: 'XOF',
    items: [
      {
        description: 'Prestation de service',
        quantity: 1,
        unitPrice: 100000,
        totalHT: 100000,
        tvaRate: 18,
        tvaAmount: 18000,
      },
    ],
    confidence: 0.75,
  };
}

/**
 * Extrait les données d'une facture avec Claude Vision
 */
export async function extractInvoiceData(
  buffer: Buffer,
  mimeType: string,
): Promise<InvoiceData> {
  if (!isClaudeEnabled) {
    console.warn('[Claude] API key not configured, returning mock data');
    return getMockInvoiceData();
  }

  try {
    console.log('[Claude] Starting invoice extraction...');
    
    let response;
    
    if (mimeType === 'application/pdf') {
      // Pour les PDF : extraire le texte avec pdfjs-dist
      console.log('[Claude] PDF detected, extracting text with pdfjs-dist...');
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      
      // Convertir Buffer en Uint8Array
      const uint8Array = new Uint8Array(buffer);
      
      // Charger le document PDF
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdfDocument = await loadingTask.promise;
      
      console.log(`[Claude] PDF loaded: ${pdfDocument.numPages} pages`);
      
      // Extraire le texte de toutes les pages
      let extractedText = '';
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        extractedText += pageText + '\n';
      }
      
      extractedText = extractedText.trim();
      
      console.log(`[Claude] Extracted ${extractedText.length} characters from PDF`);
      
      // Appel à Claude avec le texte extrait
      response = await anthropic.messages.create({
        model: CLAUDE_CONFIG.model,
        max_tokens: 8192,  // Augmenté pour les gros PDFs
        messages: [
          {
            role: 'user',
            content: `${EXTRACTION_PROMPT}\n\nTexte extrait du PDF:\n\n${extractedText}`,
          },
        ],
      });
    } else {
      // Pour les images : utiliser Claude Vision
      console.log('[Claude] Image detected, using Vision API...');
      const base64Image = buffer.toString('base64');
      
      const mediaType = mimeType.startsWith('image/') 
        ? mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
        : 'image/jpeg';

      response = await anthropic.messages.create({
        model: CLAUDE_CONFIG.model,
        max_tokens: 8192,  // Augmenté pour les gros PDFs
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });
    }

    // Extraire le texte de la réponse
    const content = response.content?.[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const textContent = content.text.trim();
    console.log(`[Claude] Received response (${textContent.length} chars)`);

    // Parser le JSON
    let jsonText = textContent;
    
    // Nettoyer le markdown si présent (Claude retourne souvent avec ```json)
    jsonText = jsonText.trim();
    
    // Essayer de trouver le JSON dans les backticks
    if (jsonText.startsWith('```')) {
      // Retirer les backticks de début et de fin
      const lines = jsonText.split('\n');
      // Retirer la première ligne (```json ou ```)
      lines.shift();
      // Retirer la dernière ligne si c'est ```
      const lastLine = lines[lines.length - 1];
      if (lastLine && lastLine.trim() === '```') {
        lines.pop();
      }
      jsonText = lines.join('\n').trim();
    }

    console.log(`[Claude] Parsing JSON (${jsonText.length} chars)...`);
    
    let data: InvoiceData;
    try {
      data = JSON.parse(jsonText) as InvoiceData;
    } catch (parseError) {
      console.error('[Claude] JSON parse error:', parseError);
      console.error('[Claude] First 500 chars of JSON:', jsonText.substring(0, 500));
      console.error('[Claude] Last 500 chars of JSON:', jsonText.substring(Math.max(0, jsonText.length - 500)));
      throw new Error(`Failed to parse Claude response as JSON: ${parseError}`);
    }

    // Validation basique
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
      console.warn('[Claude] Invalid confidence score, setting to 0.5');
      data.confidence = 0.5;
    }

    console.log(`[Claude] Extraction complete (confidence: ${(data.confidence * 100).toFixed(0)}%)`);
    
    return data;
  } catch (error) {
    console.error('[Claude] Extraction failed:', error);
    throw error;
  }
}
