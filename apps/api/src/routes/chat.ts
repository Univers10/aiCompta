import { Router } from 'express';
import { ChatMessageSchema } from '@aicompta/validators';
import { prisma } from '../lib/db/prisma';
import { success } from '../lib/response';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { processChatMessage } from '../lib/ai/chat';
import { logger } from '../lib/logger';

const router = Router();

router.get('/threads', requireAuth, async (req, res) => {
  const auth = req.auth!;
  const threads = await prisma.chatThread.findMany({
    where: { organizationId: auth.organizationId, userId: auth.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    take: 50,
  });
  success(res, threads);
});

router.get('/threads/:id', requireAuth, async (req, res) => {
  const auth = req.auth!;
  const thread = await prisma.chatThread.findFirst({
    where: { id: req.params.id, organizationId: auth.organizationId, userId: auth.userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!thread) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Conversation introuvable' });
    return;
  }
  success(res, thread);
});

router.post('/', requireAuth, aiLimiter, validateBody(ChatMessageSchema), async (req, res) => {
  const auth = req.auth!;
  const { threadId, message } = req.body as { threadId?: string; message: string };

  let thread = threadId
    ? await prisma.chatThread.findFirst({
        where: { id: threadId, organizationId: auth.organizationId, userId: auth.userId },
      })
    : null;
  if (!thread) {
    thread = await prisma.chatThread.create({
      data: {
        organizationId: auth.organizationId,
        userId: auth.userId,
        title: message.slice(0, 80),
      },
    });
  }

  await prisma.chatMessage.create({
    data: {
      threadId: thread.id,
      organizationId: auth.organizationId,
      role: 'user',
      content: message,
    },
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (data: unknown): void => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // En-tête : signale le threadId
  send({ type: 'thread', threadId: thread.id });

  try {
    for await (const chunk of processChatMessage(thread.id, message, auth.organizationId, auth.userId)) {
      send(chunk);
    }
  } catch (err) {
    logger.error({ err }, 'Erreur stream chat');
    send({ type: 'error', message: err instanceof Error ? err.message : 'Erreur inconnue' });
  } finally {
    res.write('event: end\ndata: {}\n\n');
    res.end();
  }
});

export default router;
