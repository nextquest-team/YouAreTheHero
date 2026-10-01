// Direction « Carnet d'aventure » : encre, papier, vermillon.
// Clair = papier et encre ; sombre = la même page inversée (fond encre, texte papier,
// vermillon éclairci). Contraste AA vérifié pour chaque paire texte / fond, et au moins
// 3:1 pour les bordures, qui délimitent aussi les champs et les boutons.

export type ColorScheme = 'light' | 'dark';

export type Palette = {
  background: string;
  surface: string; // cartes, champs
  surfaceAlt: string; // tuiles, emplacements d'image
  tabBar: string;
  border: string; // traits fins (≥ 3:1 sur les fonds)
  borderStrong: string; // trait d'encre des cartes et des choix, et leur ombre décalée
  text: string;
  textMuted: string; // sous-titres, légendes
  textSoft: string; // étiquettes secondaires
  primary: string; // fond des boutons principaux (encre)
  onPrimary: string; // texte sur primary
  accent: string; // vermillon : numéros de §, lettres des choix, onglet actif
  accentSoft: string; // fond des badges vermillon
  danger: string;
  dangerSoft: string;
  dangerBorder: string;
  success: string;
  successSoft: string;
  info: string;
  infoSoft: string;
};

export const palettes: Record<ColorScheme, Palette> = {
  light: {
    background: '#F3EBDB',
    surface: '#FBF6EC',
    surfaceAlt: '#E7DCC5',
    tabBar: '#F3EBDB',
    border: '#7E705F',
    borderStrong: '#1D1A16',
    text: '#1D1A16',
    textMuted: '#574E44',
    textSoft: '#3D362F',
    primary: '#1D1A16',
    onPrimary: '#F3EBDB',
    accent: '#B3321F',
    accentSoft: '#F2DDD2',
    danger: '#9A2B1A',
    dangerSoft: '#F4DCD3',
    dangerBorder: '#B3321F',
    success: '#2E6030',
    successSoft: '#DDE5CC',
    info: '#34466E',
    infoSoft: '#DDE0E6',
  },
  dark: {
    background: '#1D1A16',
    surface: '#27231E',
    surfaceAlt: '#332E27',
    tabBar: '#1D1A16',
    border: '#8A8072',
    borderStrong: '#CFC4B1',
    text: '#F3EBDB',
    textMuted: '#CFC4B1',
    textSoft: '#E3D9C6',
    primary: '#F3EBDB',
    onPrimary: '#1D1A16',
    accent: '#F08A74',
    accentSoft: '#3D2620',
    danger: '#F4A08C',
    dangerSoft: '#35211C',
    dangerBorder: '#C0654F',
    success: '#A7D1A0',
    successSoft: '#23301F',
    info: '#AFBEDD',
    infoSoft: '#262A33',
  },
};
