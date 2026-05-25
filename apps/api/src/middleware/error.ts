import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, InternalServerError } from '../lib/errors';
import { logger } from '../lib/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Données invalides',
      details: err.issues.map((i) => ({ path: i.path, message: i.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, 'AppError 5xx');
    }
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  const e = err as { code?: string; message?: string };
  if (e?.code === 'P2002') {
    res.status(409).json({
      code: 'CONFLICT',
      message: 'Contrainte unique violée',
      details: e,
    });
    return;
  }
  if (e?.code === 'P2025') {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Ressource introuvable' });
    return;
  }

  logger.error({ err }, 'Erreur non gérée');
  const internal = new InternalServerError();
  res.status(internal.statusCode).json({
    code: internal.code,
    message: internal.message,
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Route inconnue' });
}
