import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, radius, spacing } from '@/theme';
import type { SaveSummary } from '@/types/api';

import { StoryCover } from './StoryCover';

type Props = { save: SaveSummary; onPress: () => void };

/** Dernière partie en cours, mise en avant en haut de la bibliothèque. */
export function ResumeCard({ save, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${fr.library.continue} : ${save.story.title}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.row}>
        <StoryCover uri={save.story.coverUrl} width={64} height={64} />
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {save.story.title}
        </Text>
      </View>
      <Text style={[styles.cta, { color: colors.accent }]}>{fr.library.continue}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 22, lineHeight: 26 },
  cta: { fontFamily: fonts.bodyBold, fontSize: 14 },
});
