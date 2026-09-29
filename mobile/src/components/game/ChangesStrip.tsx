import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, spacing } from '@/theme';
import type { GameState } from '@/types/api';

type Props = { changes: GameState['changes'] };

/**
 * Ce que la dernière action a changé (« +1 Clé rouillée », « Force 5 → 6 »), en tampons
 * penchés, annoncé par VoiceOver. Le signe écrit distingue gain et perte, pas la couleur.
 */
export function ChangesStrip({ changes }: Props) {
  const { colors } = useTheme();
  if (changes.length === 0) return null;

  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${fr.game.changesTitle} : ${changes.map((change) => change.label).join(', ')}`}
      style={styles.row}
    >
      {changes.map((change, index) => {
        const gain = change.delta > 0;
        const color = gain ? colors.accent : colors.text;
        return (
          <View
            key={`${change.label}-${index}`}
            style={[styles.stamp, { borderColor: color, transform: [{ rotate: index % 2 === 0 ? '-2deg' : '1.5deg' }] }]}
          >
            <Text style={[styles.label, { color }]}>{change.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: 2 },
  stamp: {
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
});
