import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from '@/i18n/errorMessage';
import { listReviews, submitReview } from '@/services/stories';
import type { ReviewList } from '@/types/api';

/** Avis d'une histoire : la liste, le mien, et l'envoi (qui remplace mon avis s'il existe). */
export function useReviews(storyId: string) {
  const [data, setData] = useState<ReviewList | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    listReviews(storyId).then(
      (list) => {
        if (!active) return;
        setData(list);
        setLoading(false);
      },
      (err: unknown) => {
        if (!active) return;
        setError(errorMessage(err));
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [storyId, version]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((current) => current + 1);
  }, []);

  /** Renvoie true si l'avis est enregistré ; la liste, la moyenne et le total sont alors rechargés. */
  const submit = useCallback(
    async (rating: number, comment: string): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        await submitReview(storyId, rating, comment);
        setData(await listReviews(storyId));
        return true;
      } catch (err) {
        setError(errorMessage(err));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [storyId],
  );

  return {
    reviews: data?.reviews ?? [],
    mine: data?.mine ?? null,
    canReview: data?.canReview ?? false,
    avgRating: data?.avgRating ?? null,
    count: data?.count ?? 0,
    loading,
    submitting,
    error,
    reload,
    submit,
  };
}
