import type { ColorValue } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

// Feather n'a que des contours : l'étoile et le cœur pleins sont dessinés ici,
// sur les mêmes tracés, pour que plein et creux se distinguent par la forme.
type Props = { size: number; color: ColorValue; filled: boolean; strokeWidth?: number };

const STAR = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';
const HEART =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

export function StarIcon({ size, color, filled, strokeWidth = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon points={STAR} fill={filled ? color : 'none'} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function HeartIcon({ size, color, filled, strokeWidth = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={HEART} fill={filled ? color : 'none'} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}
