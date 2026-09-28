import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, radius, spacing } from '@/theme';
import type { GameState } from '@/types/api';

import { Gauge } from './Gauge';
import { gameColors } from './gameColors';

type Props = { game: GameState };

/** Visage du héros, jauge de PV et stats numériques, posés à cheval sur le décor. */
export function HeroBar({ game }: Props) {
  const { colors } = useTheme();
  const face = assetUrl(game.heroFaceUrl);
  const hp = game.stats.find((stat) => stat.id === game.hpStatId);
  const others = game.stats.filter((stat) => stat.type === 'number' && stat.id !== game.hpStatId);

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.face, { borderColor: colors.accent, backgroundColor: colors.surfaceAlt }]}>
        {face ? (
          <Image source={face} style={styles.faceImage} contentFit="cover" accessibilityLabel={fr.game.heroAlt} />
        ) : (
          <Feather name="user" size={22} color={colors.textMuted} />
        )}
      </View>
      {hp ? <Gauge label={hp.name} value={Number(hp.value)} max={hp.max} color={gameColors.hpFill} /> : <View style={styles.spacer} />}
      {others.map((stat) => (
        <View key={stat.id} style={[styles.stat, { backgroundColor: colors.surfaceAlt }]} accessible accessibilityLabel={`${stat.name} ${stat.value}`}>
          <Text style={[styles.statName, { color: colors.textMuted }]} numberOfLines={1}>
            {stat.name}
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: radius.xl,
  },
  face: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceImage: { width: '100%', height: '100%' },
  spacer: { flex: 1 },
  stat: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, maxWidth: 84 },
  statName: { fontFamily: fonts.body, fontSize: 11 },
  statValue: { fontFamily: fonts.bodyBold, fontSize: 15 },
});
