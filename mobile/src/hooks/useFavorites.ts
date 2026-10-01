import { useCallback, useState } from 'react';

import { errorMessage } from '@/i18n/errorMessage';
import { addFavorite, listFavorites, removeFavorite } from '@/services/stories';

import { useApi } from './useApi';

/** Mes histoires favorites, les plus récemment ajoutées d'abord. */
export function useFavorites() {
  return useApi(listFavorites, 'favorites');
}

/**
 * Bascule le favori d'une histoire : l'état change tout de suite, puis revient en arrière
 * si l'API refuse. Les appels pendant un envoi sont ignorés.
 */
export function useFavoriteToggle(storyId: string, initial: boolean) {
  const [isFavorite, setIsFavorite] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(async () => {
    if (busy) return;
    const next = !isFavorite;
    setBusy(true);
    setError(null);
    setIsFavorite(next);
    try {
      await (next ? addFavorite(storyId) : removeFavorite(storyId));
    } catch (err) {
      setIsFavorite(!next);
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [busy, isFavorite, storyId]);

  return { isFavorite, busy, error, toggle };
}
