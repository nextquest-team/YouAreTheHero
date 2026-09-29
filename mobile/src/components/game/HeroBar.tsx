import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fr } from '@/i18n/fr';
import { fonts, hairline, radius, spacing, touchTarget } from '@/theme';
import type { GameState } from '@/types/api';

import { Gauge } from './Gauge';
import { gameColors } from './gameColors';

type Props = { game: GameState; itemCount: number; onOpenInventory: () => void };

/** Feuille d'aventure résumée, en pied d'écran : PV en cases, stats numériques et sac. */
export function HeroBar({ game, itemCount, onOpenInventory }: Props) {
  const hp = game.stats.find((stat) => stat.id === game.hpStatId);
  const others = game.stats.filter((stat) => stat.type === 'number' && stat.id !== game.hpStatId);

  return (
    <View accessibilityLabel={fr.game.sheet} style={[styles.bar, { backgroundColor: gameColors.ink }]}>
      {hp ? (
        <Gauge
          label={hp.name}
          value={Number(hp.value)}
          max={hp.max}
          color={gameColors.paper}
          textColor={gameColors.paper}
          emptyColor={gameColors.paperMuted}
        />
      ) : (
        <View style={styles.spacer} />
      )}
      {others.map((stat) => (
        <View key={stat.id} style={styles.stat} accessible accessibilityLabel={`${stat.name} ${stat.value}`}>
          <Text style={[styles.statValue, { color: gameColors.paper }]}>{stat.value}</Text>
          <Text style={[styles.statName, { color: gameColors.paperMuted }]} numberOfLines={1}>
            {stat.name}
          </Text>
        </View>
      ))}
      <Pressable
        onPress={onOpenInventory}
        accessibilityRole="button"
        accessibilityLabel={`${fr.game.inventory}, ${itemCount}`}
        style={({ pressed }) => [styles.bag, { borderColor: gameColors.paper, opacity: pressed ? 0.7 : 1 }]}
      >
        <Feather name="briefcase" size={20} color={gameColors.paper} />
        {itemCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: gameColors.accentOnInk }]}>
            <Text style={[styles.badgeText, { color: gameColors.ink }]}>{itemCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  spacer: { flex: 1 },
  stat: { alignItems: 'center', minWidth: 32, maxWidth: 72 },
  statValue: { fontFamily: fonts.monoBold, fontSize: 18 },
  statName: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  bag: {
    width: touchTarget,
    height: touchTarget,
    borderWidth: hairline,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.monoBold, fontSize: 11 },
});
