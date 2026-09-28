import type { GameState, SaveSummary, StartGameInput } from '@/types/api';

import { apiFetch } from './client';

export function listSaves(): Promise<SaveSummary[]> {
  return apiFetch<SaveSummary[]>('/me/saves');
}

export function startGame(storyId: string, input: StartGameInput = {}): Promise<GameState> {
  return apiFetch<GameState>(`/play/${storyId}/start`, { method: 'POST', body: input });
}

export function getGame(storyId: string): Promise<GameState> {
  return apiFetch<GameState>(`/play/${storyId}`);
}

export function chooseOption(storyId: string, choiceId: string): Promise<GameState> {
  return apiFetch<GameState>(`/play/${storyId}/choose`, { method: 'POST', body: { choiceId } });
}

export function attack(storyId: string): Promise<GameState> {
  return apiFetch<GameState>(`/play/${storyId}/combat`, { method: 'POST', body: { action: 'attack' } });
}

export function consumeItem(storyId: string, itemId: string): Promise<GameState> {
  return apiFetch<GameState>(`/play/${storyId}/use`, { method: 'POST', body: { itemId } });
}

export function abandonGame(storyId: string): Promise<void> {
  return apiFetch<void>(`/play/${storyId}`, { method: 'DELETE' });
}
