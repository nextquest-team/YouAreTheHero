import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, spacing, typography } from '@/theme';
import type { GameState } from '@/types/api';

type Props = {
  game: GameState;
  storyTitle: string;
  restarting: boolean;
  error?: string | null;
  onRestart: () => void;
  // Présent quand l'histoire est terminée et que le joueur n'a pas encore donné son avis
  onReview?: () => void;
  onBackToLibrary: () => void;
};

/** Écran plein affiché quand la partie est terminée (fin ou héros tombé). */
export function EndScreen({ game, storyTitle, restarting, error, onRestart, onReview, onBackToLibrary }: Props) {
  const { colors } = useTheme();
  const dead = game.status === 'DEAD';
  const accentColor = dead ? colors.danger : colors.accent;
  const word = dead ? fr.game.endWordDead : fr.game.endWordFinished;

  const hpStat = game.stats.find((stat) => stat.id === game.hpStatId);
  const itemCount = game.inventory.reduce((sum, item) => sum + item.qty, 0);

  const recap = [
    { value: String(itemCount), label: itemCount > 1 ? fr.game.itemCountPlural : fr.game.itemCountSingular },
    ...(hpStat
      ? [{ value: hpStat.max !== null ? `${hpStat.value}/${hpStat.max}` : String(hpStat.value), label: fr.game.hpRemainingLabel }]
      : []),
  ];

  const confirmRestart = () =>
    Alert.alert(fr.game.replay, fr.storyDetail.restartHint, [
      { text: fr.common.cancel, style: 'cancel' },
      { text: fr.game.replay, style: 'destructive', onPress: onRestart },
    ]);

  return (
    <View style={styles.root}>
      {storyTitle ? <Text style={[typography.overline, { color: colors.textMuted }]}>{storyTitle}</Text> : null}

      <View style={styles.wordBlock}>
        <Text accessibilityRole="header" style={[styles.word, { color: accentColor, fontSize: dead ? 84 : 112 }]}>
          {word}
        </Text>
        <View style={styles.flourish} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.flourishLine, { backgroundColor: colors.borderStrong }]} />
          <Text style={[styles.flourishMark, { color: accentColor }]}>§</Text>
          <View style={[styles.flourishLine, { backgroundColor: colors.borderStrong }]} />
        </View>
      </View>

      <Text style={[styles.epilogue, { color: colors.textSoft }]}>{game.scene.text}</Text>

      <View style={styles.recap}>
        {recap.map((row, index) => (
          <View key={`${index}-${row.label}`} style={[styles.recapRow, { borderTopWidth: hairline, borderTopColor: colors.borderStrong }]}>
            <Text style={[styles.recapValue, { color: accentColor }]}>{row.value}</Text>
            <Text style={[styles.recapLabel, { color: colors.textSoft }]}>{row.label}</Text>
          </View>
        ))}
      </View>

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[typography.label, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {onReview ? <Button label={fr.reviews.write} onPress={onReview} /> : null}
        <Button
          label={fr.game.replay}
          variant={onReview ? 'secondary' : 'primary'}
          onPress={confirmRestart}
          loading={restarting}
        />
        <Button label={fr.game.backToLibrary} variant="ghost" onPress={onBackToLibrary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  wordBlock: { alignItems: 'center', gap: 4 },
  word: { fontFamily: fonts.displayItalic },
  flourish: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flourishLine: { width: 56, height: hairline },
  flourishMark: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  epilogue: { fontFamily: fonts.bodyItalic, fontSize: 19, lineHeight: 28, textAlign: 'center', maxWidth: 320 },
  recap: { width: '100%', maxWidth: 280 },
  recapRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md, paddingVertical: 10 },
  recapValue: {
    width: 80, // assez pour « 20/20 » : les libellés restent alignés
    fontFamily: fonts.monoBold,
    fontSize: 24,
    lineHeight: 30,
  },
  recapLabel: { fontFamily: fonts.mono, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  actions: { width: '100%', gap: spacing.sm, marginTop: spacing.md },
});
