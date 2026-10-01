import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { GenreChips } from '@/components/library/GenreChips';
import { StoryCard } from '@/components/library/StoryCard';
import type { CoverVariant } from '@/components/library/StoryCover';
import { Button, Input, Screen } from '@/components/ui';
import { useGenres, useSaves, useStories } from '@/hooks/useStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, typography } from '@/theme';

export default function Library() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);

  const stories = useStories(query, genre);
  const genres = useGenres();
  const saves = useSaves();
  const reloadSaves = saves.reload;
  const reloadStories = stories.reload;

  // La partie en cours change après chaque session de jeu, et un favori a pu changer depuis
  // la fiche : on relit les deux au retour sur l'onglet.
  useFocusEffect(
    useCallback(() => {
      reloadSaves();
      reloadStories();
    }, [reloadSaves, reloadStories]),
  );

  // Toutes les parties commencées : leur fiche passe « En cours » et remonte en tête de liste
  const inProgress = new Set(saves.data?.filter((save) => save.status === 'IN_PROGRESS').map((save) => save.story.id));
  const list = [...(stories.data ?? [])].sort((x, y) => Number(inProgress.has(y.id)) - Number(inProgress.has(x.id)));
  const filtered = query.trim() !== '' || genre !== null;
  const count = stories.data?.length ?? 0;
  const openStory = (id: string) => router.push({ pathname: '/story/[id]', params: { id } });

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={[styles.brand, { color: colors.text }]} numberOfLines={1}>
            {fr.library.brand}
          </Text>
          {stories.data ? (
            <Text style={[styles.brand, { color: colors.accent }]} accessibilityLabel={fr.library.storyCount(count)}>
              {`Nº ${String(count).padStart(2, '0')}`}
            </Text>
          ) : null}
        </View>
        {/* Double filet d'en-tête de carnet */}
        <View style={[styles.doubleRule, { borderColor: colors.borderStrong }]} />
        <Text accessibilityRole="header" style={[styles.headline, { color: colors.text }]}>
          {fr.library.headlineStart}
          <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>{fr.library.headlineAccent}</Text>
          {fr.library.headlineEnd}
        </Text>
        <Text style={[styles.tagline, { color: colors.textMuted }]}>{fr.library.tagline}</Text>
      </View>

      <View style={styles.section}>
        <Input
          variant="underline"
          label={fr.library.searchLabel}
          placeholder={fr.library.searchPlaceholder}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {genres.data && genres.data.length > 0 ? (
          <GenreChips genres={genres.data} value={genre} onChange={setGenre} />
        ) : null}
      </View>

      <LoadState loading={stories.loading && !stories.data} error={stories.error} onRetry={stories.reload} />

      {stories.data && stories.data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[typography.body, styles.emptyText, { color: colors.textMuted }]}>
            {filtered ? fr.library.noResult : fr.library.empty}
          </Text>
          {filtered ? (
            <Button
              label={fr.library.clearFilters}
              variant="ghost"
              onPress={() => {
                setQuery('');
                setGenre(null);
              }}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.list}>
        {list.map((story, index) => (
          <StoryCard
            key={story.id}
            story={story}
            inProgress={inProgress.has(story.id)}
            coverVariant={(index % 3) as CoverVariant}
            onPress={() => openStory(story.id)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  brand: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  doubleRule: { borderTopWidth: hairline, borderBottomWidth: hairline, paddingTop: 3 },
  headline: { fontFamily: fonts.display, fontSize: 44, lineHeight: 48, marginTop: 4 },
  tagline: { fontFamily: fonts.bodyItalic, fontSize: 16, lineHeight: 22 },
  section: { gap: 14 },
  list: { gap: 18, paddingRight: 4, paddingBottom: 4 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  emptyText: { textAlign: 'center', fontFamily: fonts.body },
});
