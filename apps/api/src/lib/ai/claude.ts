import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';

export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export const isClaudeEnabled = env.ANTHROPIC_API_KEY.trim() !== '';

export const CLAUDE_CONFIG = {
  model: env.ANTHROPIC_MODEL,
  maxTokens: env.ANTHROPIC_MAX_TOKENS,
  confidenceThreshold: env.AI_CONFIDENCE_THRESHOLD,
} as const;
