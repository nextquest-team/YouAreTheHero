import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { StoryCover } from '@/components/library/StoryCover';
import { Button, Input, Screen } from '@/components/ui';
import { useStory } from '@/hooks/useStories';
import { useTheme } from '@/hooks/useTheme';
import { errorMessage } from '@/i18n/errorMessage';
import { fr } from '@/i18n/fr';
import { startGame } from '@/services/play';
import { fonts, radius, spacing, touchTarget, typography } from '@/theme';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const story = useStory(id);
  const reload = story.reload;
  const [textStats, setTextStats] = useState<Record<string, string>>({});
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Au retour du jeu, l'état de la partie a changé : on relit la fiche.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const openGame = () => router.push({ pathname: '/play/[storyId]', params: { storyId: id } });

  const start = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const values = Object.fromEntries(Object.entries(textStats).filter(([, value]) => value.trim() !== ''));
      await startGame(id, { textStats: values });
      openGame();
    } catch (error) {
      setStartError(errorMessage(error));
    } finally {
      setStarting(false);
    }
  };

  const confirmRestart = () =>
    Alert.alert(fr.storyDetail.restart, fr.storyDetail.restartHint, [
      { text: fr.common.cancel, style: 'cancel' },
      { text: fr.storyDetail.restart, style: 'destructive', onPress: start },
    ]);

  const data = story.data;
  const inProgress = data?.mySave?.status === 'IN_PROGRESS';
  const textDefs = data?.stats.filter((stat) => stat.type === 'text') ?? [];
  const numberDefs = data?.stats.filter((stat) => stat.type === 'number') ?? [];

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

      <LoadState loading={story.loading && !data} error={story.error} onRetry={story.reload} />

      {data ? (
        <>
          <View style={styles.hero}>
            <StoryCover uri={data.coverUrl} width={120} height={150} />
            <View style={styles.heroText}>
              <Text accessibilityRole="header" style={[typography.heading, { color: colors.text }]}>
                {data.title}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {fr.storyDetail.by} {data.author.displayName}
              </Text>
              <View style={styles.badges}>
                <Text style={[styles.badge, { backgroundColor: colors.surfaceAlt, color: colors.accent }]}>
                  {data.hasCombat ? fr.storyDetail.combat : fr.storyDetail.narrative}
                </Text>
                <Text style={[styles.badge, { backgroundColor: colors.surfaceAlt, color: colors.textSoft }]}>
                  {data.genre}
                </Text>
              </View>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {data.avgRating === null
                  ? fr.storyDetail.noRating
                  : `${fr.storyDetail.rating} : ${data.avgRating.toLocaleString('fr-FR')} / 5`}
              </Text>
            </View>
          </View>

          {data.summary ? (
            <Text style={[styles.summary, { color: colors.textSoft }]}>{data.summary}</Text>
          ) : null}

          {data.mySave?.status === 'FINISHED' || data.mySave?.status === 'DEAD' ? (
            <Text style={[typography.label, { color: data.mySave.status === 'DEAD' ? colors.danger : colors.success }]}>
              {data.mySave.status === 'DEAD' ? fr.storyDetail.dead : fr.storyDetail.finished}
            </Text>
          ) : null}

          {numberDefs.length > 0 || (!inProgress && textDefs.length > 0) ? (
            <View style={styles.section}>
              <Text style={[typography.overline, { color: colors.textMuted }]}>{fr.storyDetail.heroStats}</Text>
              {numberDefs.length > 0 ? (
                <View style={styles.stats}>
                  {numberDefs.map((stat) => (
                    <View key={stat.id} style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[typography.caption, { color: colors.textMuted }]}>{stat.name}</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>{stat.defaultValue}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {!inProgress
                ? textDefs.map((stat) => (
                    <Input
                      key={stat.id}
                      label={stat.name}
                      placeholder={`${fr.storyDetail.textStatPlaceholder} ${stat.defaultValue}`}
                      value={textStats[stat.id] ?? ''}
                      onChangeText={(value) => setTextStats((prev) => ({ ...prev, [stat.id]: value }))}
                      maxLength={50}
                    />
                  ))
                : null}
            </View>
          ) : null}

          <View style={styles.actions}>
            {startError ? (
              <Text accessibilityLiveRegion="polite" style={[typography.label, { color: colors.danger }]}>
                {startError}
              </Text>
            ) : null}
            {inProgress ? (
              <>
                <Button label={fr.storyDetail.resume} icon="play" onPress={openGame} />
                <Button
                  label={fr.storyDetail.restart}
                  variant="ghost"
                  accessibilityHint={fr.storyDetail.restartHint}
                  onPress={confirmRestart}
                  loading={starting}
                />
              </>
            ) : (
              <Button label={fr.storyDetail.start} icon="play" onPress={start} loading={starting} />
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    width: touchTarget,
    height: touchTarget,
    marginLeft: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  heroText: { flex: 1, gap: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 2 },
  badge: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  summary: { fontFamily: fonts.body, fontSize: 17, lineHeight: 26 },
  section: { gap: 10 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: {
    minWidth: 84,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
  },
  statValue: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
