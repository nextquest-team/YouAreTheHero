import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { fr } from '@/i18n/fr';
import { assetUrl } from '@/services/client';
import { fonts, hairline, offsetShadow, radius, spacing, typography } from '@/theme';
import type { GameState } from '@/types/api';

import { Gauge } from './Gauge';
import { gameColors } from './gameColors';

type Props = { combat: NonNullable<GameState['combat']>; busy: boolean; onAttack: () => void };

/**
 * Combat en cours, sur une page d'encre : l'adversaire, ses PV et son bouclier, le déroulé
 * des tours, puis l'unique action. Le bouton reste sur le papier pour garder son contraste.
 */
export function CombatPanel({ combat, busy, onAttack }: Props) {
  const { enemy } = combat;
  const image = assetUrl(enemy.imageUrl);
  const lastTurns = combat.log.slice(-4);

  return (
    <View style={styles.panel}>
      <View style={[styles.enemy, { backgroundColor: gameColors.ink, boxShadow: offsetShadow(gameColors.hpFill) }]}>
        <View style={styles.enemyHead}>
          {image ? <Image source={image} style={[styles.portrait, { borderColor: gameColors.paper }]} contentFit="cover" /> : null}
          <View style={styles.enemyText}>
            <Text style={[typography.overline, { color: gameColors.accentOnInk }]}>{fr.game.enemy}</Text>
            <Text accessibilityRole="header" style={[styles.enemyName, { color: gameColors.paper }]}>
              {enemy.name}
            </Text>
            <Text style={[styles.enemyStats, { color: gameColors.paperMuted }]}>
              {[`${fr.game.attackStat} ${enemy.attack}`, ...enemy.extraStats.map((stat) => `${stat.name} ${stat.value}`)].join(' · ')}
            </Text>
          </View>
        </View>
        <Gauge
          label={fr.game.hp}
          value={combat.enemyHp}
          max={enemy.hpMax}
          color={gameColors.accentOnInk}
          textColor={gameColors.paper}
          emptyColor={gameColors.paperMuted}
        />
        {enemy.shieldMax > 0 ? (
          <Gauge
            label={fr.game.shield}
            value={combat.enemyShield}
            max={enemy.shieldMax}
            color={gameColors.paper}
            textColor={gameColors.paper}
            emptyColor={gameColors.paperMuted}
          />
        ) : null}

        {lastTurns.length > 0 ? (
          <View
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${fr.game.combatLog} : ${lastTurns.join('. ')}`}
            style={[styles.log, { borderTopColor: gameColors.paperMuted }]}
          >
            {lastTurns.map((line, index) => {
              const latest = index === lastTurns.length - 1;
              return (
                <Text
                  key={`${combat.log.length - lastTurns.length + index}`}
                  style={[styles.logLine, { color: latest ? gameColors.paper : gameColors.paperMuted }]}
                >
                  {/* Le dernier tour est marqué d'une flèche, pas seulement éclairci */}
                  {latest ? `▸ ${line}` : line}
                </Text>
              );
            })}
          </View>
        ) : null}
      </View>

      <Button label={fr.game.attack} icon="zap" onPress={onAttack} loading={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.xl },
  enemy: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  enemyHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  portrait: { width: 64, height: 64, borderRadius: radius.sm, borderWidth: hairline },
  enemyText: { flex: 1, gap: 2 },
  enemyName: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  enemyStats: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  log: { gap: 4, paddingTop: spacing.md, borderTopWidth: 1, borderStyle: 'dashed' },
  logLine: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
});
