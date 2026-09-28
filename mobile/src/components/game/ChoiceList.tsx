import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, radius, spacing } from '@/theme';
import type { GameState } from '@/types/api';

type Props = { choices: GameState['choices']; disabled: boolean; onChoose: (choiceId: string) => void };

/** Choix de la scène ; un choix verrouillé reste visible, grisé, avec sa condition. */
export function ChoiceList({ choices, disabled, onChoose }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      {choices.map((choice) =>
        choice.locked ? (
          <View
            key={choice.id}
            accessible
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel={`${choice.label}, ${fr.game.locked}${choice.conditionLabel ? ` : ${choice.conditionLabel}` : ''}`}
            style={[styles.choice, styles.locked, { borderColor: colors.border }]}
          >
            <Text style={[styles.label, { color: colors.textMuted }]}>{choice.label}</Text>
            {choice.conditionLabel ? (
              <View style={styles.condition}>
                <Feather name="lock" size={13} color={colors.textMuted} />
                <Text style={[styles.conditionText, { color: colors.textMuted }]}>{choice.conditionLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Pressable
            key={choice.id}
            onPress={() => onChoose(choice.id)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={choice.label}
            accessibilityState={{ disabled }}
            style={({ pressed }) => [
              styles.choice,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: disabled ? 0.6 : pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={[styles.label, { color: colors.text }]}>{choice.label}</Text>
            <Feather name="chevron-right" size={18} color={colors.accent} />
          </Pressable>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  choice: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  locked: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  label: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 21 },
  condition: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  conditionText: { fontFamily: fonts.bodyBold, fontSize: 12 },
});
