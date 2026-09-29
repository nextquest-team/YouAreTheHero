import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fr } from '@/i18n/fr';
import { fonts, hairline, radius, touchTarget } from '@/theme';
import type { GameState } from '@/types/api';

import { Gauge } from './Gauge';
import { gameColors } from './gameColors';

type Props = { game: GameState; itemCount: number; onOpenSheet: () => void };

/** Feuille d'aventure résumée, en pied de scène : PV en cases, stats numériques et sac. */
export function HeroBar({ game, itemCount, onOpenSheet }: Props) {
  const hp = game.stats.find((stat) => stat.id === game.hpStatId);
  const others = game.stats.filter((stat) => stat.type === 'number' && stat.id !== game.hpStatId);
  const countLabel = itemCount > 1 ? fr.game.itemCountPlural : fr.game.itemCountSingular;

  return (
    <View accessibilityLabel={fr.game.sheet} style={[styles.bar, { backgroundColor: gameColors.ink }]}>
      {hp ? (
        <Gauge
          label={hp.name}
          value={Number(hp.value)}
          max={hp.max}
          color={gameColors.paper}
          textColor={gameColors.paper}
          emptyColor={gameColors.paper}
          empty="faded"
        />
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.stats}>
        {others.map((stat) => (
          // Abrégé à l'écran comme sur une feuille de jeu (FOR, COU) ; nom complet pour VoiceOver
          <View key={stat.id} style={styles.stat} accessible accessibilityLabel={`${stat.name} ${stat.value}`}>
            <Text style={[styles.statValue, { color: gameColors.paper }]}>{stat.value}</Text>
            <Text style={[styles.statName, { color: gameColors.paper }]}>{stat.name.slice(0, 3)}</Text>
          </View>
        ))}
      </View>
      <Pressable
        onPress={onOpenSheet}
        accessibilityRole="button"
        accessibilityLabel={`${fr.game.openBag}, ${itemCount} ${countLabel}`}
        style={({ pressed }) => [styles.bag, { borderColor: gameColors.paper, opacity: pressed ? 0.7 : 1 }]}
      >
        <Feather name="shopping-bag" size={20} color={gameColors.paper} />
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
    paddingVertical: 12,
    borderRadius: radius.lg,
  },
  spacer: { flex: 1 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: fonts.monoBold, fontSize: 18, lineHeight: 22 },
  statName: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  bag: {
    width: touchTarget,
    height: touchTarget,
    borderWidth: hairline,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
