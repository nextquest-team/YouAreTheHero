import Feather from '@expo/vector-icons/Feather';
import { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts, hairline, offsetShadow, radius, spacing, touchTarget } from '@/theme';

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

  // Principal : bloc d'encre avec son ombre vermillon décalée, qui s'écrase à l'appui.
  const variants: Record<Variant, { container: ViewStyle; text: string }> = {
    primary: {
      container: { backgroundColor: colors.primary, minHeight: 52, boxShadow: offsetShadow(colors.accent) },
      text: colors.onPrimary,
    },
    secondary: {
      container: { backgroundColor: colors.surface, borderWidth: hairline, borderColor: colors.borderStrong },
      text: colors.text,
    },
    dashed: {
      container: { borderWidth: hairline, borderStyle: 'dashed', borderColor: colors.borderStrong, minHeight: 56 },
      text: colors.text,
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
        { opacity: inactive ? 0.5 : 1 },
        pressed && variant === 'primary' && styles.pressed,
        pressed && variant !== 'primary' && { opacity: 0.7 },
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
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: 'none' },
  label: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
