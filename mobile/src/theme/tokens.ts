// Chaque graisse est une police distincte côté natif : on référence la famille
// chargée par useFonts (voir app/_layout.tsx), jamais fontWeight.
export const fonts = {
  display: 'CormorantGaramond_700Bold',
  body: 'NunitoSans_400Regular',
  bodySemiBold: 'NunitoSans_600SemiBold',
  bodyBold: 'NunitoSans_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 999,
} as const;

// Taille minimale d'une cible tactile (accessibilité)
export const touchTarget = 44;

export const typography = {
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36 },
  heading: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  cardTitle: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  overline: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
} as const;
