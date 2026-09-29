import { useId } from 'react';
import { View } from 'react-native';
import Svg, { ClipPath, Defs, Ellipse, Image, Line, Pattern } from 'react-native-svg';

type Props = {
  uri: string | null;
  width: number;
  height: number;
  ink: string; // couleur des deux filets et des hachures
  background: string; // fond de l'ovale sans photo
  ringGap?: number; // écart entre les deux filets
  hatchAngle?: number;
};

const STROKE = 1.5;

/**
 * Portrait en ovale à double filet, comme sur une feuille d'aventure : la photo du héros
 * découpée dans l'ovale, ou des hachures de gravure tant qu'il n'y en a pas.
 * Décoratif pour VoiceOver : c'est le bouton qui l'entoure qui porte le libellé.
 */
export function OvalPortrait({ uri, width, height, ink, background, ringGap = 4, hatchAngle = 135 }: Props) {
  const id = useId().replace(/:/g, '');
  const cx = width / 2;
  const cy = height / 2;
  // Filet extérieur au bord de la boîte, filet intérieur (et la photo) en retrait de ringGap
  const outer = { rx: cx - STROKE / 2, ry: cy - STROKE / 2 };
  const inner = { rx: outer.rx - ringGap - STROKE, ry: outer.ry - ringGap - STROKE };

  return (
    <View style={{ width, height }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height}>
        <Defs>
          <ClipPath id={`clip-${id}`}>
            <Ellipse cx={cx} cy={cy} rx={inner.rx} ry={inner.ry} />
          </ClipPath>
          <Pattern id={`hatch-${id}`} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform={`rotate(${hatchAngle})`}>
            <Line x1="0" y1="0" x2="0" y2="5" stroke={ink} strokeWidth={1} strokeOpacity={0.45} />
          </Pattern>
        </Defs>
        <Ellipse cx={cx} cy={cy} rx={inner.rx} ry={inner.ry} fill={background} />
        {uri ? (
          <Image
            href={{ uri }}
            x={cx - inner.rx}
            y={cy - inner.ry}
            width={inner.rx * 2}
            height={inner.ry * 2}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#clip-${id})`}
          />
        ) : (
          <Ellipse cx={cx} cy={cy} rx={inner.rx} ry={inner.ry} fill={`url(#hatch-${id})`} />
        )}
        <Ellipse cx={cx} cy={cy} rx={inner.rx} ry={inner.ry} fill="none" stroke={ink} strokeWidth={STROKE} />
        <Ellipse cx={cx} cy={cy} rx={outer.rx} ry={outer.ry} fill="none" stroke={ink} strokeWidth={STROKE} />
      </Svg>
    </View>
  );
}
