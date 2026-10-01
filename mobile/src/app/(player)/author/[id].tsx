import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { StoryCard } from '@/components/library/StoryCard';
import type { CoverVariant } from '@/components/library/StoryCover';
import { Screen } from '@/components/ui';
import { useAuthorStories } from '@/hooks/useStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, touchTarget, typography } from '@/theme';

// Page d'un auteur : ses histoires publiées. Le nom arrive avec la navigation, pour s'afficher
// tout de suite (et même si l'auteur n'a plus rien de publié).
export default function AuthorScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { colors } = useTheme();
  const stories = useAuthorStories(id);
  const displayName = name ?? stories.data?.[0]?.author.displayName ?? '';
  const count = stories.data?.length ?? 0;

  return (
    <Screen scroll>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={fr.common.back}
        style={styles.back}
      >
        <Feather name="arrow-left" size={24} color={colors.text} />
      </Pressable>

      <View style={styles.header}>
        <Text style={[typography.overline, { color: colors.textMuted }]}>{fr.author.overline}</Text>
        <Text accessibilityRole="header" style={[styles.name, { color: colors.text }]}>
          {displayName}
        </Text>
        <View style={[styles.doubleRule, { borderColor: colors.borderStrong }]} />
        {stories.data ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.author.count(count)}</Text>
        ) : null}
      </View>

      <LoadState loading={stories.loading && !stories.data} error={stories.error} onRetry={stories.reload} />

      {stories.data && count === 0 ? (
        <Text style={[typography.body, styles.empty, { color: colors.textMuted }]}>{fr.author.empty}</Text>
      ) : null}

      <View style={styles.list}>
        {stories.data?.map((story, index) => (
          <StoryCard
            key={story.id}
            story={story}
            coverVariant={(index % 3) as CoverVariant}
            onPress={() => router.push({ pathname: '/story/[id]', params: { id: story.id } })}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: touchTarget, height: touchTarget, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  header: { gap: 8 },
  name: { fontFamily: fonts.displayItalic, fontSize: 36, lineHeight: 40 },
  doubleRule: { borderTopWidth: hairline, borderBottomWidth: hairline, paddingTop: 3 },
  empty: { textAlign: 'center', fontFamily: fonts.body, paddingVertical: 24 },
  list: { gap: 18, paddingRight: 4, paddingBottom: 4 },
});
