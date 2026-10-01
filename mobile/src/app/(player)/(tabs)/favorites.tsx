import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { DogEar } from '@/components/library/DogEar';
import { StoryCard } from '@/components/library/StoryCard';
import type { CoverVariant } from '@/components/library/StoryCover';
import { Button, Screen } from '@/components/ui';
import { useFavorites } from '@/hooks/useFavorites';
import { useSaves } from '@/hooks/useStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, offsetShadow } from '@/theme';

export default function Favorites() {
  const { colors } = useTheme();
  const favorites = useFavorites();
  const saves = useSaves();
  const reloadFavorites = favorites.reload;
  const reloadSaves = saves.reload;

  // Un favori s'ajoute ou se retire depuis la fiche : on relit la liste au retour sur l'onglet.
  useFocusEffect(
    useCallback(() => {
      reloadFavorites();
      reloadSaves();
    }, [reloadFavorites, reloadSaves]),
  );

  const inProgress = new Set(saves.data?.filter((save) => save.status === 'IN_PROGRESS').map((save) => save.story.id));
  const count = favorites.data?.length ?? 0;
  const openStory = (id: string) => router.push({ pathname: '/story/[id]', params: { id } });

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={[styles.brand, { color: colors.text }]} numberOfLines={1}>
            {fr.library.brand}
          </Text>
          {favorites.data ? (
            <Text style={[styles.brand, { color: colors.accent }]} accessibilityLabel={fr.favorites.count(count)}>
              {`Nº ${String(count).padStart(2, '0')}`}
            </Text>
          ) : null}
        </View>
        <View style={[styles.doubleRule, { borderColor: colors.borderStrong }]} />
        <Text accessibilityRole="header" style={[styles.headline, { color: colors.text }]}>
          {fr.favorites.headlineStart}
          <Text style={{ fontFamily: fonts.displayItalic, color: colors.accent }}>{fr.favorites.headlineAccent}</Text>
          {fr.favorites.headlineEnd}
        </Text>
        {count > 0 ? <Text style={[styles.tagline, { color: colors.textMuted }]}>{fr.favorites.tagline}</Text> : null}
      </View>

      <LoadState loading={favorites.loading && !favorites.data} error={favorites.error} onRetry={favorites.reload} />

      {favorites.data && count === 0 ? (
        <View style={styles.empty}>
          <View
            style={[styles.page, { backgroundColor: colors.surface, borderColor: colors.borderStrong, boxShadow: offsetShadow(colors.borderStrong) }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {[40, 58, 76, 94].map((top, index) => (
              <View key={top} style={[styles.pageLine, { top, right: index === 3 ? 44 : 16, backgroundColor: colors.border }]} />
            ))}
            <DogEar size={34} dashed soft />
          </View>
          <Text accessibilityRole="header" style={[styles.emptyTitle, { color: colors.text }]}>
            {fr.favorites.emptyTitle}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{fr.favorites.emptyHint}</Text>
          <View style={styles.emptyAction}>
            <Button label={fr.favorites.browse} variant="secondary" onPress={() => router.navigate('/')} />
          </View>
        </View>
      ) : null}

      <View style={styles.list}>
        {favorites.data?.map((story, index) => (
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
  list: { gap: 18, paddingRight: 4, paddingBottom: 4 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 24 },
  page: { width: 118, height: 150, borderWidth: hairline, marginBottom: 8 },
  pageLine: { position: 'absolute', left: 16, height: hairline },
  emptyTitle: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, textAlign: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, textAlign: 'center', maxWidth: 280 },
  emptyAction: { alignSelf: 'stretch', marginTop: 8 },
});
