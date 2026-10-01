// Chaque graisse est une police distincte côté natif : on référence la famille
// chargée par useFonts (voir app/_layout.tsx), jamais fontWeight.
export const fonts = {
  display: 'IMFellEnglish_400Regular', // titres, texte des choix
  displayItalic: 'IMFellEnglish_400Regular_Italic', // titre de scène
  body: 'Spectral_400Regular', // texte de lecture
  bodyItalic: 'Spectral_400Regular_Italic',
  bodySemiBold: 'Spectral_600SemiBold',
  bodyBold: 'Spectral_700Bold',
  mono: 'JetBrainsMono_500Medium', // étiquettes, surtitres, chiffres
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

// Coins presque droits : une page de carnet, pas une bulle.
export const radius = {
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
  pill: 999,
} as const;

// Trait d'encre des cartes et des choix
export const hairline = 1.5;

// Ombre décalée « tampon » : un bloc plein, sans flou.
export const offsetShadow = (color: string, offset = 4) => `${offset}px ${offset}px 0px ${color}`;

// Taille minimale d'une cible tactile (accessibilité)
export const touchTarget = 44;

export const typography = {
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38 },
  heading: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32 },
  cardTitle: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26 },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 17, lineHeight: 25 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19 },
  overline: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
} as const;
