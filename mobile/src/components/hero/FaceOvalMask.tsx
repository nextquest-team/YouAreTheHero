import { StyleSheet } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

type Oval = { cx: number; cy: number; rx: number; ry: number };

/**
 * Ovale de cadrage du visage, portrait (4:5), centré dans le viseur : le recadrage de la
 * photo s'appuie sur ce même centre (voir services/heroPhoto.ts).
 */
export function faceOval(width: number, height: number): Oval {
  const rx = width * 0.31;
  return { cx: width / 2, cy: height / 2, rx, ry: rx * 1.25 };
}

type Props = { width: number; height: number; color: string };

/** Voile sombre sur tout le viseur, sauf l'ovale où placer son visage. */
export function FaceOvalMask({ width, height, color }: Props) {
  const { cx, cy, rx, ry } = faceOval(width, height);
  const hole = `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path d={`M0 0 H${width} V${height} H0 Z ${hole}`} fill="rgba(12, 11, 16, 0.74)" fillRule="evenodd" />
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={3} />
    </Svg>
  );
}
