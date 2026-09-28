import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, spacing, touchTarget } from '@/theme';

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
            style={[
              styles.chip,
              selected
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: 'transparent', borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.onPrimary : colors.text, fontFamily: selected ? fonts.bodyBold : fonts.bodySemiBold },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  chip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: touchTarget / 2,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: { fontSize: 14 },
});
