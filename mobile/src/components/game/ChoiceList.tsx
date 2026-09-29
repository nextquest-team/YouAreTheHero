import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, offsetShadow, radius, spacing, typography } from '@/theme';
import type { GameState } from '@/types/api';

type Props = { choices: GameState['choices']; disabled: boolean; onChoose: (choiceId: string) => void };

const letterOf = (index: number) => String.fromCharCode(65 + index);

// « Avec Clé rouillée » (libellé de l'API) devient « Il te faut : Clé rouillée »
const requirement = (conditionLabel: string | null) => {
  if (!conditionLabel) return fr.game.locked;
  return `${fr.game.youNeed} ${conditionLabel.replace(/^Avec /, '')}`;
};

/**
 * Choix de la scène, lettrés A, B, C comme dans un livre-jeu. Un choix verrouillé reste
 * visible : pointillés, cadenas et condition écrite, jamais la couleur seule.
 */
export function ChoiceList({ choices, disabled, onChoose }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      <Text accessibilityRole="header" style={[typography.overline, { color: colors.textMuted }]}>
        {fr.game.whatDoYouDo}
      </Text>
      {choices.map((choice, index) => {
        const letter = letterOf(index);
        return choice.locked ? (
          <View
            key={choice.id}
            accessible
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel={`${fr.game.choiceLetter} ${letter}, ${choice.label}, ${fr.game.locked}. ${requirement(choice.conditionLabel)}`}
            style={[styles.choice, styles.locked, { borderColor: colors.textMuted }]}
          >
            <Text style={[styles.letter, { color: colors.textMuted }]}>{letter}</Text>
            <View style={styles.lockedText}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{choice.label}</Text>
              <Text style={[styles.condition, { color: colors.textMuted }]}>
                {requirement(choice.conditionLabel)}
              </Text>
            </View>
            <Feather name="lock" size={18} color={colors.textMuted} />
          </View>
        ) : (
          <Pressable
            key={choice.id}
            onPress={() => onChoose(choice.id)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${fr.game.choiceLetter} ${letter}, ${choice.label}`}
            accessibilityState={{ disabled }}
            style={({ pressed }) => [
              styles.choice,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderStrong,
                boxShadow: offsetShadow(colors.borderStrong),
                opacity: disabled ? 0.6 : 1,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.letter, { color: colors.accent }]}>{letter}</Text>
            <Text style={[styles.label, { color: colors.text }]}>{choice.label}</Text>
            <Feather name="arrow-right" size={20} color={colors.text} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingTop: 12, paddingRight: 4, paddingBottom: 4 },
  choice: {
    minHeight: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: hairline,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: 'none' },
  locked: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  letter: { fontFamily: fonts.monoBold, fontSize: 13 },
  label: { flex: 1, fontFamily: fonts.display, fontSize: 20, lineHeight: 22 },
  lockedText: { flex: 1, gap: 2 },
  condition: { fontFamily: fonts.mono, fontSize: 11, textTransform: 'uppercase' },
});
