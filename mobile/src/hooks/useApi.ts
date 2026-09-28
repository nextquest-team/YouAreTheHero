import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/services/client';

type State<T> = { data: T | null; error: ApiError | null; loading: boolean };

function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError(0, 'UNKNOWN_ERROR', String(error));
}

/**
 * Charge une ressource de l'API et expose { data, error, loading, reload }.
 * La requête est relancée quand `key` change (ex. les filtres de recherche) ; une réponse
 * arrivée après un changement de clé est ignorée, pour qu'une recherche plus ancienne
 * n'écrase pas la dernière.
 */
export function useApi<T>(fetcher: () => Promise<T>, key: string) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;
    fetcherRef.current().then(
      (data) => {
        if (active) setState({ data, error: null, loading: false });
      },
      (error: unknown) => {
        if (active) setState((prev) => ({ ...prev, error: toApiError(error), loading: false }));
      },
    );
    return () => {
      active = false;
    };
  }, [key, version]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    setVersion((current) => current + 1);
  }, []);

  return { ...state, reload };
}
