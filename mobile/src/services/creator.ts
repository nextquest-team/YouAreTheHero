import type { CreateStoryInput, CreatorStory, CreatorStoryFull, PublishResult, UpdateStoryInput } from '@/types/api';

import { apiFetch } from './client';

export function listMyStories(): Promise<CreatorStory[]> {
  return apiFetch<CreatorStory[]>('/me/stories');
}

export function createStory(input: CreateStoryInput): Promise<CreatorStory> {
  return apiFetch<CreatorStory>('/me/stories', { method: 'POST', body: input });
}

export function getMyStory(id: string): Promise<CreatorStoryFull> {
  return apiFetch<CreatorStoryFull>(`/me/stories/${id}`);
}

/** 409 STORY_PUBLISHED si l'histoire est publiée, 422 HAS_COMBAT_SCENES si on retire les combats trop tôt. */
export function updateStory(id: string, input: UpdateStoryInput): Promise<CreatorStory> {
  return apiFetch<CreatorStory>(`/me/stories/${id}`, { method: 'PATCH', body: input });
}

export function deleteStory(id: string): Promise<void> {
  return apiFetch<void>(`/me/stories/${id}`, { method: 'DELETE' });
}

/** 422 STORY_INVALID avec le détail `errors` et `warnings` si une règle de publication n'est pas respectée. */
export function publishStory(id: string): Promise<PublishResult> {
  return apiFetch<PublishResult>(`/me/stories/${id}/publish`, { method: 'POST' });
}

export function unpublishStory(id: string): Promise<CreatorStory> {
  return apiFetch<CreatorStory>(`/me/stories/${id}/unpublish`, { method: 'POST' });
}
