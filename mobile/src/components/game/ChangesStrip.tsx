import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, radius, spacing } from '@/theme';
import type { GameState } from '@/types/api';

type Props = { changes: GameState['changes'] };

/** Ce que la dernière action a changé (« +1 Clé rouillée », « Force 5 → 6 »), annoncé par VoiceOver. */
export function ChangesStrip({ changes }: Props) {
  const { colors } = useTheme();
  if (changes.length === 0) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${fr.game.changesTitle} : ${changes.map((change) => change.label).join(', ')}`}
      style={styles.row}
    >
      {changes.map((change, index) => {
        const gain = change.delta > 0;
        return (
          <Text
            key={`${change.label}-${index}`}
            style={[
              styles.chip,
              {
                backgroundColor: gain ? colors.successSoft : colors.dangerSoft,
                color: gain ? colors.success : colors.danger,
              },
            ]}
          >
            {change.label}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
