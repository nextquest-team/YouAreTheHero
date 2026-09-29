import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { GenreChips } from '@/components/library/GenreChips';
import { ResumeCard } from '@/components/library/ResumeCard';
import { StoryCard } from '@/components/library/StoryCard';
import { Button, Input, Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useGenres, useSaves, useStories } from '@/hooks/useStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, hairline, typography } from '@/theme';

export default function Library() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);

  const stories = useStories(query, genre);
  const genres = useGenres();
  const saves = useSaves();
  const reloadSaves = saves.reload;

  // La partie en cours change après chaque session de jeu : on la relit au retour sur l'onglet.
  useFocusEffect(
    useCallback(() => {
      reloadSaves();
    }, [reloadSaves]),
  );

  const current = saves.data?.find((save) => save.status === 'IN_PROGRESS') ?? null;
  const filtered = query.trim() !== '' || genre !== null;
  const avatar = assetUrl(user?.avatarUrl);
  const openStory = (id: string) => router.push({ pathname: '/story/[id]', params: { id } });

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={[typography.overline, styles.brand, { color: colors.text }]} numberOfLines={1}>
            {`${fr.library.greeting} ${user?.displayName ?? ''}`}
          </Text>
          <Pressable
            onPress={() => router.push('/selfie')}
            accessibilityRole="button"
            accessibilityLabel={fr.library.heroButton}
            style={[styles.hero, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt }]}
          >
            {avatar ? (
              <Image source={avatar} style={styles.heroImage} contentFit="cover" />
            ) : (
              <Feather name="camera" size={20} color={colors.text} />
            )}
          </Pressable>
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

      {current ? (
        <View style={styles.section}>
          <Text style={[typography.overline, { color: colors.textMuted }]}>{fr.library.resume}</Text>
          <ResumeCard save={current} onPress={() => openStory(current.story.id)} />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[typography.overline, { color: colors.textMuted }]}>{fr.library.allStories}</Text>
        <Input
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
          {stories.data?.map((story) => (
            <StoryCard key={story.id} story={story} onPress={() => openStory(story.id)} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  brand: { flex: 1 },
  doubleRule: { borderTopWidth: hairline, borderBottomWidth: hairline, paddingTop: 3 },
  headline: { fontFamily: fonts.display, fontSize: 42, lineHeight: 46, marginTop: 4 },
  tagline: { fontFamily: fonts.bodyItalic, fontSize: 16, lineHeight: 22 },
  hero: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  section: { gap: 14 },
  list: { gap: 18, paddingRight: 4, paddingBottom: 4 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  emptyText: { textAlign: 'center', fontFamily: fonts.body },
});
