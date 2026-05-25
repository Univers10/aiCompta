import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../db/prisma';
import { env, isMockAI } from '../../config/env';
import { logger } from '../logger';
import { AI_TOOLS } from './tools/definitions';
import { TOOL_HANDLERS } from './tools/handlers';
import { injectOrgId, sanitizeToolError, validateTokenBudget } from './guards';
import { COPILOTE_SYSTEM_PROMPT } from './system-prompts';

export type ChatStreamChunk =
  | { type: 'text'; content: string }
  | { type: 'tool_use'; name: string; input: unknown }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'done'; sources: Array<{ tool: string; summary: string }>; tokens: { input: number; output: number } }
  | { type: 'error'; message: string };

/**
 * Génère la réponse du copilote en streaming.
 * Si ANTHROPIC_API_KEY est absente, retourne une réponse stub déterministe pour le dev.
 */
export async function* processChatMessage(
  threadId: string,
  userMessage: string,
  orgId: string,
  userId: string,
): AsyncGenerator<ChatStreamChunk> {
  if (isMockAI) {
    yield* mockChatStream(userMessage);
    await persistAssistantMessage(threadId, orgId, '[MOCK] Réponse simulée — configurez ANTHROPIC_API_KEY pour activer le copilote complet.', null);
    return;
  }

  await validateTokenBudget(orgId, Math.ceil(userMessage.length / 4));

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  // Charge l'historique
  const history = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    take: 30,
  });

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));
  messages.push({ role: 'user', content: userMessage });

  const sources: Array<{ tool: string; summary: string }> = [];
  let totalInput = 0;
  let totalOutput = 0;
  let assistantText = '';

  // Boucle d'agentic tool use (max 5 itérations)
  for (let iter = 0; iter < 5; iter++) {
    const response = await client.messages.create({
      model: env.ANTHROPIC_MODEL_EXTRACTION,
      max_tokens: 2048,
      system: COPILOTE_SYSTEM_PROMPT,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: AI_TOOLS as unknown as any,
      messages,
    });

    totalInput += response.usage.input_tokens;
    totalOutput += response.usage.output_tokens;

    const toolUses = response.content.filter((c) => c.type === 'tool_use');
    const textBlocks = response.content.filter((c) => c.type === 'text');
    for (const block of textBlocks) {
      if (block.type === 'text') {
        assistantText += block.text;
        yield { type: 'text', content: block.text };
      }
    }

    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      if (tu.type !== 'tool_use') continue;
      yield { type: 'tool_use', name: tu.name, input: tu.input };
      const handler = TOOL_HANDLERS[tu.name];
      let result: unknown;
      try {
        if (!handler) throw new Error(`Outil inconnu : ${tu.name}`);
        const safeParams = injectOrgId(tu.name, tu.input as Record<string, unknown>, orgId);
        result = await handler(safeParams, orgId);
        sources.push({ tool: tu.name, summary: summarizeResult(result) });
      } catch (err) {
        logger.warn({ err, tool: tu.name }, 'Erreur tool handler');
        result = { error: sanitizeToolError(err) };
      }
      yield { type: 'tool_result', name: tu.name, result };
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });
  }

  await persistAssistantMessage(threadId, orgId, assistantText, {
    inputTokens: totalInput,
    outputTokens: totalOutput,
  });

  yield {
    type: 'done',
    sources,
    tokens: { input: totalInput, output: totalOutput },
  };
}

async function persistAssistantMessage(
  threadId: string,
  orgId: string,
  content: string,
  usage: { inputTokens: number; outputTokens: number } | null,
): Promise<void> {
  await prisma.chatMessage.create({
    data: {
      threadId,
      organizationId: orgId,
      role: 'assistant',
      content,
      inputTokens: usage?.inputTokens ?? null,
      outputTokens: usage?.outputTokens ?? null,
    },
  });
}

function summarizeResult(result: unknown): string {
  if (Array.isArray(result)) return `${result.length} résultats`;
  if (result && typeof result === 'object' && 'count' in (result as object)) {
    return `${(result as { count: number }).count} résultats`;
  }
  return 'données récupérées';
}

async function* mockChatStream(userMessage: string): AsyncGenerator<ChatStreamChunk> {
  const text = `[Mode MOCK] Vous avez demandé : "${userMessage}".\n\nLe copilote est en mode démo car ANTHROPIC_API_KEY n'est pas configurée.`;
  for (const word of text.split(' ')) {
    yield { type: 'text', content: word + ' ' };
    await new Promise((r) => setTimeout(r, 20));
  }
  yield { type: 'done', sources: [], tokens: { input: 0, output: 0 } };
}
