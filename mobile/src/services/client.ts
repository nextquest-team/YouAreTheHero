import type { ApiErrorBody } from '@/types/api';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Code d'erreur local quand l'API ne répond pas (Wi-Fi, IP du Mac, serveur arrêté).
export const NETWORK_ERROR = 'NETWORK_ERROR';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Le token et la réaction à un 401 sont fournis par l'AuthProvider : les services
// n'ont ainsi jamais à manipuler le token eux-mêmes.
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/** URL complète d'une image renvoyée par l'API en chemin relatif ("/uploads/abc.jpg"). */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${API_URL}${path}`;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | undefined>;
};

export async function apiFetch<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value);
  }
  const search = params.toString();

  const headers: Record<string, string> = {};
  // Pas de Content-Type sans corps : Fastify refuse un JSON vide (400).
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  return send<T>(`${path}${search ? `?${search}` : ''}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/**
 * Envoie une image locale (URI renvoyée par useImagePicker) dans le champ multipart "file",
 * par exemple vers /uploads (selfie) ou /me/media (médiathèque). L'API n'accepte que JPEG et PNG.
 */
export async function apiUpload<T>(path: string, fileUri: string): Promise<T> {
  const name = fileUri.split('/').pop() || 'image.jpg';
  const form = new FormData();
  // Forme propre à React Native : le fichier est décrit par son URI, pas par un Blob.
  form.append('file', { uri: fileUri, name, type: name.endsWith('.png') ? 'image/png' : 'image/jpeg' } as unknown as Blob);

  // Pas de Content-Type : fetch le pose lui-même avec la frontière multipart.
  return send<T>(path, { method: 'POST', headers: {}, body: form });
}

async function send<T>(pathWithQuery: string, init: { method: string; headers: Record<string, string>; body?: BodyInit }): Promise<T> {
  const headers = { ...init.headers };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${pathWithQuery}`, { ...init, headers });
  } catch {
    throw new ApiError(0, NETWORK_ERROR, 'API injoignable');
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload as ApiErrorBody | null)?.error;
    if (response.status === 401 && authToken) onUnauthorized?.();
    const { code = 'UNKNOWN_ERROR', message = response.statusText, ...details } = error ?? {};
    throw new ApiError(response.status, code, message, details);
  }

  return payload as T;
}
