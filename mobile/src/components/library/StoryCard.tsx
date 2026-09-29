import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, offsetShadow, radius, spacing } from '@/theme';
import type { StorySummary } from '@/types/api';

import { type CoverVariant, StoryCover } from './StoryCover';

type Props = { story: StorySummary; inProgress?: boolean; coverVariant?: CoverVariant; onPress: () => void };

/** Fiche d'une histoire : une carte de carnet, trait d'encre et ombre décalée. */
export function StoryCard({ story, inProgress = false, coverVariant = 0, onPress }: Props) {
  const { colors } = useTheme();
  const kind = story.hasCombat ? fr.library.combat : fr.library.narrative;
  // Une partie commencée prime sur le type d'histoire : c'est elle qu'on vient reprendre
  const status = inProgress ? fr.library.inProgress : kind;
  const action = inProgress ? fr.library.resumeArrow : fr.library.readArrow;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${story.title}, ${fr.library.by} ${story.author.displayName}, ${story.genre}, ${status}`}
      accessibilityHint={inProgress ? fr.library.resume : undefined}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderStrong, boxShadow: offsetShadow(colors.borderStrong) },
        pressed && styles.pressed,
      ]}
    >
      <StoryCover uri={story.coverUrl} title={story.title} width={84} height={124} variant={coverVariant} />
      <View style={styles.body}>
        <Text style={[styles.overline, { color: story.hasCombat || inProgress ? colors.accent : colors.textMuted }]} numberOfLines={1}>
          {`${story.genre} · ${status}`}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {story.title}
        </Text>
        {story.summary ? (
          <Text style={[styles.summary, { color: colors.textMuted }]} numberOfLines={2}>
            {story.summary}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={[styles.meta, styles.author, { color: colors.textMuted }]} numberOfLines={1}>
            {`${fr.library.by} ${story.author.displayName}`}
          </Text>
          <Text style={[styles.meta, { color: inProgress ? colors.accent : colors.text }]}>{action}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: spacing.md,
    borderWidth: hairline,
    borderRadius: radius.xl,
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: 'none' },
  body: { flex: 1, gap: 5 },
  overline: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, fontSize: 23, lineHeight: 25 },
  summary: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19 },
  footer: { marginTop: 'auto', flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  author: { flex: 1 },
  meta: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
});
