import { useCallback, useState } from 'react';

import { errorMessage } from '@/i18n/errorMessage';
import { ApiError } from '@/services/client';
import { createStat, deleteStat, updateStat } from '@/services/creator';
import type { StatInput, Usage } from '@/types/api';

type FieldError = { field: string; message: string };
type RemoveResult = { ok: true } | { ok: false; usedIn: Usage[] };

/**
 * Création, modification et suppression des caractéristiques d'une histoire.
 * `onChange` relit l'histoire après chaque action réussie.
 */
export function useStatEditor(storyId: string, onChange: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Erreur 422 INVALID_STAT : affichée sous le champ concerné.
  const [fieldError, setFieldError] = useState<FieldError | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setFieldError(null);
  }, []);

  const save = useCallback(
    async (statId: string | null, input: StatInput): Promise<boolean> => {
      setBusy(true);
      reset();
      try {
        if (statId) await updateStat(statId, input);
        else await createStat(storyId, input);
        onChange();
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.code === 'INVALID_STAT' && typeof err.details.field === 'string') {
          setFieldError({ field: err.details.field, message: err.message });
        } else {
          setError(errorMessage(err));
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [storyId, onChange, reset],
  );

  /** Une stat encore citée n'est pas supprimée : on renvoie où elle sert pour l'expliquer. */
  const remove = useCallback(
    async (statId: string): Promise<RemoveResult> => {
      setBusy(true);
      reset();
      try {
        await deleteStat(statId);
        onChange();
        return { ok: true };
      } catch (err) {
        if (err instanceof ApiError && err.code === 'STAT_IN_USE') {
          return { ok: false, usedIn: (err.details.usedIn as Usage[] | undefined) ?? [] };
        }
        setError(errorMessage(err));
        return { ok: false, usedIn: [] };
      } finally {
        setBusy(false);
      }
    },
    [onChange, reset],
  );

  return { busy, error, fieldError, reset, save, remove };
}
