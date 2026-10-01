import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import * as authApi from '@/services/auth';
import { ApiError, setAuthToken, setUnauthorizedHandler } from '@/services/client';
import { clearToken, loadToken, saveToken } from '@/services/tokenStorage';
import type { RegisterInput, User } from '@/types/api';

export type AuthContextValue = {
  // true tant qu'on relit le token enregistré au démarrage (le splash reste affiché)
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  // Supprime le compte côté API puis déconnecte ; lève l'erreur de l'API en cas d'échec.
  deleteAccount: () => Promise<void>;
  setUser: (user: User) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUserState] = useState<User | null>(null);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setUserState(null);
    await clearToken();
  }, []);

  // Token expiré ou compte supprimé : n'importe quel appel en 401 ramène à la connexion.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await loadToken();
      if (token) {
        setAuthToken(token);
        try {
          const me = await authApi.fetchMe();
          if (!cancelled) setUserState(me);
        } catch (error) {
          // API injoignable : on repasse par la connexion sans effacer le token.
          if (!(error instanceof ApiError) || error.status !== 401) setAuthToken(null);
        }
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (token: string, me: User) => {
    await saveToken(token);
    setAuthToken(token);
    setUserState(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      user,
      login: async (email, password) => {
        const { token, user: me } = await authApi.login(email, password);
        await signIn(token, me);
      },
      register: async (input) => {
        const { token, user: me } = await authApi.register(input);
        await signIn(token, me);
      },
      logout,
      deleteAccount: async () => {
        await authApi.deleteMe();
        await logout();
      },
      setUser: setUserState,
    }),
    [isLoading, user, logout, signIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
