import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DropCapText } from '@/components/common/DropCapText';
import { Hatch } from '@/components/common/Hatch';
import { LoadState } from '@/components/common/LoadState';
import { ChangesStrip } from '@/components/game/ChangesStrip';
import { ChoiceList } from '@/components/game/ChoiceList';
import { CombatPanel } from '@/components/game/CombatPanel';
import { EndScreen } from '@/components/game/EndScreen';
import { HeroBar } from '@/components/game/HeroBar';
import { InventorySheet } from '@/components/game/InventorySheet';
import { useGame } from '@/hooks/useGame';
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
  const [inventoryOpen, setInventoryOpen] = useState(false);

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
    }, [reload]),
  );

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
            onBackToLibrary={() => router.dismissTo('/')}
          />
        </ScrollView>
      </View>
    );
  }

  const face = assetUrl(game?.heroFaceUrl);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderStrong }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={fr.game.quit} style={styles.iconButton}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[typography.overline, styles.center, { color: colors.text }]} numberOfLines={1}>
            {storyMeta.data?.title ?? ''}
          </Text>
          {game ? (
            <View style={styles.saved} accessible accessibilityLabel={fr.game.saved}>
              <Feather name="check" size={12} color={colors.success} />
              <Text style={[styles.savedText, { color: colors.success }]}>{fr.game.saved}</Text>
            </View>
          ) : null}
        </View>
        {game ? (
          <Pressable
            onPress={() => router.push({ pathname: '/selfie', params: { storyId: game.storyId } })}
            accessibilityRole="button"
            accessibilityLabel={fr.game.heroFaceButton}
            style={styles.iconButton}
          >
            {/* Portrait en ovale à double filet, comme sur la feuille d'aventure */}
            <View style={[styles.faceRing, { borderColor: colors.borderStrong }]}>
              <View style={[styles.face, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceAlt }]}>
                {face ? (
                  <Image source={face} style={styles.faceImage} contentFit="cover" accessibilityLabel={fr.game.heroAlt} />
                ) : (
                  <Feather name="user" size={16} color={colors.text} />
                )}
              </View>
            </View>
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
            <Hatch color={colors.text} />
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

              {game.combat ? (
                <CombatPanel combat={game.combat} busy={busy} onAttack={attack} />
              ) : (
                <ChoiceList choices={game.choices} disabled={busy} onChoose={choose} />
              )}
            </>
          )}
        </View>
      </ScrollView>

      {game ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <HeroBar game={game} itemCount={itemCount} onOpenInventory={() => setInventoryOpen(true)} />
        </View>
      ) : null}

      {game ? (
        <InventorySheet
          visible={inventoryOpen}
          items={game.inventory}
          canUse={!over}
          busy={busy}
          onUse={consumeItem}
          onClose={() => setInventoryOpen(false)}
        />
      ) : null}
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: hairline,
  },
  headerText: { flex: 1, alignItems: 'center', gap: 2 },
  center: { textAlign: 'center' },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  savedText: { fontFamily: fonts.mono, fontSize: 11 },
  faceRing: { width: 40, height: 44, borderRadius: 22, borderWidth: 1, padding: 2 },
  face: {
    flex: 1,
    borderRadius: 20,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceImage: { width: '100%', height: '100%' },
  backdrop: { height: BACKDROP_HEIGHT, overflow: 'hidden', borderBottomWidth: hairline },
  body: { paddingHorizontal: 22, paddingTop: 22, gap: 14 },
  paragraphMark: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  section: { fontFamily: fonts.display, fontSize: 52, lineHeight: 56 },
  dashedRule: { flex: 1, borderTopWidth: hairline, borderStyle: 'dashed' },
  sceneTitle: { fontFamily: fonts.displayItalic, fontSize: 30, lineHeight: 34 },
  sceneText: { fontFamily: fonts.body, fontSize: 18, lineHeight: 28 },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
