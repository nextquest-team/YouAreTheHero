import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

type Props = { color: string; angle?: number; gap?: number; opacity?: number };

/** Hachures de gravure qui remplissent leur parent : l'emplacement d'une image absente. */
export function Hatch({ color, angle = 135, gap = 6, opacity = 0.45 }: Props) {
  const id = `hatch-${useId().replace(/:/g, '')}`;

  // Les props d'accessibilité vont sur une View : sur le web, Svg les passerait telles quelles au DOM.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
            <Line x1="0" y1="0" x2="0" y2={gap} stroke={color} strokeWidth={1} strokeOpacity={opacity} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
