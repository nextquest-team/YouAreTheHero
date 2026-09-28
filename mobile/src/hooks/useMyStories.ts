import { useCallback, useState } from 'react';

import { errorMessage } from '@/i18n/errorMessage';
import { ApiError } from '@/services/client';
import {
  createStory,
  deleteStory,
  getMyStory,
  listMyStories,
  publishStory,
  unpublishStory,
  updateStory,
} from '@/services/creator';
import { uploadMedia } from '@/services/media';
import type { CreateStoryInput, CreatorStory, PublishIssue, UpdateStoryInput } from '@/types/api';

import { useApi } from './useApi';

/** Liste des histoires du créateur, la plus récemment modifiée en premier. */
export function useMyStories() {
  const list = useApi(listMyStories, 'my-stories');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateStoryInput): Promise<CreatorStory | null> => {
    setCreating(true);
    setCreateError(null);
    try {
      return await createStory(input);
    } catch (err) {
      setCreateError(errorMessage(err));
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  return { ...list, creating, createError, create };
}

export type PublishReport = { errors: PublishIssue[]; warnings: PublishIssue[] };

/**
 * Écran d'édition d'une histoire : chaque action relit l'histoire complète ensuite.
 * `report` garde le résultat de la dernière tentative de publication (erreurs bloquantes et avertissements).
 */
export function useStoryEditor(id: string) {
  const story = useApi(() => getMyStory(id), id);
  const { reload } = story;
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [report, setReport] = useState<PublishReport | null>(null);

  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      setBusy(true);
      setActionError(null);
      try {
        await action();
        reload();
        return true;
      } catch (err) {
        setActionError(errorMessage(err));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  const save = useCallback((input: UpdateStoryInput) => run(() => updateStory(id, input)), [id, run]);

  // La couverture passe d'abord par la médiathèque : l'API n'accepte qu'un chemin /uploads/...
  const changeCover = useCallback(
    (fileUri: string) =>
      run(async () => {
        const media = await uploadMedia(fileUri);
        await updateStory(id, { coverUrl: media.url });
      }),
    [id, run],
  );

  const publish = useCallback(() => {
    setReport(null);
    return run(async () => {
      try {
        const result = await publishStory(id);
        setReport({ errors: [], warnings: result.warnings });
      } catch (err) {
        if (err instanceof ApiError && err.code === 'STORY_INVALID') {
          setReport({
            errors: (err.details.errors as PublishIssue[] | undefined) ?? [],
            warnings: (err.details.warnings as PublishIssue[] | undefined) ?? [],
          });
          return;
        }
        throw err;
      }
    });
  }, [id, run]);

  const unpublish = useCallback(() => {
    setReport(null);
    return run(() => unpublishStory(id));
  }, [id, run]);

  const remove = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    setActionError(null);
    try {
      await deleteStory(id);
      return true;
    } catch (err) {
      setActionError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, [id]);

  return { ...story, busy, actionError, report, save, changeCover, publish, unpublish, remove };
}
