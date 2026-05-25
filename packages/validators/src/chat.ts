import { z } from 'zod';

export const ChatMessageSchema = z.object({
  threadId: z.string().uuid().optional(),
  message: z.string().min(1, 'Message vide').max(2000, 'Message trop long (max 2000 caractères)'),
});
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
