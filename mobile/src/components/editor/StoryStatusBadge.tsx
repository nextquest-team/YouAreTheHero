import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, radius, spacing, typography } from '@/theme';

/** Pastille « Publiée » ou « Brouillon » d'une histoire du créateur. */
export function StoryStatusBadge({ published }: { published: boolean }) {
  const { colors } = useTheme();
  const tone = published
    ? { backgroundColor: colors.successSoft, color: colors.success }
    : { backgroundColor: colors.accentSoft, color: colors.accent };

  return (
    <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
      <Text style={[typography.caption, styles.text, { color: tone.color }]}>
        {published ? fr.creatorStories.published : fr.creatorStories.draft}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 2 },
  text: { fontFamily: fonts.bodyBold },
});
