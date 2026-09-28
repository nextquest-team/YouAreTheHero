import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { DropCapText } from '@/components/common/DropCapText';
import { LoadState } from '@/components/common/LoadState';
import { parchment } from '@/components/common/parchment';
import { Button, Input, Screen } from '@/components/ui';
import { useStory } from '@/hooks/useStories';
import { useTheme } from '@/hooks/useTheme';
import { errorMessage } from '@/i18n/errorMessage';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { startGame } from '@/services/play';
import { fonts, radius, spacing, touchTarget, typography } from '@/theme';

const COVER_HEIGHT = 236;

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

  const goBack = () => router.back();
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
  const cover = assetUrl(data?.coverUrl ?? null);
  const inProgress = data?.mySave?.status === 'IN_PROGRESS';
  const textDefs = data?.stats.filter((stat) => stat.type === 'text') ?? [];
  const numberDefs = data?.stats.filter((stat) => stat.type === 'number') ?? [];

  return (
    <Screen scroll contentStyle={styles.screenContent}>
      {!data ? (
        <>
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel={fr.common.back} style={styles.standaloneBack}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.loadBox}>
            <LoadState loading={story.loading && !data} error={story.error} onRetry={story.reload} />
          </View>
        </>
      ) : null}

      {data ? (
        <>
          <View style={[styles.coverWrap, { backgroundColor: colors.surfaceAlt }]}>
            {cover ? (
              <Image source={cover} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
            ) : (
              <View style={styles.coverFallback}>
                <Feather name="book" size={56} color={colors.textMuted} />
              </View>
            )}
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={fr.common.back}
              style={[styles.coverBack, { backgroundColor: colors.background }]}
            >
              <Feather name="arrow-left" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.titleBlock}>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
                {data.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  {fr.storyDetail.by} {data.author.displayName}
                </Text>
                <View style={[styles.badge, { borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.textSoft }]}>{data.genre}</Text>
                </View>
                {data.hasCombat ? (
                  <View style={[styles.badge, { borderColor: colors.accent }]}>
                    <Text style={[styles.badgeText, { color: colors.accent }]}>{fr.storyDetail.combat}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {data.avgRating === null
                  ? fr.storyDetail.noRating
                  : `${fr.storyDetail.rating} : ${data.avgRating.toLocaleString('fr-FR')} / 5`}
              </Text>
            </View>

            {data.summary ? (
              <View style={[styles.summaryBox, { backgroundColor: parchment.background, borderLeftColor: parchment.rule }]}>
                <DropCapText text={data.summary} textStyle={styles.summaryText} capColor={parchment.accent} />
              </View>
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
                  <View style={styles.statsGrid}>
                    {numberDefs.map((stat) => (
                      <View key={stat.id} style={[styles.statCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                <Button label={fr.storyDetail.start} onPress={start} loading={starting} />
              )}
            </View>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, gap: 0 },
  standaloneBack: {
    width: touchTarget,
    height: touchTarget,
    marginTop: spacing.sm,
    marginLeft: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadBox: { paddingHorizontal: spacing.xl },
  coverWrap: { height: COVER_HEIGHT, position: 'relative', overflow: 'hidden' },
  coverFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverBack: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.xl },
  titleBlock: { gap: 8 },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 36 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 12 },
  summaryBox: {
    padding: 18,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderLeftWidth: 6,
  },
  summaryText: { fontFamily: fonts.display, fontSize: 19, lineHeight: 27, color: parchment.ink },
  section: { gap: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCell: {
    flexBasis: '31%',
    flexGrow: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
  },
  statValue: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, fontVariant: ['lining-nums'] },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
