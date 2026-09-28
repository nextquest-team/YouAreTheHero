import type { StoryDetail, StorySummary } from '@/types/api';

import { apiFetch } from './client';

export function listStories(filters: { q?: string; genre?: string } = {}): Promise<StorySummary[]> {
  return apiFetch<StorySummary[]>('/stories', { query: { q: filters.q?.trim(), genre: filters.genre } });
}

export function listGenres(): Promise<string[]> {
  return apiFetch<string[]>('/stories/genres');
}

export function getStory(id: string): Promise<StoryDetail> {
  return apiFetch<StoryDetail>(`/stories/${id}`);
}
