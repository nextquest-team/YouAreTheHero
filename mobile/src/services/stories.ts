import type { Review, ReviewList, StoryDetail, StorySummary } from '@/types/api';

import { apiFetch } from './client';

export function listStories(filters: { q?: string; genre?: string; authorId?: string } = {}): Promise<StorySummary[]> {
  return apiFetch<StorySummary[]>('/stories', {
    query: { q: filters.q?.trim(), genre: filters.genre, authorId: filters.authorId },
  });
}

export function listGenres(): Promise<string[]> {
  return apiFetch<string[]>('/stories/genres');
}

export function getStory(id: string): Promise<StoryDetail> {
  return apiFetch<StoryDetail>(`/stories/${id}`);
}

export function listFavorites(): Promise<StorySummary[]> {
  return apiFetch<StorySummary[]>('/me/favorites');
}

export function addFavorite(storyId: string): Promise<void> {
  return apiFetch<void>(`/stories/${storyId}/favorite`, { method: 'PUT' });
}

export function removeFavorite(storyId: string): Promise<void> {
  return apiFetch<void>(`/stories/${storyId}/favorite`, { method: 'DELETE' });
}

export function listReviews(storyId: string): Promise<ReviewList> {
  return apiFetch<ReviewList>(`/stories/${storyId}/reviews`);
}

// Un second envoi remplace l'avis déjà donné.
export function submitReview(storyId: string, rating: number, comment: string): Promise<Review> {
  return apiFetch<Review>(`/stories/${storyId}/reviews`, { method: 'POST', body: { rating, comment: comment.trim() } });
}
