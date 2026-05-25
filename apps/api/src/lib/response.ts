import type { Response } from 'express';
import type { ApiError } from '@aicompta/types';

export function success<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ data });
}

export function paginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  status = 200,
): Response {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  return res.status(status).json({
    data,
    pagination: {
      ...pagination,
      totalPages,
      hasMore: pagination.page < totalPages,
    },
  });
}

export function error(res: Response, payload: ApiError, status = 400): Response {
  return res.status(status).json(payload);
}
