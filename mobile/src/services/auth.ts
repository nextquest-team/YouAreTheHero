import type { AuthResponse, RegisterInput, User } from '@/types/api';

import { apiFetch } from './client';

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } });
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: input });
}

export function fetchMe(): Promise<User> {
  return apiFetch<User>('/auth/me');
}

export function updateMe(input: { displayName?: string; avatarUrl?: string | null }): Promise<User> {
  return apiFetch<User>('/auth/me', { method: 'PATCH', body: input });
}

/** Suppression définitive du compte et de tout ce qui s'y rattache (RGPD). */
export function deleteMe(): Promise<void> {
  return apiFetch<void>('/auth/me', { method: 'DELETE' });
}
