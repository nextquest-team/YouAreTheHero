import { useEffect, useState } from 'react';

import { listSaves } from '@/services/play';
import { getStory, listGenres, listStories } from '@/services/stories';

import { useApi } from './useApi';

const SEARCH_DELAY_MS = 300;

/** Bibliothèque : la recherche n'interroge l'API qu'après une courte pause de frappe. */
export function useStories(query: string, genre: string | null) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  return useApi(
    () => listStories({ q: debouncedQuery, genre: genre ?? undefined }),
    JSON.stringify([debouncedQuery.trim(), genre]),
  );
}

export function useGenres() {
  return useApi(listGenres, 'genres');
}

export function useAuthorStories(authorId: string) {
  return useApi(() => listStories({ authorId }), authorId);
}

export function useStory(id: string) {
  return useApi(() => getStory(id), id);
}

export function useSaves() {
  return useApi(listSaves, 'saves');
}
