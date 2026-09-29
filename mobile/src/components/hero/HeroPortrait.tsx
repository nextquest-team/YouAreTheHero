import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  Image as SvgImage,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';

type Props = {
  size: number;
  /** URI de la photo à loger sous la capuche ; sans photo, la place du visage est en pointillés. */
  photoUri?: string | null;
  /** Caméra refusée : le médaillon montre une caméra barrée à la place du héros. */
  blocked?: boolean;
  accessibilityLabel?: string;
};

// Toute l'illustration est dessinée dans un carré de 248 et mise à l'échelle.
const VIEWBOX = 248;
const SILHOUETTE =
  'M124 32 C88 34 60 68 58 116 C56 148 64 170 56 188 C38 202 12 212 -10 230 L-10 262 L258 262 L258 230 C236 212 210 202 192 188 C184 170 192 148 190 116 C188 68 160 34 124 32 Z';
const CONTRE_JOUR = 'M124 32 C88 34 60 68 58 116 C56 148 64 170 56 188 C38 202 12 212 -10 230';
const BORD_OMBRE = 'M124 32 C160 34 188 68 190 116 C192 148 184 170 192 188 C210 202 236 212 258 230';
const PLIS = 'M86 156 C82 176 76 192 62 206 M162 156 C166 176 172 192 186 206 M100 70 C108 60 116 56 124 56';
// Place du visage : un ovale vertical, le même que celui du cadrage de la caméra.
const VISAGE = { cx: 124, cy: 127, rx: 33, ry: 43 };

/**
 * Médaillon à double filet doré : le héros encapuchonné n'a pas encore de visage,
 * la photo du joueur vient se loger sous la capuche.
 */
export function HeroPortrait({ size, photoUri, blocked = false, accessibilityLabel }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.ring, { borderColor: `${colors.accent}8C` }]}
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={[
          styles.medallion,
          { width: size, height: size, borderRadius: size / 2, borderColor: colors.accent, backgroundColor: colors.surface },
        ]}
      >
        {blocked ? (
          <Feather name="camera-off" size={size * 0.22} color={colors.borderStrong} />
        ) : (
          <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
            <Defs>
              <RadialGradient id="lueur" cx="42%" cy="30%" r="70%">
                <Stop offset="0" stopColor="#6A4E36" />
                <Stop offset="0.45" stopColor="#2E2532" />
                <Stop offset="1" stopColor="#16141C" />
              </RadialGradient>
              <LinearGradient id="etoffe" x1="0.2" y1="0" x2="0.7" y2="1">
                <Stop offset="0" stopColor="#4A3F54" />
                <Stop offset="0.55" stopColor="#2A2433" />
                <Stop offset="1" stopColor="#17141D" />
              </LinearGradient>
              <RadialGradient id="ombre" cx="50%" cy="42%" r="62%">
                <Stop offset="0" stopColor="#050408" />
                <Stop offset="1" stopColor="#15121B" />
              </RadialGradient>
              <ClipPath id="visage">
                <Ellipse {...VISAGE} />
              </ClipPath>
            </Defs>
            <Rect width={VIEWBOX} height={VIEWBOX} fill="url(#lueur)" />
            <Path d={SILHOUETTE} fill="url(#etoffe)" />
            <Path d={CONTRE_JOUR} fill="none" stroke="#E0B04E" strokeOpacity={0.65} strokeWidth={1.5} />
            <Path d={BORD_OMBRE} fill="none" stroke="#E0B04E" strokeOpacity={0.18} strokeWidth={1.2} />
            <Path d={PLIS} fill="none" stroke="#584C66" strokeWidth={1.3} strokeLinecap="round" />
            <Ellipse cx={124} cy={124} rx={44} ry={55} fill="#0F0C14" stroke="#E0B04E" strokeOpacity={0.3} strokeWidth={1.2} />
            {photoUri ? (
              <SvgImage
                href={{ uri: photoUri }}
                x={VISAGE.cx - VISAGE.rx}
                y={VISAGE.cy - VISAGE.ry}
                width={VISAGE.rx * 2}
                height={VISAGE.ry * 2}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#visage)"
              />
            ) : (
              <Ellipse
                {...VISAGE}
                fill="url(#ombre)"
                stroke="#E0B04E"
                strokeOpacity={0.8}
                strokeWidth={1.4}
                strokeDasharray="1.5 5"
                strokeLinecap="round"
              />
            )}
            <Path d="M124 196 C123 214 121 236 119 262" fill="none" stroke="#0D0B11" strokeWidth={1.8} />
            <Circle cx={124} cy={190} r={7.5} fill="#E0B04E" />
            <Circle cx={124} cy={190} r={3.2} fill="#8A5A12" />
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Filet extérieur fin, puis médaillon au filet doré plein : le cadre d'un frontispice.
  ring: { padding: 7, borderRadius: 9999, borderWidth: 1 },
  medallion: { borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
