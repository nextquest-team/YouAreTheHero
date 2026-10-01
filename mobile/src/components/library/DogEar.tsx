import { StyleSheet, View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';
import { hairline } from '@/theme';

type Props = { size?: number; dashed?: boolean; soft?: boolean };

/**
 * Page cornée : le coin haut droit d'une carte replié, comme on corne la page d'un livre
 * qu'on aime. Marque les favoris. Purement visuel : le libellé de la carte le dit à VoiceOver.
 */
export function DogEar({ size = 26, dashed = false, soft = false }: Props) {
  const { colors } = useTheme();
  const s = size;
  const dash = dashed ? '3 3' : undefined;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.corner, { width: s + hairline, height: s + hairline, top: -hairline, right: -hairline }]}
    >
      <Svg width={s + hairline} height={s + hairline} viewBox={`0 0 ${s + hairline} ${s + hairline}`}>
        {/* le coin découpé laisse voir le fond de la page */}
        <Polygon points={`0,0 ${s + hairline},0 ${s + hairline},${s + hairline}`} fill={colors.background} />
        {/* le rabat */}
        <Polygon points={`0,0 ${s},${s} 0,${s}`} fill={soft ? colors.accentSoft : colors.accent} />
        <Line x1={0} y1={0} x2={s} y2={s} stroke={colors.borderStrong} strokeWidth={hairline} />
        <Line x1={hairline / 2} y1={0} x2={hairline / 2} y2={s} stroke={colors.borderStrong} strokeWidth={hairline} strokeDasharray={dash} />
        <Line x1={0} y1={s - hairline / 2} x2={s} y2={s - hairline / 2} stroke={colors.borderStrong} strokeWidth={hairline} strokeDasharray={dash} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute' },
});
