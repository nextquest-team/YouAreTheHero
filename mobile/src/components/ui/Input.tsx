import { useId } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts, hairline, radius, spacing } from '@/theme';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

export function Input({ label, error, multiline, style, ...rest }: Props) {
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
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.borderStrong,
            borderWidth: error ? 2 : hairline,
            color: colors.text,
          },
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
  multiline: {
    minHeight: 96,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  error: { fontFamily: fonts.bodySemiBold, fontSize: 13 },
});
