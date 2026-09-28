import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { ColorScheme, Palette, palettes } from './colors';

const STORAGE_KEY = 'theme.scheme';

export type ThemeContextValue = {
  scheme: ColorScheme;
  colors: Palette;
  isDark: boolean;
  setScheme: (scheme: ColorScheme) => void;
  toggleScheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  // null tant que l'utilisateur n'a rien choisi : on suit alors le système
  const [saved, setSaved] = useState<ColorScheme | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'light' || value === 'dark') setSaved(value);
      })
      .catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme: ColorScheme = saved ?? (system === 'light' ? 'light' : 'dark');
    const setScheme = (next: ColorScheme) => {
      setSaved(next);
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    };
    return {
      scheme,
      colors: palettes[scheme],
      isDark: scheme === 'dark',
      setScheme,
      toggleScheme: () => setScheme(scheme === 'dark' ? 'light' : 'dark'),
    };
  }, [saved, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
