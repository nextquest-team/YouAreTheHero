import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { hairline, offsetShadow, radius, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  // Si onPress est fourni, la carte devient un bouton : accessibilityLabel obligatoire
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function Card({ children, onPress, accessibilityLabel, style }: Props) {
  const { colors } = useTheme();
  const base = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.borderStrong, boxShadow: offsetShadow(colors.borderStrong) },
    style,
  ];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: hairline,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  // À l'appui, la carte s'enfonce dans son ombre
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: 'none' },
});
