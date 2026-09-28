import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  // Si onPress est fourni, la carte devient un bouton : accessibilityLabel obligatoire
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function Card({ children, onPress, accessibilityLabel, style }: Props) {
  const { colors } = useTheme();
  const base = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { opacity: 0.8 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
