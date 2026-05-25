/**
 * Hiérarchie d'erreurs typées pour l'API.
 * Toutes les erreurs publiques héritent de AppError et sont sérialisables.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource introuvable', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès refusé', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentification requise', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Données invalides', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflit', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Fichier trop volumineux', details?: unknown) {
    super(message, 413, 'PAYLOAD_TOO_LARGE', details);
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Type de fichier non supporté', details?: unknown) {
    super(message, 415, 'UNSUPPORTED_MEDIA_TYPE', details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Trop de requêtes', details?: unknown) {
    super(message, 429, 'RATE_LIMITED', details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Erreur interne', details?: unknown) {
    super(message, 500, 'INTERNAL_ERROR', details);
  }
}
