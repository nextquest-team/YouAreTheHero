import { useId } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts, hairline, radius, spacing, touchTarget } from '@/theme';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  // Souligné : un simple trait d'encre, pour la recherche en tête de bibliothèque
  variant?: 'boxed' | 'underline';
};

export function Input({ label, error, multiline, variant = 'boxed', style, ...rest }: Props) {
  const { colors } = useTheme();
  const id = useId();

  return (
    <View style={styles.field}>
      <Text nativeID={id} style={[styles.label, { color: colors.textMuted }]}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityLabelledBy={id}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          { borderColor: error ? colors.danger : colors.borderStrong, color: colors.text },
          variant === 'boxed'
            ? { backgroundColor: colors.surface, borderWidth: error ? 2 : hairline }
            : [styles.underline, { borderBottomWidth: error ? 2 : hairline }],
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 17,
  },
  underline: { minHeight: touchTarget, borderRadius: 0, paddingHorizontal: 0 },
  multiline: {
    minHeight: 96,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  error: { fontFamily: fonts.bodySemiBold, fontSize: 13 },
});
