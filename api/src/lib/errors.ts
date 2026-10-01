export class HttpError extends Error {
  statusCode: number;
  code: string;
  extra?: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.extra = extra;
  }
}

export function unauthorized(message = 'Authentification requise'): HttpError {
  return new HttpError(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'Accès refusé'): HttpError {
  return new HttpError(403, 'FORBIDDEN', message);
}

export function notFound(message = 'Ressource introuvable', code = 'NOT_FOUND'): HttpError {
  return new HttpError(404, code, message);
}

export function conflict(code: string, message: string, extra?: Record<string, unknown>): HttpError {
  return new HttpError(409, code, message, extra);
}

export function unprocessable(code: string, message: string, extra?: Record<string, unknown>): HttpError {
  return new HttpError(422, code, message, extra);
}

/**
 * Violation de contrainte unique Postgres (23505). Drizzle enveloppe l'erreur pg dans
 * `DrizzleQueryError` (`.cause` porte l'erreur d'origine) : on regarde les deux niveaux
 * pour rester robuste si un jour l'erreur n'est plus enveloppée.
 */
export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  const causeCode = (error.cause as { code?: unknown } | undefined)?.code;
  return code === '23505' || causeCode === '23505';
}
