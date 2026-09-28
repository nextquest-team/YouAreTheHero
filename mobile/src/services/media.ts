import type { Media } from '@/types/api';

import { apiFetch, apiUpload } from './client';

export function listMedia(): Promise<Media[]> {
  return apiFetch<Media[]>('/me/media');
}

/** Envoie une image locale (déjà compressée par useImagePicker) dans la médiathèque. */
export function uploadMedia(fileUri: string): Promise<Media> {
  return apiUpload<Media>('/me/media', fileUri);
}

/** 409 IMAGE_IN_USE (détail `usedIn`) si l'image sert encore dans une histoire. */
export function deleteMedia(id: string): Promise<void> {
  return apiFetch<void>(`/me/media/${id}`, { method: 'DELETE' });
}
