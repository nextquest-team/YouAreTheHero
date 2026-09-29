import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, offsetShadow, radius, spacing } from '@/theme';
import type { SaveSummary } from '@/types/api';

import { StoryCover } from './StoryCover';

type Props = { save: SaveSummary; onPress: () => void };

/** Dernière partie en cours, mise en avant en haut de la bibliothèque (ombre vermillon). */
export function ResumeCard({ save, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${fr.library.continue} : ${save.story.title}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderStrong, boxShadow: offsetShadow(colors.accent) },
        pressed && styles.pressed,
      ]}
    >
      <StoryCover uri={save.story.coverUrl} title={save.story.title} width={64} height={80} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {save.story.title}
        </Text>
        <Text style={[styles.cta, { color: colors.accent }]}>{fr.library.continueArrow}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, padding: spacing.md, borderRadius: radius.xl, borderWidth: hairline },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: 'none' },
  body: { flex: 1, gap: spacing.sm, justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 23, lineHeight: 26 },
  cta: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
});
