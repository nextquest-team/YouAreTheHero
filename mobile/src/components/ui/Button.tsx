import Feather from '@expo/vector-icons/Feather';
import { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts, radius, spacing, touchTarget } from '@/theme';

type Variant = 'primary' | 'secondary' | 'dashed' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Feather>['name'];
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  accessibilityHint,
  style,
}: Props) {
  const { colors } = useTheme();

  const variants: Record<Variant, { container: ViewStyle; text: string }> = {
    primary: {
      container: { backgroundColor: colors.primary, minHeight: 52 },
      text: colors.onPrimary,
    },
    secondary: {
      container: { backgroundColor: colors.surfaceAlt },
      text: colors.accent,
    },
    dashed: {
      container: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.accent, minHeight: 56 },
      text: colors.accent,
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: colors.text,
    },
  };
  const v = variants[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        v.container,
        { opacity: inactive ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          {icon && <Feather name={icon} size={20} color={v.text} />}
          <Text style={[styles.label, { color: v.text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
});
