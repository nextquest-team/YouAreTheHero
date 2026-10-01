import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DropCapText } from '@/components/common/DropCapText';
import { Hatch } from '@/components/common/Hatch';
import { LoadState } from '@/components/common/LoadState';
import { AdventureSheet } from '@/components/game/AdventureSheet';
import { ChangesStrip } from '@/components/game/ChangesStrip';
import { ChoiceList } from '@/components/game/ChoiceList';
import { CombatScreen } from '@/components/game/CombatScreen';
import { EndScreen } from '@/components/game/EndScreen';
import { HeroBar } from '@/components/game/HeroBar';
import { useGame } from '@/hooks/useGame';
import { useReviews } from '@/hooks/useReviews';
import { useStory } from '@/hooks/useStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, hairline, spacing, touchTarget, typography } from '@/theme';

const BACKDROP_HEIGHT = 210;

export default function PlayScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { game, loading, busy, error, reload, choose, attack, consumeItem, restart } = useGame(storyId);
  const storyMeta = useStory(storyId);
  const reviews = useReviews(storyId);
  const reloadReviews = reviews.reload;
  const [sheetOpen, setSheetOpen] = useState(false);

  // Le premier focus correspond au montage (état "started" déjà à jour, avec ses changements
  // de scène de départ) : on ne relit la partie qu'aux focus suivants, par exemple au retour
  // de l'écran selfie, pour refléter la nouvelle photo du héros sans écraser ces changements.
  const hasFocusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }
      reload();
      reloadReviews();
    }, [reload, reloadReviews]),
  );

  // Histoire terminée : le joueur peut maintenant donner son avis, on relit ce droit.
  const finished = game?.status === 'FINISHED';
  useEffect(() => {
    if (finished) reloadReviews();
  }, [finished, reloadReviews]);
  const openReview = () =>
    router.push({ pathname: '/review/[storyId]', params: { storyId, title: storyMeta.data?.title ?? '' } });

  const backdrop = assetUrl(game?.scene.backgroundUrl);
  const over = game ? game.status !== 'IN_PROGRESS' : false;
  const itemCount = game?.inventory.reduce((sum, item) => sum + item.qty, 0) ?? 0;

  // Partie terminée : écran dédié plein écran, sans décor ni inventaire à gérer.
  if (game && over) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={[styles.endContent, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xxl }]}>
          <EndScreen
            game={game}
            storyTitle={storyMeta.data?.title ?? ''}
            restarting={busy}
            error={error}
            onRestart={restart}
            onReview={finished && reviews.canReview && !reviews.mine ? openReview : undefined}
            onBackToLibrary={() => router.dismissTo('/')}
          />
        </ScrollView>
      </View>
    );
  }

  const storyTitle = storyMeta.data?.title ?? '';
  const sheet = game ? (
    <AdventureSheet
      visible={sheetOpen}
      game={game}
      storyTitle={storyTitle}
      canUse={!over}
      busy={busy}
      onUse={consumeItem}
      onEditFace={() => {
        setSheetOpen(false);
        router.push({ pathname: '/selfie', params: { storyId: game.storyId } });
      }}
      onClose={() => setSheetOpen(false)}
    />
  ) : null;

  // Combat : l'écran entier passe à l'encre, la scène reprend une fois l'adversaire vaincu.
  if (game?.combat) {
    return (
      <View style={styles.root}>
        <CombatScreen game={{ ...game, combat: game.combat }} busy={busy} error={error} onAttack={attack} onUse={consumeItem} onQuit={() => router.back()} />
        {sheet}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderStrong }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={fr.game.quit} style={styles.iconButton}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {storyTitle}
        </Text>
        {game ? (
          <Pressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={fr.game.openSheet}
            style={styles.iconButton}
          >
            <Feather name="file-text" size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={[styles.backdrop, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.borderStrong }]}>
          {backdrop ? (
            <Image source={backdrop} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityIgnoresInvertColors />
          ) : (
            <>
              {/* Contre-hachures de gravure : deux trames croisées */}
              <Hatch color={colors.text} />
              <Hatch color={colors.text} angle={45} gap={9} opacity={0.18} />
            </>
          )}
        </View>

        <View style={styles.body}>
          {!game ? (
            <LoadState loading={loading} error={error} onRetry={reload} />
          ) : (
            <>
              {/* Ornement de paragraphe : décoratif, VoiceOver commence au titre */}
              <View style={styles.paragraphMark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Text style={[styles.section, { color: colors.accent }]}>§</Text>
                <View style={[styles.dashedRule, { borderTopColor: colors.borderStrong }]} />
              </View>

              <Text accessibilityRole="header" style={[styles.sceneTitle, { color: colors.text }]}>
                {game.scene.title}
              </Text>
              {game.scene.text ? (
                <DropCapText
                  text={game.scene.text}
                  textStyle={{ ...styles.sceneText, color: colors.text }}
                  capColor={colors.accent}
                  capFontFamily={fonts.display}
                />
              ) : null}

              <ChangesStrip changes={game.changes} />

              {error ? (
                <Text accessibilityLiveRegion="polite" style={[typography.label, { color: colors.danger }]}>
                  {error}
                </Text>
              ) : null}

              <ChoiceList choices={game.choices} disabled={busy} onChoose={choose} />
            </>
          )}
        </View>
      </ScrollView>

      {game ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <HeroBar game={game} itemCount={itemCount} onOpenSheet={() => setSheetOpen(true)} />
        </View>
      ) : null}

      {sheet}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  endContent: { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderBottomWidth: hairline,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  backdrop: { height: BACKDROP_HEIGHT, overflow: 'hidden', borderBottomWidth: hairline },
  body: { paddingHorizontal: 22, paddingTop: 22, gap: 14 },
  paragraphMark: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  section: { fontFamily: fonts.display, fontSize: 52, lineHeight: 56 },
  dashedRule: { flex: 1, borderTopWidth: hairline, borderStyle: 'dashed' },
  sceneTitle: { fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34 },
  sceneText: { fontFamily: fonts.body, fontSize: 18, lineHeight: 28 },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
