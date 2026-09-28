import Feather from '@expo/vector-icons/Feather';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type Props = {
  icon: ComponentProps<typeof Feather>['name'];
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
};

const SIZE = 52;

/** Bouton rond pour les actions secondaires de l'écran selfie (galerie, retourner la caméra). */
export function CircleIconButton({ icon, accessibilityLabel, onPress, disabled = false }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.border, backgroundColor: colors.surface, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      <Feather name={icon} size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
