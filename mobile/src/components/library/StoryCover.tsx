import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Hatch } from '@/components/common/Hatch';
import { useTheme } from '@/hooks/useTheme';
import { assetUrl } from '@/services/client';
import { fonts, hairline, radius } from '@/theme';

// Trois gravures pour distinguer les couvertures absentes : diagonales sur papier,
// trame claire sur encre avec médaillon vermillon, lignes horizontales.
export type CoverVariant = 0 | 1 | 2;

type Props = { uri: string | null; width: number; height: number; title?: string; variant?: CoverVariant };

/** Couverture d'une histoire, ou une gravure hachurée frappée de son initiale quand il n'y en a pas. */
export function StoryCover({ uri, width, height, title, variant = 0 }: Props) {
  const { colors } = useTheme();
  const source = assetUrl(uri);
  const inked = variant === 1;
  const frame = [
    styles.frame,
    { width, height, backgroundColor: inked ? colors.primary : colors.surfaceAlt, borderColor: colors.borderStrong },
  ];

  if (!source) {
    const medal = Math.min(44, Math.round(width * 0.55));
    return (
      <View style={frame} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Hatch color={inked ? colors.onPrimary : colors.text} angle={[135, 45, 90][variant]} />
        {title ? (
          <View
            style={[
              styles.medal,
              {
                width: medal,
                height: medal,
                borderRadius: medal / 2,
                backgroundColor: inked ? colors.accent : colors.surface,
                borderColor: inked ? colors.onPrimary : colors.borderStrong,
              },
            ]}
          >
            <Text style={[styles.initial, { color: inked ? colors.onPrimary : colors.text, fontSize: Math.round(medal * 0.6) }]}>
              {title.trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return <Image source={source} style={frame} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.sm, borderWidth: hairline, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  medal: { borderWidth: hairline, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fonts.display },
});
