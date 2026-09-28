import { useCallback, useEffect, useState } from 'react';

import { errorMessage } from '@/i18n/errorMessage';
import * as playApi from '@/services/play';
import type { GameState } from '@/types/api';

/**
 * État d'une partie. Le moteur tourne côté serveur : chaque action renvoie le nouvel
 * état complet, qu'on affiche tel quel.
 */
export function useGame(storyId: string) {
  // Partie tout juste lancée depuis la fiche : on l'affiche telle quelle, avec ses changements.
  const [started] = useState(() => playApi.peekStartedGame(storyId));
  const [game, setGame] = useState<GameState | null>(started);
  const [loading, setLoading] = useState(started === null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (version === 0 && started) {
      playApi.forgetStartedGame(storyId);
      return;
    }
    let active = true;
    playApi.getGame(storyId).then(
      (state) => {
        if (!active) return;
        setGame(state);
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
  }, [storyId, version, started]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((current) => current + 1);
  }, []);

  const run = useCallback(async (action: () => Promise<GameState>) => {
    setBusy(true);
    setError(null);
    try {
      setGame(await action());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    game,
    loading,
    busy,
    error,
    reload,
    choose: (choiceId: string) => run(() => playApi.chooseOption(storyId, choiceId)),
    attack: () => run(() => playApi.attack(storyId)),
    consumeItem: (itemId: string) => run(() => playApi.consumeItem(storyId, itemId)),
    restart: () => run(() => playApi.startGame(storyId)),
  };
}
