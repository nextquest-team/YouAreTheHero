import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, radius, spacing, touchTarget } from '@/theme';

const CHIP_HEIGHT = 36;

type Props = { genres: string[]; value: string | null; onChange: (genre: string | null) => void };

/** Filtre par genre, en pastilles défilables ; « Tous » retire le filtre. */
export function GenreChips({ genres, value, onChange }: Props) {
  const { colors } = useTheme();
  const options: { key: string | null; label: string }[] = [
    { key: null, label: fr.library.allGenres },
    ...genres.map((genre) => ({ key: genre, label: genre })),
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.label}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            // Pastille de 36 comme sur la maquette, dans une cible réelle de 44 (hitSlop ne compte pas pour VoiceOver)
            style={styles.target}
          >
            <View
              style={[
                styles.chip,
                selected
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: 'transparent', borderColor: colors.borderStrong },
              ]}
            >
              {/* Sélection lisible sans la couleur : pastille pleine contre simple contour */}
              <Text maxFontSizeMultiplier={1.3} style={[styles.label, { color: selected ? colors.onPrimary : colors.text }]}>
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  target: { minHeight: touchTarget, justifyContent: 'center' },
  chip: {
    minHeight: CHIP_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
});
