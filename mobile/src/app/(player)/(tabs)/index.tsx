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
import { fonts, typography } from '@/theme';

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
        <View style={styles.greeting}>
          <Text style={[typography.label, { color: colors.textMuted }]}>{fr.library.greeting}</Text>
          <Text accessibilityRole="header" style={[typography.title, { color: colors.text }]} numberOfLines={1}>
            {user?.displayName}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/selfie')}
          accessibilityRole="button"
          accessibilityLabel={fr.library.heroButton}
          style={[styles.hero, { borderColor: colors.accent, backgroundColor: colors.surfaceAlt }]}
        >
          {avatar ? (
            <Image source={avatar} style={styles.heroImage} contentFit="cover" />
          ) : (
            <Feather name="camera" size={22} color={colors.accent} />
          )}
        </Pressable>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  greeting: { flex: 1, gap: 2 },
  hero: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  section: { gap: 10 },
  list: { gap: 10 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  emptyText: { textAlign: 'center', fontFamily: fonts.body },
});
