import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Hatch } from '@/components/common/Hatch';
import { useTheme } from '@/hooks/useTheme';
import { assetUrl } from '@/services/client';
import { fonts, hairline, radius } from '@/theme';

type Props = { uri: string | null; width: number; height: number; title?: string };

/** Couverture d'une histoire, ou une gravure hachurée frappée de son initiale quand il n'y en a pas. */
export function StoryCover({ uri, width, height, title }: Props) {
  const { colors } = useTheme();
  const source = assetUrl(uri);
  const frame = [styles.frame, { width, height, backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong }];

  if (!source) {
    const medal = Math.min(44, Math.round(width * 0.55));
    return (
      <View style={frame} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Hatch color={colors.text} />
        {title ? (
          <View
            style={[
              styles.medal,
              { width: medal, height: medal, borderRadius: medal / 2, backgroundColor: colors.surface, borderColor: colors.borderStrong },
            ]}
          >
            <Text style={[styles.initial, { color: colors.text, fontSize: Math.round(medal * 0.6) }]}>
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
