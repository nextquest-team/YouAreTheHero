import type { GameState, SaveSummary, StartGameInput } from '@/types/api';

import { apiFetch } from './client';

export function listSaves(): Promise<SaveSummary[]> {
  return apiFetch<SaveSummary[]>('/me/saves');
}

export function startGame(storyId: string, input: StartGameInput = {}): Promise<GameState> {
  return apiFetch<GameState>(`/play/${storyId}/start`, { method: 'POST', body: input });
}

// L'état renvoyé par start porte les changements de la scène de départ (un objet ramassé à
// l'entrée, par exemple), que GET /play ne renvoie pas. La fiche le dépose ici et l'écran de
// jeu le reprend au lieu de recharger la partie.
const startedGames = new Map<string, GameState>();

export function rememberStartedGame(state: GameState) {
  startedGames.set(state.storyId, state);
}

export function peekStartedGame(storyId: string): GameState | null {
  return startedGames.get(storyId) ?? null;
}

export function forgetStartedGame(storyId: string) {
  startedGames.delete(storyId);
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
