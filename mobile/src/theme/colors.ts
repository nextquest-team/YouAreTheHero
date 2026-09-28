// Palette sombre : reprise telle quelle de la maquette.
// Palette claire : dérivée de la maquette (parchemin + or), contraste AA vérifié
// pour chaque paire texte / fond utilisée.

export type ColorScheme = 'light' | 'dark';

export type Palette = {
  background: string;
  surface: string; // cartes, champs
  surfaceAlt: string; // tuiles, boutons secondaires
  tabBar: string;
  border: string;
  borderStrong: string; // bordures en pointillé (ajout)
  text: string;
  textMuted: string; // sous-titres, légendes
  textSoft: string; // étiquettes secondaires
  primary: string; // fond des boutons principaux
  onPrimary: string; // texte sur primary
  accent: string; // texte et icônes dorés (liens, onglet actif)
  accentSoft: string; // fond des badges dorés
  danger: string;
  dangerSoft: string;
  dangerBorder: string;
  success: string;
  successSoft: string;
  info: string;
  infoSoft: string;
};

export const palettes: Record<ColorScheme, Palette> = {
  dark: {
    background: '#16141C',
    surface: '#211E29',
    surfaceAlt: '#2B2735',
    tabBar: '#1D1A24',
    border: '#3A3546',
    borderStrong: '#6B6478',
    text: '#F2EDE3',
    textMuted: '#B3AB9D',
    textSoft: '#D8D0C4',
    primary: '#E0B04E',
    onPrimary: '#1B1710',
    accent: '#E0B04E',
    accentSoft: '#3B3322',
    danger: '#F0A58F',
    dangerSoft: '#2A1F22',
    dangerBorder: '#5A3530',
    success: '#9FD19E',
    successSoft: '#26382A',
    info: '#A9B8D9',
    infoSoft: '#2B2F3D',
  },
  light: {
    background: '#F6F1E7',
    surface: '#FFFDF8',
    surfaceAlt: '#EFE8DA',
    tabBar: '#FFFDF8',
    border: '#D9CFBF',
    borderStrong: '#8C8496',
    text: '#1E1B24',
    textMuted: '#5E5768',
    textSoft: '#4A4453',
    primary: '#E0B04E',
    onPrimary: '#1B1710',
    accent: '#7A5200',
    accentSoft: '#F3E4C0',
    danger: '#A3402A',
    dangerSoft: '#FBEAE5',
    dangerBorder: '#E3B5A8',
    success: '#2E6B2C',
    successSoft: '#DDEFD9',
    info: '#34466E',
    infoSoft: '#DDE3F0',
  },
};
