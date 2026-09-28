import { useCallback, useState } from 'react';

import { errorMessage } from '@/i18n/errorMessage';
import { ApiError } from '@/services/client';
import { deleteMedia, listMedia, uploadMedia } from '@/services/media';
import type { Usage } from '@/types/api';

import { useApi } from './useApi';

type RemoveResult = { ok: true } | { ok: false; usedIn: Usage[] };

/** Médiathèque du créateur : liste, ajout et suppression, la liste est rechargée après chaque action. */
export function useMedia() {
  const list = useApi(listMedia, 'media');
  const { reload } = list;
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const upload = useCallback(
    async (fileUri: string) => {
      setBusy(true);
      setActionError(null);
      try {
        await uploadMedia(fileUri);
        reload();
      } catch (err) {
        setActionError(errorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  /** Une image encore utilisée n'est pas supprimée : on renvoie où elle sert pour l'expliquer. */
  const remove = useCallback(
    async (id: string): Promise<RemoveResult> => {
      setBusy(true);
      setActionError(null);
      try {
        await deleteMedia(id);
        reload();
        return { ok: true };
      } catch (err) {
        if (err instanceof ApiError && err.code === 'IMAGE_IN_USE') {
          return { ok: false, usedIn: (err.details.usedIn as Usage[] | undefined) ?? [] };
        }
        setActionError(errorMessage(err));
        return { ok: false, usedIn: [] };
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  return { ...list, busy, actionError, upload, remove };
}
