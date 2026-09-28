import { ApiError } from '@/services/client';

import { fr } from './fr';

/** Message à afficher pour une erreur d'API, d'après son code (voir fr.errors). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code in fr.errors) {
    return fr.errors[error.code as keyof typeof fr.errors];
  }
  return fr.errors.default;
}
