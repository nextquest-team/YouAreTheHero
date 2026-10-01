import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts, spacing, typography } from '@/theme';

import { Card } from './Card';

type Props = {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

/**
 * Réglage oui / non sur une carte. Toute la ligne bascule l'interrupteur : le Switch natif
 * ne fait que 31 pt de haut. VoiceOver lit la ligne comme un seul interrupteur, avec son état.
 */
export function SwitchRow({ label, hint, value, onValueChange, disabled = false }: Props) {
  const { colors } = useTheme();

  return (
    <Card>
      <Pressable
        onPress={() => onValueChange(!value)}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ checked: value, disabled }}
        style={styles.row}
      >
        <View style={styles.text}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {hint ? <Text style={[typography.caption, { color: colors.textMuted }]}>{hint}</Text> : null}
        </View>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Switch
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  text: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
