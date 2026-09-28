import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, radius, spacing, typography } from '@/theme';
import type { GameState } from '@/types/api';

import { Gauge } from './Gauge';
import { gameColors } from './gameColors';

type Props = { combat: NonNullable<GameState['combat']>; busy: boolean; onAttack: () => void };

/** Combat en cours : l'adversaire, ses PV et son bouclier, le déroulé des tours et l'unique action. */
export function CombatPanel({ combat, busy, onAttack }: Props) {
  const { colors } = useTheme();
  const { enemy } = combat;
  const image = assetUrl(enemy.imageUrl);
  const lastTurns = combat.log.slice(-4);

  return (
    <View style={styles.panel}>
      <View style={[styles.enemy, { backgroundColor: colors.surface, borderColor: colors.dangerBorder }]}>
        <View style={styles.enemyHead}>
          {image ? <Image source={image} style={styles.portrait} contentFit="cover" /> : null}
          <View style={styles.enemyText}>
            <Text style={[typography.overline, { color: colors.textMuted }]}>{fr.game.enemy}</Text>
            <Text accessibilityRole="header" style={[typography.cardTitle, { color: colors.text }]}>
              {enemy.name}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {[`${fr.game.attackStat} ${enemy.attack}`, ...enemy.extraStats.map((stat) => `${stat.name} ${stat.value}`)].join('   ')}
            </Text>
          </View>
        </View>
        <Gauge label={fr.game.hp} value={combat.enemyHp} max={enemy.hpMax} color={gameColors.hpFill} />
        {enemy.shieldMax > 0 ? (
          <Gauge label={fr.game.shield} value={combat.enemyShield} max={enemy.shieldMax} color={gameColors.shieldFill} />
        ) : null}
      </View>

      {lastTurns.length > 0 ? (
        <View accessibilityLiveRegion="polite" accessibilityLabel={`${fr.game.combatLog} : ${lastTurns.join('. ')}`} style={styles.log}>
          {lastTurns.map((line, index) => (
            <Text
              key={`${combat.log.length - lastTurns.length + index}`}
              style={[styles.logLine, { color: index === lastTurns.length - 1 ? colors.text : colors.textMuted }]}
            >
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      <Button label={fr.game.attack} icon="zap" onPress={onAttack} loading={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.md },
  enemy: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1 },
  enemyHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  portrait: { width: 64, height: 64, borderRadius: radius.md },
  enemyText: { flex: 1, gap: 2 },
  log: { gap: 4 },
  logLine: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
});
