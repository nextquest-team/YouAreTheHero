import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarIcon } from '@/components/common/InkIcons';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, radius, typography } from '@/theme';

type Props = { value: number; onChange: (value: number) => void };

const STAR_TARGET = 56;

/**
 * Note de 1 à 5. Au doigt : cinq étoiles de 56 pt. Pour VoiceOver : un seul élément
 * réglable (balayer vers le haut ou le bas), qui annonce la note et son mot.
 */
export function RatingPicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const word = value > 0 ? fr.reviews.words[value - 1] : fr.reviews.noRatingYet;

  return (
    <View style={styles.wrap}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={fr.reviews.ratingLabel}
        accessibilityValue={{ min: 1, max: 5, now: value || undefined, text: value > 0 ? fr.reviews.ratingValue(value, word) : word }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') onChange(Math.min(5, Math.max(1, value + 1)));
          if (event.nativeEvent.actionName === 'decrement') onChange(Math.max(1, value - 1));
        }}
        style={styles.row}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            style={[
              styles.star,
              star === value && { borderWidth: hairline + 0.5, borderColor: colors.borderStrong },
            ]}
          >
            <StarIcon size={38} color={colors.accent} filled={star <= value} strokeWidth={1.6} />
          </Pressable>
        ))}
      </View>
      <View style={styles.verdict} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={[styles.word, { color: value > 0 ? colors.text : colors.textMuted }]}>{word}</Text>
        {value > 0 ? <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.reviews.outOfFive(value)}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  star: { width: STAR_TARGET, height: STAR_TARGET, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  verdict: { alignItems: 'center', gap: 2 },
  word: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32 },
});
