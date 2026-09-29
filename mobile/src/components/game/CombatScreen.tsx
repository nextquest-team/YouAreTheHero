import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hatch } from '@/components/common/Hatch';
import { OvalPortrait } from '@/components/hero/OvalPortrait';
import { useAuth } from '@/hooks/useAuth';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, hairline, offsetShadow, radius, touchTarget } from '@/theme';
import type { GameState } from '@/types/api';

import { Gauge } from './Gauge';
import { gameColors } from './gameColors';

type Props = {
  game: GameState & { combat: NonNullable<GameState['combat']> };
  busy: boolean;
  error: string | null;
  onAttack: () => void;
  onUse: (itemId: string) => void;
  onQuit: () => void;
};

// Au-delà, une case par PV deviendrait illisible : on revient à 10 cases proportionnelles.
const MAX_SEGMENTS = 20;

/** « Tu fais 5, Ennemi 3 : Ennemi perd 2 PV » → l'action en italique, l'issue en capitales. */
function splitTurn(line: string) {
  const cut = line.lastIndexOf(' : ');
  return cut === -1 ? { action: line, result: '' } : { action: line.slice(0, cut), result: line.slice(cut + 3) };
}

/**
 * Combat plein écran, sur une page d'encre : l'adversaire sur sa carte de papier, le héros
 * en regard, le journal des assauts (le plus récent en tête) et l'action de frapper.
 */
export function CombatScreen({ game, busy, error, onAttack, onUse, onQuit }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { combat } = game;
  const { enemy } = combat;
  const enemyImage = assetUrl(enemy.imageUrl);
  const face = assetUrl(game.heroFaceUrl);
  const hpStat = game.stats.find((stat) => stat.id === game.hpStatId);
  const heroStats = game.stats.filter((stat) => stat.type === 'number' && stat.id !== game.hpStatId);
  const usable = game.inventory.filter((item) => item.usable);
  const journal = [...combat.log].reverse();
  const latestTurn = combat.log.at(-1);

  // À chaque assaut : retour en haut du journal (le plus récent) et annonce à VoiceOver,
  // puisque le journal ne se relit plus d'un bloc.
  const journalRef = useRef<ScrollView>(null);
  const turns = useRef(combat.log.length);
  useEffect(() => {
    if (combat.log.length === turns.current) return;
    turns.current = combat.log.length;
    journalRef.current?.scrollTo({ y: 0, animated: true });
    if (latestTurn) AccessibilityInfo.announceForAccessibility(latestTurn);
  }, [combat.log.length, latestTurn]);

  return (
    <View style={[styles.root, { backgroundColor: gameColors.ink, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.top}>
        <Pressable onPress={onQuit} accessibilityRole="button" accessibilityLabel={fr.game.quit} style={styles.iconButton}>
          <Feather name="chevron-left" size={24} color={gameColors.paper} />
        </Pressable>
        <Text accessibilityRole="header" style={[styles.mono, styles.grow, { color: gameColors.accentOnInk }]}>
          {fr.game.combatTitle}
        </Text>
        <Text style={[styles.mono, { color: gameColors.paper }]}>{`${fr.game.assault} ${combat.log.length + 1}`}</Text>
      </View>

      {/* Adversaire : carte de papier posée sur l'encre */}
      <View style={[styles.enemyCard, { backgroundColor: gameColors.paper }]}>
        <View style={styles.row}>
          <View style={[styles.enemyPortrait, { borderColor: gameColors.ink, backgroundColor: gameColors.paper }]}>
            {enemyImage ? (
              <Image source={enemyImage} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
            ) : (
              <Hatch color={gameColors.ink} />
            )}
          </View>
          <View style={styles.identity}>
            <Text style={[styles.overline, { color: gameColors.inkSoft }]}>{fr.game.enemySection}</Text>
            <Text style={[styles.enemyName, { color: gameColors.ink }]}>{enemy.name}</Text>
            <Text style={[styles.statsLine, { color: gameColors.inkSoft }]}>
              {[
                `${fr.game.attackStat} ${enemy.attack}`,
                ...(enemy.shieldMax > 0 ? [`${fr.game.shield} ${combat.enemyShield}`] : []),
                ...enemy.extraStats.map((stat) => `${stat.name} ${stat.value}`),
              ].join(' · ')}
            </Text>
          </View>
        </View>
        <Gauge
          label={fr.game.hp}
          value={combat.enemyHp}
          max={enemy.hpMax}
          color={gameColors.hpFill}
          textColor={gameColors.ink}
          emptyColor={gameColors.ink}
          segments={enemy.hpMax <= MAX_SEGMENTS ? enemy.hpMax : 10}
        />
      </View>

      <View style={styles.versus} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.rule, { backgroundColor: gameColors.paper }]} />
        <Text style={[styles.versusText, { color: gameColors.accentOnInk }]}>{fr.game.versus}</Text>
        <View style={[styles.rule, { backgroundColor: gameColors.paper }]} />
      </View>

      {/* Héros : même carte, en simple filet de papier */}
      <View style={[styles.heroCard, { borderColor: gameColors.paper }]}>
        <View style={styles.row}>
          <OvalPortrait uri={face} width={72} height={92} ringGap={3} ink={gameColors.paper} background={gameColors.ink} />
          <View style={styles.identity}>
            <Text style={[styles.overline, { color: gameColors.paperMuted }]}>{fr.game.heroSection}</Text>
            {user ? <Text style={[styles.heroName, { color: gameColors.paper }]}>{user.displayName}</Text> : null}
            {heroStats.length > 0 ? (
              <Text style={[styles.statsLine, { color: gameColors.paperMuted }]}>
                {heroStats.map((stat) => `${stat.name} ${stat.value}`).join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>
        <Gauge
          label={hpStat?.name ?? fr.game.hp}
          value={combat.heroHp}
          max={hpStat?.max ?? null}
          color={gameColors.paper}
          textColor={gameColors.paper}
          emptyColor={gameColors.paper}
          segments={hpStat?.max && hpStat.max <= MAX_SEGMENTS ? hpStat.max : 10}
        />
      </View>

      {/* Hauteur fixe : le journal prend la place restante et défile à l'intérieur,
          pour que « Frapper » reste au même endroit d'un assaut à l'autre */}
      <View style={styles.journal}>
        {journal.length > 0 ? (
          <>
            <Text style={[styles.mono, { color: gameColors.paperMuted }]}>{fr.game.journal}</Text>
            <ScrollView ref={journalRef} accessibilityLabel={fr.game.combatLog} contentContainerStyle={styles.journalContent}>
              {journal.map((line, index) => {
                const { action, result } = splitTurn(line);
                const latest = index === 0;
                return (
                  <View
                    key={combat.log.length - index}
                    accessible
                    accessibilityLabel={line}
                    style={[styles.entry, index > 0 && styles.entryRule]}
                  >
                    <Text style={[styles.action, { color: latest ? gameColors.paper : gameColors.paperMuted }]}>{action}</Text>
                    {result ? (
                      // Le dernier assaut est marqué d'une flèche, pas seulement de sa couleur
                      <Text style={[styles.result, { color: latest ? gameColors.accentOnInk : gameColors.paperMuted }]}>
                        {latest ? `▸ ${result}` : result}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          </>
        ) : null}
      </View>

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: gameColors.accentOnInk }]}>
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={onAttack}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={fr.game.attack}
        accessibilityState={{ disabled: busy, busy }}
        style={({ pressed }) => [
          styles.attack,
          { backgroundColor: gameColors.paper, boxShadow: offsetShadow(gameColors.hpFill), opacity: busy ? 0.6 : 1 },
          pressed && styles.pressed,
        ]}
      >
        <Feather name="zap" size={22} color={gameColors.ink} />
        <Text style={[styles.attackText, { color: gameColors.ink }]}>{fr.game.attack}</Text>
      </Pressable>

      {usable.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onUse(item.id)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`${fr.game.use} ${item.name}, × ${item.qty}`}
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [styles.secondary, { borderColor: gameColors.paper, opacity: busy ? 0.5 : pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.secondaryText, { color: gameColors.paper }]}>{`${fr.game.use} ${item.name} · ×${item.qty}`}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, gap: 18 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -10 },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  mono: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  overline: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identity: { flex: 1, gap: 2 },
  enemyCard: { borderRadius: radius.lg, padding: 16, gap: 14 },
  enemyPortrait: { width: 88, height: 88, borderRadius: 44, borderWidth: hairline, overflow: 'hidden' },
  enemyName: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  statsLine: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 16, letterSpacing: 0.5, textTransform: 'uppercase' },
  versus: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: 1 },
  versusText: { fontFamily: fonts.displayItalic, fontSize: 28, lineHeight: 32 },
  heroCard: { borderWidth: hairline, borderRadius: radius.lg, padding: 16, gap: 14 },
  heroName: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  journal: { flex: 1, minHeight: 0, gap: 6 },
  journalContent: { paddingBottom: 8 },
  entry: { gap: 2, paddingTop: 10 },
  entryRule: { borderTopWidth: 1, borderTopColor: 'rgba(243, 235, 219, 0.3)' },
  action: { fontFamily: fonts.bodyItalic, fontSize: 16, lineHeight: 22 },
  result: { fontFamily: fonts.monoBold, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },
  error: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20 },
  attack: {
    minHeight: 60,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: 'none' },
  attackText: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  secondary: {
    minHeight: touchTarget,
    borderWidth: hairline,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
});
