import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts, spacing, touchTarget } from '@/theme';

export type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
};

/** Choix unique en pastilles qui passent à la ligne (type d'une stat, stat de PV, ennemi…). */
export function OptionChips<T extends string>({ label, options, value, onChange, disabled = false }: Props<T>) {
  const { colors } = useTheme();

  return (
    <View style={styles.field} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected, disabled }}
              style={[
                styles.chip,
                selected
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: 'transparent', borderColor: colors.border },
                disabled && styles.disabled,
              ]}
            >
              <Text
                style={[
                  styles.chipLabel,
                  { color: selected ? colors.onPrimary : colors.text, fontFamily: selected ? fonts.bodyBold : fonts.bodySemiBold },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: touchTarget / 2,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipLabel: { fontSize: 14 },
  disabled: { opacity: 0.5 },
});
