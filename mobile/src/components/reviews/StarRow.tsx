import { StyleSheet, View } from 'react-native';

import { StarIcon } from '@/components/common/InkIcons';
import { useTheme } from '@/hooks/useTheme';

type Props = { rating: number; size?: number };

/** Cinq étoiles en lecture seule, arrondies à l'étoile la plus proche. Le parent porte la note lue par VoiceOver. */
export function StarRow({ rating, size = 14 }: Props) {
  const { colors } = useTheme();
  const full = Math.round(rating);

  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[1, 2, 3, 4, 5].map((value) => (
        <StarIcon key={value} size={size} color={colors.accent} filled={value <= full} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
