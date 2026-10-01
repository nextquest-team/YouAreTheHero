import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import type { Scene } from '@/types/api';
import { fonts, radius, spacing } from '@/theme';

type Props = {
  scene: Pick<Scene, 'isEnding' | 'enemyId' | 'choices'>;
  isStart: boolean;
};

/** Pastilles d'une scène : départ, fin, combat, nombre de choix. */
export function SceneTags({ scene, isStart }: Props) {
  const { colors } = useTheme();

  const tags: { label: string; color: string; background: string }[] = [];
  if (isStart) tags.push({ label: fr.scenes.startTag, color: colors.accent, background: colors.accentSoft });
  if (scene.isEnding) tags.push({ label: fr.scenes.endingTag, color: colors.text, background: colors.surfaceAlt });
  if (scene.enemyId) tags.push({ label: fr.scenes.combatTag, color: colors.danger, background: colors.dangerSoft });
  if (!scene.isEnding && !scene.enemyId) {
    const n = scene.choices.length;
    tags.push({
      label: n === 0 ? fr.scenes.noChoice : `${n} ${n === 1 ? fr.scenes.oneChoice : fr.scenes.manyChoices}`,
      color: colors.textMuted,
      background: colors.surfaceAlt,
    });
  }

  return (
    <View style={styles.row}>
      {tags.map((tag) => (
        <Text key={tag.label} style={[styles.tag, { color: tag.color, backgroundColor: tag.background }]}>
          {tag.label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
