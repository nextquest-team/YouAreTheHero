import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, offsetShadow, radius, spacing, typography } from '@/theme';
import type { StorySummary } from '@/types/api';

import { StoryCover } from './StoryCover';

type Props = { story: StorySummary; onPress: () => void };

/** Fiche d'une histoire : une carte de carnet, trait d'encre et ombre décalée. */
export function StoryCard({ story, onPress }: Props) {
  const { colors } = useTheme();
  const kind = story.hasCombat ? fr.library.combat : fr.library.narrative;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${story.title}, ${fr.library.by} ${story.author.displayName}, ${story.genre}, ${kind}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderStrong, boxShadow: offsetShadow(colors.borderStrong) },
        pressed && styles.pressed,
      ]}
    >
      <StoryCover uri={story.coverUrl} title={story.title} width={76} height={108} />
      <View style={styles.body}>
        <Text style={[typography.overline, { color: colors.accent }]} numberOfLines={1}>
          {`${story.genre} · ${kind}`}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {story.title}
        </Text>
        {story.summary ? (
          <Text style={[styles.summary, { color: colors.textMuted }]} numberOfLines={2}>
            {story.summary}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
          {`${fr.library.by} ${story.author.displayName}`}
        </Text>
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
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 25 },
  summary: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19 },
  meta: { marginTop: 'auto', fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
});
