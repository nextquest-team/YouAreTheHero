import Feather from '@expo/vector-icons/Feather';
import { ComponentProps } from 'react';
import { type ColorValue, StyleSheet, View } from 'react-native';

type Props = { name: ComponentProps<typeof Feather>['name']; color: ColorValue; size: number; focused: boolean };

/** Icône d'onglet : l'onglet actif porte un filet au-dessus, pas seulement une autre couleur. */
export function TabIcon({ name, color, size, focused }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: focused ? color : 'transparent' }]} />
      <Feather name={name} color={color} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  bar: { width: 22, height: 3, marginTop: -6 },
});
