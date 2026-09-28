import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadState } from '@/components/common/LoadState';
import { ChangesStrip } from '@/components/game/ChangesStrip';
import { ChoiceList } from '@/components/game/ChoiceList';
import { CombatPanel } from '@/components/game/CombatPanel';
import { EndScreen } from '@/components/game/EndScreen';
import { gameColors } from '@/components/game/gameColors';
import { HeroBar } from '@/components/game/HeroBar';
import { InventorySheet } from '@/components/game/InventorySheet';
import { useGame } from '@/hooks/useGame';
import { useStory } from '@/hooks/useStories';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, radius, spacing, touchTarget, typography } from '@/theme';

const BACKDROP_HEIGHT = 300;

export default function PlayScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { game, loading, busy, error, reload, choose, attack, consumeItem, restart } = useGame(storyId);
  const storyMeta = useStory(storyId);
  const [inventoryOpen, setInventoryOpen] = useState(false);

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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        <View style={[styles.backdrop, { backgroundColor: colors.surfaceAlt }]}>
          {backdrop ? (
            <Image source={backdrop} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityIgnoresInvertColors />
          ) : null}
          <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={fr.game.quit}
              style={[styles.iconButton, { backgroundColor: colors.background }]}
            >
              <Feather name="x" size={22} color={colors.text} />
            </Pressable>
            {game ? (
              <View style={styles.topRight}>
                <View style={[styles.saved, { backgroundColor: colors.background }]}>
                  <Feather name="check-circle" size={14} color={colors.success} />
                  <Text style={[styles.savedText, { color: colors.success }]}>{fr.game.saved}</Text>
                </View>
                <Pressable
                  onPress={() => setInventoryOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`${fr.game.inventory}, ${itemCount}`}
                  style={[styles.iconButton, { backgroundColor: colors.background }]}
                >
                  <Feather name="briefcase" size={20} color={colors.accent} />
                  {itemCount > 0 ? (
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{itemCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          {!game ? (
            <View style={styles.pad}>
              <LoadState loading={loading} error={error} onRetry={reload} />
            </View>
          ) : (
            <>
              <View style={styles.heroBar}>
                <HeroBar game={game} />
              </View>

              <View style={styles.pad}>
                <ChangesStrip changes={game.changes} />

                <View style={[styles.parchment, { backgroundColor: gameColors.parchment }]}>
                  <Text accessibilityRole="header" style={[styles.sceneTitle, { color: gameColors.inkSoft }]}>
                    {game.scene.title}
                  </Text>
                  <Text style={[styles.sceneText, { color: gameColors.ink }]}>{game.scene.text}</Text>
                </View>

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
              </View>
            </>
          )}
        </View>
      </ScrollView>

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
  backdrop: { height: BACKDROP_HEIGHT, overflow: 'hidden' },
  topBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savedText: { fontFamily: fonts.bodyBold, fontSize: 12 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11 },
  body: { gap: spacing.lg },
  heroBar: { marginTop: -44, marginHorizontal: spacing.lg },
  pad: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  parchment: { padding: 18, borderRadius: radius.xl, gap: 6 },
  sceneTitle: { ...typography.overline },
  sceneText: { fontFamily: fonts.display, fontSize: 21, lineHeight: 28 },
});
