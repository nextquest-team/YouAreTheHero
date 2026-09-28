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

export function notFound(message = 'Ressource introuvable'): HttpError {
  return new HttpError(404, 'NOT_FOUND', message);
}

export function conflict(code: string, message: string, extra?: Record<string, unknown>): HttpError {
  return new HttpError(409, code, message, extra);
}

export function unprocessable(code: string, message: string, extra?: Record<string, unknown>): HttpError {
  return new HttpError(422, code, message, extra);
}
