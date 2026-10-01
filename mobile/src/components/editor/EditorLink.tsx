import Feather from '@expo/vector-icons/Feather';
import { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { fonts, spacing, typography } from '@/theme';

type Props = {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  detail: string; // ex. « 3 caractéristiques »
  onPress: () => void;
};

/** Ligne qui ouvre une partie de l'éditeur (caractéristiques, ennemis, objets, scènes). */
export function EditorLink({ icon, label, detail, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Card onPress={onPress} accessibilityLabel={`${label}, ${detail}`} style={styles.row}>
      <Feather name={icon} size={22} color={colors.accent} />
      <View style={styles.text}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{detail}</Text>
      </View>
      <Feather name="chevron-right" size={22} color={colors.textMuted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  text: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
