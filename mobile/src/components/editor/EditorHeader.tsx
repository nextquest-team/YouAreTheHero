import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { spacing, touchTarget, typography } from '@/theme';

type Props = {
  overline: string;
  title?: string;
  children?: ReactNode; // ex. la pastille Publiée ou Brouillon
};

/** En-tête des écrans de l'éditeur : retour, surtitre, titre. */
export function EditorHeader({ overline, title, children }: Props) {
  const { colors } = useTheme();

  return (
    <>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={fr.common.back} style={styles.back}>
        <Feather name="arrow-left" size={24} color={colors.text} />
      </Pressable>
      {title ? (
        <View style={styles.header}>
          <Text style={[typography.label, { color: colors.textMuted }]}>{overline}</Text>
          <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]}>
            {title}
          </Text>
          {children}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  back: { width: touchTarget, height: touchTarget, justifyContent: 'center', marginLeft: -spacing.sm, paddingLeft: spacing.sm },
  header: { gap: spacing.xs, alignItems: 'flex-start' },
});
