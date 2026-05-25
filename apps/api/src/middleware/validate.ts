import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

function makeValidator(source: Source) {
  return <S extends ZodSchema>(schema: S) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        next(result.error);
        return;
      }
      // Réinjecte les données parsées (avec valeurs par défaut/coerced) pour l'accès downstream
      (req as unknown as Record<string, unknown>)[source] = result.data;
      next();
    };
}

export const validateBody = makeValidator('body');
export const validateQuery = makeValidator('query');
export const validateParams = makeValidator('params');
