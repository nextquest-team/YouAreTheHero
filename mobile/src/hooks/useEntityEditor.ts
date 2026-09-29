import { useCallback, useState } from 'react';

import { errorMessage } from '@/i18n/errorMessage';
import { ApiError } from '@/services/client';
import {
  createEnemy,
  createItem,
  deleteEnemy,
  deleteItem,
  updateEnemy,
  updateItem,
} from '@/services/creator';
import { uploadMedia } from '@/services/media';
import type { EnemyInput, ItemInput, Usage } from '@/types/api';

export type FieldError = { field: string; message: string };
export type RemoveResult = { ok: true } | { ok: false; usedIn: Usage[] };

type Actions<Input> = {
  create: (input: Input) => Promise<unknown>;
  update: (id: string, input: Input) => Promise<unknown>;
  remove: (id: string) => Promise<void>;
  inUseCode: string; // ex. ITEM_IN_USE
};

/**
 * Création, modification et suppression d'un élément de l'histoire (objet, ennemi, scène…).
 * `onChange` relit l'histoire après chaque action réussie. Une erreur qui vise un champ
 * (INVALID_REFERENCE, COMBAT_DISABLED…) est rendue à part pour s'afficher sous ce champ.
 */
export function useEntityEditor<Input>(actions: Actions<Input>, onChange: () => void) {
  const { create, update, remove: removeEntity, inUseCode } = actions;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<FieldError | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setFieldError(null);
  }, []);

  const save = useCallback(
    async (id: string | null, input: Input): Promise<boolean> => {
      setBusy(true);
      reset();
      try {
        if (id) await update(id, input);
        else await create(input);
        onChange();
        return true;
      } catch (err) {
        if (err instanceof ApiError && typeof err.details.field === 'string') {
          setFieldError({ field: err.details.field, message: err.message });
        } else {
          setError(errorMessage(err));
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [create, update, onChange, reset],
  );

  /** Un élément encore cité n'est pas supprimé : on renvoie où il sert pour l'expliquer. */
  const remove = useCallback(
    async (id: string): Promise<RemoveResult> => {
      setBusy(true);
      reset();
      try {
        await removeEntity(id);
        onChange();
        return { ok: true };
      } catch (err) {
        if (err instanceof ApiError && err.code === inUseCode) {
          return { ok: false, usedIn: (err.details.usedIn as Usage[] | undefined) ?? [] };
        }
        setError(errorMessage(err));
        return { ok: false, usedIn: [] };
      } finally {
        setBusy(false);
      }
    },
    [removeEntity, inUseCode, onChange, reset],
  );

  return { busy, error, fieldError, reset, save, remove };
}

// Une image choisie sur le téléphone passe d'abord par la médiathèque : l'API n'accepte qu'un chemin /uploads/...
async function uploadIfLocal(uri: string | null): Promise<string | null> {
  if (uri === null || uri.startsWith('/uploads/')) return uri;
  const media = await uploadMedia(uri);
  return media.url;
}

export function useItemEditor(storyId: string, onChange: () => void) {
  const create = useCallback(
    async (input: ItemInput) => createItem(storyId, { ...input, imageUrl: await uploadIfLocal(input.imageUrl) }),
    [storyId],
  );
  const update = useCallback(
    async (id: string, input: ItemInput) => updateItem(id, { ...input, imageUrl: await uploadIfLocal(input.imageUrl) }),
    [],
  );
  return useEntityEditor<ItemInput>({ create, update, remove: deleteItem, inUseCode: 'ITEM_IN_USE' }, onChange);
}

export function useEnemyEditor(storyId: string, onChange: () => void) {
  const create = useCallback(
    async (input: EnemyInput) => createEnemy(storyId, { ...input, imageUrl: await uploadIfLocal(input.imageUrl) }),
    [storyId],
  );
  const update = useCallback(
    async (id: string, input: EnemyInput) => updateEnemy(id, { ...input, imageUrl: await uploadIfLocal(input.imageUrl) }),
    [],
  );
  return useEntityEditor<EnemyInput>({ create, update, remove: deleteEnemy, inUseCode: 'ENEMY_IN_USE' }, onChange);
}
