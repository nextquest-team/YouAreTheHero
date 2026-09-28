import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, radius, spacing } from '@/theme';
import type { StorySummary } from '@/types/api';

import { StoryCover } from './StoryCover';

type Props = { story: StorySummary; onPress: () => void };

export function StoryCard({ story, onPress }: Props) {
  const { colors } = useTheme();
  const kind = story.hasCombat ? fr.library.combat : fr.library.narrative;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${story.title}, ${fr.library.by} ${story.author.displayName}, ${story.genre}, ${kind}`}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
    >
      <StoryCover uri={story.coverUrl} width={72} height={88} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {story.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
          {fr.library.by} {story.author.displayName}
        </Text>
        <View style={styles.tags}>
          <Text style={[styles.tag, { backgroundColor: colors.surfaceAlt, color: colors.accent }]}>{kind}</Text>
          <Text style={[styles.genre, { color: colors.textSoft }]} numberOfLines={1}>
            {story.genre}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  body: { flex: 1, gap: spacing.xs },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  meta: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  genre: { fontFamily: fonts.bodySemiBold, fontSize: 12, flexShrink: 1 },
});
