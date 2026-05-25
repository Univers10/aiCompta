import Anthropic from '@anthropic-ai/sdk';
import type { ExtractionResult, IExtractor, ExtractionLine } from '@aicompta/types';
import { env } from '../../config/env';
import { ValidationError } from '../errors';
import { ExtractionPayloadSchema, EXTRACTION_TOOL_JSON_SCHEMA } from './schema';
import { EXTRACTION_SYSTEM_PROMPT } from './system-prompts';
import { logger } from '../logger';

export class ClaudeExtractor implements IExtractor {
  public readonly model = env.ANTHROPIC_MODEL_EXTRACTION;
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async extract(fileBuffer: Uint8Array, mimeType: string, _orgId: string): Promise<ExtractionResult> {
    if (mimeType === 'application/pdf') {
      throw new ValidationError(
        'Claude extractor ne supporte pas les PDF directement. Utilisez le MockExtractor ou convertissez en image.',
      );
    }
    const base64 = Buffer.from(fileBuffer).toString('base64');
    const contentBlock = {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: mimeType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
        data: base64,
      },
    };

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature: 0,
      system: EXTRACTION_SYSTEM_PROMPT,
      tools: [
        {
          name: 'extract_document_data',
          description: "Extrait les données structurées d'une pièce justificative comptable",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          input_schema: EXTRACTION_TOOL_JSON_SCHEMA as any,
        },
      ],
      tool_choice: { type: 'tool', name: 'extract_document_data' },
      messages: [
        {
          role: 'user',
          content: [contentBlock, { type: 'text', text: "Extrait toutes les données de cette pièce justificative." }],
        },
      ],
    });

    const toolUse = response.content.find((c) => c.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new ValidationError("Réponse Claude sans appel d'outil", { response });
    }

    const parseResult = ExtractionPayloadSchema.safeParse(toolUse.input);
    if (!parseResult.success) {
      logger.warn({ issues: parseResult.error.issues }, 'Extraction Claude invalide');
      throw new ValidationError('Données extraites non conformes au schéma', {
        issues: parseResult.error.issues,
      });
    }

    const data = parseResult.data;
    const lines: ExtractionLine[] = data.lines.map((l) => ({
      description: l.description,
      accountCode: l.accountCode ?? null,
      amountHT: l.amountHT.toString(),
      tvaRate: l.tvaRate.toString(),
      amountTVA: l.amountTVA.toString(),
      amountTTC: l.amountTTC.toString(),
    }));

    const confidence = computeConfidence(data);

    return {
      supplier: data.supplier,
      customer: data.customer,
      date: data.date,
      invoiceNumber: data.invoiceNumber,
      lines,
      totalHT: data.totalHT.toString(),
      totalTVA: data.totalTVA.toString(),
      totalTTC: data.totalTTC.toString(),
      currency: data.currency,
      confidence,
      rawResponse: { tool: toolUse, usage: response.usage },
    };
  }
}

function computeConfidence(data: {
  supplier: string | null;
  date: string | null;
  invoiceNumber: string | null;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  lines: Array<unknown>;
}): number {
  let score = 0;
  const max = 6;
  if (data.supplier) score++;
  if (data.date) score++;
  if (data.invoiceNumber) score++;
  if (data.lines.length > 0) score++;
  if (Math.abs(data.totalHT + data.totalTVA - data.totalTTC) <= 0.01) score += 2;
  return score / max;
}
